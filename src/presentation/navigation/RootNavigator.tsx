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
import AuthStack from './stacks/AuthStack';
import LegalScreen from '../screens/generals/LegalScreen';
import ApproveDeviceScreen from '../screens/generals/ApproveDeviceScreen';
import { PanicFAB } from '../components/PanicFAB';
import { AppProviders } from '../providers/AppProviders';
import { useTheme } from '../providers/context/ThemeContext';
import { useAuthStore } from '../store/auth.store';
import {
  requestNotificationPermission,
  getFCMToken,
  initNotificationListeners,
  handleInitialNotification,
  navigateToApprovalIfNeeded,
  type FCMData,
} from '../../infraestructure/services/NotificationService';
import {
  isDevicePinLinked,
  fetchPendingDeviceApprovals,
  wasPinPromptShown,
  markPinPromptShown,
} from '../../infraestructure/services/deviceAuth.service';
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
import { getApiErrorMessage } from '../../infraestructure/utils/apiError';
import { useAlert } from '../providers/context/AlertContext';

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

// ─── Device security bootstrap ────────────────────────────────────────────────

/**
 * Al abrir la app con sesión: (1) consulta las solicitudes de ingreso
 * pendientes —respaldo para cuando el push no llega, y vencen en 5 minutos— y
 * (2) si el dispositivo aún no tiene PIN, ofrece crearlo una sola vez.
 */
function DeviceSecurityBootstrap({
  navigationRef,
}: {
  navigationRef: React.RefObject<NavigationContainerRef<RootStackParamList> | null>;
}) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const { showQuestion } = useAlert();

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;

    (async () => {
      try {
        const pending = await fetchPendingDeviceApprovals();
        if (cancelled) return;
        if (pending.length) {
          const nav = navigationRef.current;
          const { approvalId, approvalCode, requestedFromLabel, requestedFromIp, expiresAt } = pending[0];
          if (nav?.isReady()) {
            nav.navigate('ApproveDevice', {
              approvalId,
              approvalCode,
              requestedFromLabel: requestedFromLabel ?? undefined,
              requestedFromIp: requestedFromIp ?? undefined,
              expiresAt,
            });
          }
          return; // la aprobación manda: no encimar el diálogo del PIN
        }
      } catch {
        // Sin conexión o backend sin el flujo desplegado: no bloquea el arranque.
      }

      const [linked, promptShown] = await Promise.all([isDevicePinLinked(), wasPinPromptShown()]);
      if (cancelled || linked || promptShown) return;

      markPinPromptShown();
      showQuestion(
        'Crea un PIN de 6 dígitos para entrar en este dispositivo sin esperar códigos por WhatsApp.',
        'Ingresa más rápido',
        {
          buttons: [
            { text: 'Ahora no', style: 'secondary', onPress: () => {} },
            {
              text: 'Crear PIN',
              style: 'primary',
              onPress: () => {
                const nav = navigationRef.current;
                if (nav?.isReady()) {
                  nav.navigate('Main', {
                    screen: 'ProfileTab',
                    params: { screen: 'SetDevicePin', params: { firstTime: true } },
                  });
                }
              },
            },
          ],
        },
      );
    })();

    return () => { cancelled = true; };
  }, [isAuthenticated, navigationRef, showQuestion]);

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
  const settingsHydrated      = useSettingsStore(s => s.hydrated);
  const autostartPromptShown  = useSettingsStore(s => s.autostartPromptShown);
  const { showQuestion } = useAlert();

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
        const notifeeData = notifeeInitial?.notification?.data as FCMData | undefined;
        if (notifeeData?.type === 'PANIC_ALERT') {
          handlePanic(notifeeData);
        } else if (notifeeData && navReady) {
          // La solicitud de ingreso llega data-only (la muestra Notifee), así que
          // su pulsación desde app cerrada solo aparece por esta vía.
          navigateToApprovalIfNeeded(navReady, notifeeData);
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
    apolloClientInstance.mutate<{ saveMobileToken: { success: boolean } }>({
      mutation: SAVE_MOBILE_TOKEN,
      variables: {
        input: {
          complexId,
          deviceToken: fcmToken,
          platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
        },
      },
    })
      .then(({ data, error }) => {
        // errorPolicy 'all' (default del cliente) NO rechaza la promesa en errores
        // GraphQL — quedan en `error` (singular) y el .then() de "éxito" igual corre.
        // Sin este chequeo el token nunca queda registrado en el backend y el push
        // por FCM (notificaciones con la app cerrada) falla en silencio para siempre.
        if (error || data?.saveMobileToken?.success === false) {
          console.warn('[FCM] saveMobileToken falló:', getApiErrorMessage(error, 'sin detalle'));
          return;
        }
        if (__DEV__) console.log('[FCM] saveMobileToken OK');
      })
      .catch(err => console.warn('[FCM] saveMobileToken error:', getApiErrorMessage(err)));
  }, [isAuthenticated, complexId, fcmToken]);

  // One-time nudge to the OEM autostart/background-launch whitelist (MIUI, ColorOS,
  // FuntouchOS, EMUI, …). Without it, killed apps never get to process the FCM
  // broadcast that would show a notification — see openAutostartSettings() in
  // PanicSoundModule for why. There's no public API to check current state, so we
  // only ask once per install and let the user re-open it from Settings later.
  // Gated on isAutostartRelevant() — Samsung/Pixel/stock-AOSP devices have no such
  // screen, so nudging them there would just dump them on a useless App Info page.
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    if (!isAuthenticated || !settingsHydrated || autostartPromptShown) return;
    let cancelled = false;
    (async () => {
      const relevant = await PanicSound?.isAutostartRelevant();
      if (cancelled) return;
      useSettingsStore.getState().markAutostartPromptShown();
      if (!relevant) return;
      showQuestion(
        'Activa el inicio automático',
        'Para que las notificaciones y alertas de pánico te lleguen incluso con la app cerrada, tu fabricante requiere activar el permiso de inicio automático. Te llevamos a esa pantalla.',
        {
          buttons: [
            { text: 'Ahora no', style: 'secondary', onPress: () => {} },
            { text: 'Activar', style: 'primary', onPress: () => { PanicSound?.openAutostartSettings(); } },
          ],
        },
      );
    })();
    return () => { cancelled = true; };
  }, [isAuthenticated, settingsHydrated, autostartPromptShown, showQuestion]);

  return null;
}

