import apolloClient from '../../data/lib/apollo/client';
import {
  MY_NOTIFICATIONS,
  NOTIFICATION_DETAIL,
  UNREAD_NOTIFICATIONS_COUNT,
} from '../../domain/graphql/notifications.queries';
import {
  MARK_NOTIFICATION_AS_READ,
  MARK_ALL_NOTIFICATIONS_AS_READ,
  DELETE_NOTIFICATION,
} from '../../domain/graphql/notifications.mutations';
import type { NotificationDetail } from '../../domain/responses/NotificationResponseModel';
import type { Notification, NotificationType } from '../../presentation/store/notifications.store';

// Backend notification row as returned by `myNotifications`.
interface RawNotification {
  id: string;
  type: string;
  priority?: string;
  title: string;
  body: string;
  isRead: boolean;
  isActionable?: boolean;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, any> | null;
  createdAt: string;
}

// The store's coarse `type` only drives the list icon. Collapse the rich backend
// enum (PACKAGE_*, VISIT_*, PAYMENT_*, …) into the four buckets the UI renders.
function toStoreType(backendType: string): NotificationType {
  if (/PANIC|ALERT|REJECTED|DENIED|OVERDUE|LOST|REVOKED|SUSPENDED/i.test(backendType)) return 'alert';
  if (/PAYMENT|CHARGE|WALLET|MORA|PARKING/i.test(backendType)) return 'payment';
  if (/VISIT|VISITOR/i.test(backendType)) return 'visit';
  return 'general';
}

// Map a backend row to the store shape. `data` mirrors the FCM payload keys so the
// existing tap handler in NotificationsScreen can deep-link without changes.
function mapNotification(raw: RawNotification): Notification {
  return {
    id: raw.id,
    type: toStoreType(raw.type),
    title: raw.title,
    body: raw.body,
    isRead: raw.isRead,
    createdAt: raw.createdAt,
    data: {
      notificationId: raw.id,
      type: raw.type,
      ...(raw.entityType ? { entityType: raw.entityType } : {}),
      ...(raw.entityId ? { entityId: raw.entityId } : {}),
      ...(raw.metadata ? { metadata: JSON.stringify(raw.metadata) } : {}),
    },
  };
}

// Real-time `notification:new` socket payload = the full persisted backend
// Notification entity (same fields as `myNotifications` rows, plus routing meta).
export interface SocketNotificationPayload {
  id: string;
  type: string;
  priority?: string;
  title: string;
  body: string;
  complexId?: string;
  recipientUserId?: string | null;
  isBroadcast?: boolean;
  isRead?: boolean;
  entityId?: string | null;
  entityType?: string | null;
  metadata?: Record<string, any> | null;
  createdAt: string;
}

// Map a socket `notification:new` payload to the store shape. Reuses the same
// mapper as the persisted history so the id (a real UUID) lets markAsRead persist,
// and the `data` keys feed the existing NotificationsScreen tap router.
export function mapSocketNotification(p: SocketNotificationPayload): Notification {
  return mapNotification({
    id: p.id,
    type: p.type,
    priority: p.priority,
    title: p.title,
    body: p.body,
    isRead: p.isRead ?? false,
    entityType: p.entityType,
    entityId: p.entityId,
    metadata: p.metadata,
    createdAt: p.createdAt,
  });
}

export interface NotificationsPage {
  items: Notification[];
  currentPage: number;
  hasNextPage: boolean;
}

// Fetch one page of the resident's persisted notification history. network-only so
// reopening the app always reflects the current read state from the server.
export async function fetchMyNotifications(
  complexId: string,
  pagination: { page: number; limit: number } = { page: 1, limit: 20 },
): Promise<NotificationsPage> {
  const { data } = await apolloClient.query<{
    myNotifications: {
      items: RawNotification[];
      pagination: { currentPage: number; hasNextPage: boolean };
    };
  }>({
    query: MY_NOTIFICATIONS,
    variables: { complexId, pagination },
    fetchPolicy: 'network-only',
  });
  const raw = data?.myNotifications;
  return {
    items: (raw?.items ?? []).map(mapNotification),
    currentPage: raw?.pagination?.currentPage ?? pagination.page,
    hasNextPage: raw?.pagination?.hasNextPage ?? false,
  };
}

// Authoritative count of unread notifications for the badge, independent of how
// many history pages are loaded client-side.
export async function fetchUnreadCount(complexId: string): Promise<number> {
  const { data } = await apolloClient.query<{ unreadNotificationsCount: { count: number } }>({
    query: UNREAD_NOTIFICATIONS_COUNT,
    variables: { complexId },
    fetchPolicy: 'network-only',
  });
  return data?.unreadNotificationsCount?.count ?? 0;
}

// Resolve the full, actionable detail of a notification. Returns null when the
// backend has no record for it (e.g. a locally-built FCM notification that was
// never persisted), so callers can fall back to the in-memory payload.
export async function fetchNotificationDetail(
  notificationId: string,
  complexId: string,
): Promise<NotificationDetail | null> {
  const { data } = await apolloClient.query<{ notificationDetail: NotificationDetail }>({
    query: NOTIFICATION_DETAIL,
    variables: { notificationId, complexId },
    fetchPolicy: 'network-only',
  });
  return data?.notificationDetail ?? null;
}

// Persist read state for one notification. The mutation only accepts the real
// UUID id, so callers must guard against FCM messageId fallbacks.
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  await apolloClient.mutate({
    mutation: MARK_NOTIFICATION_AS_READ,
    variables: { notificationId },
  });
}

// Mark every unread notification of the user as read. Returns the count changed.
export async function markAllNotificationsAsRead(complexId: string): Promise<number> {
  const { data } = await apolloClient.mutate<{ markAllNotificationsAsRead: number }>({
    mutation: MARK_ALL_NOTIFICATIONS_AS_READ,
    variables: { complexId },
  });
  return data?.markAllNotificationsAsRead ?? 0;
}

// Soft-delete a notification. Backend is idempotent, so a non-UUID id (live FCM
// fallback) is a safe no-op; callers can remove it from the store regardless.
export async function deleteNotification(notificationId: string): Promise<boolean> {
  const { data } = await apolloClient.mutate<{ deleteNotification: boolean }>({
    mutation: DELETE_NOTIFICATION,
    variables: { notificationId },
  });
  return data?.deleteNotification ?? false;
}
