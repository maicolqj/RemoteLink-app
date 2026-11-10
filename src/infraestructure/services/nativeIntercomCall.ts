// =============================================================================
// Puente con la notificación NATIVA de la llamada por internet (Android).
//
// Con la app cerrada la llamada la muestra IntercomCallReceiver (Kotlin), no
// JS: Android no deja correr el handler de JS en ese estado. Aquí se lee lo que
// la persona eligió en esa notificación y se quita cuando ya no hace falta.
// =============================================================================

import { NativeModules, Platform } from 'react-native';

type LaunchAction = { callId: string; action: 'open' | 'answer' | 'decline' };

type NativeIntercomCall = {
  consumeLaunch(): Promise<LaunchAction | null>;
  cancel(callId: string): Promise<boolean>;
};

const native: NativeIntercomCall | undefined =
  Platform.OS === 'android' ? (NativeModules.IntercomCall as NativeIntercomCall | undefined) : undefined;

/** Lo que se eligió en la notificación nativa de la llamada (y se borra), o null. */
export async function consumeNativeCallLaunch(): Promise<LaunchAction | null> {
  try {
    return (await native?.consumeLaunch()) ?? null;
  } catch {
    return null;
  }
}

/** Quita la notificación nativa de esa llamada (deja de timbrar). */
export async function cancelNativeCallNotification(callId: string): Promise<void> {
  try {
    await native?.cancel(callId);
  } catch {
    // sin módulo nativo (iOS, pruebas): no hay nada que quitar
  }
}

/** En Android la notificación de la llamada la publica el receptor nativo. */
export const NATIVE_CALL_NOTIFICATION = Platform.OS === 'android';
