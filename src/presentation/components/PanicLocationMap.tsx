import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { GOOGLE_MAPS_API_KEY } from '@env';

import apolloClientInstance from '../../data/lib/apollo/client';
import {
  ACTIVE_PANIC_ALERTS,
  PANIC_ALERT_LOCATION,
} from '../../domain/graphql/panic.queries';
import { usePanicStore, type PanicLocation } from '../store/panic.store';

/**
 * Con más error que esto no se pinta un pin: dentro de un conjunto, 50 m pueden
 * ser otra torre, y un pin exacto mandaría a la gente al lugar equivocado con
 * toda confianza. Se pinta el círculo del error y se avisa que es aproximada.
 */
const PRECISE_M = 50;
/** Mientras no haya ubicación se vuelve a preguntar: el socket puede no estar. */
const POLL_MS = 8_000;
/** Pasado esto sin ubicación se deja de esperar y se dice. */
const GIVE_UP_MS = 90_000;

/**
 * Android necesita la clave de Google Maps en el manifiesto; sin ella el SDK
 * lanza al montar el mapa. iOS usa Apple Maps y no la pide.
 */
const CAN_RENDER_MAP = Platform.OS === 'ios' || !!GOOGLE_MAPS_API_KEY?.trim();

interface Props {
  complexId: string;
  /** Id de la alerta; si no vino en el aviso se busca entre las activas. */
  alertId?: string;
  /** Quien la activó: sirve para encontrar la alerta cuando falta el id. */
  triggeredBy?: string;
}

/**
 * Dónde está quien activó el pánico.
 *
 * Si alguien lo activa en la piscina, los vecinos corren a su apartamento. El
 * mapa llega unos segundos después que la alarma —el GPS tarda y la alarma no
 * lo espera—, así que primero se muestra "obteniendo ubicación".
 */
