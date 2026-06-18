import apolloClient from '../../data/lib/apollo/client';
import { NOTIFICATION_DETAIL } from '../../domain/graphql/notifications.queries';
import type { NotificationDetail } from '../../domain/responses/NotificationResponseModel';

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
