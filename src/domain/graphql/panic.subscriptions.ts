import { gql } from '@apollo/client';

export const PANIC_ALERT_NEW = gql`
  subscription PanicAlertNew($complexId: String!) {
    panicAlertNew(complexId: $complexId) {
      complexId
      triggeredBy
      triggeredByRole
      unitId
      unitNumber
      message
    }
  }
`;

export const PANIC_ALERT_ACKNOWLEDGED = gql`
  subscription PanicAlertAcknowledged($complexId: String!) {
    panicAlertAcknowledged(complexId: $complexId) {
      id
      complexId
    }
  }
`;
