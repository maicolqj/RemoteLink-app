import apolloClient from '../../data/lib/apollo/client';
import SecureStorageService from './SecureStorageService';
import { REST_API_URL } from '../../data/lib/constants';
import {
  GET_MAINTENANCE_TICKETS,
  GET_MAINTENANCE_TICKET,
  GET_MAINTENANCE_REPORT_OPTIONS,
  GET_MAINTENANCE_TAG_BY_CODE,
  GET_MAINTENANCE_DUPLICATES,
  ENDORSE_MAINTENANCE_TICKET,
  RATE_MAINTENANCE_TICKET,
  REOPEN_MAINTENANCE_TICKET,
  ADD_MAINTENANCE_COMMENT,
} from '../../domain/graphql/maintenance.queries';
import { getApiErrorMessage } from '../utils/apiError';
import type {
  MaintenanceCategory,
  MaintenanceLocationTag,
  MaintenanceLocationType,
  MaintenanceReportOptions,
  MaintenanceTicket,
  MaintenanceTicketPage,
} from '../../domain/responses/MaintenanceResponseModel';
import type { PhotoUpload } from './pets.service';

/**
 * Todo va con `network-only`: el estado de un ticket cambia por fuera —lo
 * asignan, lo reparan, se vence el plazo— y mostrar una versión cacheada sería
 * decirle al residente que su gotera sigue sin técnico cuando ya fue.
 */

const PAGE = { page: 1, limit: 50 };

/** Los tickets que el residente puede ver: los públicos del conjunto y los suyos. */
export async function fetchMaintenanceTickets(
  complexId: string,
  onlyMine = false,
): Promise<MaintenanceTicket[]> {
  const { data } = await apolloClient.query<{
    maintenanceTickets: MaintenanceTicketPage;
  }>({
    query: GET_MAINTENANCE_TICKETS,
    variables: { complexId, pagination: PAGE, filters: { onlyMine } },
    fetchPolicy: 'network-only',
  });
  return data?.maintenanceTickets?.items ?? [];
}

/** La ficha con su bitácora. */
export async function fetchMaintenanceTicket(
  id: string,
): Promise<MaintenanceTicket> {
  const { data } = await apolloClient.query<{
    maintenanceTicket: MaintenanceTicket;
  }>({
    query: GET_MAINTENANCE_TICKET,
    variables: { id },
    fetchPolicy: 'network-only',
  });
  return data!.maintenanceTicket;
}

/** Torres, zonas comunes y puntos señalizados para armar el formulario. */
export async function fetchMaintenanceReportOptions(
  complexId: string,
): Promise<MaintenanceReportOptions> {
  const { data } = await apolloClient.query<{
    maintenanceReportOptions: MaintenanceReportOptions;
  }>({
    query: GET_MAINTENANCE_REPORT_OPTIONS,
    variables: { complexId },
    fetchPolicy: 'network-only',
  });
  return data!.maintenanceReportOptions;
}

/** Resuelve el código impreso en el sticker QR/NFC. */
export async function fetchMaintenanceTagByCode(
  complexId: string,
  code: string,
): Promise<MaintenanceLocationTag> {
  const { data } = await apolloClient.query<{
    maintenanceLocationTagByCode: MaintenanceLocationTag;
  }>({
    query: GET_MAINTENANCE_TAG_BY_CODE,
    variables: { complexId, code },
    fetchPolicy: 'network-only',
  });
  return data!.maintenanceLocationTagByCode;
}

export interface DuplicateCheckInput {
  complexId: string;
  category: MaintenanceCategory;
  locationType: MaintenanceLocationType;
  locationTagCode?: string;
  buildingId?: string;
  floor?: number;
  amenityId?: string;
  locationText?: string;
  lat?: number;
  lng?: number;
}

/**
 * ¿Ya está reportado?
 *
 * Se pregunta antes de abrir el formulario. Un fallo aquí no puede impedir el
 * reporte: si la consulta no responde, se sigue de largo y en el peor caso
 * queda un duplicado, que la administración resuelve con un clic.
 */
export async function fetchDuplicateCandidates(
  input: DuplicateCheckInput,
): Promise<MaintenanceTicket[]> {
  try {
    const { data } = await apolloClient.query<{
      maintenanceDuplicateCandidates: MaintenanceTicket[];
    }>({
      query: GET_MAINTENANCE_DUPLICATES,
      variables: { input },
      fetchPolicy: 'network-only',
    });
    return data?.maintenanceDuplicateCandidates ?? [];
  } catch {
    return [];
  }
}

