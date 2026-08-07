import { AppRegistry, Platform } from 'react-native';
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
import { reportPanicDelivered } from './src/infraestructure/services/panicAck';
import { getPanicAlertsEnabled } from './src/presentation/store/settings.store';

// FCM background handler — fires in background AND when killed, but ONLY for
// DATA-ONLY high-priority messages. If the backend includes a `notification`
// payload, Android shows it itself and this handler never runs while killed, so
// the alarm wouldn't fire. Panic must be sent data-only (android.priority=high).
setBackgroundMessageHandler(getMessaging(), async remoteMessage => {
  if (remoteMessage.data?.type === 'PANIC_ALERT') {
    // En Android el pánico ya NO pasa por aquí: lo atiende PanicAlertReceiver en
    // Kotlin. No es una optimización, es que esta ruta no llega — para ejecutar
    // este handler, react-native-firebase tiene que arrancar un servicio
    // headless, y con la app cerrada Android lo rechaza:
    //
    //   W/ActivityManager: Background start not allowed: service Intent {
    //     cmp=…/ReactNativeFirebaseMessagingHeadlessService } startFg?=false
    //
    // Nada de lo que hubiera debajo llegaba a correr. El receptor nativo no
    // arranca ningún servicio, así que la restricción no le aplica; y hace lo
    // mismo que hacía este bloque (sirena, notificación y ACK de entrega).
    //
    // Cuando este handler SÍ corre —app en segundo plano pero viva— salir de
    // inmediato evita que la alerta se pinte y suene dos veces.
    if (Platform.OS === 'android') return;

    // iOS no tiene ruta nativa: aquí sigue mandando JS.
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
    // Al final: confirmar la entrega es lo único aquí que puede esperar. Alimenta
    // la auditoría que mide qué marcas reciben los pánicos y cuáles no.
    await reportPanicDelivered(d);
    return;
  }

  // Los mensajes de servicio del backend no son para el usuario. RemoteLink no
  // participa en la prueba de humo —es la app del residente, no la de quien
  // atiende un pánico— pero comparte la tabla de tokens con EntryLink, así que
  // uno puede llegarle igual. Sin este descarte caería en la rama de abajo y se
  // pintaría como notificación en blanco, porque el push de prueba no lleva
  // título ni cuerpo.
  if (remoteMessage.data?.type === 'PUSH_HEALTH_CHECK') return;

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
