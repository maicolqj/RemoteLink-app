package com.alternaqj.remotelink.intercom

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * Puente de la llamada de citofonía nativa con JS:
 *  - consumeLaunch: qué se eligió en la notificación (abrir, contestar, rechazar).
 *  - cancel: quitar la notificación nativa (la llamada ya se muestra en la app,
 *    contestó otro equipo o colgaron).
 */
class IntercomCallModule(private val ctx: ReactApplicationContext) : ReactContextBaseJavaModule(ctx) {

    override fun getName(): String = "IntercomCall"

    @ReactMethod
    fun consumeLaunch(promise: Promise) {
        val launch = IntercomLaunch.consume(ctx)
        if (launch == null) {
            promise.resolve(null)
            return
        }
        val map = Arguments.createMap()
        map.putString("callId", launch.first)
        map.putString("action", launch.second)
        promise.resolve(map)
    }

    @ReactMethod
    fun cancel(callId: String, promise: Promise) {
        IntercomCallNotifications.cancel(ctx, callId)
        promise.resolve(true)
    }
}
