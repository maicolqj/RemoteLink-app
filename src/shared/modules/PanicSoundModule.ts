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
  openAutostartSettings: () => Promise<boolean>;
  isAutostartRelevant: () => Promise<boolean>;
  getManufacturer: () => Promise<string>;
  areNotificationsEnabled: () => Promise<boolean>;
  canUseFullScreenIntent: () => Promise<boolean>;
  openFullScreenIntentSettings: () => Promise<boolean>;
  isNotificationPolicyAccessGranted: () => Promise<boolean>;
  openNotificationPolicySettings: () => Promise<boolean>;
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
  /**
   * Opens the manufacturer's autostart/background-launch whitelist screen
   * (MIUI, ColorOS, FuntouchOS, EMUI, …), falling back to the app's own
   * details page if the device's OEM screen isn't recognized. Resolves true
   * if an OEM-specific screen was opened, false on fallback.
   */
  openAutostartSettings: () => Promise<boolean>;
  /**
   * True when this device's manufacturer has a known OEM autostart screen
   * (Xiaomi, Huawei/Honor, Oppo, Vivo, Letv, Asus). False on Samsung, Pixel,
   * other stock/AOSP devices, or iOS — use this to skip nudging users toward
   * a setting that doesn't exist on their phone.
   */
  isAutostartRelevant: () => Promise<boolean>;
  /** Device brand (`Build.MANUFACTURER`), lowercase-compared by callers. */
  getManufacturer: () => Promise<string>;
  /** False when the user muted the app — no panic alert is displayed at all. */
  areNotificationsEnabled: () => Promise<boolean>;
  /**
   * Android 14+ only grants USE_FULL_SCREEN_INTENT automatically to calling and
   * alarm apps. When denied, the panic alert silently stops taking over a locked
   * screen and degrades to a heads-up — no error is raised anywhere, so this
   * check is the only way to know. Always true below API 34.
   */
  canUseFullScreenIntent: () => Promise<boolean>;
  /** Opens the Android 14+ screen granting full-screen alerts. False below API 34. */
  openFullScreenIntentSettings: () => Promise<boolean>;
  /** Required for the panic channel to bypass Do Not Disturb. */
  isNotificationPolicyAccessGranted: () => Promise<boolean>;
  /** Opens the device-wide DND access list (cannot deep link to this app's row). */
  openNotificationPolicySettings: () => Promise<boolean>;
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
      openAutostartSettings: async () => {
        if (Platform.OS !== 'android') return false;
        try { return await native.openAutostartSettings(); }
        catch (e) { console.error('[PanicSound] openAutostartSettings error:', e); return false; }
      },
      isAutostartRelevant: async () => {
        if (Platform.OS !== 'android') return false;
        try { return await native.isAutostartRelevant(); }
        catch (e) { console.error('[PanicSound] isAutostartRelevant error:', e); return false; }
      },
      getManufacturer: async () => {
        if (Platform.OS !== 'android') return '';
        try { return await native.getManufacturer(); }
        catch (e) { console.error('[PanicSound] getManufacturer error:', e); return ''; }
      },
      areNotificationsEnabled: async () => {
        if (Platform.OS !== 'android') return true;
        try { return await native.areNotificationsEnabled(); }
        catch (e) { console.error('[PanicSound] areNotificationsEnabled error:', e); return true; }
      },
      canUseFullScreenIntent: async () => {
        // iOS has no equivalent gate — critical alerts are a separate entitlement.
        if (Platform.OS !== 'android') return true;
        try { return await native.canUseFullScreenIntent(); }
        // Assume granted on failure: a false negative would nag the user about a
        // permission screen that may not even exist on their Android version.
        catch (e) { console.error('[PanicSound] canUseFullScreenIntent error:', e); return true; }
      },
      openFullScreenIntentSettings: async () => {
        if (Platform.OS !== 'android') return false;
        try { return await native.openFullScreenIntentSettings(); }
        catch (e) { console.error('[PanicSound] openFullScreenIntentSettings error:', e); return false; }
      },
      isNotificationPolicyAccessGranted: async () => {
        if (Platform.OS !== 'android') return true;
        try { return await native.isNotificationPolicyAccessGranted(); }
        catch (e) { console.error('[PanicSound] isNotificationPolicyAccessGranted error:', e); return false; }
      },
      openNotificationPolicySettings: async () => {
        if (Platform.OS !== 'android') return false;
        try { return await native.openNotificationPolicySettings(); }
        catch (e) { console.error('[PanicSound] openNotificationPolicySettings error:', e); return false; }
      },
    }
  : null;

export default PanicSound;
