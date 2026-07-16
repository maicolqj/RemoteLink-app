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
  // `lastAddedId` only changes when addNotification genuinely appends a live
  // push/socket arrival — unlike notifications[0], it's untouched by deleting
  // the top row or by a background fetch replacing the list, so neither of
  // those can be misread as "a new notification just arrived" and banner it.
  const lastAddedId = useNotificationsStore(s => s.lastAddedId);
  const [banner, setBanner] = useState<BannerNotification | null>(null);
  const lastShownId = useRef<string | null>(null);

  // Show banner when a notification is actually added, not just when the
  // list's head changes for any other reason.
  useEffect(() => {
    if (!lastAddedId || lastAddedId === lastShownId.current) return;
    lastShownId.current = lastAddedId;

    const latest = useNotificationsStore.getState().notifications.find(n => n.id === lastAddedId);
    if (!latest) return;

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
  }, [lastAddedId]);

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
