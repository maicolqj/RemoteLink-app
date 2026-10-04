package com.alternaqj.remotelink

import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * Abre un chat de WhatsApp en una app concreta.
 *
 * `Linking.openURL` entrega el link `wa.me` a la app que Android tenga por
 * defecto, y quien tiene WhatsApp y WhatsApp Business con líneas distintas
 * termina enviando el mensaje del login desde la que no es: el servidor lo
 * descarta en silencio porque el remitente no coincide. Aquí el intent lleva el
 * paquete elegido.
 *
 * Los clones de "Dual Messenger" (Samsung, Xiaomi) comparten el paquete en otro
 * perfil: para esos el propio sistema pregunta cuál usar.
 */
class WhatsAppLauncherModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "WhatsAppLauncher"

    /** Paquetes de WhatsApp instalados, en el orden de [KNOWN_PACKAGES]. */
    @ReactMethod
    fun getInstalledApps(promise: Promise) {
        val result = Arguments.createArray()
        KNOWN_PACKAGES.filter(::isInstalled).forEach(result::pushString)
        promise.resolve(result)
    }

    @ReactMethod
    fun openChat(packageName: String, phone: String, text: String, promise: Promise) {
        if (packageName !in KNOWN_PACKAGES || !isInstalled(packageName)) {
            promise.resolve(false)
            return
        }
        val uri = Uri.parse("https://api.whatsapp.com/send")
            .buildUpon()
            .appendQueryParameter("phone", phone)
            .appendQueryParameter("text", text)
            .build()
        val intent = Intent(Intent.ACTION_VIEW, uri)
            .setPackage(packageName)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        try {
            reactApplicationContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    private fun isInstalled(packageName: String): Boolean = try {
        reactApplicationContext.packageManager.getPackageInfo(packageName, 0)
        true
    } catch (e: PackageManager.NameNotFoundException) {
        false
    }

    companion object {
        private val KNOWN_PACKAGES = listOf("com.whatsapp", "com.whatsapp.w4b")
    }
}
