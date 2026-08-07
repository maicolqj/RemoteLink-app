package com.alternaqj.remotelink

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          add(PanicSoundPackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    // Before loadReactNative: a panic FCM can be delivered while the app is
    // killed, and the channel has to already exist when the notification is
    // posted — waiting for the JS bundle would be too late.
    PanicChannels.ensure(this)
    // Igual de temprano, y por lo mismo: PanicAlertReceiver consulta si hay una
    // pantalla visible para decidir si se aparta, y puede correr antes de que
    // React arranque.
    AppForeground.register(this)
    loadReactNative(this)
  }
}
