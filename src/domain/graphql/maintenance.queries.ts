import { gql } from '@apollo/client';

/**
 * Mantenimiento de zonas comunes, desde la app del residente.
 *
 * El recorte lo hace el servidor: el residente ve los tickets públicos del
 * conjunto y los suyos, nunca los marcados como privados —una cámara dañada es
 * un mapa para quien quiera entrar— ni las notas internas de la bitácora.
 */

export const MAINTENANCE_TICKET_FIELDS = gql`
  fragment MaintenanceTicketFields on MaintenanceTicket {
    id
    code
    title
    description
    category
    priority
    status
    visibility
    photoUrls
    videoUrl
    occurredAt
    locationType
    locationText
    floor
    lat
    lng
    buildingId
    building {
      id
      name
    }
    amenityId
    amenity {
      id
      name
    }
    locationTagId
    locationTag {
      id
      code
      name
    }
    endorsementCount
    scheduledFor
    slaDueAt
    slaBreachedAt
    resolutionNotes
    closurePhotoUrls
    resolvedAt
    rating
    ratingComment
    reopenCount
    reportedByUserId
    reportedByName
    createdAt
  }
`;

/**
 * Lo que el residente puede ver: los públicos del conjunto y los suyos.
 *
 * Ver los de los vecinos no es un descuido, es el punto: si el ascensor ya está
 * reportado y en reparación, no hace falta el reporte número treinta.
 */
export const GET_MAINTENANCE_TICKETS = gql`
  ${MAINTENANCE_TICKET_FIELDS}
  query MaintenanceTickets(
    $complexId: String!
    $pagination: PaginationInput
    $filters: FilterMaintenanceTicketsInput
  ) {
    maintenanceTickets(
      complexId: $complexId
      pagination: $pagination
      filters: $filters
    ) {
      items {
        ...MaintenanceTicketFields
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

/** La ficha con la bitácora: es la que responde "¿en qué va lo mío?". */
export const GET_MAINTENANCE_TICKET = gql`
  ${MAINTENANCE_TICKET_FIELDS}
  query MaintenanceTicket($id: String!) {
    maintenanceTicket(id: $id) {
      ...MaintenanceTicketFields
      vendor {
        id
        name
      }
      assignedUser {
        id
        name
        lastName
      }
      events {
        id
        type
        message
        fromStatus
        toStatus
        imageUrls
        authorName
        authorRole
        createdAt
      }
    }
  }
`;

/**
 * Torres, zonas comunes y puntos con QR/NFC del conjunto, en un solo viaje.
 * Es lo que llena el selector de ubicación del formulario.
 */
export const GET_MAINTENANCE_REPORT_OPTIONS = gql`
  query MaintenanceReportOptions($complexId: String!) {
    maintenanceReportOptions(complexId: $complexId) {
      residentReportingEnabled
      gpsAccuracyMeters
      qrEnabled
      nfcEnabled
      buildings {
        id
        name
        floors
      }
      amenities {
        id
        name
      }
      tags {
        id
        code
        name
        floor
        defaultCategory
        buildingId
        amenityId
      }
    }
  }
`;

/** Resuelve el código del sticker antes de abrir el formulario. */
export const GET_MAINTENANCE_TAG_BY_CODE = gql`
  query MaintenanceLocationTagByCode($complexId: String!, $code: String!) {
    maintenanceLocationTagByCode(complexId: $complexId, code: $code) {
      id
      code
      name
      description
      floor
      defaultCategory
      buildingId
      amenityId
    }
  }
`;

/**
 * ¿Esto ya está reportado?
 *
 * Se consulta ANTES de radicar. Cuando el ascensor se para, treinta vecinos
 * abren treinta tickets y el tablero deja de servir: aquí se les ofrece sumarse
 * al que ya existe.
 */
export const GET_MAINTENANCE_DUPLICATES = gql`
  ${MAINTENANCE_TICKET_FIELDS}
  query MaintenanceDuplicateCandidates($input: CheckMaintenanceDuplicateInput!) {
    maintenanceDuplicateCandidates(input: $input) {
      ...MaintenanceTicketFields
    }
  }
`;

/** "A mí también me pasa": suma al ticket abierto en vez de abrir otro. */
export const ENDORSE_MAINTENANCE_TICKET = gql`
  ${MAINTENANCE_TICKET_FIELDS}
  mutation EndorseMaintenanceTicket($ticketId: String!, $comment: String) {
    endorseMaintenanceTicket(ticketId: $ticketId, comment: $comment) {
      ...MaintenanceTicketFields
    }
  }
`;

/**
 * Calificar CIERRA el ticket: es la confirmación de que el trabajo quedó hecho.
 * Si quedó mal, el camino es reabrir, no una estrella.
 */
export const RATE_MAINTENANCE_TICKET = gql`
  ${MAINTENANCE_TICKET_FIELDS}
  mutation RateMaintenanceTicket($input: RateMaintenanceTicketInput!) {
    rateMaintenanceTicket(input: $input) {
      ...MaintenanceTicketFields
    }
  }
`;

/** El arreglo no sirvió: vuelve al tablero con el mismo número. */
export const REOPEN_MAINTENANCE_TICKET = gql`
  ${MAINTENANCE_TICKET_FIELDS}
  mutation ReopenMaintenanceTicket($ticketId: String!, $reason: String!) {
    reopenMaintenanceTicket(ticketId: $ticketId, reason: $reason) {
      ...MaintenanceTicketFields
    }
  }
`;

/** Comentario en la bitácora. Las fotos de avance van por REST. */
export const ADD_MAINTENANCE_COMMENT = gql`
  ${MAINTENANCE_TICKET_FIELDS}
  mutation AddMaintenanceComment($input: AddMaintenanceCommentInput!) {
    addMaintenanceComment(input: $input) {
      ...MaintenanceTicketFields
      events {
        id
        type
        message
        imageUrls
        authorName
        authorRole
        createdAt
      }
    }
  }
`;
