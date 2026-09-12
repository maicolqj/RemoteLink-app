import apolloClient from '../../data/lib/apollo/client';
import {
  GET_MY_PQRF,
  GET_PQRF_INBOX,
  CREATE_PQRF,
  GET_PQRF,
  OPEN_PQRF,
  RESOLVE_PQRF,
} from '../../domain/graphql/pqrf.queries';
import { getApiErrorMessage } from '../utils/apiError';
import type { Pqrf, PqrfPage } from '../../domain/responses/PqrfResponseModel';

/**
 * Todo va con `network-only`: un radicado recién puesto tiene que aparecer de
 * inmediato en la lista, y la bandeja del consejo cambia por lo que radican
 * otros residentes.
 */

const PAGE = { page: 1, limit: 50 };

/** Los radicados del propio residente. */
export async function fetchMyPqrf(complexId: string): Promise<Pqrf[]> {
  const { data } = await apolloClient.query<{ myPqrfRequests: PqrfPage }>({
    query: GET_MY_PQRF,
    variables: { complexId, pagination: PAGE },
    fetchPolicy: 'network-only',
  });
  return data?.myPqrfRequests?.items ?? [];
}

/**
 * Bandeja de la instancia. El backend decide qué entra según a quién se dirigió
 * el radicado, así que aquí no hay ningún filtro que replicar.
 */
export async function fetchPqrfInbox(complexId: string): Promise<Pqrf[]> {
  const { data } = await apolloClient.query<{ pqrfRequests: PqrfPage }>({
    query: GET_PQRF_INBOX,
    variables: { complexId, pagination: PAGE },
    fetchPolicy: 'network-only',
  });
  return data?.pqrfRequests?.items ?? [];
}

export async function createPqrf(input: {
  complexId: string;
  type: string;
  addressee: string;
  subject: string;
  description: string;
}): Promise<Pqrf> {
  const { data, error } = await apolloClient.mutate<{ createPqrf: Pqrf }>({
    mutation: CREATE_PQRF,
    variables: { input },
  });
  if (error) throw new Error(getApiErrorMessage(error, 'No se pudo radicar la solicitud'));
  return data!.createPqrf;
}

/** La ficha, con el rastro de quién lo abrió y quién lo dio por resuelto. */
export async function fetchPqrf(pqrfId: string): Promise<Pqrf> {
  const { data } = await apolloClient.query<{ pqrfRequest: Pqrf }>({
    query: GET_PQRF,
    variables: { pqrfId },
    fetchPolicy: 'network-only',
  });
  return data!.pqrfRequest;
}

/**
 * Deja constancia de que quien atiende abrió el radicado. Se llama al montar la
 * ficha y es idempotente; si quien mira es el propio residente, el backend la
 * ignora.
 */
export async function openPqrf(pqrfId: string): Promise<Pqrf> {
  const { data, error } = await apolloClient.mutate<{ openPqrf: Pqrf }>({
    mutation: OPEN_PQRF,
    variables: { pqrfId },
  });
  if (error) throw new Error(getApiErrorMessage(error, 'No se pudo abrir el radicado'));
  return data!.openPqrf;
}

/** Marca la parte de quien atiende. El radicado solo queda resuelto cuando todos marcan. */
export async function resolvePqrf(pqrfId: string): Promise<Pqrf> {
  const { data, error } = await apolloClient.mutate<{ resolvePqrf: Pqrf }>({
    mutation: RESOLVE_PQRF,
    variables: { pqrfId },
  });
  if (error) throw new Error(getApiErrorMessage(error, 'No se pudo marcar como resuelto'));
  return data!.resolvePqrf;
}
