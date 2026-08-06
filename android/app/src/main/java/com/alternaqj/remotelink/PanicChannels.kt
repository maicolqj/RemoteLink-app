package com.alternaqj.remotelink

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.graphics.Color
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.os.Build
import android.util.Log

private const val TAG = "PanicChannels"

/**
 * Owns the panic notification channel.
 *
 * Created natively from [MainApplication.onCreate] rather than from JS for two
 * reasons:
 *
 *  1. The channel must exist before the JS bundle loads. A panic FCM can arrive
 *     while the app is killed, and Android resolves the channel the instant the
 *     notification is posted — if JS hasn't run yet, the notification falls back
 *     to a generic channel and loses its importance and sound.
 *
 *  2. Notifee's `createChannel` has no way to set the channel's AudioAttributes
 *     usage (`soundURI` is read-only in its API). Without USAGE_ALARM the sound
 *     rides the notification stream, so it goes mute whenever the user has media
 *     or ring volume at 0 — exactly the case a panic alert has to survive.
 */
object PanicChannels {

    /**
     * Channels are immutable once created: changing sound/vibration/bypassDnd on
     * an existing id is silently ignored by Android. Bump this suffix whenever the
     * configuration below changes, and add the old id to [LEGACY_CHANNEL_IDS] so
     * the stale one disappears from the user's settings screen.
     */
    const val PANIC_CHANNEL_ID = "panic_v1"

    private val LEGACY_CHANNEL_IDS = listOf("panic")

    fun ensure(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return

        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
            ?: return

        // Drop superseded versions first so the user doesn't end up with two
        // "Alarma de Pánico" toggles, one of which does nothing.
        for (id in LEGACY_CHANNEL_IDS) {
            try {
                manager.deleteNotificationChannel(id)
            } catch (e: Exception) {
                Log.w(TAG, "deleteNotificationChannel($id) failed: ${e.message}")
            }
        }

        if (manager.getNotificationChannel(PANIC_CHANNEL_ID) != null) return

        val alarmAttrs = AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_ALARM)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build()

        // No bundled siren asset yet — the device's own alarm tone is already
        // loud, familiar and guaranteed to exist. The looping siren proper is
        // generated in-process by PanicSoundModule; this is the OS-side backstop
        // for the moment the notification is posted.
        val sound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
            ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)

        val channel = NotificationChannel(
            PANIC_CHANNEL_ID,
            "Alarma de Pánico",
            NotificationManager.IMPORTANCE_HIGH,
        ).apply {
            description = "Alertas de emergencia — pánico activado en el conjunto"
            setSound(sound, alarmAttrs)
            enableVibration(true)
            vibrationPattern = longArrayOf(0, 500, 300, 500, 300, 500)
            lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
            enableLights(true)
            lightColor = Color.RED
            setShowBadge(true)
            // Only takes effect once the user grants Notification Policy Access;
            // until then Android ignores it instead of failing, so it is safe to
            // request unconditionally. PanicSoundModule.openNotificationPolicySettings
            // is what actually sends the user to grant it.
            try {
                setBypassDnd(true)
            } catch (e: SecurityException) {
                Log.w(TAG, "setBypassDnd denied: ${e.message}")
            }
        }

        try {
            manager.createNotificationChannel(channel)
        } catch (e: Exception) {
            Log.e(TAG, "createNotificationChannel failed: ${e.message}", e)
        }
    }
}
