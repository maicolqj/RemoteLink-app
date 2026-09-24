import { create } from 'zustand';

import { fetchUnreadMessages } from '../../infraestructure/services/marketplace-chat.service';
import type { ChatMessage } from '../../domain/responses/MarketplaceChatResponseModel';

export interface IncomingChatMessage {
  conversationId: string;
  message: Omit<ChatMessage, 'isMine'> & { isMine?: boolean };
}

/** Lo que recibe la pantalla: el mensaje ya sabe si es mío. */
export interface ChatMessageEvent {
  conversationId: string;
  message: ChatMessage;
}

export interface ChatReadEvent {
  conversationId: string;
  readAt: string;
}

type Listener<T> = (payload: T) => void;

const messageListeners = new Set<Listener<ChatMessageEvent>>();
const readListeners = new Set<Listener<ChatReadEvent>>();

/**
 * El chat de clasificados.
 *
 * El store guarda lo que cruza pantallas —el número de no leídos del ícono y
 * qué conversación está abierta—. Los mensajes viven en la pantalla del chat:
 * guardar el historial de todas las conversaciones en memoria no aporta nada.
 *
 * `activeConversationId` sirve para no avisar por push de un mensaje que el
 * vecino ya está leyendo en pantalla.
 */
interface ChatState {
  unreadTotal: number;
  activeConversationId: string | null;

  refreshUnread: (complexId: string) => Promise<void>;
  setActiveConversation: (conversationId: string | null) => void;
  /** Llega por socket: actualiza el contador y avisa a la pantalla abierta. */
  applyIncoming: (payload: IncomingChatMessage, myUserId?: string) => void;
  applyRead: (payload: ChatReadEvent) => void;
  /** La conversación se marcó como leída: se descuentan sus no leídos. */
  discountUnread: (count: number) => void;
  clear: () => void;
}

export const useMarketplaceChatStore = create<ChatState>((set, get) => ({
  unreadTotal: 0,
  activeConversationId: null,

  refreshUnread: async complexId => {
    try {
      set({ unreadTotal: await fetchUnreadMessages(complexId) });
    } catch {
      // Sin red el número se queda como estaba; el próximo foco lo corrige.
    }
  },

  setActiveConversation: conversationId =>
    set({ activeConversationId: conversationId }),

  applyIncoming: (payload, myUserId) => {
    const isMine = payload.message.senderUserId === myUserId;
    const isOpen = get().activeConversationId === payload.conversationId;

    // Lo que escribo yo o lo que ya estoy viendo no cuenta como pendiente.
    if (!isMine && !isOpen) {
      set(state => ({ unreadTotal: state.unreadTotal + 1 }));
    }

    const message: ChatMessage = { ...payload.message, isMine };
    messageListeners.forEach(listener =>
      listener({ conversationId: payload.conversationId, message }),
    );
  },

  applyRead: payload => {
    readListeners.forEach(listener => listener(payload));
  },

  discountUnread: count =>
    set(state => ({ unreadTotal: Math.max(0, state.unreadTotal - count) })),

  clear: () => set({ unreadTotal: 0, activeConversationId: null }),
}));

/** Suscribe a los mensajes que llegan por socket. Devuelve cómo desuscribirse. */
export function onChatMessage(listener: Listener<ChatMessageEvent>): () => void {
  messageListeners.add(listener);
  return () => {
    messageListeners.delete(listener);
  };
}

/** Suscribe a los "visto" del otro vecino. */
export function onChatRead(listener: Listener<ChatReadEvent>): () => void {
  readListeners.add(listener);
  return () => {
    readListeners.delete(listener);
  };
}
