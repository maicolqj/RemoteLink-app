package com.alternaqj.remotelink

import android.app.Activity
import android.app.Application
import android.os.Bundle

/**
 * ¿Hay alguna pantalla de la app visible ahora mismo?
 *
 * [PanicAlertReceiver] necesita saberlo para no pisar el flujo que ya existe: con
 * la app abierta el pánico llega por socket y lo atiende el modal, así que una
 * notificación nativa encima sería ruido duplicado. Con la app en segundo plano o
 * muerta no hay modal que valga y la ruta nativa es la única que queda.
 *
 * Se resuelve con el contador de actividades iniciadas y no con
 * ProcessLifecycleOwner porque el receptor puede correr antes de que React
 * arranque, y esto solo depende de [Application], que para entonces ya existe.
 */
object AppForeground {

    @Volatile
    private var startedActivities = 0

    val isForeground: Boolean
        get() = startedActivities > 0

    fun register(application: Application) {
        application.registerActivityLifecycleCallbacks(
            object : Application.ActivityLifecycleCallbacks {
                override fun onActivityStarted(activity: Activity) {
                    startedActivities++
                }

                override fun onActivityStopped(activity: Activity) {
                    // Nunca por debajo de cero: un onStop sin su onStart (proceso
                    // restaurado con la actividad ya creada) dejaría el contador
                    // en negativo y la app se vería como cerrada para siempre.
                    if (startedActivities > 0) startedActivities--
                }

                override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) {}
                override fun onActivityResumed(activity: Activity) {}
                override fun onActivityPaused(activity: Activity) {}
                override fun onActivitySaveInstanceState(activity: Activity, outState: Bundle) {}
                override fun onActivityDestroyed(activity: Activity) {}
            },
        )
    }
}
