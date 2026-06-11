import { gql } from '@apollo/client';

export const GET_UNIT = gql`
  query GetUnit($id: String!) {
    unit(id: $id) {
      id
      number
    }
  }
`;
