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
      name
      lastName
      identity
      isBlacklisted
      blacklistReason
      blacklistedAt
    }
  }
`;

export const REMOVE_FROM_BLACKLIST = gql`
  mutation RemoveVisitorFromBlacklist($visitorId: String!) {
    removeVisitorFromBlacklist(visitorId: $visitorId) {
      id
      name
      lastName
      identity
      isBlacklisted
      blacklistReason
      blacklistedAt
    }
  }
`;

// Single visit by id — used when opening a visit from a notification, where the
// visit may not yet be in the list store. Visitor comes as name + lastName here
// (the list query returns fullName), so the service composes fullName.
export const GET_VISIT = gql`
  query Visit($id: String!) {
    visit(id: $id) {
      id
      type
      status
      purpose
      entryTime
      exitTime
      expectedArrivalAt
      expectedArrivalUntil
      vehiclePlate
      denialReason
      notes
      approvedByResidentAt
      deniedByResidentAt
      createdAt
      visitor {
        id
        name
        lastName
        identity
        identityType
        phone
        photoUrl
        isBlacklisted
      }
    }
  }
`;

// Resident-scoped list (auth token), not the complex-wide `visits` query. The
// visitor comes as name + lastName here (service composes fullName) and the
// pagination DTO uses currentPage/itemsPerPage/totalItems.
export const GET_VISITS = gql`
  query MisVisitas($pagination: PaginationInput, $filters: FilterVisitsInput) {
    myVisits(pagination: $pagination, filters: $filters) {
      items {
        id
        type
        status
        purpose
        expectedArrivalAt
        expectedArrivalUntil
        qrToken
        qrUsed
        qrExpiresAt
        vehiclePlate
        entryTime
        exitTime
        createdAt
        visitor {
          id
          name
          lastName
          identity
          identityType
          phone
          photoUrl
          isBlacklisted
          blacklistReason
          blacklistedAt
        }
        unit {
          id
          building {
            id
            name
          }
        }
      }
      pagination {
        currentPage
        itemsPerPage
        totalItems
        totalPages
        hasNextPage
        hasPreviousPage
      }
    }
  }
`;
