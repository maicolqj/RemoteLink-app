import apolloClientInstance from '../../data/lib/apollo/client';
import { REPORT_PANIC_LOCATION } from '../../domain/graphql/panic.mutations';
import { hasLocationPermission, watchPanicLocation } from './LocationService';

/**
 * Manda al backend dónde está quien acaba de activar el pánico.
 *
 * Se llama DESPUÉS de que la alarma salió: nada de esto puede demorarla. Sin
 * permiso de ubicación no hace nada —no se pide en plena emergencia—, y si una
 * lectura no llega al servidor se ignora: la siguiente puede llegar.
 */
export async function sharePanicLocation(panicAlertId: string): Promise<void> {
  try {
    if (!(await hasLocationPermission())) return;
  } catch {
    return;
  }

  watchPanicLocation(fix => {
    apolloClientInstance
      .mutate({
        mutation: REPORT_PANIC_LOCATION,
        variables: { input: { panicAlertId, ...fix } },
        fetchPolicy: 'no-cache',
      })
      .catch(err => {
        if (__DEV__) console.warn('[Pánico] no se pudo reportar la ubicación:', err);
      });
  });
}
