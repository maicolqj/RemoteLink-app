import apolloClient from '../../data/lib/apollo/client';
import {
  SCHEDULE_VISIT,
  APPROVE_VISIT,
  DENY_VISIT,
  CANCEL_VISIT,
  BLACKLIST_VISITOR,
  REMOVE_FROM_BLACKLIST,
  GET_VISITS,
  GET_VISIT,
} from '../../domain/graphql/visits.queries';
import { getApiErrorMessage } from '../utils/apiError';
import type { Visit, Visitor, VisitsResponse, VisitorIdentityType } from '../../domain/responses/VisitResponseModel';
import type { ScheduleVisitInput, BlacklistInput, FilterVisitsInput, PaginationInput } from '../../domain/inputs/VisitInput';

// myVisits returns the visitor as name + lastName and a different pagination DTO.
type RawListVisitor = {
  id?: string;
  name?: string;
  lastName?: string;
  identity: string;
  identityType?: VisitorIdentityType;
  phone?: string;
};
type RawListVisit = Omit<Visit, 'visitor'> & { visitor: RawListVisitor };
type RawMyVisits = {
  items: RawListVisit[];
  pagination?: { currentPage?: number; itemsPerPage?: number; totalItems?: number };
};

export async function fetchVisits(
  pagination: PaginationInput = { page: 1, limit: 50 },
  filters?: FilterVisitsInput,
): Promise<VisitsResponse> {
  const { data } = await apolloClient.query<{ myVisits: RawMyVisits }>({
    query: GET_VISITS,
    variables: { pagination, ...(filters ? { filters } : {}) },
    // cache-first would return a stale list after scheduleVisit (the mutation
    // doesn't patch the list cache), hiding the just-created visit.
    fetchPolicy: 'network-only',
  });

  const raw = data?.myVisits;
  const items: Visit[] = (raw?.items ?? []).map(v => {
    const { name, lastName, ...visitor } = v.visitor;
    return {
      ...v,
      visitor: {
        ...visitor,
        id: visitor.id ?? '',
        fullName: [name, lastName].filter(Boolean).join(' ').trim(),
      },
    };
  });

  return {
    items,
    pagination: {
      total: raw?.pagination?.totalItems ?? items.length,
      page: raw?.pagination?.currentPage ?? pagination.page,
      limit: raw?.pagination?.itemsPerPage ?? pagination.limit,
    },
  };
}

// The single-visit query returns the visitor as `name` + `lastName`; the rest of
// the app expects `visitor.fullName`, so compose it here.
type RawVisitorById = Omit<Visitor, 'fullName'> & { name?: string; lastName?: string };
type RawVisitById = Omit<Visit, 'visitor'> & { visitor: RawVisitorById };

export async function fetchVisitById(visitId: string): Promise<Visit> {
  const { data, error } = await apolloClient.query<{ visit: RawVisitById }>({
    query: GET_VISIT,
    variables: { id: visitId },
    fetchPolicy: 'network-only',
  });
  if (error) throw new Error(getApiErrorMessage(error, 'No se encontró la visita'));
  if (!data?.visit) throw new Error('No se encontró la visita');

  const { name, lastName, ...visitor } = data.visit.visitor;
  return {
    ...data.visit,
    visitor: {
      ...visitor,
      fullName: [name, lastName].filter(Boolean).join(' ').trim(),
    },
  };
}

export async function scheduleVisit(input: ScheduleVisitInput): Promise<Visit> {
  const { data, error } = await apolloClient.mutate<{ scheduleVisit: Visit }>({
    mutation: SCHEDULE_VISIT,
    variables: { input },
  });
  if (error) throw new Error(getApiErrorMessage(error, 'No se pudo agendar la visita'));
  if (!data?.scheduleVisit) throw new Error('No se pudo agendar la visita');
  return data.scheduleVisit;
}

export async function approveVisit(visitId: string): Promise<Partial<Visit>> {
  const { data, error } = await apolloClient.mutate<{ approveVisitEntry: Partial<Visit> }>({
    mutation: APPROVE_VISIT,
    variables: { visitId },
  });
  if (error) throw new Error(getApiErrorMessage(error, 'No se pudo aprobar la visita'));
  if (!data?.approveVisitEntry) throw new Error('No se pudo aprobar la visita');
  return data.approveVisitEntry;
}

export async function denyVisit(visitId: string, reason: string): Promise<Partial<Visit>> {
  const { data, error } = await apolloClient.mutate<{ denyVisitEntry: Partial<Visit> }>({
    mutation: DENY_VISIT,
    variables: { visitId, reason },
  });
  if (error) throw new Error(getApiErrorMessage(error, 'No se pudo denegar la visita'));
  if (!data?.denyVisitEntry) throw new Error('No se pudo denegar la visita');
  return data.denyVisitEntry;
}

export async function cancelVisit(visitId: string): Promise<Partial<Visit>> {
  const { data, error } = await apolloClient.mutate<{ cancelVisit: Partial<Visit> }>({
    mutation: CANCEL_VISIT,
    variables: { visitId },
  });
  if (error) throw new Error(getApiErrorMessage(error, 'No se pudo cancelar la visita'));
  if (!data?.cancelVisit) throw new Error('No se pudo cancelar la visita');
  return data.cancelVisit;
}

export async function blacklistVisitor(input: BlacklistInput): Promise<Partial<Visitor>> {
  const { data, error } = await apolloClient.mutate<{ blacklistVisitor: Partial<Visitor> }>({
    mutation: BLACKLIST_VISITOR,
    variables: { input },
  });
  if (error) throw new Error(getApiErrorMessage(error, 'No se pudo agregar a la lista negra'));
  if (!data?.blacklistVisitor) throw new Error('No se pudo agregar a la lista negra');
  return data.blacklistVisitor;
}

export async function removeFromBlacklist(visitorId: string): Promise<Partial<Visitor>> {
  const { data, error } = await apolloClient.mutate<{ removeVisitorFromBlacklist: Partial<Visitor> }>({
    mutation: REMOVE_FROM_BLACKLIST,
    variables: { visitorId },
  });
  if (error) throw new Error(getApiErrorMessage(error, 'No se pudo remover de la lista negra'));
  if (!data?.removeVisitorFromBlacklist) throw new Error('No se pudo remover de la lista negra');
  return data.removeVisitorFromBlacklist;
}
