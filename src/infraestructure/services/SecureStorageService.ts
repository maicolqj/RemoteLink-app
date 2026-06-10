import * as Keychain from 'react-native-keychain';

let onKeyInvalidatedCallback: (() => void) | null = null;

export const setOnKeyInvalidatedCallback = (callback: () => void) => {
  onKeyInvalidatedCallback = callback;
};

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  sessionId?: string;
  accessTokenExpiresAt?: number;
}

export interface BiometricStatus {
  isAvailable: boolean;
  biometryType: Keychain.BIOMETRY_TYPE | null;
  isEnrolled: boolean;
}

export type BiometryTypeLabel = 'FaceID' | 'TouchID' | 'Fingerprint' | 'Iris' | 'Biometrics' | null;

export interface AuthResult {
  success: boolean;
  error?: string;
  errorCode?: 'cancelled' | 'locked' | 'not_enrolled' | 'not_available' | 'unknown';
}

const KEYCHAIN_SERVICE = 'com.remotelink.auth';
const TOKEN_USERNAME   = 'remotelink_auth_tokens';
const PROFILE_SERVICE  = 'com.remotelink.profile';
const PROFILE_USERNAME = 'user_profile';
const BIOMETRIC_PREFERENCE_SERVICE = 'com.remotelink.prefs';
const BIOMETRIC_PREFERENCE_USER    = 'biometric_enabled';
const VERIFY_SERVICE = 'com.remotelink.verify';

const isDecryptionError = (error: any): boolean => {
  const message = error?.message || String(error);
  return (
    message.includes('Decryption failed') ||
    message.includes('CryptoFailedException') ||
    message.includes('key permanently invalidated') ||
    message.includes('Authentication tag verification failed') ||
    message.includes('wrong key') ||
    message.includes('Empty key extracted')
  );
};

export class SecureStorageService {

  static async getBiometricStatus(): Promise<BiometricStatus> {
    try {
      const biometryType = await Keychain.getSupportedBiometryType();
      return { isAvailable: biometryType !== null, biometryType, isEnrolled: biometryType !== null };
    } catch {
      return { isAvailable: false, biometryType: null, isEnrolled: false };
    }
  }

  static getBiometryTypeName(type: Keychain.BIOMETRY_TYPE | null): BiometryTypeLabel {
    if (!type) return null;
    switch (type) {
      case Keychain.BIOMETRY_TYPE.FACE_ID:    return 'FaceID';
      case Keychain.BIOMETRY_TYPE.TOUCH_ID:   return 'TouchID';
      case Keychain.BIOMETRY_TYPE.FINGERPRINT: return 'Fingerprint';
      case Keychain.BIOMETRY_TYPE.IRIS:       return 'Iris';
      default: return 'Biometrics';
    }
  }

  static async saveTokens(tokens: TokenPair, requireBiometric: boolean = false): Promise<boolean> {
    try {
      const options: Keychain.SetOptions = {
        service: KEYCHAIN_SERVICE,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        securityLevel: Keychain.SECURITY_LEVEL.SECURE_SOFTWARE,
      };
      if (requireBiometric) {
        options.accessControl = Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE;
        options.authenticationPrompt = {
          title: 'Seguridad RemoteLink',
          subtitle: 'Protegiendo tus credenciales',
          description: 'Confirma tu identidad para guardar el acceso.',
        };
      }
      const result = await Keychain.setGenericPassword(TOKEN_USERNAME, JSON.stringify(tokens), options);
      return result !== false;
    } catch {
      return false;
    }
  }

  static async getTokens(promptMessage?: string): Promise<TokenPair | null> {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: KEYCHAIN_SERVICE,
        authenticationPrompt: {
          title: 'Acceso Requerido',
          subtitle: promptMessage || 'Verifica tu identidad para entrar',
        },
      });
      if (credentials && credentials.password) {
        return JSON.parse(credentials.password) as TokenPair;
      }
      return null;
    } catch (error: any) {
      if (isDecryptionError(error)) {
        await this.clearTokens();
        if (String(error).includes('invalidated') && onKeyInvalidatedCallback) {
          onKeyInvalidatedCallback();
        }
      }
      return null;
    }
  }

  static async hasTokens(): Promise<boolean> {
    try {
      const result = await Keychain.getGenericPassword({ service: KEYCHAIN_SERVICE });
      return result !== false;
    } catch (error: any) {
      if (isDecryptionError(error)) await this.clearTokens();
      return false;
    }
  }

  static async clearTokens(): Promise<boolean> {
    return await Keychain.resetGenericPassword({ service: KEYCHAIN_SERVICE });
  }

  static async saveUserProfile<T>(profile: T): Promise<boolean> {
    try {
      await Keychain.setGenericPassword(PROFILE_USERNAME, JSON.stringify(profile), {
        service: PROFILE_SERVICE,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
      return true;
    } catch { return false; }
  }

  static async getUserProfile<T>(): Promise<T | null> {
    try {
      const creds = await Keychain.getGenericPassword({ service: PROFILE_SERVICE });
      if (!creds || !creds.password) return null;
      return JSON.parse(creds.password) as T;
    } catch { return null; }
  }

  static async clearUserProfile(): Promise<void> {
    try { await Keychain.resetGenericPassword({ service: PROFILE_SERVICE }); } catch {}
  }

  static async setBiometricEnabled(enabled: boolean): Promise<boolean> {
    try {
      if (enabled) {
        await Keychain.setGenericPassword(BIOMETRIC_PREFERENCE_USER, 'enabled', {
          service: BIOMETRIC_PREFERENCE_SERVICE,
          accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        });
      } else {
        await Keychain.resetGenericPassword({ service: BIOMETRIC_PREFERENCE_SERVICE });
      }
      return true;
    } catch { return false; }
  }

  static async isBiometricEnabled(): Promise<boolean> {
    try {
      const creds = await Keychain.getGenericPassword({ service: BIOMETRIC_PREFERENCE_SERVICE });
      return creds !== false && creds.password === 'enabled';
    } catch { return false; }
  }

  static async authenticateUser(msg?: string): Promise<AuthResult> {
    try {
      const result = await Keychain.setGenericPassword('auth_test', 'valid', {
        service: VERIFY_SERVICE,
        accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
        authenticationPrompt: { title: 'Verificación', subtitle: msg || 'Confirma tu identidad' },
      });
      if (result) {
        await Keychain.resetGenericPassword({ service: VERIFY_SERVICE });
        return { success: true };
      }
      return { success: false, errorCode: 'unknown' };
    } catch (error: any) {
      const m = error?.message || '';
      if (m.includes('cancel')) return { success: false, errorCode: 'cancelled' };
      if (m.includes('lock'))   return { success: false, errorCode: 'locked' };
      return { success: false, errorCode: 'unknown' };
    }
  }
}

export default SecureStorageService;
