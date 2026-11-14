import React, { useEffect } from 'react';
import { AppState, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@apollo/client/react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MY_COMMUNITY_ACCESS } from '../../domain/graphql/community-access.queries';
import { useAuthStore } from '../store/auth.store';
import {
  type CommunityAccess,
  formatCutDate,
  useCommunityAccessStore,
} from '../store/community-access.store';

/**
 * Explica el corte cuando la administración no renovó, y avisa antes con un
 * banner fijo porque hay equipos con las notificaciones apagadas. Nunca muestra
 * un botón de pánico que no funcione.
 */
export function CommunityAccessGate() {
  const access = useCommunityAccessStore(s => s.access);
  const setAccess = useCommunityAccessStore(s => s.setAccess);
  const reset = useCommunityAccessStore(s => s.reset);
  const logout = useAuthStore(s => s.logout);
  const insets = useSafeAreaInsets();

  const { data, refetch, loading } = useQuery<{ myCommunityAccess: CommunityAccess }>(
    MY_COMMUNITY_ACCESS,
    {
      fetchPolicy: 'network-only',
      // Solo con el corte activo: al renovar, la app se abre sola.
      pollInterval: access?.accessCut ? 60_000 : 0,
    },
  );

  useEffect(() => {
    if (data?.myCommunityAccess) setAccess(data.myCommunityAccess);
  }, [data, setAccess]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') refetch().catch(() => undefined);
    });
    return () => sub.remove();
  }, [refetch]);

  useEffect(() => reset, [reset]);

  if (!access) return null;

  if (!access.accessCut) {
    if (!access.cutAt) return null;
    return (
      <View pointerEvents="none" style={[styles.banner, { top: insets.top }]}>
        <Text style={styles.bannerText}>
          La administración no ha renovado la suscripción. Si no se renueva, el servicio se suspende
          desde el {formatCutDate(access.cutAt)}.
        </Text>
      </View>
    );
  }

  return (
    <View style={[StyleSheet.absoluteFill, styles.screen, { paddingTop: insets.top + 24 }]}>
      <Text style={styles.title}>Servicio suspendido</Text>
      <Text style={styles.body}>
        La administración del conjunto no renovó la suscripción de EntryLink. El servicio volverá en
        cuanto se renueve.
      </Text>

      {access.panicAvailable ? (
        <Text style={styles.panicActive}>El botón de pánico sigue activo.</Text>
      ) : (
        <View style={styles.panicOff}>
          <Text style={styles.panicOffText}>
            El botón de pánico está inactivo. En una emergencia marca 123.
          </Text>
          <Pressable style={styles.call} onPress={() => Linking.openURL('tel:123')}>
            <Text style={styles.callText}>Llamar al 123</Text>
          </Pressable>
        </View>
      )}

      <Pressable style={styles.secondary} disabled={loading} onPress={() => refetch()}>
        <Text style={styles.secondaryText}>{loading ? 'Comprobando…' : 'Actualizar estado'}</Text>
      </Pressable>
      <Pressable style={styles.secondary} onPress={() => logout()}>
        <Text style={styles.secondaryText}>Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    zIndex: 40,
  },
  bannerText: { color: '#92400E', fontSize: 13 },
  screen: { backgroundColor: '#F9FAFB', paddingHorizontal: 24, zIndex: 50 },
  title: { color: '#111827', fontSize: 22, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  body: { color: '#4B5563', fontSize: 15, lineHeight: 22, marginBottom: 20, textAlign: 'center' },
  panicActive: { color: '#1D4ED8', fontSize: 15, marginBottom: 20, textAlign: 'center' },
  panicOff: { backgroundColor: '#FEE2E2', borderRadius: 12, marginBottom: 20, padding: 16 },
  panicOffText: { color: '#991B1B', fontSize: 15, fontWeight: '600', marginBottom: 12 },
  call: { alignItems: 'center', backgroundColor: '#DC2626', borderRadius: 10, padding: 14 },
  callText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  secondary: {
    alignItems: 'center',
    borderColor: '#D1D5DB',
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
    padding: 12,
  },
  secondaryText: { color: '#374151', fontSize: 15 },
});
