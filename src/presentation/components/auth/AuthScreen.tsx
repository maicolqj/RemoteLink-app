import React from 'react';
import {
  View,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicon from 'react-native-vector-icons/Ionicons';
import CustomTextComponent from '../CustomTextComponent';
import { useTheme } from '../../providers/context/ThemeContext';
import { SPACING, RADIUS, ICON_SIZE } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';
import { LOGO_SF } from '../../constants/ImagesApp';

const { width: wp } = Dimensions.get('screen');

interface Props {
  title: string;
  subtitle?: string;
  /** Indicador de progreso para los flujos de varios pasos. */
  step?: { current: number; total: number };
  showBack?: boolean;
  onBack?: () => void;
  children: React.ReactNode;
  /** Contenido al final: legal, versión, notas de seguridad. */
  footer?: React.ReactNode;
}

/**
 * Marco común de las cuatro pantallas de ingreso.
 *
 * Antes cada una resolvía su propio encabezado —el login con un hero enorme y
 * las otras tres con `AppHeader` a secas—, así que el flujo se sentía como tres
 * apps distintas. Acá viven la marca, el botón de volver, el título y el paso;
 * las pantallas solo aportan su contenido.
 *
 * Sin tarjeta: el contenido va directo sobre el fondo. Estas pantallas son una
 * sola columna de arriba abajo, así que el borde de la tarjeta no separaba nada
 * de nada y solo restaba ancho útil.
 *
 * El tema lo fija `ForcedLightTheme` desde el navegador, no este componente.
 */
export default function AuthScreen({
  title,
  subtitle,
  step,
  showBack = false,
  onBack,
  children,
  footer,
}: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.surface }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Fondo claro fijo: sin esto, un teléfono en modo oscuro pinta los
          iconos de la barra en blanco sobre blanco. */}
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + SPACING.lg }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}>

        {/* Marca + volver. El botón se superpone para que el logo quede
            centrado en la pantalla, no desplazado por la flecha. */}
        <View style={[styles.brandBar, { paddingTop: insets.top + SPACING.xs }]}>
          {showBack ? (
            <TouchableOpacity
              onPress={onBack}
              style={[styles.backBtn, { top: insets.top + SPACING.xs, backgroundColor: colors.background }]}
              hitSlop={HIT_SLOP}
              accessibilityRole="button"
              accessibilityLabel="Volver">
              <Ionicon name="chevron-back-outline" size={ICON_SIZE.md} color={colors.textPrimary} />
            </TouchableOpacity>
          ) : null}
          <Image source={LOGO_SF} style={styles.logo} accessibilityIgnoresInvertColors />
        </View>

        <View style={styles.content}>
          <View style={styles.headings}>
            {step ? (
              <View style={[styles.stepPill, { backgroundColor: colors.primarySurface }]}>
                <CustomTextComponent
                  fontSize={FONT_SIZE.xs}
                  fontWeight={FONT_WEIGHT.semibold}
                  color={colors.primary}>
                  Paso {step.current} de {step.total}
                </CustomTextComponent>
              </View>
            ) : null}

            <CustomTextComponent
              fontSize={FONT_SIZE.xxl}
              fontWeight={FONT_WEIGHT.bold}
              color={colors.textPrimary}>
              {title}
            </CustomTextComponent>

            {subtitle ? (
              <CustomTextComponent
                fontSize={FONT_SIZE.sm}
                color={colors.textSecondary}
                style={styles.subtitle}>
                {subtitle}
              </CustomTextComponent>
            ) : null}
          </View>

          {children}

          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const HIT_SLOP = { top: 12, bottom: 12, left: 12, right: 12 };

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1 },

  brandBar: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: SPACING.sm,
  },
  backBtn: {
    position: 'absolute',
    left: SPACING.md,
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  logo: {
    width: wp * 0.70,
    height: 150,
    resizeMode: 'contain',
  },

  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  headings: {
    gap: SPACING.xs,
    alignItems: 'flex-start',
  },
  stepPill: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.xs / 2,
  },
  subtitle: {
    lineHeight: FONT_SIZE.sm * 1.55,
  },
  footer: {
    marginTop: SPACING.sm,
  },
});
