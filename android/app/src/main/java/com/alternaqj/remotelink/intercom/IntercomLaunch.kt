package com.alternaqj.remotelink.intercom

import android.content.Context
import android.content.Intent
import android.util.Log

private const val TAG = "IntercomLaunch"

/**
 * Lo que la persona eligió en la notificación de la llamada (abrir, contestar
 * o rechazar). MainActivity lo guarda al abrirse y JS lo recoge al cargar la
 * llamada (IntercomCallModule.consumeLaunch). Se guarda en SharedPreferences
 * porque en un arranque en frío JS todavía no existe cuando llega el intent.
 */
object IntercomLaunch {

    private const val PREFS = "remotelink_intercom"
    private const val KEY_CALL_ID = "launch_call_id"
    private const val KEY_ACTION = "launch_action"
    private const val KEY_AT = "launch_at"

    /** Una elección de hace más de esto ya no corresponde a una llamada que suena. */
    private const val MAX_AGE_MS = 60_000L

    /** Lo llama MainActivity en onCreate y onNewIntent. */
    fun capture(context: Context, intent: Intent?) {
        val callId = intent?.getStringExtra(IntercomCallNotifications.EXTRA_CALL_ID) ?: return
        val action = intent.getStringExtra(IntercomCallNotifications.EXTRA_ACTION)
            ?: IntercomCallNotifications.ACTION_OPEN
        try {
            prefs(context).edit()
                .putString(KEY_CALL_ID, callId)
                .putString(KEY_ACTION, action)
                .putLong(KEY_AT, System.currentTimeMillis())
                .apply()
        } catch (e: Exception) {
            Log.w(TAG, "No se pudo guardar la elección: ${e.message}")
        }
        // Ya se eligió: el tono deja de sonar. Si solo abrió la app, JS sigue
        // timbrando en la pantalla de la llamada.
        IntercomCallNotifications.cancel(context, callId)
        // Lo que quedó en el intent no debe volver a aplicarse al recrear la actividad.
        intent.removeExtra(IntercomCallNotifications.EXTRA_CALL_ID)
        intent.removeExtra(IntercomCallNotifications.EXTRA_ACTION)
    }

    /** Devuelve la elección pendiente (y la borra), o null. */
    fun consume(context: Context): Pair<String, String>? = try {
        val prefs = prefs(context)
        val callId = prefs.getString(KEY_CALL_ID, null)
        val action = prefs.getString(KEY_ACTION, null)
        val at = prefs.getLong(KEY_AT, 0L)
        prefs.edit().remove(KEY_CALL_ID).remove(KEY_ACTION).remove(KEY_AT).apply()
        if (callId == null || action == null || System.currentTimeMillis() - at > MAX_AGE_MS) null
        else callId to action
    } catch (e: Exception) {
        null
    }

    private fun prefs(context: Context) =
        context.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
}
