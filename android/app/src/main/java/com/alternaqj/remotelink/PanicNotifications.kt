package com.alternaqj.remotelink

import android.app.Notification
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat

private const val TAG = "PanicNotifications"

/**
 * Notificación de pánico construida en Kotlin.
 *
 * Existe porque la versión de Notifee solo se puede pintar desde JS, y JS es
 * exactamente lo que no corre cuando la app está cerrada: Android bloquea el
 * arranque del servicio headless de react-native-firebase desde segundo plano
 * ("Background start not allowed"), así que el handler de `index.js` nunca llega
 * a ejecutarse. Esta ruta se pinta desde el propio BroadcastReceiver, que no
 * necesita arrancar ningún servicio.
 *
 * El canal lo sigue creando [PanicChannels] desde `MainApplication.onCreate`: es
 * el único punto que corre antes que cualquier ruta de entrega.
 */
object PanicNotifications {

    /**
     * Id fijo y sin tag: un segundo pánico reemplaza al primero en vez de apilar
     * dos alertas. Coincide con el `collapseKey` por conjunto que ya aplica el
     * backend, así que la bandeja muestra lo mismo que el servidor consideró un
     * solo incidente.
     */
    const val PANIC_NOTIFICATION_ID = 91101

    /**
     * Android 14+ dejó de conceder USE_FULL_SCREEN_INTENT automáticamente salvo a
     * apps de llamadas y alarmas. Cuando está denegado publicar un full-screen
     * intent NO falla: el sistema lo degrada en silencio a un heads-up, así que
     * hay que consultarlo en vez de darlo por hecho.
     */
    fun canUseFullScreenIntent(context: Context): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE) return true
        return try {
            val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
            manager?.canUseFullScreenIntent() ?: false
        } catch (e: Exception) {
            Log.w(TAG, "canUseFullScreenIntent error: ${e.message}")
            false
        }
    }

    /**
     * Publica la alerta. Devuelve false si el sistema la rechazó — típicamente
     * porque falta POST_NOTIFICATIONS, el caso en que la sirena suena pero no hay
     * nada visible que explique por qué.
     */
    fun show(context: Context, data: Map<String, String>): Boolean {
        val appContext = context.applicationContext

        // Defensivo: MainApplication.onCreate ya lo hizo al arrancar el proceso,
        // pero si alguna vez deja de hacerlo, una notificación sin canal cae a uno
        // genérico y pierde prioridad y sonido sin avisar.
        PanicChannels.ensure(appContext)

        val title = data["title"]?.takeIf { it.isNotBlank() } ?: "🚨 ALERTA DE PÁNICO"
        val body = data["body"]?.takeIf { it.isNotBlank() }
            ?: data["triggeredByLabel"]?.takeIf { it.isNotBlank() }?.let { "Activada por $it" }
            ?: "Se ha activado una alerta de pánico en el conjunto."

        val contentIntent = openAppIntent(appContext)

        val builder = NotificationCompat.Builder(appContext, PanicChannels.PANIC_CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setColor(Color.RED)
            .setColorized(true)
            // Una emergencia no se descarta de un manotazo: sobrevive al swipe y
            // a "Borrar todo". La quita la app al atenderla, o el auto-apagado.
            .setOngoing(true)
            .setAutoCancel(false)
            .setContentIntent(contentIntent)
            .setDefaults(Notification.DEFAULT_LIGHTS)

        if (canUseFullScreenIntent(appContext)) {
            builder.setFullScreenIntent(contentIntent, true)
        } else {
            // Se omite en vez de pasarlo y que lo ignoren, para que la degradación
            // a heads-up sea una rama deliberada que deja rastro en el log.
            Log.w(TAG, "Sin USE_FULL_SCREEN_INTENT — la alerta degrada a heads-up")
        }

        return try {
            val manager = appContext.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
                ?: return false
            manager.notify(PANIC_NOTIFICATION_ID, builder.build())
            true
        } catch (e: Exception) {
            // SecurityException si falta POST_NOTIFICATIONS. La sirena ya arrancó
            // antes que esto, así que la alerta no se pierde entera.
            Log.e(TAG, "No se pudo publicar la alerta de pánico: ${e.message}", e)
            false
        }
    }

    /**
     * Abre la app. El payload no viaja en extras: la pantalla de pánico se
     * reconstruye desde [PanicAlarmEngine.takePendingPayload], que es la misma
     * ruta que usa el arranque en frío y ya está probada.
     */
    private fun openAppIntent(context: Context): PendingIntent {
        val intent = Intent(context, MainActivity::class.java).apply {
            // singleTask + CLEAR_TOP: un segundo pánico reutiliza la pantalla vía
            // onNewIntent en vez de apilar alertas una sobre otra.
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        return PendingIntent.getActivity(
            context,
            PANIC_NOTIFICATION_ID,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
    }
}
