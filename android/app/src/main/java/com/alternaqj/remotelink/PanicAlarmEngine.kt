package com.alternaqj.remotelink

import android.app.NotificationManager
import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioFormat
import android.media.AudioManager
import android.media.AudioTrack
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.Log
import java.util.concurrent.atomic.AtomicBoolean
import kotlin.math.PI
import kotlin.math.min
import kotlin.math.sin

private const val TAG = "PanicAlarmEngine"

/**
 * Motor de alarma de pánico, a nivel de proceso: tono USAGE_ALARM en bucle +
 * vibración.
 *
 * Extraído de [PanicSoundModule] para que deje de depender de un contexto de
 * React. Las dos rutas de entrega tienen que mover el MISMO motor: la nativa
 * ([PanicAlertReceiver], que corre antes de que React exista) y la de JS (modal
 * en foreground, socket). Dos motores serían dos sirenas desfasadas en el mismo
 * teléfono.
 *
 * [active] es el árbitro: la primera ruta que llega arranca el sonido y toda
 * llamada posterior es un no-op hasta [stop]. Eso es lo que hace seguro que
 * ambas reaccionen al mismo pánico.
 *
 * Sin servicio en primer plano a propósito: las ROMs agresivas (MIUI/HyperOS)
 * bloquean el arranque de FGS y tumban la app con
 * ForegroundServiceDidNotStartInTimeException. El audio USAGE_ALARM sí puede
 * sonar desde segundo plano sin servicio, así que no hace falta ninguno.
 */
object PanicAlarmEngine {

    /**
     * Cuánto suena la alarma como máximo si nadie la atiende.
     *
     * Sin esto la sirena no tiene quien la apague: cuando el pánico llega con la
     * app cerrada quien arranca el motor es un receptor nativo o el handler
     * headless de FCM, y esos contextos se destruyen en cuanto terminan —
     * cualquier temporizador de JS se va con ellos. El único que sobrevive es
     * este.
     *
     * Mismo valor que EntryLink, para que residente y portería dejen de sonar a
     * la vez y nadie interprete el silencio de un lado como "ya lo atendieron".
     */
    private const val AUTO_STOP_MS = 3 * 60 * 1000L

    private const val SAMPLE_RATE = 44100

    private val active = AtomicBoolean(false)

    private var audioTrack: AudioTrack? = null
    private var playThread: Thread? = null
    private var focusRequest: AudioFocusRequest? = null
    private var savedAlarmVolume = -1

    // Payload del pánico que llegó con la app cerrada, leído una sola vez por JS
    // al arrancar (recuperación en frío).
    @Volatile private var pendingComplexId: String? = null
    @Volatile private var pendingTriggeredBy: String? = null
    @Volatile private var pendingTriggeredByLabel: String? = null
    @Volatile private var hasPending = false

    private val autoStopHandler = Handler(Looper.getMainLooper())
    private var autoStopRunnable: Runnable? = null

    private val alarmAttrs: AudioAttributes = AudioAttributes.Builder()
        .setUsage(AudioAttributes.USAGE_ALARM)
        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
        .build()

    fun isActive(): Boolean = active.get()

    // ─── Payload de arranque en frío ────────────────────────────────────────────

    fun stashPayload(complexId: String?, triggeredBy: String?, triggeredByLabel: String?) {
        pendingComplexId = complexId
        pendingTriggeredBy = triggeredBy
        pendingTriggeredByLabel = triggeredByLabel
        hasPending = complexId != null || triggeredBy != null
    }

    fun hasPendingPayload(): Boolean = hasPending

    /** Devuelve y limpia el payload guardado (un solo uso). */
    fun takePendingPayload(): Triple<String?, String?, String?> {
        val data = Triple(pendingComplexId, pendingTriggeredBy, pendingTriggeredByLabel)
        pendingComplexId = null
        pendingTriggeredBy = null
        pendingTriggeredByLabel = null
        hasPending = false
        return data
    }

    // ─── Control de la alarma ───────────────────────────────────────────────────

