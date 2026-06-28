import apolloClient from '../../data/lib/apollo/client';
import {
  APPROVE_ACCESS_REQUEST,
  REJECT_ACCESS_REQUEST,
} from '../../domain/graphql/access.queries';
import { GET_ACCESS_REQUEST } from '../../domain/graphql/access-legacy';
import { getApiErrorMessage } from '../utils/apiError';
import type { AccessRequest } from '../../domain/responses/AccessRequestResponseModel';

// ⚠️ fetchAccessRequestById usa GET_ACCESS_REQUEST, que NO tiene endpoint en el
// schema actual (ver access-legacy.ts). Fallará en runtime hasta que el backend
// lo implemente. approve/reject sí mapean al schema (SupervisorAccessRequest).

export async function fetchAccessRequestById(id: string): Promise<AccessRequest> {
  const { data, error } = await apolloClient.query<{ accessRequest: AccessRequest }>({
    query: GET_ACCESS_REQUEST,
    variables: { id },
    fetchPolicy: 'network-only',
  });
  if (error) throw new Error(getApiErrorMessage(error, 'No se encontró la solicitud de acceso'));
  if (!data?.accessRequest) throw new Error('No se encontró la solicitud de acceso');
  return data.accessRequest;
}

export async function approveAccessRequest(id: string): Promise<Partial<AccessRequest>> {
  const { data, error } = await apolloClient.mutate<{ approveAccessRequest: Partial<AccessRequest> }>({
    mutation: APPROVE_ACCESS_REQUEST,
    variables: { requestId: id },
  });
  if (error) throw new Error(getApiErrorMessage(error, 'No se pudo aprobar la solicitud'));
  if (!data?.approveAccessRequest) throw new Error('No se pudo aprobar la solicitud');
  return data.approveAccessRequest;
}

export async function rejectAccessRequest(id: string, reason: string): Promise<Partial<AccessRequest>> {
  const { data, error } = await apolloClient.mutate<{ rejectAccessRequest: Partial<AccessRequest> }>({
    mutation: REJECT_ACCESS_REQUEST,
    variables: { input: { requestId: id, reason } },
  });
  if (error) throw new Error(getApiErrorMessage(error, 'No se pudo rechazar la solicitud'));
  if (!data?.rejectAccessRequest) throw new Error('No se pudo rechazar la solicitud');
  return data.rejectAccessRequest;
}
