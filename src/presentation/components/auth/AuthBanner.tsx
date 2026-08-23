import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomTextComponent from '../CustomTextComponent';
import { useTheme } from '../../providers/context/ThemeContext';
import { SPACING, RADIUS, ICON_SIZE } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';

export type BannerTone = 'info' | 'warning' | 'error' | 'success' | 'progress';

interface Props {
  tone: BannerTone;
  children: string;
  /** Encabezado en negrita sobre el texto. Para avisos que hay que leer sí o sí. */
  title?: string;
  /** Reemplaza el icono por un spinner. Solo tiene sentido con tone="progress". */
  loading?: boolean;
  /** Sobrescribe el icono por defecto del tono. */
  icon?: string;
}

const ICONS: Record<BannerTone, string> = {
  info: 'info-outline',
  warning: 'warning-amber',
  error: 'error-outline',
  success: 'check-circle-outline',
  progress: 'hourglass-empty',
};

/**
 * Aviso en línea. Existía copiado en ocho lugares de las pantallas de auth, cada
 * copia con su propio padding y su propia forma de teñir el borde; unificarlo es
 * la mitad del problema de "se ve desordenado".
 *
 * El color nunca va solo: cada tono trae su icono, para no depender de que el
 * usuario distinga rojo de ámbar.
 */
export default function AuthBanner({ tone, children, title, loading, icon }: Props) {
  const { colors } = useTheme();

  const accent =
    tone === 'error' ? colors.error
    : tone === 'warning' ? colors.warning
    : tone === 'success' ? colors.success
    : colors.primary;

  // El texto va en color de texto normal, no en el color del tono: teñir el
  // párrafo completo baja el contraste y hace ruido. El acento vive en el icono
  // y el borde.
  const textColor = tone === 'error' ? colors.error : colors.textPrimary;

  return (
    <View
      style={[styles.banner, { backgroundColor: accent + '14', borderColor: accent + '40' }]}
      accessibilityRole={tone === 'error' || tone === 'warning' ? 'alert' : undefined}
      accessibilityLiveRegion={tone === 'error' ? 'polite' : 'none'}>
      {loading ? (
        <ActivityIndicator size="small" color={accent} />
      ) : (
        <Icon name={icon ?? ICONS[tone]} size={ICON_SIZE.sm} color={accent} />
      )}

      <View style={styles.text}>
        {title ? (
          <CustomTextComponent fontSize={FONT_SIZE.sm} fontWeight={FONT_WEIGHT.bold} color={accent}>
            {title}
          </CustomTextComponent>
        ) : null}
        <CustomTextComponent fontSize={FONT_SIZE.sm} color={textColor} style={styles.body}>
          {children}
        </CustomTextComponent>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    padding: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  body: {
    lineHeight: FONT_SIZE.sm * 1.45,
  },
});
