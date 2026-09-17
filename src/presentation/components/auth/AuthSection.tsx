import React from 'react';
import { View, StyleSheet } from 'react-native';
import CustomTextComponent from '../CustomTextComponent';
import { useTheme } from '../../providers/context/ThemeContext';
import { SPACING } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';

interface Props {
  label: string;
  children: React.ReactNode;
}

/**
 * Grupo rotulado dentro de la tarjeta. El rótulo es lo que convierte una lista
 * de opciones sueltas en una respuesta a una pregunta concreta ("¿No puedes
 * ingresar?"), que es justo lo que faltaba.
 */
export default function AuthSection({ label, children }: Props) {
  const { colors } = useTheme();

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={[styles.line, { backgroundColor: colors.border }]} />
        <CustomTextComponent
          fontSize={FONT_SIZE.xs}
          fontWeight={FONT_WEIGHT.semibold}
          color={colors.textTertiary}
          numberOfLines={1}
          style={styles.label}>
          {label}
        </CustomTextComponent>
        <View style={[styles.line, { backgroundColor: colors.border }]} />
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  label: {
    // letterSpacing: 0.4,
    marginHorizontal: 10,
    // Las dos líneas laterales son `flex: 1`, así que compiten con el rótulo por
    // el ancho y lo partían en dos renglones. Que encojan ellas: el rótulo
    // manda y se queda en una sola línea.
    flexShrink: 0,
  },
});
