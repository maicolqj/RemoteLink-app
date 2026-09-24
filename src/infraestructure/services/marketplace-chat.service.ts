import apolloClient from '../../data/lib/apollo/client';
import {
  BLOCK_COUNTERPART,
  GET_CONVERSATION,
  GET_MESSAGES,
  GET_MY_CONVERSATIONS,
  GET_UNREAD_MESSAGES,
  MARK_CONVERSATION_READ,
  OPEN_LISTING_CONVERSATION,
  SEND_MESSAGE,
  SHARE_MY_PHONE,
  UNBLOCK_COUNTERPART,
} from '../../domain/graphql/marketplace-chat.queries';
import { getApiErrorMessage } from '../utils/apiError';
import type {
  ChatMessage,
  Conversation,
  ConversationPage,
  MessagesPage,
} from '../../domain/responses/MarketplaceChatResponseModel';

/**
 * Todo con `network-only`: el chat cambia por lo que escribe el otro vecino,
 * y una caché vieja mostraría una conversación que ya siguió.
 */

export async function fetchConversations(
  complexId: string,
  page = 1,
  listingId?: string,
): Promise<ConversationPage> {
  const { data, error } = await apolloClient.query<{
    myMarketplaceConversations: ConversationPage;
  }>({
    query: GET_MY_CONVERSATIONS,
    variables: { complexId, pagination: { page, limit: 20 }, listingId },
    fetchPolicy: 'network-only',
  });
  if (error) {
    throw new Error(getApiErrorMessage(error, 'No se pudieron cargar tus mensajes'));
  }
  return (
    data?.myMarketplaceConversations ?? {
      items: [],
      pagination: { currentPage: 1, totalPages: 1, hasNextPage: false },
    }
  );
}

export async function fetchConversation(
  conversationId: string,
): Promise<Conversation> {
  const { data, error } = await apolloClient.query<{
    marketplaceConversation: Conversation;
  }>({
    query: GET_CONVERSATION,
    variables: { conversationId },
    fetchPolicy: 'network-only',
  });
  if (error || !data) {
    throw new Error(getApiErrorMessage(error, 'No se pudo abrir la conversación'));
  }
  return data.marketplaceConversation;
}

export async function fetchMessages(
  conversationId: string,
  before?: string,
): Promise<MessagesPage> {
  const { data, error } = await apolloClient.query<{
    marketplaceMessages: MessagesPage;
  }>({
    query: GET_MESSAGES,
    variables: { conversationId, before, limit: 30 },
    fetchPolicy: 'network-only',
  });
  if (error) {
    throw new Error(getApiErrorMessage(error, 'No se pudieron cargar los mensajes'));
  }
  return data?.marketplaceMessages ?? { items: [], hasMore: false };
}

export async function fetchUnreadMessages(complexId: string): Promise<number> {
  const { data } = await apolloClient.query<{
    marketplaceUnreadMessages: number;
  }>({
    query: GET_UNREAD_MESSAGES,
    variables: { complexId },
    fetchPolicy: 'network-only',
  });
  return data?.marketplaceUnreadMessages ?? 0;
}

/** "Me interesa": registra el interés y abre (o reabre) el chat. */
export async function openListingConversation(
  listingId: string,
  message?: string,
): Promise<Conversation> {
  const { data, error } = await apolloClient.mutate<{
    openListingConversation: Conversation;
  }>({
    mutation: OPEN_LISTING_CONVERSATION,
    variables: { input: { listingId, message } },
  });
  if (error || !data) {
    throw new Error(getApiErrorMessage(error, 'No se pudo abrir el chat'));
  }
  return data.openListingConversation;
}

export async function sendMessage(
  conversationId: string,
  body: string,
): Promise<ChatMessage> {
  const { data, error } = await apolloClient.mutate<{
    sendMarketplaceMessage: ChatMessage;
  }>({
    mutation: SEND_MESSAGE,
    variables: { input: { conversationId, body } },
  });
  if (error || !data) {
    throw new Error(getApiErrorMessage(error, 'No se pudo enviar el mensaje'));
  }
  return data.sendMarketplaceMessage;
}

export async function shareMyPhone(conversationId: string): Promise<ChatMessage> {
  const { data, error } = await apolloClient.mutate<{
    shareMyPhoneInConversation: ChatMessage;
  }>({
    mutation: SHARE_MY_PHONE,
    variables: { conversationId },
  });
  if (error || !data) {
    throw new Error(getApiErrorMessage(error, 'No se pudo compartir tu WhatsApp'));
  }
  return data.shareMyPhoneInConversation;
}

/** Sin red no pasa nada: la próxima apertura la vuelve a marcar. */
export async function markConversationRead(conversationId: string): Promise<void> {
  try {
    await apolloClient.mutate({
      mutation: MARK_CONVERSATION_READ,
      variables: { conversationId },
    });
  } catch {
    /* se reintenta al volver a abrir el chat */
  }
}

export async function blockCounterpart(conversationId: string): Promise<Conversation> {
  const { data, error } = await apolloClient.mutate<{
    blockConversationCounterpart: Conversation;
  }>({
    mutation: BLOCK_COUNTERPART,
    variables: { conversationId },
  });
  if (error || !data) {
    throw new Error(getApiErrorMessage(error, 'No se pudo bloquear'));
  }
  return data.blockConversationCounterpart;
}

export async function unblockCounterpart(conversationId: string): Promise<Conversation> {
  const { data, error } = await apolloClient.mutate<{
    unblockConversationCounterpart: Conversation;
  }>({
    mutation: UNBLOCK_COUNTERPART,
    variables: { conversationId },
  });
  if (error || !data) {
    throw new Error(getApiErrorMessage(error, 'No se pudo desbloquear'));
  }
  return data.unblockConversationCounterpart;
}