export function PanicLocationMap({ complexId, alertId, triggeredBy }: Props) {
  const fromSocket = usePanicStore(s => s.panicLocation);
  const [resolvedId, setResolvedId] = useState<string | undefined>(alertId);
  const [fetched, setFetched] = useState<PanicLocation | null>(null);
  const [gaveUp, setGaveUp] = useState(false);
  const [now, setNow] = useState(Date.now());

  // Sin id en el aviso (arranque en frío desde la sirena nativa) se busca la
  // alerta abierta que disparó esa persona.
  useEffect(() => {
    if (alertId) {
      setResolvedId(alertId);
      return;
    }
    let active = true;
    apolloClientInstance
      .query<{
        activePanicAlerts: { panicAlertId?: string | null; createdByUserId?: string | null }[];
      }>({
        query: ACTIVE_PANIC_ALERTS,
        variables: { complexId },
        fetchPolicy: 'network-only',
      })
      .then(({ data }) => {
        const alerts = data?.activePanicAlerts ?? [];
        const match =
          alerts.find(a => a.createdByUserId === triggeredBy && a.panicAlertId) ??
          alerts.find(a => a.panicAlertId);
        if (active && match?.panicAlertId) setResolvedId(match.panicAlertId);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [alertId, complexId, triggeredBy]);

  const socketFix =
    fromSocket && (!resolvedId || fromSocket.alertId === resolvedId) ? fromSocket : null;
  const location = newest(socketFix, fetched);
  // Solo esto decide si se sigue preguntando: depender de `location` relanzaría
  // el efecto con cada respuesta y la consulta se volvería un bucle.
  const hasPreciseFix = !!location && location.accuracy <= PRECISE_M;
  const hasFix = !!location;

  // Se consulta al abrir y, mientras falte o sea imprecisa, cada pocos segundos.
  useEffect(() => {
    if (!resolvedId || hasPreciseFix) return;

    let active = true;
    const load = () =>
      apolloClientInstance
        .query<{ panicAlertLocation: RawLocation }>({
          query: PANIC_ALERT_LOCATION,
          variables: { panicAlertId: resolvedId },
          fetchPolicy: 'network-only',
        })
        .then(({ data }) => {
          const fix = toLocation(resolvedId, data?.panicAlertLocation);
          if (active && fix) setFetched(fix);
        })
        .catch(() => undefined);

    void load();
    const poll = setInterval(load, POLL_MS);
    return () => {
      active = false;
      clearInterval(poll);
    };
  }, [resolvedId, hasPreciseFix]);

  useEffect(() => {
    if (hasFix) return;
    const timer = setTimeout(() => setGaveUp(true), GIVE_UP_MS);
    return () => clearTimeout(timer);
  }, [hasFix]);

  // Refresca el "hace X s".
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 10_000);
    return () => clearInterval(tick);
  }, []);

  if (!location) {
    return (
      <View style={styles.pending}>
        {gaveUp ? (
          <Icon name="location-off" size={18} color="#999" />
        ) : (
          <ActivityIndicator size="small" color="#c00" />
        )}
        <Text style={styles.pendingText}>
          {gaveUp
            ? 'No llegó la ubicación de quien activó la alarma. Acude a la unidad indicada.'
            : 'Obteniendo la ubicación de quien activó la alarma…'}
        </Text>
      </View>
    );
  }

  const precise = location.accuracy <= PRECISE_M;
  const coordinate = { latitude: location.latitude, longitude: location.longitude };
  // El encuadre crece con el error para que el círculo quepa entero.
  const span = Math.max(0.002, (location.accuracy * 3) / 111_000);

  const openDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}&travelmode=walking`;
    Linking.openURL(url).catch(() => undefined);
  };

  return (
    <View style={styles.container}>
      {CAN_RENDER_MAP ? (
        <MapView
          style={styles.map}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          // Lite: una imagen del mapa, liviana y sin gestos. Es un vistazo; para
          // moverse está "Cómo llegar".
          liteMode
          scrollEnabled={false}
          zoomEnabled={false}
          pitchEnabled={false}
          rotateEnabled={false}
          toolbarEnabled={false}
          region={{ ...coordinate, latitudeDelta: span, longitudeDelta: span }}>
          {precise ? (
            <Marker coordinate={coordinate} pinColor="#c00" />
          ) : (
            <Circle
              center={coordinate}
              radius={location.accuracy}
              strokeColor="rgba(204,0,0,0.8)"
              fillColor="rgba(204,0,0,0.18)"
            />
          )}
        </MapView>
      ) : (
        <Text style={styles.coords}>
          {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
        </Text>
      )}

      <View style={styles.footer}>
        <Text style={[styles.meta, !precise && styles.metaWarn]}>
          {precise ? 'Ubicación' : 'Ubicación aproximada'} · ±{Math.round(location.accuracy)} m
          {' · '}
          {agoLabel(location.capturedAt, now)}
        </Text>
        <TouchableOpacity style={styles.directions} onPress={openDirections} activeOpacity={0.8}>
          <Icon name="directions-walk" size={16} color="#c00" />
          <Text style={styles.directionsText}>Cómo llegar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

interface RawLocation {
  latitude?: number | string | null;
  longitude?: number | string | null;
  accuracy?: number | string | null;
  locationCapturedAt?: string | null;
}

function toLocation(alertId: string, raw?: RawLocation | null): PanicLocation | null {
  if (raw?.latitude == null || raw.longitude == null) return null;
  return {
    alertId,
    latitude: Number(raw.latitude),
    longitude: Number(raw.longitude),
    accuracy: Number(raw.accuracy ?? 9999),
    capturedAt: raw.locationCapturedAt ?? new Date().toISOString(),
  };
}

function newest(a: PanicLocation | null, b: PanicLocation | null): PanicLocation | null {
  if (!a) return b;
  if (!b) return a;
  return Date.parse(a.capturedAt) >= Date.parse(b.capturedAt) ? a : b;
}

function agoLabel(iso: string, now: number): string {
  const seconds = Math.max(0, Math.round((now - Date.parse(iso)) / 1000));
  if (seconds < 60) return 'hace un momento';
  const minutes = Math.round(seconds / 60);
  return `hace ${minutes} min`;
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 4,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f3d0d0',
  },
  map: { width: '100%', height: 150 },
  coords: {
    paddingHorizontal: 12,
    paddingTop: 10,
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff5f5',
  },
  meta: { flex: 1, fontSize: 12, color: '#555' },
  metaWarn: { color: '#b45309' },
  directions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#c00',
  },
  directionsText: { fontSize: 12, fontWeight: '700', color: '#c00' },
  pending: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#fff5f5',
  },
  pendingText: { flex: 1, fontSize: 12, color: '#555' },
});
