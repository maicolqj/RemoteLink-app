import { useVisitsStore } from '../../presentation/store/visits.store';
import { usePanicStore } from '../../presentation/store/panic.store';
import { useSettingsStore } from '../../presentation/store/settings.store';
import notifee, {
  AndroidImportance,
  AndroidVisibility,
  EventType,
  type Event,
  type NotificationAndroid,
} from '@notifee/react-native';
import type { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import type { NavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from '../../presentation/navigation/types/NavigationTypes';
import type { FCMData } from './NotificationService';

// ─── Channel IDs ─────────────────────────────────────────────────────────────

export const CHANNEL = {
  VISITS: 'visits',
  PAYMENTS: 'payments',
  ALERTS: 'alerts',
  GENERAL: 'general',
  PANIC: 'panic',
} as const;

// ─── Action IDs ──────────────────────────────────────────────────────────────

export const ACTION = {
  VISIT_APPROVE: 'visit_approve',
  VISIT_REJECT: 'visit_reject',
} as const;

// ─── Map notification type → channel ─────────────────────────────────────────

const TYPE_CHANNEL: Record<string, string> = {
  visit: CHANNEL.VISITS,
  payment: CHANNEL.PAYMENTS,
  alert: CHANNEL.ALERTS,
  general: CHANNEL.GENERAL,
};

// ─── Create Android channels (call once on app start) ────────────────────────

export async function createNotificationChannels(): Promise<void> {
  await Promise.all([
    notifee.createChannel({
      id: CHANNEL.VISITS,
      name: 'Alertas de visitas',
      description: 'Notificaciones cuando hay visitas pendientes de aprobación',
      importance: AndroidImportance.HIGH,
      visibility: AndroidVisibility.PUBLIC,
      vibration: true,
      vibrationPattern: [100, 250, 100, 250],
      sound: 'default',
    }),
    notifee.createChannel({
      id: CHANNEL.PAYMENTS,
      name: 'Finanzas y pagos',
      description: 'Recordatorios y confirmaciones de pagos',
      importance: AndroidImportance.DEFAULT,
      visibility: AndroidVisibility.PRIVATE,
      sound: 'default',
    }),
    notifee.createChannel({
      id: CHANNEL.ALERTS,
      name: 'Alertas importantes',
      description: 'Alertas críticas del conjunto residencial',
      importance: AndroidImportance.HIGH,
      visibility: AndroidVisibility.PUBLIC,
      vibration: true,
      sound: 'default',
    }),
    notifee.createChannel({
      id: CHANNEL.GENERAL,
      name: 'General',
      description: 'Notificaciones generales de RemoteLink',
      importance: AndroidImportance.DEFAULT,
      visibility: AndroidVisibility.PUBLIC,
      sound: 'default',
    }),
    notifee.createChannel({
      id: CHANNEL.PANIC,
      name: 'Alarma de Pánico',
      description: 'Alertas de emergencia — pánico activado en el conjunto',
      importance: AndroidImportance.HIGH,
      visibility: AndroidVisibility.PUBLIC,
      vibration: true,
      vibrationPattern: [300, 500, 200, 500, 200, 500],
      sound: 'default',
      lights: true,
    }),
  ]);
}

// ─── Display panic notification (background / killed state) ──────────────────

export async function displayPanicFCMNotification(
  remoteMessage: FirebaseMessagingTypes.RemoteMessage,
): Promise<void> {
  const data = (remoteMessage.data ?? {}) as FCMData;

  await notifee.displayNotification({
    id: `panic-${data.complexId ?? remoteMessage.messageId ?? 'alert'}`,
    title: data.title ?? '🚨 ALERTA DE PÁNICO',
    body:  data.body  ?? 'Se ha activado una alerta de pánico en el conjunto.',
    data:  remoteMessage.data as Record<string, string>,
    android: {
      channelId:  CHANNEL.PANIC,
      smallIcon:  'ic_notification',
      color:      '#cc0000',
      importance: AndroidImportance.HIGH,
      visibility: AndroidVisibility.PUBLIC,
      // Opens app immediately — even from lock screen
      fullScreenAction: { id: 'default', launchActivity: 'default' },
      pressAction:      { id: 'default' },
      vibrationPattern: [300, 500, 200, 500, 200, 500],
      lights:           ['#cc0000', 500, 500],
    },
  });
}

// ─── Display notification in foreground ──────────────────────────────────────

export async function displayForegroundNotification(
  remoteMessage: FirebaseMessagingTypes.RemoteMessage,
): Promise<void> {
  const data = (remoteMessage.data ?? {}) as FCMData;
  const type = data.type ?? 'general';
  const channelId = TYPE_CHANNEL[type] ?? CHANNEL.GENERAL;

  const android: NotificationAndroid = {
    channelId,
    smallIcon: 'ic_notification',
    color: '#1E40AF',
    pressAction: { id: 'default' },
    // Show action buttons only for visit notifications
    ...(type === 'visit' && {
      actions: [
        {
          title: '✓ Aprobar',
          pressAction: {
            id: ACTION.VISIT_APPROVE,
            launchActivity: 'default',
          },
        },
        {
          title: '✕ Rechazar',
          pressAction: { id: ACTION.VISIT_REJECT },
        },
      ],
    }),
  };

  await notifee.displayNotification({
    id: data.notificationId ?? remoteMessage.messageId,
    title: remoteMessage.notification?.title ?? 'RemoteLink',
    body: remoteMessage.notification?.body ?? '',
    data: remoteMessage.data as Record<string, string>,
    android,
  });
}

// ─── Navigate based on notification data ─────────────────────────────────────

function navigateFromData(
  navigationRef: NavigationContainerRef<RootStackParamList>,
  data: Record<string, string>,
) {
  if (!navigationRef.isReady()) return;
  const d = data as FCMData;
  if (!d.targetStack) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nav = navigationRef as any;
  if (d.targetScreen) {
    const params = d.params ? JSON.parse(d.params) : undefined;
    nav.navigate('Main', {
      screen: d.targetStack,
      params: { screen: d.targetScreen, params },
    });
  } else {
    nav.navigate('Main', { screen: d.targetStack });
  }
}

// ─── Activate panic modal from a pressed panic notification ──────────────────
// Panic notifications are displayed by Notifee (data-only FCM), so their press
// events arrive here — never through messaging().onNotificationOpenedApp.

function showPanicFromNotificationData(data: Record<string, string>) {
  if (!useSettingsStore.getState().panicAlertsEnabled) return;
  const d = data as FCMData;
  usePanicStore.getState().setPanicData({
    complexId:        d.complexId ?? '',
    triggeredBy:      d.triggeredBy ?? '',
    triggeredByLabel: d.triggeredByLabel || undefined,
  });
}

// ─── Handle visit action from notification button ─────────────────────────────

async function handleVisitAction(actionId: string, data: Record<string, string>) {
  const visitId = data.visitId ?? (data.params ? JSON.parse(data.params).visitId : null);
  if (!visitId) return;

  const store = useVisitsStore.getState();

  if (actionId === ACTION.VISIT_APPROVE) {
    await store.approveVisit(visitId);
  } else {
    await store.denyVisit(visitId, 'Rechazado desde notificación');
  }
}

// ─── Foreground event handler (register inside a React component) ─────────────

export function initNotifeeForegroundListener(
  navigationRef: NavigationContainerRef<RootStackParamList>,
): () => void {
  return notifee.onForegroundEvent(({ type, detail }: Event) => {
    const data = (detail.notification?.data ?? {}) as Record<string, string>;

    switch (type) {
      case EventType.PRESS:
        if (data.type === 'PANIC_ALERT') {
          showPanicFromNotificationData(data);
        } else {
          navigateFromData(navigationRef, data);
        }
        break;
      case EventType.ACTION_PRESS: {
        const actionId = detail.pressAction?.id;
        if (actionId === ACTION.VISIT_APPROVE || actionId === ACTION.VISIT_REJECT) {
          handleVisitAction(actionId, data);
          // Navigate to visits screen after action. The Visits tab is disabled;
          // the flow lives in HomeStack, so route through HomeTab → Visits.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (navigationRef as any).navigate('Main', { screen: 'HomeTab', params: { screen: 'Visits' } });
        }
        break;
      }
    }
  });
}

// ─── Background event handler (register in index.js, outside React) ───────────

export async function handleNotifeeBackgroundEvent({ type, detail }: Event): Promise<void> {
  const data = (detail.notification?.data ?? {}) as Record<string, string>;

  // Press on a panic notification while app is background/killed: the press
  // launches the activity; seed the store so the modal shows as soon as JS mounts.
  if (type === EventType.PRESS && data.type === 'PANIC_ALERT') {
    showPanicFromNotificationData(data);
    return;
  }

  if (type === EventType.ACTION_PRESS) {
    const actionId = detail.pressAction?.id;
    if (actionId === ACTION.VISIT_APPROVE || actionId === ACTION.VISIT_REJECT) {
      await handleVisitAction(actionId, data);
    }
  }
}
