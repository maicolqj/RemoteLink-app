import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SecureStorageService from '../../infraestructure/services/SecureStorageService';
import * as Keychain from 'react-native-keychain';
import PanicSound from '../../shared/modules/PanicSoundModule';

const PANIC_ALERTS_KEY = 'settings.panicAlertsEnabled';
const AUTOSTART_LAST_PROMPT_KEY = 'settings.autostartPromptLastShownAt';
const AUTOSTART_CONFIRMED_KEY = 'settings.autostartConfirmed';
const BIOMETRIC_PROMPT_KEY = 'settings.biometricPromptShown';

// Standalone reader for non-React / headless contexts (e.g. the FCM background
// handler in index.js) where the zustand store isn't hydrated. Defaults to true.
export async function getPanicAlertsEnabled(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(PANIC_ALERTS_KEY);
    return v == null ? true : v === '1';
  } catch {
    return true; // fail open: a security alarm should err toward alerting
  }
}

interface SettingsState {
  biometricEnabled: boolean;
  biometricSupported: boolean;
  biometricType: string | null;
  panicAlertsEnabled: boolean;
  /**
   * Cuándo se ofreció por última vez activar el inicio automático (epoch ms;
   * 0 = nunca). No es un "ya se mostró" de una sola vez: sin este permiso las
   * alertas de pánico no llegan con la app cerrada, así que se vuelve a
   * ofrecer cada cierto tiempo.
   */
  autostartPromptLastShownAt: number;
  /**
   * El residente declaró que ya lo activó, o el fabricante no tiene esa
   * pantalla. Es la ÚNICA señal de que está configurado: Android no expone
   * ninguna API para consultarlo. Mientras sea falso, se sigue insistiendo.
   */
  autostartConfirmed: boolean;
  /**
   * El ofrecimiento de activar la biometría se hace UNA vez por instalación. Se
   * guarda aparte de `biometricEnabled` porque "ya se lo ofrecí y dijo que no"
   * y "nunca se lo ofrecí" son estados distintos, y la preferencia del Keychain
   * no los distingue: `setBiometricEnabled(false)` borra la entrada.
   */
  biometricPromptShown: boolean;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setBiometricEnabled: (enabled: boolean) => Promise<void>;
  setPanicAlertsEnabled: (enabled: boolean) => Promise<void>;
  markAutostartPromptShown: () => Promise<void>;
  confirmAutostartConfigured: () => Promise<void>;
  markBiometricPromptShown: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  biometricEnabled: false,
  biometricSupported: false,
  biometricType: null,
  panicAlertsEnabled: true,
  autostartPromptLastShownAt: 0,
  autostartConfirmed: false,
  biometricPromptShown: false,
  hydrated: false,

  hydrate: async () => {
    const [enabled, status, panicAlerts, autostartLastPrompt, autostartConfirmed, biometricPromptShown] = await Promise.all([
      SecureStorageService.isBiometricEnabled(),
      SecureStorageService.getBiometricStatus(),
      getPanicAlertsEnabled(),
      AsyncStorage.getItem(AUTOSTART_LAST_PROMPT_KEY).then(v => Number(v) || 0),
      AsyncStorage.getItem(AUTOSTART_CONFIRMED_KEY).then(v => v === '1'),
      AsyncStorage.getItem(BIOMETRIC_PROMPT_KEY).then(v => v === '1'),
    ]);

    const typeLabel = status.biometryType === Keychain.BIOMETRY_TYPE.FACE_ID
      ? 'Face ID'
      : status.biometryType === Keychain.BIOMETRY_TYPE.TOUCH_ID
      ? 'Touch ID'
      : status.biometryType === Keychain.BIOMETRY_TYPE.FINGERPRINT
      ? 'Huella dactilar'
      : status.biometryType
      ? 'Biometría'
      : null;

    // Re-espeja en cada arranque, no solo al cambiar el ajuste: las
    // instalaciones que ya existían cuando esto se añadió tienen el valor en
    // AsyncStorage y el espejo vacío, y ahí el nativo asumiría "activo" para
    // alguien que lo había desactivado.
    void PanicSound?.setPanicAlertsEnabled(panicAlerts);

    set({
      biometricEnabled: enabled,
      biometricSupported: status.isAvailable,
      biometricType: typeLabel,
      panicAlertsEnabled: panicAlerts,
      autostartPromptLastShownAt: autostartLastPrompt,
      autostartConfirmed,
      biometricPromptShown,
      hydrated: true,
    });
  },

  setBiometricEnabled: async (enabled: boolean) => {
    await SecureStorageService.setBiometricEnabled(enabled);
    set({ biometricEnabled: enabled });
  },

  setPanicAlertsEnabled: async (enabled: boolean) => {
    await AsyncStorage.setItem(PANIC_ALERTS_KEY, enabled ? '1' : '0');
    // El espejo nativo es lo que hace que el ajuste valga con la app cerrada:
    // quien atiende el pánico ahí es PanicAlertReceiver, que no puede leer
    // AsyncStorage. Sin esto, desactivar las alertas solo surtiría efecto
    // mientras la app está viva.
    void PanicSound?.setPanicAlertsEnabled(enabled);
    set({ panicAlertsEnabled: enabled });
  },

  markAutostartPromptShown: async () => {
    const now = Date.now();
    await AsyncStorage.setItem(AUTOSTART_LAST_PROMPT_KEY, String(now));
    set({ autostartPromptLastShownAt: now });
  },

  /**
   * Corta el recordatorio para siempre en este dispositivo. Se llama cuando el
   * residente responde que ya lo activó, o cuando el fabricante no tiene esa
   * pantalla y el recordatorio no aplica.
   */
  confirmAutostartConfigured: async () => {
    await AsyncStorage.setItem(AUTOSTART_CONFIRMED_KEY, '1');
    set({ autostartConfirmed: true });
  },

  markBiometricPromptShown: async () => {
    await AsyncStorage.setItem(BIOMETRIC_PROMPT_KEY, '1');
    set({ biometricPromptShown: true });
  },
}));
