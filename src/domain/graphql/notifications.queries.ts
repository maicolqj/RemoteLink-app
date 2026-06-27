import { gql } from '@apollo/client';

// Paginated history of the authenticated resident's notifications. Backed by the
// `notifications` table, so it survives app restarts (unlike the in-memory store
// fed by live FCM pushes). `entityType` + `entityId` + `metadata` let a tapped
// row deep-link to its entity without a second `notificationDetail` round-trip.
export const MY_NOTIFICATIONS = gql`
  query MyNotifications(
    $complexId: String!
    $pagination: PaginationInput
    $filters: FilterNotificationsInput
  ) {
    myNotifications(complexId: $complexId, pagination: $pagination, filters: $filters) {
      items {
        id
        type
        priority
        title
        body
        isRead
        isActionable
        entityType
        entityId
        metadata
        createdAt
      }
      pagination {
        currentPage
        itemsPerPage
        totalItems
        totalPages
        hasNextPage
        hasPreviousPage
      }
    }
  }
`;

// Authoritative unread badge count for the bell icon. Independent of how many
// pages of history are loaded in memory.
export const UNREAD_NOTIFICATIONS_COUNT = gql`
  query UnreadNotificationsCount($complexId: String!) {
    unreadNotificationsCount(complexId: $complexId) {
      count
    }
  }
`;

// Entry point when a notification is opened. `entityType` + `entityId` tell the
// client which entity query to call next (visit, visitor, package, vehicle, …).
export const NOTIFICATION_DETAIL = gql`
  query NotificationDetail($notificationId: String!, $complexId: String!) {
    notificationDetail(notificationId: $notificationId, complexId: $complexId) {
      id
      type
      priority
      title
      body
      isRead
      isActionable
      actionType
      actionLabel
      actionResult
      entityType
      entityId
      metadata
      createdByUser {
        id
        fullName
        roles
        profilePicture
      }
    }
  }
`;
