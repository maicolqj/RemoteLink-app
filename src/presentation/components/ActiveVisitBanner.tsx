// =============================================================================
// ARCHIVO: src/components/ActiveVisitBanner.tsx
// =============================================================================
// Banner persistente mientras hay una visita activa en cualquier complejo.
// Se apoya en el supervisor store (hydrateFromStorage debe haberse llamado ya).
// =============================================================================

import React, { useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSupervisorStore } from '../../shared/store/supervisor.store';
import { useCheckOut } from '../../shared/hooks/useCheckOut';
import apolloClientInstance from '../../data/lib/apollo/client';

const GREEN  = '#34C759';
const BG     = '#0A2A12';
const BORDER = 'rgba(52,199,89,0.2)';

export function ActiveVisitBanner() {
  const { activeVisits, isHydrated, hydrateFromStorage } = useSupervisorStore();
  const { checkOut, loading } = useCheckOut();

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  const entries = Object.entries(activeVisits);
  if (!isHydrated || entries.length === 0) return null;

  const [complexId, visit] = entries[0];
  const complexName = visit.complex?.name ?? complexId.slice(0, 8);

  const handleCheckOut = () => {
    Alert.alert(
      'Registrar salida',
      `¿Confirmas la salida de ${complexName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: 'destructive',
          onPress: async () => {
            try {
              await checkOut(complexId);
              await apolloClientInstance.refetchQueries({ include: ['MySupervisorVisits', 'MyComplexes'] });
            } catch (err: any) {
              Alert.alert('Error', err.message ?? 'No se pudo registrar la salida.');
            }
          },
        },
      ],
    );
  };

  return (
    <View style={st.banner}>
      <View style={st.dot} />
      <View style={st.info}>
        <Text style={st.label}>Visita activa</Text>
        <Text style={st.complexName} numberOfLines={1}>{complexName}</Text>
      </View>
      <TouchableOpacity
        style={[st.checkOutBtn, loading && { opacity: 0.5 }]}
        onPress={handleCheckOut}
        disabled={loading}
        activeOpacity={0.8}>
        {loading ? (
          <ActivityIndicator color={GREEN} size="small" />
        ) : (
          <>
            <Icon name="logout" size={14} color={GREEN} />
            <Text style={st.checkOutTxt}>Check-out</Text>
          </>
        )}
      </TouchableOpacity>
    </View> 
  );
}

const st = StyleSheet.create({
  banner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: BG, borderBottomWidth: 1, borderColor: BORDER,
    paddingHorizontal: 16, paddingVertical: 10, gap: 10,
  },
  dot:          { width: 8, height: 8, borderRadius: 4, backgroundColor: GREEN },
  info:         { flex: 1 },
  label:        { color: 'rgba(52,199,89,0.6)', fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  complexName:  { color: '#fff', fontSize: 13, fontWeight: '600' },
  checkOutBtn:  { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(52,199,89,0.3)', backgroundColor: 'rgba(52,199,89,0.1)' },
  checkOutTxt:  { color: GREEN, fontSize: 12, fontWeight: '600' },
});
