import * as Keychain from 'react-native-keychain';

const SERVICE_PREFIX = 'com.remotelink.';

export const storage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      const credentials = await Keychain.getGenericPassword({ service: SERVICE_PREFIX + key });
      return credentials ? credentials.password : null;
    } catch { return null; }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await Keychain.setGenericPassword(key, value, {
        service: SERVICE_PREFIX + key,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    } catch (e) { console.warn('[storage] setItem failed:', e); }
  },

  removeItem: async (key: string): Promise<void> => {
    try {
      await Keychain.resetGenericPassword({ service: SERVICE_PREFIX + key });
    } catch {}
  },
};
