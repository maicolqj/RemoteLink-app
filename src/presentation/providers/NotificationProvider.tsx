import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNotificationsStore } from '../store/notifications.store';
import { useVisitsStore } from '../store/visits.store';
import { InAppNotificationBanner, type BannerNotification } from '../components/InAppNotificationBanner';
import { NotificationActionType, NotificationType } from '../../domain/enums/enums';

function resolveActionType(type: string): string | null {
  if (
    type === NotificationType.VISITOR_WALK_IN ||
    type === NotificationType.ACCESS_REQUEST_APPROVED ||
    type === NotificationType.ACCESS_REQUEST_REJECTED
  ) {
    return NotificationActionType.VISIT_APPROVAL;
  }
  return null;
}

interface Props {
  children: React.ReactNode;
}

export function NotificationProvider({ children }: Props) {
  const notifications = useNotificationsStore(s => s.notifications);
  const [banner, setBanner] = useState<BannerNotification | null>(null);
  const lastShownId = useRef<string | null>(null);

  // Show banner when a new notification arrives at the top of the list
  useEffect(() => {
    const latest = notifications[0];
    if (!latest || latest.id === lastShownId.current) return;
    lastShownId.current = latest.id;

    // Replace previous banner immediately
    setBanner(null);
    setTimeout(() => {
      setBanner({
        id:           latest.id,
        type:         latest.type ?? NotificationType.SYSTEM_ANNOUNCEMENT,
        title:        latest.title,
        body:         latest.body,
        isActionable: !!latest.data?.visitId,
        actionType:   resolveActionType(latest.type ?? ''),
        entityId:     (latest.data?.visitId as string) ?? null,
      });
    }, 50);
  }, [notifications]);

  const handleDismiss = useCallback(() => setBanner(null), []);

  const handleAction = useCallback(
    (_notificationId: string, action: 'confirm' | 'cancel') => {
      const visitId = banner?.entityId;
      if (!visitId) return;
      const store = useVisitsStore.getState();
      if (action === 'confirm') {
        store.approveVisit(visitId);
      } else {
        store.denyVisit(visitId, 'Rechazado desde notificación');
      }
      setBanner(null);
    },
    [banner],
  );

  const handlePress = useCallback((_n: BannerNotification) => {
    setBanner(null);
  }, []);

  return (
    <>
      {children}
      <InAppNotificationBanner
        notification={banner}
        onDismiss={handleDismiss}
        onPress={handlePress}
        onAction={handleAction}
      />
    </>
  );
}
