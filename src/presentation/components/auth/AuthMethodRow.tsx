import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Ionicon from 'react-native-vector-icons/Ionicons';
import CustomTextComponent from '../CustomTextComponent';
import { useTheme } from '../../providers/context/ThemeContext';
import { SPACING, RADIUS, ICON_SIZE } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';

interface Props {
  icon: string;
  title: string;
  /** Qué hace y cuándo sirve. Sin esto la fila no se entiende fuera de contexto. */
  description: string;
  onPress: () => void;
  iconColor?: string;
  /**
   * MaterialIcons no trae logos de marca (no existe glifo de WhatsApp), así que
   * esos casos usan Ionicons: `logo-whatsapp`.
   */
  iconLibrary?: 'material' | 'ionicons';
}

/**
 * Camino alternativo de ingreso.
 *
 * Cada fila lleva su propia explicación a propósito: la versión anterior eran
 * frases en gerundio sin encabezado ("Enviando un WhatsApp desde mi celular")
 * que continuaban un título que nunca se pintó en pantalla.
 */
export default function AuthMethodRow({
  icon,
  title,
  description,
  onPress,
  iconColor,
  iconLibrary = 'material',
}: Props) {
  const { colors } = useTheme();
  const IconComponent = iconLibrary === 'ionicons' ? Ionicon : Icon;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${description}`}
      style={[styles.row, { borderColor: colors.border, backgroundColor: colors.background }]}>
      <View style={[styles.iconBox, { backgroundColor: colors.surface }]}>
        <IconComponent name={icon} size={ICON_SIZE.md} color={iconColor ?? colors.primary} />
      </View>

      <View style={styles.text}>
        <CustomTextComponent
          fontSize={FONT_SIZE.sm}
          fontWeight={FONT_WEIGHT.semibold}
          color={colors.textPrimary}>
          {title}
        </CustomTextComponent>
        <CustomTextComponent fontSize={FONT_SIZE.xs} color={colors.textSecondary} style={styles.description}>
          {description}
        </CustomTextComponent>
      </View>

      <Icon name="chevron-right" size={20} color={colors.textTertiary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    minHeight: 64,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: 2,
  },
  description: {
    lineHeight: FONT_SIZE.xs * 1.45,
  },
});
