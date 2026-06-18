import apolloClient from '../../data/lib/apollo/client';
import {
  GET_ACCESS_REQUEST,
  APPROVE_ACCESS_REQUEST,
  REJECT_ACCESS_REQUEST,
} from '../../domain/graphql/access.queries';
import type { AccessRequest } from '../../domain/responses/AccessRequestResponseModel';

// ⚠️ All operation/field names here are TENTATIVE — see access.queries.ts.

export async function fetchAccessRequestById(id: string): Promise<AccessRequest> {
  const { data } = await apolloClient.query<{ accessRequest: AccessRequest }>({
    query: GET_ACCESS_REQUEST,
    variables: { id },
    fetchPolicy: 'network-only',
  });
  if (!data?.accessRequest) throw new Error('No se encontró la solicitud de acceso');
  return data.accessRequest;
}

export async function approveAccessRequest(id: string): Promise<Partial<AccessRequest>> {
  const { data } = await apolloClient.mutate<{ approveAccessRequest: Partial<AccessRequest> }>({
    mutation: APPROVE_ACCESS_REQUEST,
    variables: { id },
  });
  if (!data?.approveAccessRequest) throw new Error('No se pudo aprobar la solicitud');
  return data.approveAccessRequest;
}

export async function rejectAccessRequest(id: string, reason: string): Promise<Partial<AccessRequest>> {
  const { data } = await apolloClient.mutate<{ rejectAccessRequest: Partial<AccessRequest> }>({
    mutation: REJECT_ACCESS_REQUEST,
    variables: { id, reason },
  });
  if (!data?.rejectAccessRequest) throw new Error('No se pudo rechazar la solicitud');
  return data.rejectAccessRequest;
}
