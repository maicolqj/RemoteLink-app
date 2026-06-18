import messaging, {
  type FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import { Platform, PermissionsAndroid } from 'react-native';
import type { NavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from '../../presentation/navigation/types/NavigationTypes';
import type { Notification, NotificationType } from '../../presentation/store/notifications.store';
import {
  displayForegroundNotification,
  initNotifeeForegroundListener,
} from './NotifeeService';

// Data payload keys sent from backend FCM messages
export interface FCMData {
  notificationId?: string;
  type?: NotificationType | 'PANIC_ALERT';
  targetStack?: string;
  targetScreen?: string;
  params?: string; // JSON string
  // Panic-specific fields
  complexId?: string;
  title?: string;
  body?: string;
  triggeredBy?: string;
  triggeredByLabel?: string;
  metadata?: string;
}

function buildNotification(
  remoteMessage: FirebaseMessagingTypes.RemoteMessage,
): Notification {
  const data = (remoteMessage.data ?? {}) as FCMData;
  return {
    id: data.notificationId ?? remoteMessage.messageId ?? Date.now().toString(),
    type: data.type ?? 'general',
    title: remoteMessage.notification?.title ?? 'RemoteLink',
    body: remoteMessage.notification?.body ?? '',
    isRead: false,
    createdAt: new Date().toISOString(),
    data: remoteMessage.data as Record<string, string>,
  };
}

// Navigate to the correct screen based on FCM data payload
function navigateFromPayload(
  navigationRef: NavigationContainerRef<RootStackParamList>,
  data: FCMData,
) {
  if (!navigationRef.isReady()) return;

  const stack = data.targetStack;
  const screen = data.targetScreen;
  const rawParams = data.params;
  const params = rawParams ? JSON.parse(rawParams) : undefined;

  if (!stack) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nav = navigationRef as any;
  if (screen) {
    nav.navigate('Main', { screen: stack, params: { screen, params } });
  } else {
    nav.navigate('Main', { screen: stack });
  }
}

// Request push notification permission (Android 13+ / iOS)
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    if (Platform.Version >= 33) {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      return result === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true; // Android < 13 doesn't need explicit permission
  }

  // iOS
  const authStatus = await messaging().requestPermission();
  return (
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL
  );
}

// Get FCM registration token for backend subscription
export async function getFCMToken(): Promise<string | null> {
  try {
    if (!messaging().isDeviceRegisteredForRemoteMessages) {
      await messaging().registerDeviceForRemoteMessages();
    }
    return await messaging().getToken();
  } catch {
    return null;
  }
}

// Initialize all notification listeners.
// Must be called once after NavigationContainer is ready.
export function initNotificationListeners(
  navigationRef: NavigationContainerRef<RootStackParamList>,
  onNewNotification: (n: Notification) => void,
  onPanic?: (data: FCMData) => void,
  onTokenRefresh?: (token: string) => void,
): () => void {
  // Foreground messages: app is open
  // Panic is handled by Socket.io in foreground — skip FCM display to avoid duplicate.
  const unsubForeground = messaging().onMessage(async remoteMessage => {
    const data = (remoteMessage.data ?? {}) as FCMData;
    if (__DEV__) console.log('[FCM] onMessage (foreground):', data.type, '| hasNotificationPayload:', !!remoteMessage.notification);
    if (data.type === 'PANIC_ALERT') return;
    onNewNotification(buildNotification(remoteMessage));
    await displayForegroundNotification(remoteMessage);
  });

  // Notifee foreground events: press + action buttons (approve/reject visit)
  const unsubNotifeeFg = initNotifeeForegroundListener(navigationRef);

  // Background → foreground: user taps notification while app is in background
  const unsubOpened = messaging().onNotificationOpenedApp(remoteMessage => {
    const data = (remoteMessage.data ?? {}) as FCMData;
    if (data.type === 'PANIC_ALERT') {
      onPanic?.(data);
    } else {
      onNewNotification(buildNotification(remoteMessage));
      navigateFromPayload(navigationRef, data);
    }
  });

  const unsubTokenRefresh = messaging().onTokenRefresh(token => {
    onTokenRefresh?.(token);
  });

  return () => {
    unsubForeground();
    unsubOpened();
    unsubTokenRefresh();
    unsubNotifeeFg();
  };
}

// Check for notification that opened app from quit state.
// Call after NavigationContainer is ready (slight delay).
export async function handleInitialNotification(
  navigationRef: NavigationContainerRef<RootStackParamList>,
  onNewNotification: (n: Notification) => void,
  onPanic?: (data: FCMData) => void,
): Promise<void> {
  const remoteMessage = await messaging().getInitialNotification();
  if (!remoteMessage) return;
  const data = (remoteMessage.data ?? {}) as FCMData;
  if (data.type === 'PANIC_ALERT') {
    onPanic?.(data);
  } else {
    onNewNotification(buildNotification(remoteMessage));
    navigateFromPayload(navigationRef, data);
  }
}
