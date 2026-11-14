package com.alternaqj.remotelink

import android.content.Intent
import android.os.Bundle
import com.alternaqj.remotelink.intercom.IntercomLaunch
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "remotelink"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  /**
   * Se descarta el estado guardado a propósito. Cuando Android saca la app de
   * memoria y el usuario vuelve, intenta recrear los fragments de
   * react-native-screens, que no se pueden restaurar: la app se cerraba al
   * abrir ("Screen fragments should never be restored"). La navegación la
   * reconstruye React desde cero.
   */
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(null)
    // Abrió la app desde la notificación de una llamada de portería.
    IntercomLaunch.capture(this, intent)
  }

  /** Con la app ya abierta (singleTask), tocar la notificación llega aquí. */
  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    IntercomLaunch.capture(this, intent)
  }
}
