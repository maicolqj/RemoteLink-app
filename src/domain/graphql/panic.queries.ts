import { gql } from '@apollo/client';

export const GET_UNIT = gql`
  query GetUnit($id: String!) {
    unit(id: $id) {
      id
      number
      floor
      building {
        id
        name
      }
    }
  }
`;

export const ACTIVE_PANIC_ALERTS = gql`
  query ActivePanicAlerts($complexId: String!) {
    activePanicAlerts(complexId: $complexId) {
      id
      complexId
      createdByUserId
      metadata
      createdAt
    }
  }
`;

/**
 * Quién disparó la alerta.
 *
 * El push de pánico solo trae el id del usuario, así que sin esto el modal se
 * queda en una etiqueta genérica ("Residente") y quien atiende no sabe a qué
 * unidad ir.
 *
 * Devuelve null cuando ese usuario no es residente —un guarda o la
 * administración disparando el pánico—, así que el modal debe seguir apoyándose
 * en `triggeredByLabel` del payload como respaldo.
 */
export const GET_RESIDENT_BY_USER_ID = gql`
  query GetResidentByUserId($userId: String!) {
    residentByUserId(userId: $userId) {
      id
      user {
        id
        name
        lastName
        phoneNumber
      }
      unit {
        id
        number
        floor
        building {
          id
          name
        }
      }
    }
  }
`;
