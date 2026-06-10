import * as Keychain from 'react-native-keychain';
import { DEVICE_ID_KEY } from '../../data/lib/constants';

const DEVICE_ID_SERVICE = 'com.remotelink.device_id';

let cachedDeviceId: string | null = null;

const generateUUID = (): string =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

export const getDeviceId = async (): Promise<string> => {
  if (cachedDeviceId) return cachedDeviceId;

  try {
    const stored = await Keychain.getGenericPassword({ service: DEVICE_ID_SERVICE });
    if (stored && stored.password) {
      cachedDeviceId = stored.password;
      return cachedDeviceId;
    }

    const newId = generateUUID();
    await Keychain.setGenericPassword(DEVICE_ID_KEY, newId, {
      service: DEVICE_ID_SERVICE,
      accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
    });
    cachedDeviceId = newId;
    return newId;
  } catch {
    if (!cachedDeviceId) cachedDeviceId = generateUUID();
    return cachedDeviceId;
  }
};
