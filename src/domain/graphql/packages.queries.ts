import { gql } from '@apollo/client';

// Resident-scoped list with full history. The complex-wide `packages` query is
// NOT authorized for RESIDENT_ROL; `myUnitPackages` is the resident-facing
// endpoint — the backend forces the scope to the resident's own unit, so any
// status (pending + delivered/returned/lost) is returned for the chip filters.
export const GET_MY_UNIT_PACKAGES = gql`
  query MyUnitPackages($complexId: String!, $pagination: PaginationInput, $filters: FilterPackagesInput) {
    myUnitPackages(complexId: $complexId, pagination: $pagination, filters: $filters) {
      items {
        id
        trackingCode
        senderName
        description
        type
        status
        photoUrl
        receivedAt
        notifiedAt
        deliveredAt
        returnedAt
        recipientName
        receivedByName
        notes
        returnReason
        unitId
        complexId
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

// Single package by id — opened from a PACKAGE_* notification. Note the argument
// is `packageId`, not `id`.
export const GET_PACKAGE = gql`
  query Package($packageId: String!) {
    package(packageId: $packageId) {
      id
      trackingCode
      senderName
      description
      type
      status
      photoUrl
      receivedAt
      notifiedAt
      deliveredAt
      returnedAt
      recipientName
      receivedByName
      notes
      returnReason
      unitId
      complexId
    }
  }
`;