    fun start(context: Context) {
        val appContext = context.applicationContext

        // Antes del early-return: una segunda alerta que llega con la sirena ya
        // sonando debe reiniciar la cuenta, no heredar lo que le quedaba a la
        // primera. Es idempotente, así que reprogramar de más no hace daño.
        scheduleAutoStop(appContext)
        if (!active.compareAndSet(false, true)) return

        val audioManager = appContext.getSystemService(Context.AUDIO_SERVICE) as? AudioManager
        if (audioManager == null) {
            Log.e(TAG, "Sin AudioManager — la alarma no puede sonar")
            active.set(false)
            cancelAutoStop()
            return
        }

        forceAlarmVolume(audioManager)
        requestFocus(audioManager)
        startVibration(appContext)

        val minBuf = AudioTrack.getMinBufferSize(
            SAMPLE_RATE, AudioFormat.CHANNEL_OUT_MONO, AudioFormat.ENCODING_PCM_16BIT,
        ).coerceAtLeast(4096)

        val track = try {
            AudioTrack.Builder()
                .setAudioAttributes(alarmAttrs)
                .setAudioFormat(
                    AudioFormat.Builder()
                        .setSampleRate(SAMPLE_RATE)
                        .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                        .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                        .build(),
                )
                .setBufferSizeInBytes(minBuf)
                .setTransferMode(AudioTrack.MODE_STREAM)
                .build()
        } catch (e: Exception) {
            Log.e(TAG, "No se pudo construir el AudioTrack: ${e.message}", e)
            null
        }

        if (track == null || track.state != AudioTrack.STATE_INITIALIZED) {
            Log.e(TAG, "AudioTrack sin inicializar: la alarma queda muda")
            try { track?.release() } catch (_: Exception) {}
            active.set(false)
            stopVibration(appContext)
            restoreAlarmVolume(audioManager)
            abandonFocus(audioManager)
            // Nunca llegó a sonar: el auto-apagado no tiene nada que apagar y
            // borraría la notificación, que en este equipo es lo único que queda
            // de la alerta.
            cancelAutoStop()
            return
        }

        track.setVolume(AudioTrack.getMaxVolume())
        audioTrack = track
        track.play()

        playThread = Thread {
            try {
                // Patrón WEA / alerta sísmica: tres ráfagas de dos tonos (853+960 Hz)
                while (active.get()) {
                    writeTone(track, 853.0, 960.0, 220)
                    writeSilence(track, 90)
                    writeTone(track, 853.0, 960.0, 220)
                    writeSilence(track, 90)
                    writeTone(track, 853.0, 960.0, 400)
                    writeSilence(track, 750)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error de audio", e)
            } finally {
                try { track.stop() } catch (_: Exception) {}
                track.release()
                audioTrack = null
            }
        }.also { it.start() }
    }

    fun stop(context: Context) {
        val appContext = context.applicationContext

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

        stopVibration(appContext)
        val audioManager = appContext.getSystemService(Context.AUDIO_SERVICE) as? AudioManager
        audioManager?.let {
            restoreAlarmVolume(it)
            abandonFocus(it)
        }
    }

    // ─── Auto-apagado ───────────────────────────────────────────────────────────

    private fun scheduleAutoStop(appContext: Context) {
        cancelAutoStop()
        val task = Runnable {
            Log.w(TAG, "Auto-stop: nadie atendió la alerta en ${AUTO_STOP_MS / 1000}s")
            // Fuera del hilo principal: apagar espera hasta 600 ms a que el hilo
            // de audio cierre, y bloquear la UI ese rato es justo lo que el
            // usuario percibe como que la app se colgó.
            Thread {
                stop(appContext)
                clearPanicNotifications(appContext)
            }.start()
        }
        autoStopRunnable = task
        autoStopHandler.postDelayed(task, AUTO_STOP_MS)
    }

    private fun cancelAutoStop() {
        autoStopRunnable?.let { autoStopHandler.removeCallbacks(it) }
        autoStopRunnable = null
    }

    /**
     * Retira la notificación de pánico de la bandeja.
     *
     * Contraparte obligatoria de su `ongoing`: esa bandera hace que el usuario no
     * pueda descartarla ni con "Borrar todo", así que si la app no la quita queda
     * clavada para siempre. Al vencer el auto-apagado ya no queda emergencia que
     * anunciar, y el registro del incidente no se pierde: vive en el backend y se
     * ve en el buzón de notificaciones de la app.
     *
     * Barre por canal y no por id porque hay dos emisores posibles —esta ruta
     * nativa y Notifee en iOS/foreground— y solo el canal es común a ambos. El
     * canal es exclusivo del pánico, así que no se lleva por delante nada más.
     */
    fun clearPanicNotifications(context: Context) {
        // API 26 por `channelId`, no 23 por `activeNotifications`: en Android 7 el
        // getter no existe y la llamada revienta con NoSuchMethodError. Tampoco hay
        // nada que barrer — los canales nacen en Oreo, así que PanicChannels no
        // crea ninguno por debajo.
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val manager = context.applicationContext
            .getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: return
        try {
            manager.activeNotifications
                .filter { it.notification?.channelId == PanicChannels.PANIC_CHANNEL_ID }
                .forEach { manager.cancel(it.tag, it.id) }
        } catch (e: Exception) {
            Log.w(TAG, "clearPanicNotifications error: ${e.message}")
        }
    }

    // ─── Vibración ──────────────────────────────────────────────────────────────

    private fun vibratorOf(context: Context): Vibrator? =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            (context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager)?.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
        }

