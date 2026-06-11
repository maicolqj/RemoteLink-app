import { gql } from '@apollo/client';

export const TRIGGER_PANIC_ALERT = gql`
  mutation TriggerPanicAlert($input: TriggerPanicAlertInput!) {
    triggerPanicAlert(input: $input) {
      id
      complexId
      triggeredBy
    }
  }
`;

export const ACKNOWLEDGE_PANIC_ALERT = gql`
  mutation AcknowledgePanicAlert($complexId: String!) {
    acknowledgePanicAlert(complexId: $complexId) {
      id
      complexId
    }
  }
`;
