import {
  getMessaging,
  getToken,
  getInitialNotification,
  onMessage,
  onNotificationOpenedApp,
  onTokenRefresh,
  requestPermission,
  registerDeviceForRemoteMessages,
  isDeviceRegisteredForRemoteMessages,
  AuthorizationStatus,
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
import PanicSound from '../../shared/modules/PanicSoundModule';

import { parseLoginApprovalMetadata } from './deviceAuth.service';
import { reportPanicDelivered } from './panicAck';

/** Push que pide aprobar el ingreso de otro equipo (contrato §03). */
export const LOGIN_APPROVAL_TYPE = 'LOGIN_APPROVAL_REQUEST';

// Data payload keys sent from backend FCM messages
export interface FCMData {
  notificationId?: string;
  type?: NotificationType | 'PANIC_ALERT' | typeof LOGIN_APPROVAL_TYPE;
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
    // El store solo maneja categorías de UI; PANIC_ALERT y la solicitud de
    // ingreso entran como 'alert'.
    type: data.type === 'PANIC_ALERT' || data.type === LOGIN_APPROVAL_TYPE
      ? 'alert'
      : data.type ?? 'general',
    title: remoteMessage.notification?.title ?? 'RemoteLink',
    body: remoteMessage.notification?.body ?? '',
    isRead: false,
    createdAt: new Date().toISOString(),
    data: remoteMessage.data as Record<string, string>,
  };
}

// Navigate to the correct screen based on FCM data payload
/**
 * La solicitud de ingreso no trae targetStack/targetScreen: su destino es fijo
 * y su `metadata` viaja serializado como string (requisito de FCM), así que hay
 * que parsearlo antes de navegar. Devuelve true si consumió el payload.
 */
export function navigateToApprovalIfNeeded(
  navigationRef: NavigationContainerRef<RootStackParamList>,
  data: FCMData,
): boolean {
  if (data.type !== LOGIN_APPROVAL_TYPE) return false;
  if (!navigationRef.isReady()) return true;

  const payload = parseLoginApprovalMetadata(data.metadata);
  // Sin metadata usable igual abrimos la pantalla: ella cae al respaldo
  // pendingDeviceApprovals para no perder la solicitud.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (navigationRef as any).navigate('ApproveDevice', payload ?? undefined);
  return true;
}

function navigateFromPayload(
  navigationRef: NavigationContainerRef<RootStackParamList>,
  data: FCMData,
) {
  if (!navigationRef.isReady()) return;
  if (navigateToApprovalIfNeeded(navigationRef, data)) return;

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
  const messaging = getMessaging();
  const authStatus = await requestPermission(messaging);
  return (
    authStatus === AuthorizationStatus.AUTHORIZED ||
    authStatus === AuthorizationStatus.PROVISIONAL
  );
}

// Get FCM registration token for backend subscription
export async function getFCMToken(): Promise<string | null> {
  try {
    const messaging = getMessaging();
    if (!isDeviceRegisteredForRemoteMessages(messaging)) {
      await registerDeviceForRemoteMessages(messaging);
    }
    const token = await getToken(messaging);
    // Espejo para la ruta nativa del pánico: su ACK de entrega sale desde Kotlin
    // con la app muerta, donde no hay forma de pedirle el token a Firebase sin
    // sumar esa dependencia al módulo `app`. Sin el token la entrega se registra
    // igual, pero anónima — y atribuirla al equipo es justo lo que da la tasa de
    // entrega por marca.
    if (token) void PanicSound?.setDeviceToken(token);
    return token;
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
  onTokenRefreshCb?: (token: string) => void,
): () => void {
  const messaging = getMessaging();

  // Foreground messages: app is open
  // Panic is handled by Socket.io in foreground — skip FCM display to avoid duplicate.
  const unsubForeground = onMessage(messaging, async remoteMessage => {
    const data = (remoteMessage.data ?? {}) as FCMData;
    if (__DEV__) console.log('[FCM] onMessage (foreground):', data.type, '| hasNotificationPayload:', !!remoteMessage.notification);
    if (data.type === 'PANIC_ALERT') {
      // La alarma la dispara el socket en foreground, pero la copia por FCM sí
      // llegó a este equipo: confirmarla es lo que hace que la estadística de
      // entrega refleje la realidad y no solo los casos con la app cerrada.
      void reportPanicDelivered(remoteMessage.data as Record<string, string>);
      return;
    }
    // Mensaje de servicio del backend, no del usuario. Aquí importa más que en el
    // handler de background: sin el descarte entraría al buzón del residente
    // como una notificación en blanco y persistiría en la lista.
    //
    // Se compara sobre el dato crudo y no sobre FCMData a propósito: no es un
    // tipo de notificación y no debe entrar en ese enum, porque nada de la app
    // del residente lo maneja ni debería.
    if (remoteMessage.data?.type === 'PUSH_HEALTH_CHECK') return;
    onNewNotification(buildNotification(remoteMessage));
    await displayForegroundNotification(remoteMessage);
  });

  // Notifee foreground events: press + action buttons (approve/reject visit)
  const unsubNotifeeFg = initNotifeeForegroundListener(navigationRef);

  // Background → foreground: user taps notification while app is in background
  const unsubOpened = onNotificationOpenedApp(messaging, remoteMessage => {
    const data = (remoteMessage.data ?? {}) as FCMData;
    if (data.type === 'PANIC_ALERT') {
      onPanic?.(data);
    } else {
      onNewNotification(buildNotification(remoteMessage));
      navigateFromPayload(navigationRef, data);
    }
  });

  const unsubTokenRefresh = onTokenRefresh(messaging, token => {
    // Antes del callback: si el espejo se queda con el token viejo, el ACK
    // nativo atribuye la entrega a un equipo que ya no existe.
    void PanicSound?.setDeviceToken(token);
    onTokenRefreshCb?.(token);
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
  const remoteMessage = await getInitialNotification(getMessaging());
  if (!remoteMessage) return;
  const data = (remoteMessage.data ?? {}) as FCMData;
  if (data.type === 'PANIC_ALERT') {
    onPanic?.(data);
  } else {
    onNewNotification(buildNotification(remoteMessage));
    navigateFromPayload(navigationRef, data);
  }
}
