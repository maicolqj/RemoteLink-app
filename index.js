import { AppRegistry } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';
import { handleNotifeeBackgroundEvent } from './src/infraestructure/services/NotifeeService';

// FCM background handler — runs in headless context when app is background/quit.
// FCM automatically shows system notification from `notification` payload.
// For data-only messages, call notifee here to display manually.
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('[FCM Background]', remoteMessage.messageId);
});

// Notifee background event handler — handles action button presses
// (e.g., "Aprobar" / "Rechazar" visit from notification while app is in background).
notifee.onBackgroundEvent(handleNotifeeBackgroundEvent);

AppRegistry.registerComponent(appName, () => App);
