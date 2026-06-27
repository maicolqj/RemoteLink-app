import { create } from 'zustand';
import { useAuthStore } from './auth.store';
import {
  fetchMyNotifications,
  fetchUnreadCount,
  markNotificationAsRead as apiMarkAsRead,
  markAllNotificationsAsRead as apiMarkAllAsRead,
  deleteNotification as apiDeleteNotification,
} from '../../infraestructure/services/notifications.service';

export type NotificationType = 'visit' | 'payment' | 'general' | 'alert';

// Backend ids are UUIDs; live FCM notifications can fall back to a messageId.
// Only UUIDs can be persisted, so guard the mutation calls.
const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

const PAGE_LIMIT = 20;

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  data?: Record<string, string>;
}

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  page: number;
  hasMore: boolean;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  setNotifications: (notifications: Notification[]) => void;
  fetchNotifications: () => Promise<void>;
  fetchMoreNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  isLoadingMore: false,
  page: 1,
  hasMore: false,

  addNotification: notification => {
    set(state => {
      // The same backend notification can arrive twice while the app is open:
      // once over the socket (notification:new) and once over FCM foreground,
      // both carrying the same UUID. Dedup by id so the list/badge don't double.
      if (state.notifications.some(n => n.id === notification.id)) return state;
      return {
        notifications: [notification, ...state.notifications],
        unreadCount: state.unreadCount + (notification.isRead ? 0 : 1),
      };
    });
  },

  markAsRead: id => {
    let wasUnread = false;
    set(state => {
      const updated = state.notifications.map(n => {
        if (n.id === id && !n.isRead) { wasUnread = true; return { ...n, isRead: true }; }
        return n;
      });
      // Decrement the authoritative badge by the delta (not recomputed from the
      // loaded pages, which only hold a slice of the unread total).
      const unreadCount = wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount;
      return { notifications: updated, unreadCount };
    });
    // Persist on the backend (fire-and-forget; the optimistic update already
    // reflects in the UI). Only real UUIDs are accepted by the mutation.
    const notif = get().notifications.find(n => n.id === id);
    const realId = notif?.data?.notificationId ?? id;
    if (wasUnread && UUID_RE.test(realId)) {
      apiMarkAsRead(realId).catch(() => {});
    }
  },

  markAllAsRead: () => {
    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
    const complexId = useAuthStore.getState().resident?.complex?.id;
    if (complexId) apiMarkAllAsRead(complexId).catch(() => {});
  },

  removeNotification: id => {
    // Capture the row before removing it so we know whether to decrement the badge
    // and which real UUID to soft-delete on the backend.
    const target = get().notifications.find(n => n.id === id);
    set(state => {
      const notifications = state.notifications.filter(n => n.id !== id);
      const unreadCount = target && !target.isRead
        ? Math.max(0, state.unreadCount - 1)
        : state.unreadCount;
      return { notifications, unreadCount };
    });
    // Persist the soft-delete (fire-and-forget; backend is idempotent for non-UUIDs).
    const realId = target?.data?.notificationId ?? id;
    if (UUID_RE.test(realId)) apiDeleteNotification(realId).catch(() => {});
  },

  setNotifications: notifications => {
    const unreadCount = notifications.filter(n => !n.isRead).length;
    set({ notifications, unreadCount });
  },

  // Load the first page of persisted history from the backend. Called on Home mount
  // so the list survives app restarts instead of resetting to the empty store.
  fetchNotifications: async () => {
    const resident = useAuthStore.getState().resident;
    if (!resident) return;
    set({ isLoading: true });
    try {
      const complexId = resident.complex.id;
      // Page of history + authoritative badge count in parallel.
      const [{ items, hasNextPage }, unreadCount] = await Promise.all([
        fetchMyNotifications(complexId, { page: 1, limit: PAGE_LIMIT }),
        fetchUnreadCount(complexId).catch(() => get().unreadCount),
      ]);
      set({ notifications: items, unreadCount, page: 1, hasMore: hasNextPage, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  // Append the next page (infinite scroll). No-op while a load is in flight or when
  // the backend reports no further pages.
  fetchMoreNotifications: async () => {
    const { isLoading, isLoadingMore, hasMore, page, notifications } = get();
    if (isLoading || isLoadingMore || !hasMore) return;
    const resident = useAuthStore.getState().resident;
    if (!resident) return;
    set({ isLoadingMore: true });
    try {
      const next = page + 1;
      const { items, hasNextPage } = await fetchMyNotifications(
        resident.complex.id,
        { page: next, limit: PAGE_LIMIT },
      );
      // Guard against duplicates if a new notification shifted the pages server-side.
      const seen = new Set(notifications.map(n => n.id));
      const merged = [...notifications, ...items.filter(n => !seen.has(n.id))];
      // Loading more pages doesn't change the unread total — leave the badge alone.
      set({ notifications: merged, page: next, hasMore: hasNextPage, isLoadingMore: false });
    } catch {
      set({ isLoadingMore: false });
    }
  },

  // Refresh just the badge count (e.g. on app focus) without reloading the list.
  fetchUnreadCount: async () => {
    const resident = useAuthStore.getState().resident;
    if (!resident) return;
    try {
      const unreadCount = await fetchUnreadCount(resident.complex.id);
      set({ unreadCount });
    } catch {
      // Keep the previous count on failure.
    }
  },
}));
