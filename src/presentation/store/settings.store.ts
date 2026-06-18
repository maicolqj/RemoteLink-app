import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SecureStorageService from '../../infraestructure/services/SecureStorageService';
import * as Keychain from 'react-native-keychain';

const PANIC_ALERTS_KEY = 'settings.panicAlertsEnabled';

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
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setBiometricEnabled: (enabled: boolean) => Promise<void>;
  setPanicAlertsEnabled: (enabled: boolean) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  biometricEnabled: false,
  biometricSupported: false,
  biometricType: null,
  panicAlertsEnabled: true,
  hydrated: false,

  hydrate: async () => {
    const [enabled, status, panicAlerts] = await Promise.all([
      SecureStorageService.isBiometricEnabled(),
      SecureStorageService.getBiometricStatus(),
      getPanicAlertsEnabled(),
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

    set({
      biometricEnabled: enabled,
      biometricSupported: status.isAvailable,
      biometricType: typeLabel,
      panicAlertsEnabled: panicAlerts,
      hydrated: true,
    });
  },

  setBiometricEnabled: async (enabled: boolean) => {
    await SecureStorageService.setBiometricEnabled(enabled);
    set({ biometricEnabled: enabled });
  },

  setPanicAlertsEnabled: async (enabled: boolean) => {
    await AsyncStorage.setItem(PANIC_ALERTS_KEY, enabled ? '1' : '0');
    set({ panicAlertsEnabled: enabled });
  },
}));
