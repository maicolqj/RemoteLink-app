import React, { useEffect, useRef } from 'react';
import {
  NavigationContainer,
  DarkTheme,
  DefaultTheme,
  type NavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'react-native';
import type { RootStackParamList } from './types/NavigationTypes';
import MainNavigator from './MainNavigator';
import LoginScreen from '../screens/auth/LoginScreen';
import { PanicFAB } from '../components/PanicFAB';
import { AppProviders } from '../providers/AppProviders';
import { useTheme } from '../providers/context/ThemeContext';
import { useAuthStore } from '../store/auth.store';
import {
  requestNotificationPermission,
  getFCMToken,
  initNotificationListeners,
  handleInitialNotification,
} from '../../infraestructure/services/NotificationService';
import { fetchMyResidentProfile } from '../../infraestructure/services/auth.service';
import { createNotificationChannels } from '../../infraestructure/services/NotifeeService';
import { useNotificationsStore } from '../store/notifications.store';
import { lightColors, darkColors } from '../providers/context/ThemeContext';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Adapts RemoteLink palettes to React Navigation theme shape
const navLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary:    lightColors.primary,
    background: lightColors.background,
    card:       lightColors.surface,
    text:       lightColors.textPrimary,
    border:     lightColors.border,
    notification: lightColors.error,
  },
};

const navDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary:    darkColors.primary,
    background: darkColors.background,
    card:       darkColors.surface,
    text:       darkColors.textPrimary,
    border:     darkColors.border,
    notification: darkColors.error,
  },
};

// ─── Profile bootstrap ────────────────────────────────────────────────────────

function ProfileBootstrap() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const resident        = useAuthStore(s => s.resident);
  const setResident     = useAuthStore(s => s.setResident);

  useEffect(() => {
    if (!isAuthenticated || resident) return;
    fetchMyResidentProfile()
      .then(setResident)
      .catch(err => console.warn('[ProfileBootstrap]', err));
  }, [isAuthenticated, resident, setResident]);

  return null;
}

// ─── Notification bootstrap ───────────────────────────────────────────────────

function NotificationBootstrap({
  navigationRef,
}: {
  navigationRef: React.RefObject<NavigationContainerRef<RootStackParamList> | null>;
}) {
  const addNotification = useNotificationsStore(s => s.addNotification);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    async function bootstrap() {
      await createNotificationChannels();

      const granted = await requestNotificationPermission();
      if (!granted) return;

      const token = await getFCMToken();
      if (token) {
        // TODO: send token to backend
        console.log('[FCM] Token:', token);
      }

      const nav = navigationRef.current;
      if (!nav) return;

      cleanup = initNotificationListeners(nav, addNotification);

      setTimeout(() => {
        const navReady = navigationRef.current;
        if (navReady) handleInitialNotification(navReady, addNotification);
      }, 600);
    }

    bootstrap();
    return () => cleanup?.();
  }, [addNotification, navigationRef]);

  return null;
}

// ─── Inner navigator (has access to ThemeContext) ─────────────────────────────

function ThemedNavigator() {
  const { isDark } = useTheme();
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? darkColors.surface : lightColors.surface}
      />
      <NavigationContainer
        ref={navigationRef}
        theme={isDark ? navDarkTheme : navLightTheme}>
        <ProfileBootstrap />
        <NotificationBootstrap navigationRef={navigationRef} />
        <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
          {isAuthenticated ? (
            <Stack.Screen name="Main" component={MainNavigator} />
          ) : (
            <Stack.Screen name="Auth" component={LoginScreen} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
      {isAuthenticated && <PanicFAB />}
    </>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function RootNavigator() {
  return (
    <AppProviders>
      <ThemedNavigator />
    </AppProviders>
  );
}
