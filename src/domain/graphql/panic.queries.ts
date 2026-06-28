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
