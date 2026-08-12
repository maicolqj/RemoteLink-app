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
    private const val KEY_SELF_USER_ID = "self_user_id"
    private const val KEY_SESSION_OPEN = "session_open"

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

    /**
     * Espejo del id del usuario con sesión abierta en este equipo.
     *
     * Sirve para una sola cosa: que quien dispara el pánico no se lo reciba de
     * vuelta. El backend ya excluye al activador de la lista de destinatarios,
     * pero lo hace por `user_id`, y un token FCM identifica una INSTALACIÓN, no
     * una cuenta: si este teléfono tiene todavía una suscripción activa de otra
     * cuenta —una sesión anterior que nunca se desregistró—, el push dirigido a
     * esa otra cuenta aterriza igual aquí. La comparación por `triggeredBy` es
     * la única que se hace del lado del equipo, así que es la que cierra ese
     * hueco.
     *
     * Se limpia al cerrar sesión: sin sesión no hay a quién callar, y un id
     * viejo podría silenciar un pánico legítimo de la cuenta siguiente.
     */
    fun setSelfUserId(context: Context, userId: String?) {
        try {
            val editor = prefs(context).edit()
            if (userId.isNullOrBlank()) editor.remove(KEY_SELF_USER_ID)
            else editor.putString(KEY_SELF_USER_ID, userId)
            editor.apply()
        } catch (e: Exception) {
            Log.w(TAG, "No se pudo guardar el espejo del usuario: ${e.message}")
        }
    }

    fun getSelfUserId(context: Context): String? = try {
        prefs(context).getString(KEY_SELF_USER_ID, null)
    } catch (e: Exception) {
        // Falla abierto, igual que el opt-out: sin el espejo la alerta suena.
        Log.w(TAG, "No se pudo leer el espejo del usuario: ${e.message}")
        null
    }

    /**
     * Espejo de si hay sesión abierta en el equipo.
     *
     * La suscripción push no muere con la sesión: el `logout` invalida tokens y
     * sesión pero deja la fila de `push_subscriptions` activa, así que el
     * servidor sigue mandando a un teléfono donde ya no hay nadie. El
     * desregistro en el servidor es la solución de fondo, pero es best-effort
     * —depende de que haya red al salir— y no alcanza a los equipos que ya
     * quedaron registrados. Esta compuerta sí, y es local.
     *
     * A diferencia del opt-out, falla CERRADO: una instalación que nunca
     * escribió la bandera no tiene sesión, y sonar ahí es justo el fallo que se
     * corrige. La escribe el arranque de sesión, que corre antes de que exista
     * nada que atender.
     */
    fun setSessionOpen(context: Context, open: Boolean) {
        try {
            prefs(context).edit().putBoolean(KEY_SESSION_OPEN, open).apply()
        } catch (e: Exception) {
            Log.w(TAG, "No se pudo guardar el espejo de sesión: ${e.message}")
        }
    }

    fun isSessionOpen(context: Context): Boolean = try {
        prefs(context).getBoolean(KEY_SESSION_OPEN, false)
    } catch (e: Exception) {
        Log.w(TAG, "No se pudo leer el espejo de sesión, se asume cerrada: ${e.message}")
        false
    }
}
