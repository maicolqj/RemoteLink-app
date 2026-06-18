import { gql } from '@apollo/client';

export const TRIGGER_PANIC_ALERT = gql`
  mutation TriggerPanicAlert($complexId: String!) {
    triggerPanicAlert(complexId: $complexId) {
      success
    }
  }
`;

export const ACKNOWLEDGE_PANIC_ALERT = gql`
  mutation AcknowledgePanicAlert($notificationId: String!) {
    acknowledgePanicAlert(notificationId: $notificationId) {
      id
      complexId
    }
  }
`;
