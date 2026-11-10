import { gql } from '@apollo/client';

export const MY_COMMUNITY_ACCESS = gql`
  query MyCommunityAccess {
    myCommunityAccess {
      accessCut
      panicAvailable
      cutAt
    }
  }
`;
