import type {
  ListingStatus,
  ListingType,
} from './MarketplaceResponseModel';

export type ConversationRole = 'OWNER' | 'INTERESTED';

export type MessageKind = 'TEXT' | 'PHONE_SHARED';

export interface Conversation {
  id: string;
  role: ConversationRole;
  listing: {
    id: string;
    title: string;
    type: ListingType;
    status: ListingStatus;
    imageUrl?: string | null;
    priceLabel: string;
  };
  /** El otro vecino: nombre, foto y unidad. Nunca su teléfono. */
  counterpart: {
    name: string;
    profilePicture?: string | null;
    unitLabel?: string | null;
  };
  lastMessagePreview?: string | null;
  lastMessageAt?: string | null;
  lastMessageIsMine: boolean;
  unreadCount: number;
  /** Hasta cuándo leyó el otro: con esto se pinta el "visto". */
  counterpartLastReadAt?: string | null;
  /** El aviso se cerró: se lee pero no se escribe. */
  isReadOnly: boolean;
  isBlocked: boolean;
  blockedByMe: boolean;
  myPhoneShared: boolean;
  canSharePhone: boolean;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderUserId: string;
  kind: MessageKind;
  /** En `PHONE_SHARED` es el número que su dueño compartió. */
  body: string;
  createdAt: string;
  isMine: boolean;
}

export interface ConversationPage {
  items: Conversation[];
  pagination: {
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
  };
}

export interface MessagesPage {
  items: ChatMessage[];
  hasMore: boolean;
}
