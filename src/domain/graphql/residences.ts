import { gql } from '@apollo/client';

// Selector de conjunto: dónde vive el residente y cambiar el conjunto de la sesión.

export const GET_MY_RESIDENCES = gql`
  query MyResidences {
    myResidences {
      complexId
      complexName
      buildingName
      unitNumber
      isCurrent
      unreadCount
    }
  }
`;

export const SWITCH_RESIDENT_COMPLEX = gql`
  mutation SwitchResidentComplex($complexId: String!, $refreshToken: String!) {
    switchResidentComplex(complexId: $complexId, refreshToken: $refreshToken) {
      accessToken
      refreshToken
      expiresIn
      sessionId
    }
  }
`;
