import apolloClient from '../../data/lib/apollo/client';
import {
  SCHEDULE_VISIT,
  APPROVE_VISIT,
  DENY_VISIT,
  CANCEL_VISIT,
  BLACKLIST_VISITOR,
  REMOVE_FROM_BLACKLIST,
  GET_VISITS,
} from '../../domain/graphql/visits.queries';
import type { Visit, Visitor, VisitsResponse } from '../../domain/responses/VisitResponseModel';
import type { ScheduleVisitInput, BlacklistInput, FilterVisitsInput, PaginationInput } from '../../domain/inputs/VisitInput';

export async function fetchVisits(
  complexId: string,
  pagination: PaginationInput = { page: 1, limit: 50 },
  filters?: FilterVisitsInput,
): Promise<VisitsResponse> {
  const { data } = await apolloClient.query<{ visits: VisitsResponse }>({
    query: GET_VISITS,
    variables: { complexId, pagination, ...(filters ? { filters } : {}) },
  });
  return data.visits;
}

export async function scheduleVisit(input: ScheduleVisitInput): Promise<Visit> {
  const { data } = await apolloClient.mutate<{ scheduleVisit: Visit }>({
    mutation: SCHEDULE_VISIT,
    variables: { input },
  });
  if (!data?.scheduleVisit) throw new Error('No se pudo agendar la visita');
  return data.scheduleVisit;
}

export async function approveVisit(visitId: string): Promise<Partial<Visit>> {
  const { data } = await apolloClient.mutate<{ approveVisitEntry: Partial<Visit> }>({
    mutation: APPROVE_VISIT,
    variables: { visitId },
  });
  if (!data?.approveVisitEntry) throw new Error('No se pudo aprobar la visita');
  return data.approveVisitEntry;
}

export async function denyVisit(visitId: string, reason: string): Promise<Partial<Visit>> {
  const { data } = await apolloClient.mutate<{ denyVisitEntry: Partial<Visit> }>({
    mutation: DENY_VISIT,
    variables: { visitId, reason },
  });
  if (!data?.denyVisitEntry) throw new Error('No se pudo denegar la visita');
  return data.denyVisitEntry;
}

export async function cancelVisit(visitId: string): Promise<Partial<Visit>> {
  const { data } = await apolloClient.mutate<{ cancelVisit: Partial<Visit> }>({
    mutation: CANCEL_VISIT,
    variables: { visitId },
  });
  if (!data?.cancelVisit) throw new Error('No se pudo cancelar la visita');
  return data.cancelVisit;
}

export async function blacklistVisitor(input: BlacklistInput): Promise<Partial<Visitor>> {
  const { data } = await apolloClient.mutate<{ blacklistVisitor: Partial<Visitor> }>({
    mutation: BLACKLIST_VISITOR,
    variables: { input },
  });
  if (!data?.blacklistVisitor) throw new Error('No se pudo agregar a la lista negra');
  return data.blacklistVisitor;
}

export async function removeFromBlacklist(visitorId: string): Promise<Partial<Visitor>> {
  const { data } = await apolloClient.mutate<{ removeVisitorFromBlacklist: Partial<Visitor> }>({
    mutation: REMOVE_FROM_BLACKLIST,
    variables: { visitorId },
  });
  if (!data?.removeVisitorFromBlacklist) throw new Error('No se pudo remover de la lista negra');
  return data.removeVisitorFromBlacklist;
}
