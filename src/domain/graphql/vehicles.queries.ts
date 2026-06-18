import { gql } from '@apollo/client';

// Single vehicle by id — opened from a VEHICLE_* notification.
export const GET_VEHICLE = gql`
  query Vehicle($id: String!) {
    vehicle(id: $id) {
      id
      plate
      type
      brand
      model
      year
      color
      fuelType
      photoUrl
      parkingSpot
      status
      approvedAt
      rejectionReason
      notes
      residentId
      unitId
      complexId
      createdAt
    }
  }
`;
