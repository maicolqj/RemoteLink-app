# Reglas de R8 para el build de release.
#
# R8 se activó para subir la ofuscación DEX que mide Google Play. Las librerías
# (Firebase, Notifee, NFC, cámara…) traen sus propias reglas de consumidor; aquí
# van solo las del puente de React Native y las del código nativo de la app.

# ── React Native / Hermes ────────────────────────────────────────────────────
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }
-keep,allowobfuscation @interface com.facebook.proguard.annotations.DoNotStrip
-keep,allowobfuscation @interface com.facebook.proguard.annotations.KeepGettersAndSetters
-keep @com.facebook.proguard.annotations.DoNotStrip class *
-keepclassmembers class * {
    @com.facebook.proguard.annotations.DoNotStrip *;
    @com.facebook.react.bridge.ReactMethod *;
    @com.facebook.react.uimanager.annotations.ReactProp *;
    @com.facebook.react.uimanager.annotations.ReactPropGroup *;
}

# ── Código nativo de la app ──────────────────────────────────────────────────
# Módulos del puente (sirena de pánico), receptores y el cliente que confirma la
# entrega del pánico. Se conservan enteros: son pocos, los llama JS por nombre o
# el sistema por el manifiesto, y un nombre cambiado rompe la alarma sin error
# visible.
-keep class com.alternaqj.remotelink.** { *; }

# ── Kotlin ───────────────────────────────────────────────────────────────────
-dontwarn kotlin.**
-dontwarn org.jetbrains.annotations.**
