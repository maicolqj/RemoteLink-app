import { gql } from '@apollo/client';

// ⚠️ TENTATIVE NAMES — adjust to the real backend schema.
// TODO(backend): confirm query name (`accessRequest`?) and arg name (`id`?).
// If only `pendingAccessRequests(complexId)` exists, this single-by-id query
// won't resolve APPROVED/REJECTED requests.
export const GET_ACCESS_REQUEST = gql`
  query AccessRequest($id: String!) {
    accessRequest(id: $id) {
      id
      status
      reason
      requestedAt
      resolvedAt
      rejectionReason
      requesterName
      requesterIdentity
      requesterIdentityType
      requesterPhone
      photoUrl
      unitId
      complexId
    }
  }
`;

// TODO(backend): confirm mutation name + args.
export const APPROVE_ACCESS_REQUEST = gql`
  mutation ApproveAccessRequest($id: String!) {
    approveAccessRequest(id: $id) {
      id
      status
      resolvedAt
    }
  }
`;

// TODO(backend): confirm mutation name + whether `reason` is required.
export const REJECT_ACCESS_REQUEST = gql`
  mutation RejectAccessRequest($id: String!, $reason: String!) {
    rejectAccessRequest(id: $id, reason: $reason) {
      id
      status
      rejectionReason
      resolvedAt
    }
  }
`;