    private fun startVibration(context: Context) {
        val pattern = longArrayOf(0, 500, 200, 500) // sincronizado con las ráfagas
        try {
            val v = vibratorOf(context) ?: return
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                v.vibrate(VibrationEffect.createWaveform(pattern, 0))
            } else {
                @Suppress("DEPRECATION")
                v.vibrate(pattern, 0)
            }
        } catch (e: Exception) {
            Log.w(TAG, "vibrate error: ${e.message}")
        }
    }

    private fun stopVibration(context: Context) {
        try { vibratorOf(context)?.cancel() } catch (_: Exception) {}
    }

    // ─── Foco de audio / volumen ───────────────────────────────────────────────

    private fun forceAlarmVolume(am: AudioManager) {
        try {
            val max = am.getStreamMaxVolume(AudioManager.STREAM_ALARM)
            savedAlarmVolume = am.getStreamVolume(AudioManager.STREAM_ALARM)
            if (savedAlarmVolume < max) am.setStreamVolume(AudioManager.STREAM_ALARM, max, 0)
        } catch (e: Exception) {
            // Subir el stream de alarma exige acceso a la política de DND en
            // algunas ROMs. No es fatal: suena al volumen que haya.
            Log.w(TAG, "Volume error: ${e.message}")
            savedAlarmVolume = -1
        }
    }

    private fun restoreAlarmVolume(am: AudioManager) {
        if (savedAlarmVolume < 0) return
        try {
            am.setStreamVolume(AudioManager.STREAM_ALARM, savedAlarmVolume, 0)
        } catch (_: Exception) {
        } finally {
            savedAlarmVolume = -1
        }
    }

    private fun requestFocus(am: AudioManager) {
        try {
            val req = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_EXCLUSIVE)
                .setAudioAttributes(alarmAttrs)
                .setAcceptsDelayedFocusGain(false)
                .build()
            focusRequest = req
            am.requestAudioFocus(req)
        } catch (e: Exception) {
            Log.w(TAG, "requestAudioFocus error: ${e.message}")
        }
    }

    private fun abandonFocus(am: AudioManager) {
        try {
            focusRequest?.let { am.abandonAudioFocusRequest(it) }
        } catch (_: Exception) {
        } finally {
            focusRequest = null
        }
    }

    // ─── Síntesis de tono PCM ──────────────────────────────────────────────────

    private fun writeTone(track: AudioTrack, freq1: Double, freq2: Double, durationMs: Int) {
        val totalSamples = SAMPLE_RATE * durationMs / 1000
        val chunk = ShortArray(512)
        val fadeSamples = min(200, totalSamples / 4)
        var written = 0
        while (written < totalSamples && active.get()) {
            val toWrite = min(chunk.size, totalSamples - written)
            for (i in 0 until toWrite) {
                val idx = written + i
                val t = idx.toDouble() / SAMPLE_RATE
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
        val totalSamples = SAMPLE_RATE * durationMs / 1000
        val chunk = ShortArray(512)
        var written = 0
        while (written < totalSamples && active.get()) {
            val toWrite = min(chunk.size, totalSamples - written)
            track.write(chunk, 0, toWrite)
            written += toWrite
        }
    }
}
