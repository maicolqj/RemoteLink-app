import React, { useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet, Vibration, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomTextComponent from './CustomTextComponent';
import { useTheme } from '../providers/context/ThemeContext';
import { SPACING, RADIUS } from '../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../constants/typography';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  value: string;
  onChange: (v: string) => void;
  /** Se dispara al completar la longitud; evita un botón extra de "continuar". */
  onComplete?: (v: string) => void;
  length?: number;
  error?: string;
  disabled?: boolean;
  /** Texto del hueco inferior izquierdo del teclado (acción secundaria). */
  secondaryAction?: { label: string; onPress: () => void };
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Teclado numérico propio en vez del teclado del sistema: el PIN no debe pasar
 * por el diccionario/autocompletado del teclado, y así la pantalla no se
 * reacomoda cuando el teclado aparece.
 */
const PinPadInput: React.FC<Props> = ({
  value,
  onChange,
  onComplete,
  length = 6,
  error,
  disabled = false,
  secondaryAction,
}) => {
  const { colors } = useTheme();

  const press = useCallback(
    (digit: string) => {
      if (disabled || value.length >= length) return;
      const next = value + digit;
      if (Platform.OS === 'android') Vibration.vibrate(10);
      onChange(next);
      if (next.length === length) onComplete?.(next);
    },
    [disabled, value, length, onChange, onComplete],
  );

  const backspace = useCallback(() => {
    if (disabled || !value.length) return;
    onChange(value.slice(0, -1));
  }, [disabled, value, onChange]);

  const renderKey = (digit: string) => (
    <TouchableOpacity
      key={digit}
      style={[styles.key, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => press(digit)}
      disabled={disabled}
      activeOpacity={0.6}
      accessibilityRole="button"
      accessibilityLabel={`Dígito ${digit}`}>
      <CustomTextComponent
        fontSize={FONT_SIZE.xl}
        fontWeight={FONT_WEIGHT.medium}
        color={disabled ? colors.textDisabled : colors.textPrimary}>
        {digit}
      </CustomTextComponent>
    </TouchableOpacity>
  );

  return (
    <View style={styles.root}>
      {/* Dots */}
      <View style={styles.dots}>
        {Array.from({ length }).map((_, i) => {
          const filled = i < value.length;
          return (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: filled ? (error ? colors.error : colors.primary) : 'transparent',
                  borderColor: error ? colors.error : filled ? colors.primary : colors.border,
                },
              ]}
            />
          );
        })}
      </View>

      {error ? (
        <CustomTextComponent
          fontSize={FONT_SIZE.sm}
          color={colors.error}
          textAlign="center"
          style={styles.error}>
          {error}
        </CustomTextComponent>
      ) : null}

      {/* Keypad */}
      <View style={styles.pad}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(renderKey)}

        {secondaryAction ? (
          <TouchableOpacity
            style={styles.key}
            onPress={secondaryAction.onPress}
            disabled={disabled}
            activeOpacity={0.6}
            accessibilityRole="button">
            <CustomTextComponent
              fontSize={FONT_SIZE.xs}
              fontWeight={FONT_WEIGHT.medium}
              color={colors.primary}
              textAlign="center">
              {secondaryAction.label}
            </CustomTextComponent>
          </TouchableOpacity>
        ) : (
          <View style={styles.key} />
        )}

        {renderKey('0')}

        <TouchableOpacity
          style={styles.key}
          onPress={backspace}
          disabled={disabled || !value.length}
          activeOpacity={0.6}
          accessibilityRole="button"
          accessibilityLabel="Borrar">
          <Icon
            name="backspace"
            size={24}
            color={value.length && !disabled ? colors.textSecondary : colors.textDisabled}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const KEY_SIZE = 72;

const styles = StyleSheet.create({
  root: { gap: SPACING.md },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm + 2,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  error: {
    lineHeight: FONT_SIZE.sm * 1.4,
  },
  pad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  key: {
    width: KEY_SIZE,
    height: KEY_SIZE - 12,
    borderRadius: RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xs,
  },
});

export default React.memo(PinPadInput);
