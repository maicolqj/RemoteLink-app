import apolloClient, { API_BASE_URL } from '../../data/lib/apollo/client';
import SecureStorageService from './SecureStorageService';
import type { PhotoUpload } from '../../domain/interfaces/PhotoUpload';
import {
  BLOCK_COUNTERPART,
  GET_CONVERSATION,
  GET_MESSAGES,
  GET_MY_CONVERSATIONS,
  GET_UNREAD_MESSAGES,
  GET_UNREAD_SUMMARY,
  MARK_CONVERSATION_READ,
  OPEN_LISTING_CONVERSATION,
  REPORT_CONVERSATION,
  SEND_MESSAGE,
  SHARE_MY_PHONE,
  UNBLOCK_COUNTERPART,
} from '../../domain/graphql/marketplace-chat.queries';
import { getApiErrorMessage } from '../utils/apiError';
import type {
  ChatBoard,
  ChatMessage,
  ChatReportReason,
  Conversation,
  ConversationPage,
  MessagesPage,
  UnreadSummary,
} from '../../domain/responses/MarketplaceChatResponseModel';

/** Qué tipos de aviso pertenecen a cada tablero. */
const BOARD_TYPES: Record<ChatBoard, string[]> = {
  classifieds: ['PRODUCT', 'RENTAL', 'GIVEAWAY', 'WANTED'],
  services: ['SERVICE'],
};

/**
 * Todo con `network-only`: el chat cambia por lo que escribe el otro vecino,
 * y una caché vieja mostraría una conversación que ya siguió.
 */

export async function fetchConversations(
  complexId: string,
  page = 1,
  listingId?: string,
  board?: ChatBoard,
): Promise<ConversationPage> {
  const { data, error } = await apolloClient.query<{
    myMarketplaceConversations: ConversationPage;
  }>({
    query: GET_MY_CONVERSATIONS,
    variables: {
      complexId,
      pagination: { page, limit: 20 },
      listingId,
      types: board ? BOARD_TYPES[board] : undefined,
    },
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

export async function fetchUnreadSummary(
  complexId: string,
): Promise<UnreadSummary> {
  const { data } = await apolloClient.query<{
    marketplaceUnreadSummary: UnreadSummary;
  }>({
    query: GET_UNREAD_SUMMARY,
    variables: { complexId },
    fetchPolicy: 'network-only',
  });
  return (
    data?.marketplaceUnreadSummary ?? { total: 0, classifieds: 0, services: 0 }
  );
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

/**
 * Manda una foto por el chat. Va por REST porque GraphQL en este proyecto no
 * recibe archivos. El servidor valida antes de subirla a R2.
 */
export async function sendChatImage(
  conversationId: string,
  photo: PhotoUpload,
): Promise<ChatMessage> {
  const form = new FormData();
  form.append('image', {
    uri: photo.uri,
    type: photo.type,
    name: photo.name,
  } as unknown as Blob);

  const tokens = await SecureStorageService.getTokens();

  const response = await fetch(
    `${API_BASE_URL}/api/v1/marketplace/conversations/${conversationId}/images`,
    {
      method: 'POST',
      headers: tokens?.accessToken
        ? { Authorization: `Bearer ${tokens.accessToken}` }
        : {},
      body: form,
    },
  );

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as {
      message?: string | string[];
    };
    const message = Array.isArray(payload.message)
      ? payload.message.join('\n')
      : payload.message;
    throw new Error(message ?? 'No se pudo enviar la foto');
  }

  return (await response.json()) as ChatMessage;
}

/** La URL completa de una foto del chat, a partir de su `imagePath`. */
export const chatImageUrl = (imagePath: string): string =>
  `${API_BASE_URL}${imagePath}`;

export async function reportConversation(
  conversationId: string,
  reason: ChatReportReason,
  alsoBlock: boolean,
  comment?: string,
): Promise<void> {
  const { error } = await apolloClient.mutate({
    mutation: REPORT_CONVERSATION,
    variables: { input: { conversationId, reason, comment, alsoBlock } },
  });
  if (error) {
    throw new Error(getApiErrorMessage(error, 'No se pudo enviar el reporte'));
  }
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
