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
import apolloClientInstance from '../../data/lib/apollo/client';
import { DEACTIVATE_MOBILE_TOKEN } from '../../domain/graphql/notifications.mutations';
import { getApiErrorMessage } from '../utils/apiError';
import { useAuthStore } from '../../presentation/store/auth.store';
import { SCREEN_MODULE } from '../../presentation/constants/modules';
import { useMarketplaceChatStore } from '../../presentation/store/marketplace-chat.store';

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

export const CHAT_MESSAGE_TYPE = 'MARKETPLACE_CHAT_MESSAGE';

/**
 * La conversación de clasificados a la que lleva un push, si lleva a alguna.
 *
 * Dos avisos abren el chat: el mensaje nuevo y el primer "me interesa" (que
 * trae el id de la conversación en metadata). Los demás avisos de clasificados
 * siguen abriendo lo suyo.
 */
export function chatConversationFromData(
  data: Record<string, string | undefined>,
): string | null {
  let metadata: Record<string, unknown> = {};
  try {
    metadata = data.metadata ? JSON.parse(data.metadata) : {};
  } catch {
    metadata = {};
  }
  const fromMetadata =
    typeof metadata.conversationId === 'string' ? metadata.conversationId : null;

  if (data.type === CHAT_MESSAGE_TYPE) {
    return fromMetadata ?? data.entityId ?? null;
  }
  if (data.type === 'LISTING_INTEREST') return fromMetadata;
  return null;
}

/** Abre el chat dentro del stack del inicio. */
export function navigateToChat(
  navigationRef: NavigationContainerRef<RootStackParamList>,
  conversationId: string,
): void {
  if (!navigationRef.isReady()) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (navigationRef as any).navigate('Main', {
    screen: 'HomeTab',
    params: { screen: 'ChatConversation', params: { conversationId } },
  });
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

  const chatId = chatConversationFromData(
    data as unknown as Record<string, string | undefined>,
  );
  if (chatId) {
    navigateToChat(navigationRef, chatId);
    return;
  }

  const stack = data.targetStack;
  const screen = data.targetScreen;
  const rawParams = data.params;
  const params = rawParams ? JSON.parse(rawParams) : undefined;

  if (!stack) return;

  // Un push viejo sobrevive al apagado del módulo: queda en la bandeja del
  // sistema y se puede tocar días después. Llevarlo a la pantalla terminaría en
  // `COMPLEX_MODULE_DISABLED`, así que se deja al residente donde estaba —el
  // aviso sigue en la bandeja de la app, que sí explica por qué no abre—.
  const requiredModule = screen ? SCREEN_MODULE[screen] : undefined;
  if (requiredModule && !useAuthStore.getState().isModuleEnabled(requiredModule)) return;

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

/**
 * Desregistra el token de este equipo al cerrar sesión.
 *
 * Sin esto la suscripción sobrevive a la sesión: el `logout` invalida tokens y
 * termina la sesión, pero deja la fila de `push_subscriptions` activa, así que
 * el servidor sigue mandando a un teléfono donde ya no hay nadie — pánico,
 * visitas y todo lo demás de la cuenta anterior.
 *
 * Hay que llamarla ANTES de borrar los tokens de acceso: la mutación exige
 * sesión válida. Y no puede bloquear el cierre de sesión — si falla, la
 * compuerta local (`setSessionOpen(false)`) sigue impidiendo que este equipo
 * atienda una alerta.
 */
export async function deactivateFCMToken(): Promise<void> {
  try {
    const token = await getToken(getMessaging());
    if (!token) return;

    const { error } = await apolloClientInstance.mutate<{
      deactivateMobileToken: { success: boolean };
    }>({
      mutation: DEACTIVATE_MOBILE_TOKEN,
      variables: { deviceToken: token },
      fetchPolicy: 'no-cache',
    });

    // errorPolicy 'all' (Apollo v4): el error viaja en `error` (singular) y la
    // promesa NO se rechaza. Sin mirarlo, un rechazo pasaría por éxito.
    if (error) {
      console.warn('[FCM] desregistro del token rechazado:', getApiErrorMessage(error, 'sin detalle'));
      return;
    }
    if (__DEV__) console.log('[FCM] token del equipo desactivado en el servidor');
  } catch (err) {
    console.warn('[FCM] desregistro del token falló:', getApiErrorMessage(err));
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
      // El receptor nativo ya hizo sonar la sirena: el modal tiene que aparecer
      // aquí mismo. Confiar solo en el socket dejaba la sirena sonando sin modal
      // (y sin forma de apagarla) cuando el socket no estaba conectado. Si el
      // socket también llega, reemplaza el mismo estado.
      onPanic?.(data);
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

    // Solicitud de ingreso desde otro equipo con la app ABIERTA: se abre la
    // pantalla de aprobación, que es la que tiene Aprobar / Rechazar y el código
    // a comparar. Antes caía como un banner de 4 segundos sin botones (y la
    // pantalla solo se abría tocando el push con la app en segundo plano), así
    // que la solicitud vencía sin que hubiera cómo responderla.
    if (data.type === LOGIN_APPROVAL_TYPE) {
      navigateToApprovalIfNeeded(navigationRef, data);
      return;
    }

    // Mensaje del chat: si esa conversación ya está en pantalla, ni banner ni
    // bandeja —el mensaje ya se ve ahí y el servidor lo da por leído al
    // abrirla—. En cualquier otra pantalla sí se avisa: el vecino tiene que
    // enterarse de que le escribieron.
    if ((data.type as string) === CHAT_MESSAGE_TYPE) {
      const chatId = chatConversationFromData(
        remoteMessage.data as Record<string, string | undefined>,
      );
      if (chatId && useMarketplaceChatStore.getState().activeConversationId === chatId) {
        return;
      }
    }

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
