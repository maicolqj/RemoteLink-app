import { gql } from '@apollo/client';

/**
 * PQRF: radicación y consulta.
 *
 * `pqrfRequests` es la bandeja de la instancia (administración o consejo) y el
 * backend filtra por destinatario: un radicado dirigido solo al consejo nunca
 * viaja hacia la administración, aunque pida la misma consulta.
 */

export const PQRF_FIELDS = gql`
  fragment PqrfFields on Pqrf {
    id
    code
    type
    addressee
    status
    subject
    description
    requestedByName
    resolvedAt
    dueAt
    resolvedBySilence
    unitId
    unit {
      id
      number
      building {
        id
        name
      }
    }
    createdAt
  }
`;

export const GET_MY_PQRF = gql`
  ${PQRF_FIELDS}
  query MyPqrfRequests($complexId: String!, $pagination: PaginationInput, $filters: FilterPqrfInput) {
    myPqrfRequests(complexId: $complexId, pagination: $pagination, filters: $filters) {
      items {
        ...PqrfFields
      }
      pagination {
        currentPage
        totalPages
        totalItems
        hasNextPage
      }
    }
  }
`;

export const GET_PQRF_INBOX = gql`
  ${PQRF_FIELDS}
  query PqrfRequests($complexId: String!, $pagination: PaginationInput, $filters: FilterPqrfInput) {
    pqrfRequests(complexId: $complexId, pagination: $pagination, filters: $filters) {
      items {
        ...PqrfFields
      }
      pagination {
        currentPage
        totalPages
        totalItems
        hasNextPage
      }
    }
  }
`;

/** La ficha trae además quién lo abrió y quién ya lo dio por resuelto. */
export const GET_PQRF = gql`
  ${PQRF_FIELDS}
  query PqrfRequest($pqrfId: String!) {
    pqrfRequest(pqrfId: $pqrfId) {
      ...PqrfFields
      viewerCanResolve
      viewerIsCouncilObserver
      acknowledgements {
        id
        userId
        userName
        instance
        openedAt
        resolvedAt
      }
    }
  }
`;

/**
 * Deja constancia de que el destinatario abrió el radicado. La ficha la llama
 * al montarse: leerlo es un hecho, no algo que se deba reportar a mano.
 */
export const OPEN_PQRF = gql`
  ${PQRF_FIELDS}
  mutation OpenPqrf($pqrfId: String!) {
    openPqrf(pqrfId: $pqrfId) {
      ...PqrfFields
      viewerCanResolve
      viewerIsCouncilObserver
      acknowledgements {
        id
        userId
        userName
        instance
        openedAt
        resolvedAt
      }
    }
  }
`;

export const RESOLVE_PQRF = gql`
  ${PQRF_FIELDS}
  mutation ResolvePqrf($pqrfId: String!) {
    resolvePqrf(pqrfId: $pqrfId) {
      ...PqrfFields
      viewerCanResolve
      viewerIsCouncilObserver
      acknowledgements {
        id
        userId
        userName
        instance
        openedAt
        resolvedAt
      }
    }
  }
`;

export const CREATE_PQRF = gql`
  ${PQRF_FIELDS}
  mutation CreatePqrf($input: CreatePqrfInput!) {
    createPqrf(input: $input) {
      ...PqrfFields
    }
  }
`;
