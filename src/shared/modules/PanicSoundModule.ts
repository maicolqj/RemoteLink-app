import { NativeModules, Platform } from 'react-native';

export interface PanicLaunchData {
  complexId?: string | null;
  triggeredBy?: string | null;
  triggeredByLabel?: string | null;
}

interface PanicSoundNative {
  start: () => void;
  startAlarmService: (data: Record<string, string>) => void;
  stop: () => void;
  getInitialPanicData: () => Promise<PanicLaunchData | null>;
  isIgnoringBatteryOptimizations: () => Promise<boolean>;
  requestIgnoreBatteryOptimizations: () => Promise<boolean>;
}

const native = NativeModules.PanicSound as PanicSoundNative | undefined;

if (__DEV__) {
  console.log('[PanicSound] NativeModules.PanicSound:', native ?? 'NOT FOUND');
}

export interface PanicSoundApi {
  start: () => void;
  /** Start the alarm carrying FCM panic payload (background / killed delivery). */
  startAlarmService: (data: PanicLaunchData) => void;
  stop: () => void;
  /** Panic payload that launched the app from killed state (cleared on read). */
  getInitialPanicData: () => Promise<PanicLaunchData | null>;
  /** True if the app is already exempt from battery optimization (Android only). */
  isIgnoringBatteryOptimizations: () => Promise<boolean>;
  /**
   * Opens the system dialog to exempt the app from battery optimization.
   * Resolves true if already exempt, false if the dialog was opened (re-check after).
   */
  requestIgnoreBatteryOptimizations: () => Promise<boolean>;
}

const PanicSound: PanicSoundApi | null = native
  ? {
      start: () => {
        if (__DEV__) console.log('[PanicSound] calling start()');
        try { native.start(); } catch (e) { console.error('[PanicSound] start() error:', e); }
      },
      startAlarmService: (data) => {
        if (__DEV__) console.log('[PanicSound] calling startAlarmService()', data);
        try {
          // Strip null/undefined — native bridge only forwards string extras.
          const clean: Record<string, string> = {};
          for (const [k, v] of Object.entries(data)) if (v != null) clean[k] = String(v);
          native.startAlarmService(clean);
        } catch (e) { console.error('[PanicSound] startAlarmService() error:', e); }
      },
      stop: () => {
        if (__DEV__) console.log('[PanicSound] calling stop()');
        try { native.stop(); } catch (e) { console.error('[PanicSound] stop() error:', e); }
      },
      getInitialPanicData: async () => {
        if (Platform.OS !== 'android') return null;
        try { return await native.getInitialPanicData(); }
        catch (e) { console.error('[PanicSound] getInitialPanicData error:', e); return null; }
      },
      isIgnoringBatteryOptimizations: async () => {
        if (Platform.OS !== 'android') return true;
        try { return await native.isIgnoringBatteryOptimizations(); }
        catch (e) { console.error('[PanicSound] isIgnoringBatteryOptimizations error:', e); return true; }
      },
      requestIgnoreBatteryOptimizations: async () => {
        if (Platform.OS !== 'android') return true;
        try { return await native.requestIgnoreBatteryOptimizations(); }
        catch (e) { console.error('[PanicSound] requestIgnoreBatteryOptimizations error:', e); return false; }
      },
    }
  : null;

export default PanicSound;
