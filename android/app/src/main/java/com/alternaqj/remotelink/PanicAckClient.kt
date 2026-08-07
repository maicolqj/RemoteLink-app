package com.alternaqj.remotelink

import android.content.Context
import android.util.Log
import okhttp3.Call
import okhttp3.Callback
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import org.json.JSONObject
import java.io.IOException
import java.util.concurrent.TimeUnit

private const val TAG = "PanicAckClient"

/**
 * Confirma al backend que este equipo MOSTRÓ la alerta.
 *
 * En RemoteLink no mueve el estado del incidente —eso solo lo hace quien debe
 * atenderlo, no un vecino— pero alimenta la auditoría de entrega, que es donde
 * se mide qué marcas de teléfono reciben los pánicos y cuáles no. El dato importa
 * justo aquí: el parque de equipos de los residentes es mucho más heterogéneo que
 * el de la portería.
 *
 * Sale desde Kotlin y no desde JS porque con la app cerrada no hay bundle
 * cargado. Y va después de arrancar la sirena, nunca antes: sonar es lo único que
 * no puede esperar a la red.
 *
 * La URL y el permiso llegan en el propio payload FCM (`ackUrl` + `ackToken`),
 * así que este lado no necesita conocer la config del API ni tener sesión.
 */
object PanicAckClient {

    private val client: OkHttpClient by lazy {
        OkHttpClient.Builder()
            // Plazos cortos y deliberados: esto corre mientras suena una alarma.
            // Si la red no responde rápido, insistir no ayuda a nadie — el
            // escalamiento del servidor ya es la red de seguridad de este fallo.
            .connectTimeout(5, TimeUnit.SECONDS)
            .writeTimeout(5, TimeUnit.SECONDS)
            .readTimeout(5, TimeUnit.SECONDS)
            .retryOnConnectionFailure(false)
            .build()
    }

    private val JSON = "application/json; charset=utf-8".toMediaType()

    /**
     * Dispara el ACK. Asíncrono y sin bloquear: el receptor debe devolver el
     * control enseguida o Android lo mata por ANR.
     */
    fun reportDelivered(context: Context, data: Map<String, String>) {
        val url = data["ackUrl"]
        val ackToken = data["ackToken"]

        if (url.isNullOrBlank() || ackToken.isNullOrBlank()) {
            // Backend sin API_PUBLIC_URL, o una versión anterior del payload. No es
            // un fallo del equipo: simplemente no se confirma la entrega. Sin esta
            // traza el caso "no se confirmó nada" es indistinguible de "se confirmó
            // y falló", y desde el servidor ambos se ven igual.
            Log.w(TAG, "Push de pánico sin ackUrl/ackToken — no se confirma la entrega")
            return
        }

        post(url, ackToken, PanicPrefs.getDeviceToken(context))
    }

    private fun post(url: String, ackToken: String, deviceToken: String?) {
        try {
            val payload = JSONObject().apply {
                put("token", ackToken)
                if (!deviceToken.isNullOrBlank()) put("deviceToken", deviceToken)
            }

            val request = Request.Builder()
                .url(url)
                .post(payload.toString().toRequestBody(JSON))
                .build()

            client.newCall(request).enqueue(object : Callback {
                override fun onFailure(call: Call, e: IOException) {
                    // Sin reintento: para cuando la red vuelva, la alerta ya se
                    // resolvió por otra vía o el servidor ya escaló.
                    Log.w(TAG, "ACK de entrega falló: ${e.message}")
                }

                override fun onResponse(call: Call, response: Response) {
                    response.use {
                        // 204 es el éxito esperado. Otros códigos apuntan a algo
                        // concreto: 401 token vencido o firmado con otro secreto
                        // (típico si el ackUrl apunta a un servidor distinto del
                        // que envió la alerta), 404 alerta inexistente.
                        if (it.isSuccessful) {
                            Log.i(TAG, "Entrega confirmada (${it.code})")
                        } else {
                            Log.w(TAG, "El servidor rechazó el ACK: ${it.code}")
                        }
                    }
                }
            })
        } catch (e: Exception) {
            Log.e(TAG, "No se pudo enviar el ACK de entrega: ${e.message}", e)
        }
    }
}
