import React from 'react';
import { StyleSheet, TouchableOpacity, ActivityIndicator, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Ionicon from 'react-native-vector-icons/Ionicons';
import CustomTextComponent from '../CustomTextComponent';
import { useTheme } from '../../providers/context/ThemeContext';
import { SPACING, RADIUS } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';

interface Props {
  text: string;
  onPress: () => void;
  /** `primary` es la única acción destacada de cada pantalla. */
  variant?: 'primary' | 'secondary' | 'text';
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  /**
   * MaterialIcons no incluye logos de marca —no tiene glifo de WhatsApp—, así
   * que esos casos usan Ionicons (`logo-whatsapp`), que ya viene empaquetado.
   */
  iconLibrary?: 'material' | 'ionicons';
  /** Color de fondo propio (WhatsApp usa su verde de marca). */
  tint?: string;
}

/**
 * Botón de los flujos de ingreso.
 *
 * Cada pantalla repetía el mismo bloque: `minHeight`, el radio, y un ternario
 * que pintaba el fondo gris cuando estaba deshabilitado. Ese gris sobre texto
 * gris quedaba por debajo del contraste mínimo, así que acá el estado
 * deshabilitado se resuelve con opacidad sobre el color real.
 */
export default function AuthButton({
  text,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  iconLibrary = 'material',
  tint,
}: Props) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;
  const accent = tint ?? colors.primary;
  const IconComponent = iconLibrary === 'ionicons' ? Ionicon : Icon;

  const background =
    variant === 'primary' ? accent
    : variant === 'secondary' ? 'transparent'
    : 'transparent';

  const label =
    variant === 'primary' ? colors.textInverse
    : variant === 'secondary' ? accent
    : colors.textSecondary;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={text}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={[
        styles.base,
        variant === 'text' ? styles.textVariant : styles.filled,
        { backgroundColor: background },
        variant === 'secondary' && [styles.outlined, { borderColor: accent }],
        variant === 'primary' && styles.elevated,
        isDisabled && styles.disabled,
      ]}>
      <View style={styles.content}>
        {loading ? <ActivityIndicator size="small" color={label} /> : null}
        <CustomTextComponent
          fontSize={FONT_SIZE.md}
          fontWeight={variant === 'text' ? FONT_WEIGHT.medium : FONT_WEIGHT.semibold}
          color={label}>
          {text}
        </CustomTextComponent>
        {icon && !loading ? <IconComponent name={icon} size={20} color={label} /> : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filled: {
    minHeight: 52,
    paddingHorizontal: SPACING.md,
  },
  textVariant: {
    minHeight: 44,
    paddingHorizontal: SPACING.sm,
  },
  outlined: {
    borderWidth: 1.5,
  },
  elevated: {
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 3,
  },
  disabled: {
    // Opacidad en vez de un gris plano: conserva el contraste del texto sobre
    // el fondo y comunica "no disponible" sin inventar otro color.
    opacity: 0.45,
    shadowOpacity: 0,
    elevation: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
});
