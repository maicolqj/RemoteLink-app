import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
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
  /** Cantidad de casillas. 5 para el código RES, 6 para la clave de acceso. */
  length?: number;
  /**
   * Prefijo fijo a la izquierda. `RES` para el código que emite el sistema;
   * la clave que elige el residente no lleva ninguno.
   */
  prefix?: string | null;
  /** Texto de ayuda bajo las casillas cuando no hay error. */
  hint?: string;
  /**
   * Oculta los caracteres y ofrece un botón para revelarlos.
   *
   * La clave de acceso es una credencial: mostrarla mientras se teclea la deja a
   * la vista de cualquiera que mire la pantalla. Se enmascara por defecto y el
   * residente decide cuándo verla —que es lo que evita el error de tipeo
   * silencioso, sobre todo al cambiarla—.
   */
  secure?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_CHARS = 5; // RES-XXXXX → 5 caracteres variables

// ─── Helpers ──────────────────────────────────────────────────────────────────

const sanitize = (raw: string, max: number) =>
  raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, max);

// ─── Component ───────────────────────────────────────────────────────────────

const CodeSegmentInput: React.FC<Props> = ({
  value,
  onChange,
  error,
  autoFocus = false,
  editable = true,
  length = DEFAULT_CHARS,
  prefix = 'RES',
  hint = 'Toca para ingresar el código',
  secure = false,
}) => {
  const { colors } = useTheme();
  const inputRef = useRef<TextInput>(null);
  const [revealed, setRevealed] = useState(false);

  const masked = secure && !revealed;

  const handleChange = useCallback(
    (raw: string) => onChange(sanitize(raw, length)),
    [onChange, length],
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
          {isFilled ? (masked ? '•' : char) : '·'}
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
          {prefix ? (
            <>
              <View style={[styles.prefixBox, { backgroundColor: colors.primarySurface, borderColor: colors.primary }]}>
                <CustomTextComponent
                  fontSize={FONT_SIZE.md}
                  fontWeight={FONT_WEIGHT.bold}
                  color={colors.primary}>
                  {prefix}
                </CustomTextComponent>
              </View>

              <CustomTextComponent
                fontSize={FONT_SIZE.xl}
                fontWeight={FONT_WEIGHT.bold}
                color={colors.textTertiary}
                style={styles.dash}>
                —
              </CustomTextComponent>
            </>
          ) : null}

          <View style={styles.segment}>
            {Array.from({ length }).map((_, i) => renderChar(value[i], i))}
          </View>
        </View>

        {/* Hidden input */}
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={handleChange}
          maxLength={length}
          autoFocus={autoFocus}
          autoCapitalize="characters"
          autoCorrect={false}
          keyboardType="default"
          editable={editable}
          style={styles.hiddenInput}
          caretHidden
          accessibilityLabel="Código de acceso"
          accessibilityHint={`Ingresa los ${length} caracteres`}
          {...(Platform.OS === 'android' && { importantForAccessibility: 'no' })}
        />
      </TouchableOpacity>

      {secure ? (
        <TouchableOpacity
          onPress={() => setRevealed(prev => !prev)}
          style={styles.revealRow}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={revealed ? 'Ocultar la clave' : 'Mostrar la clave'}>
          <Icon
            name={revealed ? 'visibility-off' : 'visibility'}
            size={16}
            color={colors.primary}
          />
          <CustomTextComponent fontSize={FONT_SIZE.xs} color={colors.primary}>
            {revealed ? 'Ocultar' : 'Mostrar'}
          </CustomTextComponent>
        </TouchableOpacity>
      ) : null}

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
          {hint}
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
  revealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: SPACING.xs / 2,
    marginTop: SPACING.sm,
  },
});

export default React.memo(CodeSegmentInput);