// ─── Inner navigator (has access to ThemeContext) ─────────────────────────────

function ThemedNavigator() {
  const { isDark, colors } = useTheme();
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  // `null` = aún sin resolver. AuthStack fija su ruta inicial en el montaje, así
  // que hay que conocer el dato ANTES de renderizarlo.
  const [pinLinked, setPinLinked] = useState<boolean | null>(null);

  useEffect(() => { isDevicePinLinked().then(setPinLinked); }, []);

  if (!isAuthenticated && pinLinked === null) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

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
        <DeviceSecurityBootstrap navigationRef={navigationRef} />
        <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
          {isAuthenticated ? (
            <>
              <Stack.Screen name="Main" component={MainNavigator} />
              {/* Fuera de los tabs: la solicitud de ingreso llega por push desde
                  cualquier pantalla y vence en 5 minutos. */}
              <Stack.Screen
                name="ApproveDevice"
                component={ApproveDeviceScreen}
                options={{ animation: 'slide_from_bottom' }}
              />
            </>
          ) : (
            <Stack.Screen name="Auth">
              {() => <AuthStack pinLinked={pinLinked === true} />}
            </Stack.Screen>
          )}
          {/* Fuera del condicional: los legales deben abrirse con y sin sesión. */}
          <Stack.Screen
            name="Legal"
            component={LegalScreen}
            options={{ animation: 'slide_from_right' }}
          />
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
