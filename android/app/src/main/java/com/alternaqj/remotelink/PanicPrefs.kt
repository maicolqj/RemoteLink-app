package com.alternaqj.remotelink

import android.content.Context
import android.util.Log

private const val TAG = "PanicPrefs"

/**
 * Espejo nativo de dos datos que viven en JS y que la ruta nativa de pánico
 * necesita leer sin bundle cargado.
 *
 * [PanicAlertReceiver] corre en un BroadcastReceiver sin contexto de React:
 * AsyncStorage es inalcanzable desde ahí. Así que JS escribe aquí cada vez que
 * el valor cambia y el nativo lee esta copia.
 *
 * El opt-out falla abierto: una instalación recién hecha que nunca escribió la
 * bandera tiene que sonar igual. Para una alerta de seguridad el costo de una
 * falsa alarma está muy por debajo del de una perdida.
 */
object PanicPrefs {

    private const val PREFS_NAME = "remotelink_panic"
    private const val KEY_ALERTS_ENABLED = "panic_alerts_enabled"
    private const val KEY_DEVICE_TOKEN = "fcm_device_token"

    private fun prefs(context: Context) =
        context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    fun setAlertsEnabled(context: Context, enabled: Boolean) {
        try {
            prefs(context).edit().putBoolean(KEY_ALERTS_ENABLED, enabled).apply()
        } catch (e: Exception) {
            Log.w(TAG, "No se pudo guardar el opt-out de pánico: ${e.message}")
        }
    }

    fun areAlertsEnabled(context: Context): Boolean = try {
        prefs(context).getBoolean(KEY_ALERTS_ENABLED, true)
    } catch (e: Exception) {
        Log.w(TAG, "No se pudo leer el opt-out de pánico, se asume activo: ${e.message}")
        true
    }

    /**
     * Espejo del token FCM del equipo.
     *
     * Lo escribe JS al registrarlo. El ACK de entrega lo necesita para atribuir
     * la entrega a un dispositivo concreto —que es justo lo que mide la auditoría
     * de qué ROMs reciben los pánicos—, y leerlo desde FirebaseMessaging exigiría
     * sumar esa dependencia al módulo `app` y una llamada asíncrona dentro de la
     * ruta crítica. Si todavía no se registró, el ACK sale igual sin atribución
     * en vez de perderse entero.
     */
    fun setDeviceToken(context: Context, token: String) {
        try {
            prefs(context).edit().putString(KEY_DEVICE_TOKEN, token).apply()
        } catch (e: Exception) {
            Log.w(TAG, "No se pudo guardar el espejo del token FCM: ${e.message}")
        }
    }

    fun getDeviceToken(context: Context): String? = try {
        prefs(context).getString(KEY_DEVICE_TOKEN, null)
    } catch (e: Exception) {
        Log.w(TAG, "No se pudo leer el espejo del token FCM: ${e.message}")
        null
    }
}
