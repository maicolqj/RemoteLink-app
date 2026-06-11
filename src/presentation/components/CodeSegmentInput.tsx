import React, { useRef, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import CustomTextComponent from './CustomTextComponent';
import { useTheme } from '../providers/context/ThemeContext';
import { SPACING, RADIUS } from '../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../constants/typography';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  value: string;
  onChange: (v: string) => void;
  error?: string;
  autoFocus?: boolean;
  editable?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TOTAL_CHARS = 5; // RES-XXXXX → 5 variable chars

// ─── Helpers ──────────────────────────────────────────────────────────────────

const sanitize = (raw: string) =>
  raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, TOTAL_CHARS);

// ─── Component ───────────────────────────────────────────────────────────────

const CodeSegmentInput: React.FC<Props> = ({
  value,
  onChange,
  error,
  autoFocus = false,
  editable = true,
}) => {
  const { colors } = useTheme();
  const inputRef = useRef<TextInput>(null);

  const handleChange = useCallback(
    (raw: string) => onChange(sanitize(raw)),
    [onChange],
  );

  const focusInput = () => editable && inputRef.current?.focus();

  const renderChar = (char: string | undefined, index: number) => {
    const isFilled = char !== undefined && char !== '';
    const isCurrent = index === value.length && editable;

    return (
      <View
        key={index}
        style={[
          styles.charBox,
          {
            backgroundColor: isFilled ? colors.primary : colors.surface,
            borderColor: isCurrent
              ? colors.primary
              : error
              ? colors.error
              : colors.border,
            borderWidth: isCurrent ? 2 : 1,
          },
        ]}>
        <CustomTextComponent
          fontSize={FONT_SIZE.lg}
          fontWeight={FONT_WEIGHT.bold}
          color={isFilled ? colors.textInverse : colors.textTertiary}
          style={styles.charText}>
          {char ?? '·'}
        </CustomTextComponent>
      </View>
    );
  };

  return (
    <View>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={focusInput}
        accessible={false}>
        <View style={styles.row}>
          {/* Static RES prefix */}
          <View style={[styles.prefixBox, { backgroundColor: colors.primarySurface, borderColor: colors.primary }]}>
            <CustomTextComponent
              fontSize={FONT_SIZE.md}
              fontWeight={FONT_WEIGHT.bold}
              color={colors.primary}>
              RES
            </CustomTextComponent>
          </View>

          <CustomTextComponent
            fontSize={FONT_SIZE.xl}
            fontWeight={FONT_WEIGHT.bold}
            color={colors.textTertiary}
            style={styles.dash}>
            —
          </CustomTextComponent>

          {/* 5 character boxes */}
          <View style={styles.segment}>
            {Array.from({ length: TOTAL_CHARS }).map((_, i) =>
              renderChar(value[i], i),
            )}
          </View>
        </View>

        {/* Hidden input */}
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={handleChange}
          maxLength={TOTAL_CHARS}
          autoFocus={autoFocus}
          autoCapitalize="characters"
          autoCorrect={false}
          keyboardType="default"
          editable={editable}
          style={styles.hiddenInput}
          caretHidden
          accessibilityLabel="Código de acceso"
          accessibilityHint="Ingresa los 5 caracteres del código que recibiste"
          {...(Platform.OS === 'android' && { importantForAccessibility: 'no' })}
        />
      </TouchableOpacity>

      {error ? (
        <CustomTextComponent
          fontSize={FONT_SIZE.xs}
          color={colors.error}
          textAlign="center"
          style={styles.message}>
          {error}
        </CustomTextComponent>
      ) : (
        <CustomTextComponent
          fontSize={FONT_SIZE.xs}
          color={colors.textTertiary}
          textAlign="center"
          style={styles.message}>
          Toca para ingresar el código
        </CustomTextComponent>
      )}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const BOX_SIZE = 42;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  prefixBox: {
    height: BOX_SIZE,
    paddingHorizontal: SPACING.sm + 2,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segment: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  charBox: {
    width: BOX_SIZE,
    height: BOX_SIZE,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  charText: {
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  dash: {
    lineHeight: BOX_SIZE,
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
    top: 0,
    left: 0,
  },
  message: {
    marginTop: SPACING.sm,
  },
});

export default React.memo(CodeSegmentInput);
