import { gql } from '@apollo/client';

export const SCHEDULE_VISIT = gql`
  mutation ScheduleVisit($input: ScheduleVisitInput!) {
    scheduleVisit(input: $input) {
      id
      status
      type
      qrToken
      qrExpiresAt
      expectedArrivalAt
      expectedArrivalUntil
      createdAt
      visitor {
        id
        fullName
        identity
        identityType
        phone
      }
    }
  }
`;

export const APPROVE_VISIT = gql`
  mutation ApproveVisit($visitId: String!) {
    approveVisitEntry(visitId: $visitId) {
      id
      status
      approvedByResidentAt
    }
  }
`;

export const DENY_VISIT = gql`
  mutation DenyVisit($visitId: String!, $reason: String!) {
    denyVisitEntry(visitId: $visitId, reason: $reason) {
      id
      status
      denialReason
      deniedByResidentAt
    }
  }
`;

export const CANCEL_VISIT = gql`
  mutation CancelVisit($visitId: String!) {
    cancelVisit(visitId: $visitId) {
      id
      status
    }
  }
`;

export const BLACKLIST_VISITOR = gql`
  mutation BlacklistVisitor($input: BlacklistVisitorInput!) {
    blacklistVisitor(input: $input) {
      id
      isBlacklisted
      blacklistReason
      blacklistedAt
    }
  }
`;

export const REMOVE_FROM_BLACKLIST = gql`
  mutation RemoveFromBlacklist($visitorId: String!) {
    removeVisitorFromBlacklist(visitorId: $visitorId) {
      id
      isBlacklisted
      blacklistReason
      blacklistedAt
    }
  }
`;

export const GET_VISITS = gql`
  query GetVisits($complexId: String!, $pagination: PaginationInput, $filters: FilterVisitsInput) {
    visits(complexId: $complexId, pagination: $pagination, filters: $filters) {
      items {
        id
        status
        type
        entryTime
        exitTime
        purpose
        vehiclePlate
        qrToken
        qrExpiresAt
        qrUsed
        expectedArrivalAt
        expectedArrivalUntil
        createdAt
        notes
        denialReason
        approvedByResidentAt
        deniedByResidentAt
        visitor {
          id
          fullName
          identity
          identityType
          phone
          isBlacklisted
          blacklistReason
          blacklistedAt
        }
      }
      pagination {
        total
        page
        limit
      }
    }
  }
`;
