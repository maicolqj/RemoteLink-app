import { gql } from '@apollo/client';

/**
 * "Mi unidad": datos de la unidad, parqueaderos y bodegas propios, vehículos e
 * integrantes, en una sola consulta. La unidad la resuelve el servidor desde
 * la ficha activa del residente: la app no manda ningún id de unidad.
 */
export const GET_MY_UNIT = gql`
  query MyUnit($complexId: String!) {
    myUnit(complexId: $complexId) {
      unit {
        id
        number
        floor
        type
        area
        bedrooms
        bathrooms
        parkingSpots
        storageRooms
        hasElevator
        houseFloors
        coefficient
        building {
          id
          name
        }
      }
      assets {
        id
        type
        code
        location
      }
      vehicles {
        id
        plate
        type
        brand
        model
        year
        color
        photoUrl
        parkingSpot
        status
        suspendedByRotation
        fixedParkingAsset {
          id
          code
          location
        }
      }
      nextRotationAt
      members {
        residentId
        name
        lastName
        phoneNumber
        type
        isMainResident
        startDate
        isMe
      }
    }
  }
`;
