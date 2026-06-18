import { gql } from '@apollo/client';

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
