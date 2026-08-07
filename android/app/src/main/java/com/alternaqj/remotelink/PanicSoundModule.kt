package com.alternaqj.remotelink

import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap

private const val TAG = "PanicSound"

/**
 * Puente de JS hacia la alarma de pánico y hacia el estado de los permisos que
 * la entrega necesita.
 *
 * El motor de sonido ya NO vive aquí: se movió a [PanicAlarmEngine] para que la
 * ruta nativa ([PanicAlertReceiver]) pueda arrancarlo sin contexto de React, que
 * es justo lo que no existe cuando la app está cerrada. Este módulo se quedó con
 * lo que solo tiene sentido desde JS.
 */
class PanicSoundModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "PanicSound"

    // ─── Alarm control ──────────────────────────────────────────────────────────

    /** Start the alarm (in-app / socket-triggered). */
    @ReactMethod
    fun start() = PanicAlarmEngine.start(reactApplicationContext)

    /** Start the alarm carrying FCM panic payload (background / killed delivery). */
    @ReactMethod
    fun startAlarmService(data: ReadableMap?) {
        if (data != null) {
            fun str(key: String) = if (data.hasKey(key) && !data.isNull(key)) data.getString(key) else null
            PanicAlarmEngine.stashPayload(
                complexId = str("complexId"),
                triggeredBy = str("triggeredBy"),
                triggeredByLabel = str("triggeredByLabel"),
            )
        }
        PanicAlarmEngine.start(reactApplicationContext)
    }

    @ReactMethod
    fun stop() = PanicAlarmEngine.stop(reactApplicationContext)

    /** Alias kept for the modal handoff; same in-process engine. */
    @ReactMethod
    fun stopAlarmService() = PanicAlarmEngine.stop(reactApplicationContext)

    /**
     * Retira la alerta de pánico de la bandeja.
     *
     * Hace falta como método propio porque la notificación puede haberla pintado
     * el lado nativo, y el barrido de Notifee no la ve: filtra por `data.type`,
     * un campo que solo existe en las notificaciones que crea el propio Notifee.
     * Este barre por canal, que es lo único común a los dos emisores.
     */
    @ReactMethod
    fun clearPanicNotifications(promise: Promise) {
        PanicAlarmEngine.clearPanicNotifications(reactApplicationContext)
        promise.resolve(true)
    }

    // ─── Espejos nativos de estado que vive en JS ───────────────────────────────

    /**
     * Replica el opt-out de alertas de pánico en SharedPreferences.
     *
     * [PanicAlertReceiver] corre sin contexto de React y no puede leer
     * AsyncStorage, así que sin este espejo respetaría el ajuste solo cuando la
     * app está viva — es decir, casi nunca en el caso que importa.
     */
    @ReactMethod
    fun setPanicAlertsEnabled(enabled: Boolean, promise: Promise) {
        PanicPrefs.setAlertsEnabled(reactApplicationContext, enabled)
        promise.resolve(true)
    }

    /** Replica el token FCM para que el ACK de entrega pueda atribuirse a este
     *  equipo aunque salga desde Kotlin y sin sesión. */
    @ReactMethod
    fun setDeviceToken(token: String?, promise: Promise) {
        if (!token.isNullOrBlank()) {
            PanicPrefs.setDeviceToken(reactApplicationContext, token)
        }
        promise.resolve(true)
    }

    // ─── Launch payload (killed-state cold start) ───────────────────────────────

    @ReactMethod
    fun getInitialPanicData(promise: Promise) {
        if (!PanicAlarmEngine.hasPendingPayload()) {
            promise.resolve(null)
            return
        }
        val (complexId, triggeredBy, triggeredByLabel) = PanicAlarmEngine.takePendingPayload()
        val map: WritableMap = Arguments.createMap().apply {
            putString("complexId", complexId)
            putString("triggeredBy", triggeredBy)
            putString("triggeredByLabel", triggeredByLabel)
        }
        promise.resolve(map)
    }

    // ─── Battery optimization exemption ──────────────────────────────────────

    @ReactMethod
    fun isIgnoringBatteryOptimizations(promise: Promise) {
        try {
            val pm = reactApplicationContext.getSystemService(Context.POWER_SERVICE) as PowerManager
            promise.resolve(pm.isIgnoringBatteryOptimizations(reactApplicationContext.packageName))
        } catch (e: Exception) {
            Log.w(TAG, "isIgnoringBatteryOptimizations error: ${e.message}")
            promise.resolve(true)
        }
    }

    @ReactMethod
    fun requestIgnoreBatteryOptimizations(promise: Promise) {
        try {
            val pm = reactApplicationContext.getSystemService(Context.POWER_SERVICE) as PowerManager
            val pkg = reactApplicationContext.packageName
            if (pm.isIgnoringBatteryOptimizations(pkg)) {
                promise.resolve(true)
                return
            }
            val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS)
                .setData(Uri.parse("package:$pkg"))
            launchIntent(intent)
            promise.resolve(false)
        } catch (e: Exception) {
            Log.w(TAG, "requestIgnoreBatteryOptimizations error: ${e.message}")
            openBatterySettingsFallback()
            promise.resolve(false)
        }
    }

    private fun openBatterySettingsFallback() {
        try {
            val intent = Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)
            launchIntent(intent)
        } catch (e: Exception) {
            Log.w(TAG, "battery settings fallback error: ${e.message}")
        }
    }

    // ─── Panic delivery preconditions (readable permission state) ─────────────
    // Everything a panic alert needs in order to actually reach the user, in the
    // one form Android lets us read back. Anything not listed here (autostart,
    // OEM background pop-ups) has no query API at all — see the section below.

    private val notificationManager by lazy {
        reactApplicationContext.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
    }

    /** Device brand, used to decide which onboarding steps apply. Kept native so
     *  the app doesn't need react-native-device-info just for one string. */
    @ReactMethod
    fun getManufacturer(promise: Promise) {
        promise.resolve(Build.MANUFACTURER ?: "")
    }

    /** Modelo comercial del equipo. Junto con la marca es lo que permite medir la
     *  tasa de entrega por dispositivo y ver si los fallos se concentran en
     *  ciertas ROMs o son transversales. */
    @ReactMethod
    fun getDeviceModel(promise: Promise) {
        promise.resolve(Build.MODEL ?: "")
    }

    /** False when the user denied POST_NOTIFICATIONS or muted the app entirely —
     *  in that state nothing below matters, no panic alert is ever displayed. */
    @ReactMethod
    fun areNotificationsEnabled(promise: Promise) {
        try {
            promise.resolve(notificationManager?.areNotificationsEnabled() ?: true)
        } catch (e: Exception) {
            Log.w(TAG, "areNotificationsEnabled error: ${e.message}")
            promise.resolve(true)
        }
    }

    /**
     * Android 14+ turned USE_FULL_SCREEN_INTENT into a special app access that is
     * auto-granted only to calling/alarm apps; everyone else has to be sent to a
     * settings screen. When it is denied Android does NOT fail the notification —
     * it quietly downgrades the full-screen takeover to an ordinary heads-up, so
     * the alert stops waking a locked screen with no error anywhere. This is the
     * only way to detect that degradation and tell the user about it.
     */
    @ReactMethod
    fun canUseFullScreenIntent(promise: Promise) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            promise.resolve(true) // Granted at install time below API 34.
            return
        }
        try {
            promise.resolve(notificationManager?.canUseFullScreenIntent() ?: false)
        } catch (e: Exception) {
            Log.w(TAG, "canUseFullScreenIntent error: ${e.message}")
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun openFullScreenIntentSettings(promise: Promise) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            promise.resolve(false) // No such screen before API 34.
            return
        }
        try {
            val intent = Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT)
                .setData(Uri.parse("package:${reactApplicationContext.packageName}"))
            launchIntent(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            Log.w(TAG, "openFullScreenIntentSettings error: ${e.message}")
            openAppDetailsFallback()
            promise.resolve(false)
        }
    }

    /** Gates whether the panic channel's bypassDnd flag has any effect: without
     *  policy access Android silently ignores it and the alarm stays muted while
     *  the guard has Do Not Disturb on — the exact shift when it matters most. */
    @ReactMethod
    fun isNotificationPolicyAccessGranted(promise: Promise) {
        try {
            promise.resolve(notificationManager?.isNotificationPolicyAccessGranted ?: false)
        } catch (e: Exception) {
            Log.w(TAG, "isNotificationPolicyAccessGranted error: ${e.message}")
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun openNotificationPolicySettings(promise: Promise) {
        try {
            // Device-wide list, not per-app: there is no way to deep link straight
            // to this app's row, so the UI has to name the app for the user.
            launchIntent(Intent(Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS))
            promise.resolve(true)
        } catch (e: Exception) {
            Log.w(TAG, "openNotificationPolicySettings error: ${e.message}")
            openAppDetailsFallback()
            promise.resolve(false)
        }
    }

    private fun openAppDetailsFallback() {
        try {
            val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
                .setData(Uri.parse("package:${reactApplicationContext.packageName}"))
            launchIntent(intent)
        } catch (e: Exception) {
            Log.w(TAG, "openAppDetailsFallback error: ${e.message}")
        }
    }

    // ─── Autostart settings (OEM background-launch whitelist) ─────────────────
    // Standard Android has no public "autostart" API — MIUI, ColorOS, FuntouchOS,
    // EMUI/Magic UI and a few others each gate whether a killed app's broadcast
    // receivers (FCM's c2dm.intent.RECEIVE included) get to run at all behind a
    // manufacturer-specific settings screen. Without it enabled here, panic and
    // regular push notifications are silently dropped whenever the app is killed
    // — the OS never lets the app wake up to handle them. No public API exists to
    // read current state, so callers can't tell if it's already granted; only that
    // a screen was found and opened (or the generic app-details page as fallback).

    /** OEM package/activity pairs known to gate background launch. Empty on
     *  manufacturers (Samsung, Pixel, generic AOSP…) with no such screen — callers
     *  use that to skip nagging users a step that doesn't apply to their device. */
    private fun autostartCandidates(): List<Pair<String, String>> {
        val manufacturer = Build.MANUFACTURER.lowercase()
        return when {
            manufacturer.contains("xiaomi") -> listOf(
                "com.miui.securitycenter" to "com.miui.permcenter.autostart.AutoStartManagementActivity",
            )
            manufacturer.contains("huawei") || manufacturer.contains("honor") -> listOf(
                "com.huawei.systemmanager" to "com.huawei.systemmanager.startupmgr.ui.StartupNormalAppListActivity",
                "com.huawei.systemmanager" to "com.huawei.systemmanager.optimize.process.ProtectActivity",
            )
            manufacturer.contains("oppo") -> listOf(
                "com.coloros.safecenter" to "com.coloros.safecenter.permission.startup.StartupAppListActivity",
                "com.oppo.safe" to "com.oppo.safe.permission.startup.StartupAppListActivity",
            )
            manufacturer.contains("vivo") -> listOf(
                "com.vivo.permissionmanager" to "com.vivo.permissionmanager.activity.BgStartUpManagerActivity",
            )
            manufacturer.contains("letv") -> listOf(
                "com.letv.android.letvsafe" to "com.letv.android.letvsafe.AutobootManageActivity",
            )
            manufacturer.contains("asus") -> listOf(
                "com.asus.mobilemanager" to "com.asus.mobilemanager.autostart.AutoStartActivity",
            )
            else -> emptyList()
        }
    }

    /** True when this device's manufacturer has a known autostart-gating screen —
     *  used to decide whether the onboarding nudge is worth showing at all. */
    @ReactMethod
    fun isAutostartRelevant(promise: Promise) {
        promise.resolve(autostartCandidates().isNotEmpty())
    }

    @ReactMethod
    fun openAutostartSettings(promise: Promise) {
        // Intent.resolveActivity() is a no-op once a component is set explicitly —
        // it hands the component straight back without checking it exists, so it
        // can't tell candidates apart. Verify via getActivityInfo() instead, which
        // throws NameNotFoundException when the target ROM doesn't ship that screen.
        for ((pkg, cls) in autostartCandidates()) {
            try {
                val component = android.content.ComponentName(pkg, cls)
                reactApplicationContext.packageManager.getActivityInfo(component, 0)
                val intent = Intent().apply {
                    this.component = component
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                launchIntent(intent)
                promise.resolve(true)
                return
            } catch (e: Exception) {
                Log.w(TAG, "openAutostartSettings candidate failed: $pkg/$cls — ${e.message}")
            }
        }

        // No OEM-specific screen found (or getActivityInfo rejected every
        // candidate) — send the user to the app's own details page to dig manually.
        openAppDetailsFallback()
        promise.resolve(false)
    }

    private fun launchIntent(intent: Intent) {
        val activity = reactApplicationContext.currentActivity
        if (activity != null) {
            activity.startActivity(intent)
        } else {
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
        }
    }

    @ReactMethod fun addListener(eventName: String) {}
    @ReactMethod fun removeListeners(count: Int) {}
}
