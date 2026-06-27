import { AppRegistry } from 'react-native';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';
import {
  handleNotifeeBackgroundEvent,
  displayPanicFCMNotification,
  displayForegroundNotification,
  createNotificationChannels,
} from './src/infraestructure/services/NotifeeService';
import PanicSound from './src/shared/modules/PanicSoundModule';
import { getPanicAlertsEnabled } from './src/presentation/store/settings.store';

// FCM background handler — fires in background AND when killed, but ONLY for
// DATA-ONLY high-priority messages. If the backend includes a `notification`
// payload, Android shows it itself and this handler never runs while killed, so
// the alarm wouldn't fire. Panic must be sent data-only (android.priority=high).
//
// On a PANIC_ALERT we (1) show a full-screen Notifee notification for the visual +
// tap-to-open, and (2) start the in-process alarm tone/vibration. We deliberately
// do NOT use a foreground service: aggressive OEMs (MIUI/HyperOS) block FGS starts
// and crash the app. USAGE_ALARM audio plays from the background without one; the
// sound runs while the headless task is alive, and the notification tap launches
// the app where the modal keeps the alarm looping until acknowledged.
setBackgroundMessageHandler(getMessaging(), async remoteMessage => {
  if (remoteMessage.data?.type === 'PANIC_ALERT') {
    // Respect the user's opt-out — don't blare if they disabled panic alerts.
    if (!(await getPanicAlertsEnabled())) return;
    await createNotificationChannels();
    const d = remoteMessage.data;
    PanicSound?.startAlarmService({
      complexId:        d.complexId,
      triggeredBy:      d.triggeredBy,
      triggeredByLabel: d.triggeredByLabel,
    });
    await displayPanicFCMNotification(remoteMessage);
    return;
  }

  // Non-panic (visits, payments, packages, …). When the message is data-only the
  // OS shows nothing on its own, so we must render it via Notifee here — otherwise
  // it's silently dropped in background/killed. If the backend already includes a
  // `notification` payload, Android displays it itself; skip to avoid duplicates.
  if (!remoteMessage.notification) {
    await createNotificationChannels();
    await displayForegroundNotification(remoteMessage);
  }
});

// Notifee background event handler — handles action button presses.
notifee.onBackgroundEvent(handleNotifeeBackgroundEvent);

AppRegistry.registerComponent(appName, () => App);
