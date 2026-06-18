import { gql } from '@apollo/client';

export const LOGIN_RESIDENT = gql`
  mutation LoginResident($input: LoginResidentInput!) {
    loginResident(input: $input) {
      accessToken
      refreshToken
      expiresIn
      sessionId
    }
  }
`;

export const REFRESH_TOKEN = gql`
  mutation RefreshToken($refreshToken: String!) {
    refreshToken(refreshToken: $refreshToken) {
      accessToken
      refreshToken
      expiresIn
      sessionId
    }
  }
`;

export const GET_MY_RESIDENT_PROFILE = gql`
  query GetMyResidentProfile {
    myResidentProfile {
      id
      type
      status
      isMainResident
      startDate
      user {
        id
        name
        lastName
        email
        phoneNumber
        identity
        rating
      }
      unit {
        id
        number
        floor
        building {
          id
          name
          floors
        }
      }
      complex {
        id
        name
      }
    }
  }
`;
