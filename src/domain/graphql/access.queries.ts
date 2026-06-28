import { gql } from '@apollo/client';

// Aprobar/rechazar solicitudes de acceso de SUPERVISOR a un complejo.
// Coinciden con el schema actual (SupervisorAccessRequest).

export const APPROVE_ACCESS_REQUEST = gql`
  mutation ApproveAccessRequest($requestId: String!) {
    approveAccessRequest(requestId: $requestId) {
      id
      status
      resolvedAt
    }
  }
`;

export const REJECT_ACCESS_REQUEST = gql`
  mutation RejectAccessRequest($input: RejectAccessRequestInput!) {
    rejectAccessRequest(input: $input) {
      id
      status
      rejectionReason
      resolvedAt
    }
  }
`;
