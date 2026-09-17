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

export const RESEND_SYSTEM_CODE = gql`
  mutation ResendResidentSystemCode($identity: String!) {
    resendResidentSystemCode(identity: $identity) {
      success
      message
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
      isCouncilMember
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
        # Con qué módulos cuenta el conjunto: es lo que decide qué accesos se
        # pintan en el inicio. Lista vacía o nula = todos habilitados, la misma
        # regla que usa el servidor.
        enabledModules
      }
    }
  }
`;
