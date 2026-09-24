import { gql } from '@apollo/client';

/**
 * Chat entre quien publicó un aviso y quien se interesó.
 *
 * Solo los dos participantes leen la conversación —el servidor lo exige—, y
 * el teléfono del otro nunca viaja salvo como mensaje `PHONE_SHARED`, cuando
 * su dueño decide compartirlo.
 */

export const CONVERSATION_FIELDS = gql`
  fragment ConversationFields on MarketplaceConversationView {
    id
    role
    listing {
      id
      title
      type
      status
      imageUrl
      priceLabel
    }
    counterpart {
      name
      profilePicture
      unitLabel
    }
    lastMessagePreview
    lastMessageAt
    lastMessageIsMine
    unreadCount
    counterpartLastReadAt
    isReadOnly
    closedByModeration
    reportedByMe
    isBlocked
    blockedByMe
    myPhoneShared
    canSharePhone
  }
`;

export const MESSAGE_FIELDS = gql`
  fragment MessageFields on MarketplaceMessage {
    id
    conversationId
    senderUserId
    kind
    body
    imagePath
    createdAt
    isMine
  }
`;

export const GET_MY_CONVERSATIONS = gql`
  ${CONVERSATION_FIELDS}
  query MyMarketplaceConversations(
    $complexId: String!
    $pagination: PaginationInput
    $listingId: String
  ) {
    myMarketplaceConversations(
      complexId: $complexId
      pagination: $pagination
      listingId: $listingId
    ) {
      items {
        ...ConversationFields
      }
      pagination {
        currentPage
        totalPages
        hasNextPage
      }
    }
  }
`;

export const GET_CONVERSATION = gql`
  ${CONVERSATION_FIELDS}
  query MarketplaceConversation($conversationId: String!) {
    marketplaceConversation(conversationId: $conversationId) {
      ...ConversationFields
    }
  }
`;

export const GET_MESSAGES = gql`
  ${MESSAGE_FIELDS}
  query MarketplaceMessages(
    $conversationId: String!
    $before: DateTime
    $limit: Int
  ) {
    marketplaceMessages(
      conversationId: $conversationId
      before: $before
      limit: $limit
    ) {
      items {
        ...MessageFields
      }
      hasMore
    }
  }
`;

export const GET_UNREAD_MESSAGES = gql`
  query MarketplaceUnreadMessages($complexId: String!) {
    marketplaceUnreadMessages(complexId: $complexId)
  }
`;

// ─── Mutaciones ──────────────────────────────────────────────────────────────

export const OPEN_LISTING_CONVERSATION = gql`
  ${CONVERSATION_FIELDS}
  mutation OpenListingConversation($input: OpenListingConversationInput!) {
    openListingConversation(input: $input) {
      ...ConversationFields
    }
  }
`;

export const SEND_MESSAGE = gql`
  ${MESSAGE_FIELDS}
  mutation SendMarketplaceMessage($input: SendMarketplaceMessageInput!) {
    sendMarketplaceMessage(input: $input) {
      ...MessageFields
    }
  }
`;

export const SHARE_MY_PHONE = gql`
  ${MESSAGE_FIELDS}
  mutation ShareMyPhoneInConversation($conversationId: String!) {
    shareMyPhoneInConversation(conversationId: $conversationId) {
      ...MessageFields
    }
  }
`;

export const MARK_CONVERSATION_READ = gql`
  mutation MarkMarketplaceConversationRead($conversationId: String!) {
    markMarketplaceConversationRead(conversationId: $conversationId)
  }
`;

export const BLOCK_COUNTERPART = gql`
  ${CONVERSATION_FIELDS}
  mutation BlockConversationCounterpart($conversationId: String!) {
    blockConversationCounterpart(conversationId: $conversationId) {
      ...ConversationFields
    }
  }
`;

/**
 * Reportar el chat a la administración. Es lo único que le permite leerlo: sin
 * reporte, nadie más que los dos vecinos ve la conversación.
 */
export const REPORT_CONVERSATION = gql`
  mutation ReportMarketplaceConversation($input: ReportConversationInput!) {
    reportMarketplaceConversation(input: $input)
  }
`;

export const UNBLOCK_COUNTERPART = gql`
  ${CONVERSATION_FIELDS}
  mutation UnblockConversationCounterpart($conversationId: String!) {
    unblockConversationCounterpart(conversationId: $conversationId) {
      ...ConversationFields
    }
  }
`;
