package com.alternaqj.remotelink

import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioFormat
import android.media.AudioManager
import android.media.AudioTrack
import android.net.Uri
import android.os.Build
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
    }

    private val sampleRate = 44100
    private val active = AtomicBoolean(false)
    private var audioTrack: AudioTrack? = null
    private var playThread: Thread? = null
    private var focusRequest: AudioFocusRequest? = null
    private var savedAlarmVolume = -1

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
