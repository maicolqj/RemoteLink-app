import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  NavigationContainer,
  DarkTheme,
  DefaultTheme,
  type NavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, Alert, Platform, StatusBar, View } from 'react-native';
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
  type FCMData,
} from '../../infraestructure/services/NotificationService';
import { fetchMyResidentProfile, refreshSession } from '../../infraestructure/services/auth.service';
import { tokenRefreshService } from '../../infraestructure/services/TokenRefreshService';
import { createNotificationChannels } from '../../infraestructure/services/NotifeeService';
import notifee from '@notifee/react-native';
import SecureStorageService from '../../infraestructure/services/SecureStorageService';
import { useNotificationsStore } from '../store/notifications.store';
import { lightColors, darkColors } from '../providers/context/ThemeContext';
import { usePanicStore } from '../store/panic.store';
import { useSettingsStore } from '../store/settings.store';
import apolloClientInstance from '../../data/lib/apollo/client';
import { SAVE_MOBILE_TOKEN } from '../../domain/graphql/notifications.mutations';
import PanicSound from '../../shared/modules/PanicSoundModule';

// Conecta el refresh real al authLink/errorLink de Apollo. Sin esto,
// tokenRefreshService.refreshToken() retorna null y cualquier 401 fuerza logout.
tokenRefreshService.registerRefreshCallback(refreshSession);

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

// ─── Auth gate (biometric + session restore) ──────────────────────────────────

function AuthGate({ children }: { children: React.ReactNode }) {
  const { hydrating, hydrateSession, setSession } = useAuthStore();
  const { colors } = useTheme();
  const [biometricPending, setBiometricPending] = useState(false);

  useEffect(() => {
    hydrateSession().then(async (result) => {
      if (result === 'biometric_required') {
        setBiometricPending(true);
        const auth = await SecureStorageService.authenticateUser('Confirma tu identidad para acceder');
        if (auth.success) {
          const tokens = await SecureStorageService.getTokens();
          if (tokens?.accessToken) {
            setSession(tokens.accessToken, tokens.sessionId ?? '');
          }
        } else if (auth.errorCode !== 'cancelled') {
          Alert.alert('Autenticación requerida', 'No se pudo verificar tu identidad.');
        }
        setBiometricPending(false);
        useAuthStore.setState({ hydrating: false });
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (hydrating || biometricPending) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

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
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const complexId       = useAuthStore(s => s.resident?.complex?.id);
  const setPanicData    = usePanicStore(s => s.setPanicData);

  const [fcmToken, setFcmToken] = useState<string | null>(null);

  const handlePanic = useCallback((data: FCMData) => {
    // Respect the user's opt-out across cold-start / FCM-opened paths.
    if (!useSettingsStore.getState().panicAlertsEnabled) return;
    setPanicData({
      complexId:        data.complexId ?? '',
      triggeredBy:      data.triggeredBy ?? '',
      triggeredByLabel: data.triggeredByLabel,
    });
  }, [setPanicData]);

  // One-time setup: channels, permission, token, listeners
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    async function bootstrap() {
      // Hydrate settings early so panic opt-out gating is correct before any
      // socket/FCM alert can fire.
      useSettingsStore.getState().hydrate();
      await createNotificationChannels();

      // Permission only gates *showing* tray notifications — FCM still delivers
      // messages and we still want the token + listeners. Don't bail on denial.
      const granted = await requestNotificationPermission();
      if (__DEV__ && !granted) console.log('[FCM] permiso de notificaciones NO concedido — los mensajes llegan pero no se mostrarán en bandeja');

      const token = await getFCMToken();
      if (__DEV__) console.log('[FCM] token obtenido:', token ?? 'NULL - Firebase no inicializado');
      if (token) setFcmToken(token);

      const nav = navigationRef.current;
      if (!nav) return;

      cleanup = initNotificationListeners(
        nav,
        addNotification,
        handlePanic,
        (refreshed) => setFcmToken(refreshed),
      );

      setTimeout(async () => {
        const navReady = navigationRef.current;
        if (navReady) handleInitialNotification(navReady, addNotification, handlePanic);

        // Cold start from a panic: the native alarm service stashed the payload
        // when it launched the activity (full-screen intent / tap). Pull it so the
        // modal shows immediately; the service is already blaring the alarm.
        const panicLaunch = await PanicSound?.getInitialPanicData();
        if (panicLaunch?.complexId || panicLaunch?.triggeredBy) {
          handlePanic({
            complexId:        panicLaunch.complexId ?? '',
            triggeredBy:      panicLaunch.triggeredBy ?? '',
            triggeredByLabel: panicLaunch.triggeredByLabel ?? undefined,
          } as FCMData);
        }

        // Notifee initial notification — handles non-panic notifications tapped
        // from killed state (visits, payments, etc.).
        const notifeeInitial = await notifee.getInitialNotification();
        if (notifeeInitial?.notification?.data?.type === 'PANIC_ALERT') {
          handlePanic(notifeeInitial.notification.data as FCMData);
        }
      }, 600);
    }

    bootstrap();
    return () => cleanup?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Register FCM token with backend once authenticated + complexId is available
  useEffect(() => {
    if (__DEV__) console.log('[FCM] registro check → auth:', isAuthenticated, '| complex:', complexId, '| token:', fcmToken ? fcmToken.slice(0, 20) + '…' : 'null');
    if (!isAuthenticated || !complexId || !fcmToken) return;
    if (__DEV__) console.log('[FCM] enviando token al backend…');
    apolloClientInstance.mutate({
      mutation: SAVE_MOBILE_TOKEN,
      variables: {
        input: {
          complexId,
          deviceToken: fcmToken,
          platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
        },
      },
    })
      .then(() => { if (__DEV__) console.log('[FCM] saveMobileToken OK'); })
      .catch(err => console.warn('[FCM] saveMobileToken error:', err?.message));
  }, [isAuthenticated, complexId, fcmToken]);

  return null;
}

// ─── Inner navigator (has access to ThemeContext) ─────────────────────────────

function ThemedNavigator() {
  const { isDark } = useTheme();
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

  return (
    <AuthGate>
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
    </AuthGate>
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
