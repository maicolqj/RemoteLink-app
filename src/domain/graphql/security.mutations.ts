import { gql } from '@apollo/client';

// Resident asks the gatehouse to call their unit. Mirrors triggerPanicAlert:
// only complexId travels — the backend resolves the requesting resident's unit
// from the authenticated user and fans the request out (push + socket) to the
// SECURITY role of that complex.
export const REQUEST_SECURITY_CALL = gql`
  mutation RequestSecurityCall($complexId: String!) {
    requestSecurityCall(complexId: $complexId) {
      success
      message
    }
  }
`;
