import { gql } from '@apollo/client';

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
