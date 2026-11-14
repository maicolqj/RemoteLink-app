// =============================================================================
// Push de llamadas por internet (citofonía por la app).
//
// Con la app abierta la llamada entra por socket. Con la app en segundo plano
// (o cerrada, si Android deja correr el handler) llega este push data-only:
// se pinta una notificación de llamada a pantalla completa con "Contestar" y
// "Rechazar". Tocarla abre la app, que le pregunta a la API por la llamada
// (voipCallService.restore) y aplica lo que se eligió.
// =============================================================================

import notifee, {
  AndroidCategory,
  AndroidImportance,
  AndroidVisibility,
} from '@notifee/react-native';
import { NATIVE_CALL_NOTIFICATION, cancelNativeCallNotification } from './nativeIntercomCall';

export const INTERCOM_PUSH = {
  INCOMING: 'INTERCOM_CALL_INCOMING',
  ANSWERED: 'INTERCOM_CALL_ANSWERED',
  ENDED: 'INTERCOM_CALL_ENDED',
} as const;

export const INTERCOM_CHANNEL_ID = 'intercom_calls_v1';
export const INTERCOM_ACTION = { ANSWER: 'intercom-answer', DECLINE: 'intercom-decline' } as const;
export type IntercomAction = 'answer' | 'decline' | 'open';

export function isIntercomPush(data?: Record<string, unknown> | null): boolean {
  const type = data?.type;
  return typeof type === 'string' && type.startsWith('INTERCOM_CALL_');
}

/** Qué hizo la persona al tocar la notificación de la llamada. */
export function intercomActionFromPress(pressActionId?: string | null): IntercomAction {
  if (pressActionId === INTERCOM_ACTION.ANSWER) return 'answer';
  if (pressActionId === INTERCOM_ACTION.DECLINE) return 'decline';
  return 'open';
}

const notificationId = (callId: string) => `intercom-${callId}`;

async function ensureChannel(): Promise<void> {
  await notifee.createChannel({
    id: INTERCOM_CHANNEL_ID,
    name: 'Llamadas de citofonía',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
    vibrationPattern: [0, 800, 600, 800, 600, 800],
  });
}

/** Notificación de llamada entrante a pantalla completa. */
export async function showIncomingCallNotification(data: Record<string, string>): Promise<void> {
  if (!data.callId) return;
  await ensureChannel();

  const expiresAt = data.expiresAt ? Date.parse(data.expiresAt) : NaN;
  const timeoutAfter = Number.isFinite(expiresAt) ? Math.max(1000, expiresAt - Date.now()) : 30_000;
  const caller = data.callerName || 'Portería';

  await notifee.displayNotification({
    id: notificationId(data.callId),
    title: caller,
    body: 'Te llama portería por la app',
    data,
    android: {
      channelId: INTERCOM_CHANNEL_ID,
      importance: AndroidImportance.HIGH,
      category: AndroidCategory.CALL,
      visibility: AndroidVisibility.PUBLIC,
      smallIcon: 'ic_notification',
      ongoing: true,
      autoCancel: false,
      timeoutAfter,
      pressAction: { id: 'default', launchActivity: 'default' },
      fullScreenAction: { id: 'default', launchActivity: 'default' },
      actions: [
        { title: 'Rechazar', pressAction: { id: INTERCOM_ACTION.DECLINE, launchActivity: 'default' } },
        { title: 'Contestar', pressAction: { id: INTERCOM_ACTION.ANSWER, launchActivity: 'default' } },
      ],
    },
  });
}

/** La llamada ya no suena (contestó otro equipo, colgaron, se perdió). */
export async function cancelCallNotification(callId?: string): Promise<void> {
  if (!callId) return;
  await notifee.cancelNotification(notificationId(callId)).catch(() => {});
  await cancelNativeCallNotification(callId);
}

/** Atiende un push de citofonía en segundo plano. Devuelve true si era uno. */
export async function handleIntercomPushInBackground(data: Record<string, string>): Promise<boolean> {
  if (!isIntercomPush(data)) return false;
  // En Android la publica (y la quita) IntercomCallReceiver, en Kotlin: corre
  // también con la app cerrada, donde este handler no llega. Pintarla aquí
  // además dejaba dos notificaciones timbrando.
  if (NATIVE_CALL_NOTIFICATION) return true;
  if (data.type === INTERCOM_PUSH.INCOMING) {
    await showIncomingCallNotification(data);
  } else {
    await cancelCallNotification(data.callId);
  }
  return true;
}
