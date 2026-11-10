import { gql } from '@apollo/client';

// Resident asks the gatehouse to call their unit. Mirrors triggerPanicAlert:
// only complexId travels — the backend resolves the requesting resident's unit
// from the authenticated user and fans the request out (push + socket) to the
// SECURITY role of that complex.
//
// Con varias porterías, `securityPostId` dice a cuál: solo esa se entera.
export const REQUEST_SECURITY_CALL = gql`
  mutation RequestSecurityCall($complexId: String!, $securityPostId: String) {
    requestSecurityCall(complexId: $complexId, securityPostId: $securityPostId) {
      success
      message
    }
  }
`;
