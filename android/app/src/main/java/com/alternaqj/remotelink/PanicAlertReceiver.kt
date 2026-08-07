package com.alternaqj.remotelink

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

private const val TAG = "PanicAlertReceiver"

/**
 * Ruta nativa de entrega del pánico.
 *
 * Escucha el mismo broadcast que react-native-firebase
 * (`com.google.android.c2dm.intent.RECEIVE`) con prioridad de manifiesto más
 * alta, y atiende la alerta sin pasar por JS.
 *
 * Existe porque la ruta de JS no llega con la app cerrada. Verificado en un
 * Xiaomi 2201117TL (MIUI V816, Android 13): el push entra, GMS despierta el
 * proceso, y al intentar arrancar el servicio headless que ejecuta
 * `setBackgroundMessageHandler` el sistema responde
 *
 *     W/ActivityManager: Background start not allowed: service Intent {
 *       cmp=…/ReactNativeFirebaseMessagingHeadlessService } startFg?=false
 *
 * y ahí se acaba todo: ni sirena, ni notificación, ni rastro de error en la app.
 * Un BroadcastReceiver no arranca ningún servicio, así que esa restricción no le
 * aplica.
 *
 * NO aborta el broadcast: el receptor de RNFB corre igual después y mantiene el
 * flujo de JS (buzón, recuperación en frío, modal). Ambos caminos convergen en
 * [PanicAlarmEngine], cuyo arranque es idempotente, así que la alerta suena una
 * sola vez sin importar quién llegó primero.
 *
 * Con la app en primer plano se aparta: ahí el pánico llega por socket y lo
 * atiende el modal, que es el flujo que ya existía. Publicar además una
 * notificación nativa sería ruido duplicado sobre una alerta que el usuario ya
 * tiene en pantalla.
 *
 * No puede heredar de ReactNativeFirebaseMessagingService: el `onMessageReceived`
 * de esa clase es un stub vacío ("handled in receiver"), así que delegar en super
 * descartaría el flujo de JS en silencio.
 */
class PanicAlertReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        // Que nunca reviente: una excepción en un receptor tumba el proceso, y
        // este corre en CADA push que recibe la app, no solo en los de pánico.
        try {
            val extras = intent.extras ?: return
            if (extras.getString("type") != PANIC_TYPE) return

            if (AppForeground.isForeground) {
                Log.i(TAG, "PANIC_ALERT con la app abierta — lo atiende el socket")
                return
            }

            // Mismo opt-out que respeta el handler de JS, espejado en
            // SharedPreferences porque AsyncStorage es inalcanzable desde aquí.
            // Se consulta antes de hacer ruido.
            if (!PanicPrefs.areAlertsEnabled(context)) {
                Log.i(TAG, "PANIC_ALERT ignorado — el usuario desactivó las alertas")
                return
            }

            val data = extras.keySet()
                .mapNotNull { key -> extras.getString(key)?.let { key to it } }
                .toMap()

            Log.w(TAG, "PANIC_ALERT recibido — arrancando la sirena nativa")

            // El orden importa. Primero el motor, que es el único paso que ninguna
            // ROM puede vetar: el audio USAGE_ALARM suena desde segundo plano sin
            // servicio. La notificación va después porque sí puede fallar (falta
            // POST_NOTIFICATIONS) y no debe arrastrar a la sirena consigo.
            PanicAlarmEngine.stashPayload(
                complexId = data["complexId"],
                triggeredBy = data["triggeredBy"],
                triggeredByLabel = data["triggeredByLabel"],
            )
            PanicAlarmEngine.start(context)
            PanicNotifications.show(context, data)

            // Al final y asíncrono: confirmar la entrega es lo único aquí que puede
            // esperar. Sin ella el escalamiento trata la alerta como no entregada y
            // gasta canales alternos aunque el push haya funcionado.
            PanicAckClient.reportDelivered(context, data)
        } catch (e: Exception) {
            Log.e(TAG, "La ruta nativa de pánico falló: ${e.message}", e)
        }
    }

    companion object {
        private const val PANIC_TYPE = "PANIC_ALERT"
    }
}
