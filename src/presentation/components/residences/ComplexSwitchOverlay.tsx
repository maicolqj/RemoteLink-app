// =============================================================================
// Pantalla de carga al cambiar de conjunto.
//
// Tapa la app desde que empieza el cambio hasta que llega la ficha del
// conjunto nuevo, para que no se vea un Inicio vacío ni datos a medias. Si el
// cambio falla, la ficha sigue ahí y se quita sola.
// =============================================================================

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import CustomTextComponent from '../CustomTextComponent';
import { useTheme } from '../../providers/context/ThemeContext';
import { useAuthStore } from '../../store/auth.store';

export function ComplexSwitchOverlay() {
  const { colors } = useTheme();
  const switchingTo = useAuthStore(s => s.switchingTo);
  const hasProfile = useAuthStore(s => !!s.resident);
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    if (switchingTo !== null) setLabel(switchingTo);
    else if (hasProfile) setLabel(null);
  }, [switchingTo, hasProfile]);

  if (label === null) return null;

  return (
    <View style={[StyleSheet.absoluteFill, styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <CustomTextComponent style={[styles.text, { color: colors.textPrimary }]} numberOfLines={2}>
        {label ? `Cambiando a ${label}…` : 'Cambiando de conjunto…'}
      </CustomTextComponent>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 32 },
  text: { fontSize: 16, fontWeight: '600', textAlign: 'center' },
});
