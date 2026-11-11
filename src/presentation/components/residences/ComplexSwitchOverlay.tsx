// =============================================================================
// Pantalla de carga al cambiar de conjunto.
//
// Tapa la app mientras dura el cambio (tokens nuevos + ficha del conjunto
// nuevo), para que no se vean datos a medias. `switchComplex` siempre la
// suelta al terminar, falle o no.
// =============================================================================

import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import CustomTextComponent from '../CustomTextComponent';
import { useTheme } from '../../providers/context/ThemeContext';
import { useAuthStore } from '../../store/auth.store';

export function ComplexSwitchOverlay() {
  const { colors } = useTheme();
  const switchingTo = useAuthStore(s => s.switchingTo);

  if (switchingTo === null) return null;

  return (
    <View style={[StyleSheet.absoluteFill, styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <CustomTextComponent style={[styles.text, { color: colors.textPrimary }]} numberOfLines={2}>
        {switchingTo ? `Cambiando a ${switchingTo}…` : 'Cambiando de conjunto…'}
      </CustomTextComponent>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 32 },
  text: { fontSize: 16, fontWeight: '600', textAlign: 'center' },
});
