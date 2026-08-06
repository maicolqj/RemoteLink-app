package com.alternaqj.remotelink

import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioFormat
import android.media.AudioManager
import android.media.AudioTrack
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.PowerManager
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.provider.Settings
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import java.util.concurrent.atomic.AtomicBoolean
import kotlin.math.PI
import kotlin.math.min
import kotlin.math.sin

private const val TAG = "PanicSound"

/**
 * In-process alarm engine: looping AudioTrack tone (USAGE_ALARM) + vibration.
 * Plays from foreground (modal) and from the FCM headless handler alike — no
 * foreground service, because aggressive OEMs (MIUI/HyperOS) block FGS starts and
 * crash the app with ForegroundServiceDidNotStartInTimeException. USAGE_ALARM audio
 * is allowed to play from the background, so a service isn't required to make noise.
 */
class PanicSoundModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "PanicSound"

    companion object {
        // Panic payload from the killed-state FCM, read once by JS on app start.
        @Volatile private var pendingComplexId: String? = null
        @Volatile private var pendingTriggeredBy: String? = null
        @Volatile private var pendingTriggeredByLabel: String? = null
        @Volatile private var hasPending = false

        /**
         * Cuánto suena la alarma como máximo si nadie la atiende.
         *
         * Sin esto la sirena no tiene quien la apague: cuando el pánico llega con
         * la app cerrada, quien arranca el motor es el handler headless de FCM, y
         * ese contexto JS se destruye en cuanto termina — cualquier temporizador
         * de JS se va con él. El único que sobrevive es este, del lado nativo.
         *
         * Mismo valor que EntryLink, para que residente y portería dejen de sonar
         * a la vez y nadie interprete el silencio de un lado como "ya lo atendieron".
         */
        private const val AUTO_STOP_MS = 3 * 60 * 1000L
    }

    private val sampleRate = 44100
    private val active = AtomicBoolean(false)
    private var audioTrack: AudioTrack? = null
    private var playThread: Thread? = null
    private var focusRequest: AudioFocusRequest? = null
    private var savedAlarmVolume = -1

    private val autoStopHandler = Handler(Looper.getMainLooper())
    private val autoStopRunnable = Runnable {
        Log.w(TAG, "Auto-stop: nadie atendió la alerta en ${AUTO_STOP_MS / 1000}s")
        // Fuera del hilo principal: apagar espera hasta 600 ms a que el hilo de
        // audio cierre, y bloquear la UI ese rato es justo lo que el usuario
        // percibe como que la app se colgó.
        Thread {
            stopAlarm()
            clearPanicNotifications()
        }.start()
    }

    private val audioManager by lazy {
        reactApplicationContext.getSystemService(Context.AUDIO_SERVICE) as AudioManager
    }

    private val vibrator: Vibrator? by lazy {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            (reactApplicationContext.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager)?.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            reactApplicationContext.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
        }
    }

    private val alarmAttrs = AudioAttributes.Builder()
        .setUsage(AudioAttributes.USAGE_ALARM)
        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
        .build()

    // ─── Alarm control ──────────────────────────────────────────────────────────

    /** Start the alarm (in-app / socket-triggered). */
    @ReactMethod
    fun start() = startAlarm()

    /** Start the alarm carrying FCM panic payload (background / killed delivery). */
    @ReactMethod
    fun startAlarmService(data: ReadableMap?) {
        if (data != null) {
            fun str(key: String) = if (data.hasKey(key) && !data.isNull(key)) data.getString(key) else null
            pendingComplexId        = str("complexId")
            pendingTriggeredBy      = str("triggeredBy")
            pendingTriggeredByLabel = str("triggeredByLabel")
            hasPending = pendingComplexId != null || pendingTriggeredBy != null
        }
        startAlarm()
    }

    @ReactMethod
    fun stop() = stopAlarm()

    /** Alias kept for the modal handoff; same in-process engine. */
    @ReactMethod
    fun stopAlarmService() = stopAlarm()

    private fun startAlarm() {
        // Antes del early-return: una segunda alerta que llega con la sirena ya
        // sonando debe reiniciar la cuenta, no heredar lo que le quedaba a la
        // primera. Es idempotente, así que reprogramar de más no hace daño.
        scheduleAutoStop()
        if (!active.compareAndSet(false, true)) return
        forceAlarmVolume()
        requestFocus()
        startVibration()

        val minBuf = AudioTrack.getMinBufferSize(
            sampleRate, AudioFormat.CHANNEL_OUT_MONO, AudioFormat.ENCODING_PCM_16BIT,
        ).coerceAtLeast(4096)

        val track = AudioTrack.Builder()
            .setAudioAttributes(alarmAttrs)
            .setAudioFormat(
                AudioFormat.Builder()
                    .setSampleRate(sampleRate)
                    .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                    .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                    .build(),
            )
            .setBufferSizeInBytes(minBuf)
            .setTransferMode(AudioTrack.MODE_STREAM)
            .build()

        if (track.state != AudioTrack.STATE_INITIALIZED) {
            Log.e(TAG, "AudioTrack not initialized: state=${track.state}")
            track.release()
            active.set(false)
            stopVibration()
            restoreAlarmVolume()
            abandonFocus()
            // Nunca llegó a sonar: el auto-stop no tiene nada que apagar y borraría
            // la notificación, que en este equipo es lo único que queda de la alerta.
            cancelAutoStop()
            return
        }

        track.setVolume(AudioTrack.getMaxVolume())
        audioTrack = track
        track.play()

        playThread = Thread {
            try {
                // WEA / earthquake-alert pattern: three two-tone bursts (853+960 Hz)
                while (active.get()) {
                    writeTone(track, 853.0, 960.0, 220)
                    writeSilence(track, 90)
                    writeTone(track, 853.0, 960.0, 220)
                    writeSilence(track, 90)
                    writeTone(track, 853.0, 960.0, 400)
                    writeSilence(track, 750)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Audio error", e)
            } finally {
                try { track.stop() } catch (_: Exception) {}
                track.release()
                audioTrack = null
            }
        }.also { it.start() }
    }

    private fun stopAlarm() {
        // Fuera del early-return: si la alarma ya está apagada pero quedó un
        // temporizador vivo (arranque fallido, doble stop), dejarlo correr haría
        // que borre la notificación de una alerta posterior.
        cancelAutoStop()
        if (!active.compareAndSet(true, false)) return
        try { audioTrack?.pause() } catch (_: Exception) {}
        try { audioTrack?.flush() } catch (_: Exception) {}
        playThread?.join(600)
        try { audioTrack?.release() } catch (_: Exception) {}
        audioTrack = null
        playThread = null
        stopVibration()
        restoreAlarmVolume()
        abandonFocus()
    }

    // ─── Auto-apagado ───────────────────────────────────────────────────────────

    private fun scheduleAutoStop() {
        autoStopHandler.removeCallbacks(autoStopRunnable)
        autoStopHandler.postDelayed(autoStopRunnable, AUTO_STOP_MS)
    }

    private fun cancelAutoStop() {
        autoStopHandler.removeCallbacks(autoStopRunnable)
    }

    /**
     * Retira la notificación de pánico de la bandeja.
     *
     * Contraparte obligatoria de su `ongoing: true`: esa bandera hace que el
     * usuario no pueda descartarla ni con "Borrar todo", así que si la app no la
     * quita queda clavada para siempre. Al vencer el auto-apagado ya no queda
     * emergencia que anunciar, y el registro del incidente no se pierde: vive en
     * el backend y se ve en el buzón de notificaciones de la app.
     *
     * Barre por canal en vez de por id porque el id lo arma Notifee desde el
     * payload FCM, que este lado no conoce. El canal es exclusivo del pánico, así
     * que no hay riesgo de llevarse por delante otra notificación.
     */
    private fun clearPanicNotifications() {
        // API 26 por `channelId`, no 23 por `activeNotifications`: en Android 7 el
        // getter no existe y la llamada revienta con NoSuchMethodError. Tampoco hay
        // nada que barrer — los canales nacen en Oreo, así que PanicChannels no
        // crea ninguno por debajo.
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val manager = notificationManager ?: return
        try {
            manager.activeNotifications
                .filter { it.notification?.channelId == PanicChannels.PANIC_CHANNEL_ID }
                .forEach { manager.cancel(it.tag, it.id) }
        } catch (e: Exception) {
            Log.w(TAG, "clearPanicNotifications error: ${e.message}")
        }
    }

    // ─── Launch payload (killed-state cold start) ───────────────────────────────

    @ReactMethod
    fun getInitialPanicData(promise: Promise) {
        if (!hasPending) {
            promise.resolve(null)
            return
        }
        val map: WritableMap = Arguments.createMap().apply {
            putString("complexId",        pendingComplexId)
            putString("triggeredBy",      pendingTriggeredBy)
            putString("triggeredByLabel", pendingTriggeredByLabel)
        }
        pendingComplexId = null
        pendingTriggeredBy = null
        pendingTriggeredByLabel = null
        hasPending = false
        promise.resolve(map)
    }

    // ─── Vibration ──────────────────────────────────────────────────────────────

    private fun startVibration() {
        val pattern = longArrayOf(0, 500, 200, 500) // synced with tone bursts
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator?.vibrate(VibrationEffect.createWaveform(pattern, 0))
            } else {
                @Suppress("DEPRECATION")
                vibrator?.vibrate(pattern, 0)
            }
        } catch (e: Exception) { Log.w(TAG, "vibrate error: ${e.message}") }
    }

    private fun stopVibration() {
        try { vibrator?.cancel() } catch (_: Exception) {}
    }

    // ─── Audio focus / volume ──────────────────────────────────────────────────

    private fun forceAlarmVolume() {
        try {
            val max = audioManager.getStreamMaxVolume(AudioManager.STREAM_ALARM)
            savedAlarmVolume = audioManager.getStreamVolume(AudioManager.STREAM_ALARM)
            if (savedAlarmVolume < max) audioManager.setStreamVolume(AudioManager.STREAM_ALARM, max, 0)
        } catch (e: Exception) { Log.w(TAG, "Volume error: ${e.message}") }
    }

    private fun restoreAlarmVolume() {
        if (savedAlarmVolume >= 0) {
            try { audioManager.setStreamVolume(AudioManager.STREAM_ALARM, savedAlarmVolume, 0) } catch (_: Exception) {}
            savedAlarmVolume = -1
        }
    }

    private fun requestFocus() {
        val req = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_EXCLUSIVE)
            .setAudioAttributes(alarmAttrs)
            .setAcceptsDelayedFocusGain(false)
            .build()
        focusRequest = req
        audioManager.requestAudioFocus(req)
    }

    private fun abandonFocus() {
        focusRequest?.let { audioManager.abandonAudioFocusRequest(it) }
        focusRequest = null
    }

    // ─── PCM tone generation ───────────────────────────────────────────────────

    private fun writeTone(track: AudioTrack, freq1: Double, freq2: Double, durationMs: Int) {
        val totalSamples = sampleRate * durationMs / 1000
        val chunk = ShortArray(512)
        val fadeSamples = min(200, totalSamples / 4)
        var written = 0
        while (written < totalSamples && active.get()) {
            val toWrite = min(chunk.size, totalSamples - written)
            for (i in 0 until toWrite) {
                val idx = written + i
                val t = idx.toDouble() / sampleRate
                val env = when {
                    idx < fadeSamples -> idx.toDouble() / fadeSamples
                    idx > totalSamples - fadeSamples -> (totalSamples - idx).toDouble() / fadeSamples
                    else -> 1.0
                }
                val sample = (sin(2.0 * PI * freq1 * t) + sin(2.0 * PI * freq2 * t)) * 0.5
                chunk[i] = (sample * 32767.0 * env).toInt().coerceIn(-32768, 32767).toShort()
            }
            track.write(chunk, 0, toWrite)
            written += toWrite
        }
    }

    private fun writeSilence(track: AudioTrack, durationMs: Int) {
        val totalSamples = sampleRate * durationMs / 1000
        val chunk = ShortArray(512)
        var written = 0
        while (written < totalSamples && active.get()) {
            val toWrite = min(chunk.size, totalSamples - written)
            track.write(chunk, 0, toWrite)
            written += toWrite
        }
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
