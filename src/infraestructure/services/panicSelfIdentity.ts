import AsyncStorage from '@react-native-async-storage/async-storage';
import PanicSound from '../../shared/modules/PanicSoundModule';

const SELF_USER_ID_KEY = 'panic.selfUserId';

/**
 * Id del usuario con sesión abierta, replicado donde la ruta de pánico puede
 * leerlo sin la app viva.
 *
 * Existe para que quien dispara la alerta no la reciba de vuelta en su propio
 * teléfono. El backend ya excluye al activador de la lista de destinatarios,
 * pero lo hace por `user_id`, y un token FCM identifica una INSTALACIÓN, no una
 * cuenta: si este equipo conserva la suscripción activa de una sesión anterior,
 * el push dirigido a esa otra cuenta aterriza aquí igual. Comparar contra
 * `triggeredBy` del payload es la única defensa que se puede hacer del lado del
 * equipo.
 *
 * Se guarda por duplicado a propósito: en `SharedPreferences` vía el módulo
 * nativo, que es lo que lee `PanicAlertReceiver` con la app cerrada en Android;
 * y en AsyncStorage, que es lo que alcanza el handler headless de iOS, donde el
 * pánico sigue pasando por JS.
 */
export async function mirrorPanicSelfUserId(userId: string): Promise<void> {
  if (!userId) return;
  try {
    await AsyncStorage.setItem(SELF_USER_ID_KEY, userId);
  } catch (e) {
    console.warn('[PanicIdentity] no se pudo espejar el usuario:', (e as Error)?.message);
  }
  void PanicSound?.setSelfUserId(userId);
  // Con usuario espejado hay sesión: se abre la compuerta que el receptor
  // nativo consulta antes de atender nada.
  void PanicSound?.setSessionOpen(true);
}

/**
 * Borra el espejo al cerrar sesión.
 *
 * Sin esto un id viejo silenciaría un pánico legítimo disparado por el usuario
 * anterior contra la cuenta que entre después en el mismo equipo.
 */
export async function clearPanicSelfUserId(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SELF_USER_ID_KEY);
  } catch (e) {
    console.warn('[PanicIdentity] no se pudo limpiar el espejo:', (e as Error)?.message);
  }
  void PanicSound?.setSelfUserId('');
  // Cierra la compuerta: sin sesión el receptor nativo descarta cualquier
  // pánico, aunque el servidor siga creyendo que este equipo es alcanzable.
  void PanicSound?.setSessionOpen(false);
}

/** Lector para contextos sin React (handler headless de FCM en iOS). */
export async function getPanicSelfUserId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(SELF_USER_ID_KEY);
  } catch {
    // Falla abierto, igual que el opt-out: ante la duda, una alarma de seguridad
    // suena. El costo de una falsa alarma está por debajo del de una perdida.
    return null;
  }
}

/**
 * True cuando la alerta la disparó este mismo equipo.
 *
 * Sin espejo devuelve false —falla abierto— porque una instalación que todavía
 * no lo escribió tiene que seguir recibiendo pánicos ajenos.
 */
export function isSelfTriggeredPanic(
  triggeredBy: string | null | undefined,
  selfUserId: string | null | undefined,
): boolean {
  return !!selfUserId && !!triggeredBy && triggeredBy === selfUserId;
}
