package com.alternaqj.remotelink.intercom

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.alternaqj.remotelink.MainActivity
import com.alternaqj.remotelink.R

private const val TAG = "IntercomCallNotif"

/**
 * Notificación nativa de la llamada de citofonía: suena como una llamada
 * (tono de llamada, en bucle) y se abre a pantalla completa con el equipo
 * bloqueado. "Contestar" y "Rechazar" abren la app con la acción elegida, que
 * JS aplica al cargar la llamada (ver IntercomLaunch).
 */
object IntercomCallNotifications {

    /** Los canales no se pueden cambiar después de creados: subir el sufijo si cambia algo. */
    const val CHANNEL_ID = "intercom_calls_native_v1"

    const val EXTRA_CALL_ID = "intercomCallId"
    const val EXTRA_ACTION = "intercomAction"
    const val ACTION_OPEN = "open"
    const val ACTION_ANSWER = "answer"
    const val ACTION_DECLINE = "decline"

    private const val DEFAULT_RING_MS = 30_000L

    fun notificationId(callId: String): Int = "intercom-$callId".hashCode()

    fun ensureChannel(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: return
        if (manager.getNotificationChannel(CHANNEL_ID) != null) return

        val attrs = AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build()
        val sound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
            ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)

        val channel = NotificationChannel(
            CHANNEL_ID,
            "Llamadas de citofonía",
            NotificationManager.IMPORTANCE_HIGH,
        ).apply {
            description = "Llamadas por la app entre portería y residentes"
            setSound(sound, attrs)
            enableVibration(true)
            vibrationPattern = longArrayOf(0, 800, 600, 800, 600, 800)
            lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            setShowBadge(false)
        }
        try {
            manager.createNotificationChannel(channel)
        } catch (e: Exception) {
            Log.e(TAG, "createNotificationChannel falló: ${e.message}", e)
        }
    }

    fun showIncoming(context: Context, data: Map<String, String>) {
        val callId = data["callId"] ?: return
        ensureChannel(context)

        val caller = data["callerName"]?.takeIf { it.isNotBlank() } ?: "Portería"
        val body = data["unitLabel"]?.takeIf { it.isNotBlank() }?.let { "$it · Llamada por la app" }
            ?: "Te llama portería por la app"

        val ringMs = data["expiresAt"]
            ?.let { parseIsoMillis(it) }
            ?.let { (it - System.currentTimeMillis()).coerceAtLeast(1_000L) }
            ?: DEFAULT_RING_MS

        val open = launchIntent(context, callId, ACTION_OPEN, 0)
        val answer = launchIntent(context, callId, ACTION_ANSWER, 1)
        val decline = launchIntent(context, callId, ACTION_DECLINE, 2)

        val builder = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(caller)
            .setContentText(body)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOngoing(true)
            .setAutoCancel(false)
            .setTimeoutAfter(ringMs)
            .setContentIntent(open)
            .addAction(0, "Rechazar", decline)
            .addAction(0, "Contestar", answer)

        // Sin el permiso (Android 14+) la notificación baja a aviso flotante.
        if (canUseFullScreenIntent(context)) {
            builder.setFullScreenIntent(open, true)
        } else {
            Log.w(TAG, "Sin USE_FULL_SCREEN_INTENT — la llamada se muestra como aviso flotante")
        }

        val notification = builder.build().apply {
            // Que el tono se repita hasta contestar o vencer, como una llamada.
            flags = flags or Notification.FLAG_INSISTENT
        }

        try {
            NotificationManagerCompat.from(context).notify(notificationId(callId), notification)
        } catch (e: SecurityException) {
            Log.w(TAG, "Sin permiso de notificaciones: ${e.message}")
        }
    }

    /** "2026-11-10T15:00:40.000Z" (toISOString del backend). java.time pide API 26. */
    private fun parseIsoMillis(value: String): Long? = try {
        java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", java.util.Locale.US)
            .apply { timeZone = java.util.TimeZone.getTimeZone("UTC") }
            .parse(value)?.time
    } catch (e: Exception) {
        null
    }

    fun cancel(context: Context, callId: String) {
        try {
            NotificationManagerCompat.from(context).cancel(notificationId(callId))
        } catch (e: Exception) {
            Log.w(TAG, "cancel falló: ${e.message}")
        }
    }

    private fun canUseFullScreenIntent(context: Context): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE) return true
        return try {
            (context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager)
                ?.canUseFullScreenIntent() ?: false
        } catch (e: Exception) {
            false
        }
    }

    private fun launchIntent(context: Context, callId: String, action: String, slot: Int): PendingIntent {
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra(EXTRA_CALL_ID, callId)
            putExtra(EXTRA_ACTION, action)
        }
        // Un requestCode por acción y llamada: si no, Android reutiliza el
        // PendingIntent y todos los botones harían lo mismo.
        return PendingIntent.getActivity(
            context,
            notificationId(callId) * 4 + slot,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
    }
}
