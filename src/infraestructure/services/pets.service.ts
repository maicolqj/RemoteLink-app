import apolloClient from '../../data/lib/apollo/client';
import SecureStorageService from './SecureStorageService';
import { REST_API_URL } from '../../data/lib/constants';
import {
  GET_MY_PETS,
  GET_MY_PET_INCIDENTS,
  GET_PET_INCIDENT,
  ADD_PET_INCIDENT_STATEMENT,
  UPDATE_PET,
  REMOVE_PET,
} from '../../domain/graphql/pets.queries';
import { getApiErrorMessage } from '../utils/apiError';
import type { Pet, PetIncident, PetIncidentPage } from '../../domain/responses/PetResponseModel';

/**
 * Todo va con `network-only`: el estado de un reporte cambia por fuera —la
 * administración lo valida o lo sanciona— y mostrar una versión cacheada sería
 * decirle al residente que aún tiene plazo cuando ya no lo tiene.
 */

const PAGE = { page: 1, limit: 50 };

/** Las mascotas de la unidad del residente. */
export async function fetchMyPets(complexId: string): Promise<Pet[]> {
  const { data } = await apolloClient.query<{ myPets: Pet[] }>({
    query: GET_MY_PETS,
    variables: { complexId },
    fetchPolicy: 'network-only',
  });
  return data?.myPets ?? [];
}

/**
 * Los reportes que el residente puede ver: los suyos y los que se abrieron
 * contra su unidad. El backend decide cuáles entran.
 */
export async function fetchMyPetIncidents(complexId: string): Promise<PetIncident[]> {
  const { data } = await apolloClient.query<{ petIncidents: PetIncidentPage }>({
    query: GET_MY_PET_INCIDENTS,
    variables: { complexId, pagination: PAGE },
    fetchPolicy: 'network-only',
  });
  return data?.petIncidents?.items ?? [];
}

/** La ficha, con la evidencia y el hilo de descargos. */
export async function fetchPetIncident(id: string): Promise<PetIncident> {
  const { data } = await apolloClient.query<{ petIncident: PetIncident }>({
    query: GET_PET_INCIDENT,
    variables: { id },
    fetchPolicy: 'network-only',
  });
  return data!.petIncident;
}

/**
 * Presenta los descargos de la unidad.
 *
 * El servidor rechaza el intento fuera del plazo o si quien escribe no vive en
 * la unidad señalada; el mensaje de error se muestra tal cual, porque explica
 * exactamente cuál de las dos cosas pasó.
 */
export async function addPetIncidentStatement(input: {
  incidentId: string;
  text: string;
}): Promise<PetIncident> {
  const { data, error } = await apolloClient.mutate<{ addPetIncidentStatement: PetIncident }>({
    mutation: ADD_PET_INCIDENT_STATEMENT,
    variables: { input },
  });
  if (error) throw new Error(getApiErrorMessage(error, 'No se pudieron enviar los descargos'));
  return data!.addPetIncidentStatement;
}

/** Datos editables de la ficha. La unidad y la foto no viajan por aquí. */
export interface UpdatePetData {
  petId: string;
  name?: string;
  species?: string;
  breed?: string;
  color?: string;
  distinguishingMarks?: string;
  hasMicrochip?: boolean;
  microchipCode?: string;
  isSpecialBreed?: boolean;
  insuranceCompany?: string;
  insurancePolicyNumber?: string;
  insuranceExpiresAt?: string;
  rabiesVaccineAt?: string;
}

/**
 * Corrige la ficha. Va por GraphQL —no por REST— porque aquí los booleanos son
 * booleanos de verdad: el enredo de `"false"` solo existe en multipart.
 */
export async function updatePet(input: UpdatePetData): Promise<Pet> {
  const { data, error } = await apolloClient.mutate<{ updatePet: Pet }>({
    mutation: UPDATE_PET,
    variables: { input },
  });
  if (error) throw new Error(getApiErrorMessage(error, 'No se pudo actualizar la ficha'));
  return data!.updatePet;
}

/** Retira la mascota del censo. */
export async function removePet(petId: string, reason?: string): Promise<boolean> {
  const { data, error } = await apolloClient.mutate<{ removePet: boolean }>({
    mutation: REMOVE_PET,
    variables: { petId, reason },
  });
  if (error) throw new Error(getApiErrorMessage(error, 'No se pudo retirar la mascota'));
  return !!data?.removePet;
}

/** Una foto lista para viajar en multipart. */
export interface PhotoUpload {
  uri: string;
  type: string;
  name: string;
}

/**
 * Las subidas van por REST y no por GraphQL: el servidor necesita el archivo
 * para sellarlo —hora de recepción y SHA-256— y GraphQL en este proyecto no
 * recibe multipart.
 *
 * No se fija `Content-Type` a propósito: fetch tiene que ponerlo él con el
 * `boundary` del FormData. Si se escribe a mano, el backend no encuentra los
 * archivos y responde que falta la evidencia.
 */
async function postMultipart<T>(path: string, form: FormData, fallback: string): Promise<T> {
  const tokens = await SecureStorageService.getTokens();

  const res = await fetch(`${REST_API_URL}${path}`, {
    method: 'POST',
    headers: tokens?.accessToken ? { Authorization: `Bearer ${tokens.accessToken}` } : {},
    body: form,
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => ({} as { message?: string }));
    throw new Error((payload as { message?: string })?.message ?? fallback);
  }

  return (await res.json()) as T;
}

/**
 * Registra la mascota con su foto. Queda en PENDING_APPROVAL: la administración
 * valida la ficha antes de que entre al censo.
 */
export async function registerPet(
  input: {
    complexId: string;
    name: string;
    species: string;
    breed?: string;
    color?: string;
    distinguishingMarks?: string;
    hasMicrochip?: boolean;
    microchipCode?: string;
    isSpecialBreed?: boolean;
    insuranceCompany?: string;
    insurancePolicyNumber?: string;
    insuranceExpiresAt?: string;
    rabiesVaccineAt?: string;
  },
  photo: PhotoUpload,
): Promise<Pet> {
  const form = new FormData();

  Object.entries(input).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    form.append(key, String(value));
  });
  form.append('photo', photo as unknown as Blob);

  return postMultipart<Pet>('/api/v1/pets', form, 'No se pudo registrar la mascota');
}

/** Reemplaza la foto de una ficha ya creada. */
export async function uploadPetPhoto(
  petId: string,
  photo: PhotoUpload,
): Promise<{ photoUrl?: string }> {
  const form = new FormData();
  form.append('photo', photo as unknown as Blob);

  return postMultipart<{ photoUrl?: string }>(
    `/api/v1/pets/${petId}/photo`,
    form,
    'No se pudo actualizar la foto',
  );
}

/**
 * Radica un reporte de convivencia con su evidencia.
 *
 * Quien reporta no elige la hora del sello: el servidor registra cuándo recibió
 * cada foto y guarda su huella. Por eso la evidencia viaja en la misma petición
 * y no en un segundo paso.
 */
export async function reportPetIncident(
  input: {
    complexId: string;
    type: string;
    description: string;
    severity?: string;
    occurredAt?: string;
    location?: string;
    petId?: string;
  },
  photos: PhotoUpload[],
): Promise<PetIncident> {
  const form = new FormData();

  Object.entries(input).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    form.append(key, String(value));
  });
  photos.forEach(photo => form.append('files', photo as unknown as Blob));

  return postMultipart<PetIncident>(
    '/api/v1/pets/incidents',
    form,
    'No se pudo radicar el reporte',
  );
}
