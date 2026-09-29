import { gql } from '@apollo/client';

export const TRIGGER_PANIC_ALERT = gql`
  mutation TriggerPanicAlert($complexId: String!) {
    triggerPanicAlert(complexId: $complexId) {
      success
      panicAlertId
    }
  }
`;

/**
 * Dónde está quien activó el pánico. Va aparte del disparo para que la alarma
 * no espere al GPS; la app manda la primera lectura y las que la mejoran.
 */
export const REPORT_PANIC_LOCATION = gql`
  mutation ReportPanicLocation($input: ReportPanicLocationInput!) {
    reportPanicLocation(input: $input) {
      id
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