/** "A mí también me pasa". */
export async function endorseMaintenanceTicket(
  ticketId: string,
  comment?: string,
): Promise<MaintenanceTicket> {
  const { data, error } = await apolloClient.mutate<{
    endorseMaintenanceTicket: MaintenanceTicket;
  }>({
    mutation: ENDORSE_MAINTENANCE_TICKET,
    variables: { ticketId, comment },
  });
  if (error) {
    throw new Error(getApiErrorMessage(error, 'No se pudo sumar tu reporte'));
  }
  return data!.endorseMaintenanceTicket;
}

/** Calificar cierra el ticket. */
export async function rateMaintenanceTicket(input: {
  ticketId: string;
  rating: number;
  comment?: string;
}): Promise<MaintenanceTicket> {
  const { data, error } = await apolloClient.mutate<{
    rateMaintenanceTicket: MaintenanceTicket;
  }>({
    mutation: RATE_MAINTENANCE_TICKET,
    variables: { input },
  });
  if (error) {
    throw new Error(getApiErrorMessage(error, 'No se pudo calificar la atención'));
  }
  return data!.rateMaintenanceTicket;
}

/** El arreglo no sirvió. El servidor valida la ventana y el tope de reaperturas. */
export async function reopenMaintenanceTicket(
  ticketId: string,
  reason: string,
): Promise<MaintenanceTicket> {
  const { data, error } = await apolloClient.mutate<{
    reopenMaintenanceTicket: MaintenanceTicket;
  }>({
    mutation: REOPEN_MAINTENANCE_TICKET,
    variables: { ticketId, reason },
  });
  if (error) {
    throw new Error(getApiErrorMessage(error, 'No se pudo reabrir el ticket'));
  }
  return data!.reopenMaintenanceTicket;
}

/** Comentario sin fotos. Con fotos se usa `addMaintenanceProgress`. */
export async function addMaintenanceComment(
  ticketId: string,
  message: string,
): Promise<MaintenanceTicket> {
  const { data, error } = await apolloClient.mutate<{
    addMaintenanceComment: MaintenanceTicket;
  }>({
    mutation: ADD_MAINTENANCE_COMMENT,
    variables: { input: { ticketId, message } },
  });
  if (error) {
    throw new Error(getApiErrorMessage(error, 'No se pudo enviar el comentario'));
  }
  return data!.addMaintenanceComment;
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
async function postMultipart<T>(
  path: string,
  form: FormData,
  fallback: string,
): Promise<T> {
  const tokens = await SecureStorageService.getTokens();

  const res = await fetch(`${REST_API_URL}${path}`, {
    method: 'POST',
    headers: tokens?.accessToken
      ? { Authorization: `Bearer ${tokens.accessToken}` }
      : {},
    body: form,
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => ({} as { message?: string }));
    throw new Error((payload as { message?: string })?.message ?? fallback);
  }

  return (await res.json()) as T;
}

export interface CreateTicketInput {
  complexId: string;
  title: string;
  description: string;
  category: MaintenanceCategory;
  priority?: string;
  locationType: MaintenanceLocationType;
  locationText?: string;
  buildingId?: string;
  floor?: number;
  amenityId?: string;
  locationTagCode?: string;
  lat?: number;
  lng?: number;
  gpsAccuracyMeters?: number;
  occurredAt?: string;
}

/**
 * Radica el ticket con su evidencia.
 *
 * Las fotos van en el campo `photos` y el video en `video`: son dos campos
 * distintos porque tienen topes distintos —40 MB el video, 10 MB cada foto— y
 * el servidor los sella por separado.
 */
export async function createMaintenanceTicket(
  input: CreateTicketInput,
  photos: PhotoUpload[],
  video?: PhotoUpload | null,
): Promise<MaintenanceTicket> {
  const form = new FormData();

  Object.entries(input).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    form.append(key, String(value));
  });

  photos.forEach(photo => form.append('photos', photo as unknown as Blob));
  if (video) form.append('video', video as unknown as Blob);

  return postMultipart<MaintenanceTicket>(
    '/api/v1/maintenance/tickets',
    form,
    'No se pudo radicar el reporte',
  );
}

/** Avance con fotos en la bitácora. */
export async function addMaintenanceProgress(
  ticketId: string,
  message: string,
  photos: PhotoUpload[],
): Promise<MaintenanceTicket> {
  const form = new FormData();
  form.append('message', message);
  photos.forEach(photo => form.append('photos', photo as unknown as Blob));

  return postMultipart<MaintenanceTicket>(
    `/api/v1/maintenance/tickets/${ticketId}/progress`,
    form,
    'No se pudo enviar el avance',
  );
}
