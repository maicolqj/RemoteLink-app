import { useEffect, useState } from 'react';
import type { NavigationContainerRef } from '@react-navigation/native';
import {
  requestNotificationPermission,
  getFCMToken,
  initNotificationListeners,
  handleInitialNotification,
} from '../../infraestructure/services/NotificationService';
import { useNotificationsStore } from '../store/notifications.store';
import type { RootStackParamList } from '../navigation/types/NavigationTypes';

export function useNotifications(
  navigationRef: NavigationContainerRef<RootStackParamList> | null,
) {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const addNotification = useNotificationsStore(s => s.addNotification);

  useEffect(() => {
    let cleanupListeners: (() => void) | undefined;

    async function setup() {
      const granted = await requestNotificationPermission();
      setPermissionGranted(granted);
      if (!granted) return;

      const token = await getFCMToken();
      setFcmToken(token);
      // TODO: register token with backend

      if (!navigationRef) return;

      cleanupListeners = initNotificationListeners(navigationRef, addNotification);

      // Small delay so NavigationContainer is fully ready before navigating
      setTimeout(() => {
        handleInitialNotification(navigationRef, addNotification);
      }, 500);
    }

    setup();
    return () => cleanupListeners?.();
  }, [navigationRef, addNotification]);

  return { fcmToken, permissionGranted };
}
