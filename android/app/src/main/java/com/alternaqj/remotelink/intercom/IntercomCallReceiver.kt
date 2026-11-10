package com.alternaqj.remotelink.intercom

import android.app.ActivityManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.alternaqj.remotelink.PanicPrefs

private const val TAG = "IntercomCallReceiver"

/**
 * Llamada de citofonía por la app con la app CERRADA.
 *
 * Con la app cerrada Android no deja arrancar el servicio headless que corre el
 * handler de JS ("Background start not allowed"); por eso el pánico tiene su
 * receptor nativo, y la llamada necesita lo mismo: sin esto, el teléfono no
 * suena hasta que alguien abre la app.
 *
 * Escucha el mismo broadcast que react-native-firebase, por debajo del pánico
 * (una emergencia nunca espera a una llamada). NO aborta el broadcast: el
 * receptor de RNFB corre después y, si la app está viva, JS sigue su flujo.
 *
 *  - INTERCOM_CALL_INCOMING → notificación de llamada a pantalla completa que
 *    timbra hasta contestar o vencer (30 s).
 *  - INTERCOM_CALL_ANSWERED / ENDED → se quita (contestó otro equipo, colgaron).
 *
 * Con la app en pantalla no hace nada: ahí la llamada la muestra JS por socket.
 */
class IntercomCallReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        // Nunca reventar: un receptor que lanza tumba el proceso, y este corre
        // con cada push que recibe la app.
        try {
            val extras = intent.extras ?: return
            val type = extras.getString("type") ?: return
            if (!type.startsWith("INTERCOM_CALL_")) return
            val callId = extras.getString("callId") ?: return

            if (type != INCOMING) {
                IntercomCallNotifications.cancel(context, callId)
                return
            }

            // Sin sesión no hay a quién llamar: la suscripción push sobrevive al
            // cierre de sesión.
            if (!PanicPrefs.isSessionOpen(context)) {
                Log.i(TAG, "Llamada ignorada — no hay sesión abierta en este equipo")
                return
            }

            // Con la app en pantalla la llamada entra por socket y JS la muestra.
            if (isAppVisible()) return

            val data = extras.keySet()
                .mapNotNull { key -> extras.getString(key)?.let { key to it } }
                .toMap()
            Log.i(TAG, "Llamada entrante $callId — notificación nativa")
            IntercomCallNotifications.showIncoming(context, data)
        } catch (e: Exception) {
            Log.e(TAG, "Fallo la ruta nativa de la llamada: ${e.message}", e)
        }
    }

    private fun isAppVisible(): Boolean = try {
        val info = ActivityManager.RunningAppProcessInfo()
        ActivityManager.getMyMemoryState(info)
        info.importance <= ActivityManager.RunningAppProcessInfo.IMPORTANCE_VISIBLE
    } catch (e: Exception) {
        false
    }

    companion object {
        private const val INCOMING = "INTERCOM_CALL_INCOMING"
    }
}
