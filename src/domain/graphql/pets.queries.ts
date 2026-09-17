import { gql } from '@apollo/client';

/**
 * Mascotas y convivencia, desde la app del residente.
 *
 * El recorte lo hace el servidor y no se puede replicar aquí: un reporte sin
 * revisar no le aparece a la unidad señalada, y la identidad de quien reportó
 * nunca viaja hacia el acusado.
 */

export const PET_FIELDS = gql`
  fragment PetFields on Pet {
    id
    name
    species
    breed
    color
    distinguishingMarks
    sex
    size
    birthDate
    photoUrl
    hasMicrochip
    microchipCode
    isSpecialBreed
    insuranceCompany
    insurancePolicyNumber
    insuranceExpiresAt
    vaccinationCardUrl
    rabiesVaccineAt
    sterilized
    status
    approvedAt
    rejectionReason
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

export const PET_INCIDENT_FIELDS = gql`
  fragment PetIncidentFields on PetIncident {
    id
    code
    type
    severity
    description
    photoUrls
    occurredAt
    location
    status
    statementDueAt
    resolutionNotes
    resolvedAt
    fineAmount
    reportedByName
    petId
    pet {
      id
      name
      species
      breed
      photoUrl
    }
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

/** Las mascotas de la unidad del residente autenticado. */
export const GET_MY_PETS = gql`
  ${PET_FIELDS}
  query MyPets($complexId: String!) {
    myPets(complexId: $complexId) {
      ...PetFields
    }
  }
`;

/**
 * Lo que el residente puede ver: lo que él radicó y lo que se abrió contra su
 * unidad una vez validado. El filtro es del servidor.
 */
export const GET_MY_PET_INCIDENTS = gql`
  ${PET_INCIDENT_FIELDS}
  query PetIncidents(
    $complexId: String!
    $pagination: PaginationInput
    $filters: FilterPetIncidentsInput
  ) {
    petIncidents(complexId: $complexId, pagination: $pagination, filters: $filters) {
      items {
        ...PetIncidentFields
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

/** La ficha con el hilo del expediente: observaciones y descargos, en orden. */
export const GET_PET_INCIDENT = gql`
  ${PET_INCIDENT_FIELDS}
  query PetIncident($id: String!) {
    petIncident(id: $id) {
      ...PetIncidentFields
      statements {
        id
        text
        imageUrls
        authorName
        authorRole
        createdAt
      }
    }
  }
`;

/**
 * Editar la ficha mientras la administración no la haya aprobado. La unidad no
 * se puede cambiar por aquí: mover una mascota de apartamento es un traslado
 * con consecuencias, no un campo editable.
 */
export const UPDATE_PET = gql`
  ${PET_FIELDS}
  mutation UpdatePet($input: UpdatePetInput!) {
    updatePet(input: $input) {
      ...PetFields
    }
  }
`;

/** Saca la mascota del censo. No se borra: los reportes ya radicados la citan. */
export const REMOVE_PET = gql`
  mutation RemovePet($petId: String!, $reason: String) {
    removePet(petId: $petId, reason: $reason)
  }
`;

/**
 * Descargos de la unidad señalada.
 *
 * Es la pieza que hace defendible —o anulable— la sanción: la Ley 675 exige
 * oír al implicado antes de sancionarlo. Solo se acepta dentro del plazo y solo
 * de quien vive en la unidad acusada.
 */
export const ADD_PET_INCIDENT_STATEMENT = gql`
  ${PET_INCIDENT_FIELDS}
  mutation AddPetIncidentStatement($input: CreatePetIncidentStatementInput!) {
    addPetIncidentStatement(input: $input) {
      ...PetIncidentFields
      statements {
        id
        text
        imageUrls
        authorName
        authorRole
        createdAt
      }
    }
  }
`;
