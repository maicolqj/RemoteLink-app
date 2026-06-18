import { gql } from '@apollo/client';

export const SAVE_MOBILE_TOKEN = gql`
  mutation SaveMobileToken($input: SaveMobileTokenInput!) {
    saveMobileToken(input: $input) {
      success
    }
  }
`;
