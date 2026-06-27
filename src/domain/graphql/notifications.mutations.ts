import { gql } from '@apollo/client';

export const SAVE_MOBILE_TOKEN = gql`
  mutation SaveMobileToken($input: SaveMobileTokenInput!) {
    saveMobileToken(input: $input) {
      success
    }
  }
`;

// Persist the read state of a single notification on the backend so it stays read
// across app restarts (the in-memory store alone would reset it).
export const MARK_NOTIFICATION_AS_READ = gql`
  mutation MarkNotificationAsRead($notificationId: String!) {
    markNotificationAsRead(notificationId: $notificationId) {
      id
      isRead
      readAt
    }
  }
`;

// Mark every unread notification of the user as read. Returns how many rows changed.
export const MARK_ALL_NOTIFICATIONS_AS_READ = gql`
  mutation MarkAllNotificationsAsRead($complexId: String!) {
    markAllNotificationsAsRead(complexId: $complexId)
  }
`;

// Soft-delete a notification from the user's list. Idempotent on the backend
// (non-UUID / not-found resolve to true), so the optimistic removal is safe.
export const DELETE_NOTIFICATION = gql`
  mutation DeleteNotification($notificationId: String!) {
    deleteNotification(notificationId: $notificationId)
  }
`;
