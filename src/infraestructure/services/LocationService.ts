import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation, {
  type GeolocationResponse,
} from '@react-native-community/geolocation';

/**
 * Ubicación de quien activa la alerta de pánico.
 *
 * Se lee UNA vez por incidente y solo en primer plano: nada de seguimiento
 * continuo. El permiso lo pide la app después del login, nunca al pulsar el
 * botón —ahí cuesta segundos y se niega por reflejo—; si no está concedido, la
 * alarma sale igual, sin ubicación.
 */

// El permiso lo gestiona la app (PermissionsAndroid / requestAuthorization): la
// librería no debe pedirlo por su cuenta en medio de una emergencia.
Geolocation.setRNConfiguration({
  skipPermissionRequests: true,
  authorizationLevel: 'whenInUse',
  locationProvider: 'auto',
});

export interface LocationFix {
  latitude: number;
  longitude: number;
  /** Radio de error en metros. */
  accuracy: number;
  /** ISO 8601: cuándo tomó el equipo la lectura. */
  capturedAt: string;
}

/** Cuánto se escucha al GPS después del disparo. */
const WATCH_MS = 45_000;
/** Con esta precisión ya se distingue una torre de otra: se deja de escuchar. */
const GOOD_ENOUGH_M = 15;
/** Lecturas que se reportan como mucho: la primera y las que mejoran. */
const MAX_REPORTS = 3;
/** Una lectura nueva se reporta solo si reduce el error en al menos un 30 %. */
const IMPROVEMENT = 0.7;

const FINE = PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;
const COARSE = PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION;

export async function hasLocationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    const [fine, coarse] = await Promise.all([
      PermissionsAndroid.check(FINE),
      PermissionsAndroid.check(COARSE),
    ]);
    return fine || coarse;
  }
  // iOS no expone una consulta sin pedir: requestAuthorization no vuelve a
  // mostrar el diálogo si ya se respondió, así que sirve de consulta.
  return requestLocationPermission();
}

export async function requestLocationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    const result = await PermissionsAndroid.requestMultiple([FINE, COARSE]);
    // Android 12+ deja elegir "aproximada": sirve igual, con un círculo en vez
    // de un pin exacto.
    return (
      result[FINE] === PermissionsAndroid.RESULTS.GRANTED ||
      result[COARSE] === PermissionsAndroid.RESULTS.GRANTED
    );
  }
  return new Promise(resolve => {
    Geolocation.requestAuthorization(
      () => resolve(true),
      () => resolve(false),
    );
  });
}

const toFix = (pos: GeolocationResponse): LocationFix => ({
  latitude: pos.coords.latitude,
  longitude: pos.coords.longitude,
  accuracy: pos.coords.accuracy,
  capturedAt: new Date(pos.timestamp).toISOString(),
});

/**
 * Escucha el GPS un rato y entrega la primera lectura y las que la mejoran.
 *
 * La primera suele llegar rápido y con mala precisión (la última conocida o la
 * de la red); las siguientes afinan. Se corta al tener una buena, al llegar al
 * tope de reportes o al vencer el plazo. Devuelve la función para cortar antes.
 */
export function watchPanicLocation(onFix: (fix: LocationFix) => void): () => void {
  let best = Number.POSITIVE_INFINITY;
  let reports = 0;
  let stopped = false;
  let watchId: number | null = null;

  const stop = () => {
    if (stopped) return;
    stopped = true;
    if (watchId !== null) Geolocation.clearWatch(watchId);
    clearTimeout(timer);
  };

  const timer = setTimeout(stop, WATCH_MS);

  watchId = Geolocation.watchPosition(
    pos => {
      if (stopped) return;
      const fix = toFix(pos);
      if (reports === 0 || fix.accuracy < best * IMPROVEMENT) {
        best = fix.accuracy;
        reports += 1;
        onFix(fix);
      }
      if (best <= GOOD_ENOUGH_M || reports >= MAX_REPORTS) stop();
    },
    // Sin GPS no hay nada que hacer: la alarma ya salió y eso es lo que cuenta.
    () => undefined,
    {
      enableHighAccuracy: true,
      distanceFilter: 0,
      interval: 2_000,
      fastestInterval: 1_000,
      maximumAge: 30_000,
    },
  );

  return stop;
}
