import React, { useCallback, useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Switch, Alert, TouchableOpacity, Platform } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomTextComponent from '../../components/CustomTextComponent';
import AppHeader from '../../components/AppHeader';
import Card from '../../components/Card';
import { useTheme } from '../../providers/context/ThemeContext';
import { useCoachmark, useCoachmarkTarget, type CoachStep } from '../../providers/context/CoachmarkContext';
import { useGlobalStyles } from '../../styles/useGlobalStyles';
import { useSettingsStore } from '../../store/settings.store';
import { SPACING } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';
import PanicSound from '../../../shared/modules/PanicSoundModule';
import { useAlert } from '../../providers/context/AlertContext';

// First-run walkthrough. Bump the persistKey suffix to re-show it to everyone.
// Battery/autostart targets only render on Android — on iOS their refs never
// attach to a node, so the tour skips them automatically (see goToStep/next
// in CoachmarkContext, which measure-and-skip unmeasurable targets).
const SETTINGS_TOUR_STEPS: CoachStep[] = [
  {
    targetId: 'settings.biometric',
    title: 'Biometría',
    text: 'Actívala para pedir tu huella o Face ID cada vez que abras RemoteLink.',
  },
  {
    targetId: 'settings.panicAlerts',
    title: 'Alertas de pánico',
    text: 'Con esto activo, tu teléfono sonará una alarma si alguien activa el botón de pánico en el conjunto.',
  },
  {
    targetId: 'settings.battery',
    title: 'Optimización de batería',
    text: 'Evita que el sistema mate la app en segundo plano, para que la alarma de pánico te llegue con la app cerrada.',
  },
  {
    targetId: 'settings.autostart',
    title: 'Inicio automático',
    text: 'Requerido por tu fabricante (Xiaomi, Huawei, Oppo…) para que las notificaciones lleguen con la app cerrada.',
    placement: 'top',
  },
];

export default function SettingsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { resetTour, startTour } = useCoachmark();
  const { showError, showSuccess, showInfo, showQuestion, showWarning } = useAlert()
  const gs = useGlobalStyles();
  const {
    biometricEnabled, biometricSupported, biometricType, hydrated, hydrate,
    setBiometricEnabled, panicAlertsEnabled, setPanicAlertsEnabled,
  } = useSettingsStore();

  const isAndroid = Platform.OS === 'android';
  const [batteryExempt, setBatteryExempt] = useState(true);

  // First-run walkthrough targets + trigger.
  const biometricRef = useCoachmarkTarget('settings.biometric');
  const panicAlertsRef = useCoachmarkTarget('settings.panicAlerts');
  const batteryRef = useCoachmarkTarget('settings.battery');
  const autostartRef = useCoachmarkTarget('settings.autostart');

  const refreshPermissions = useCallback(() => {
    if (!isAndroid) return;
    PanicSound?.isIgnoringBatteryOptimizations().then(setBatteryExempt);
  }, [isAndroid]);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  // Re-check on focus — the user may return from the battery settings screen.
  useFocusEffect(refreshPermissions);

  useFocusEffect(
    useCallback(() => {
      const t = setTimeout(() => startTour(SETTINGS_TOUR_STEPS, { persistKey: 'settings_v1' }), 700);
      return () => clearTimeout(t);
    }, [startTour]),
  );

  const handleBiometricToggle = async (value: boolean) => {
    if (value && !biometricSupported) {
      showError( 'Este dispositivo no tiene autenticación biométrica configurada.', 'No disponible');
      return;
    }
    await setBiometricEnabled(value);
  };

  const handlePanicToggle = async (value: boolean) => {
    if (!value) {
      showQuestion(
        'Desactivar alertas de pánico',
        'No recibirás la alarma cuando alguien active el botón de pánico en tu conjunto. ¿Continuar?',
        {buttons: [
          { text: 'Cancelar', style: 'danger', onPress: () => {} },
          { text: 'Desactivar', style: 'primary', onPress: () => setPanicAlertsEnabled(false) },
        ]},
      );
      return;
    }
    await setPanicAlertsEnabled(true);
  };

  const requestBattery = async () => {
    await PanicSound?.requestIgnoreBatteryOptimizations();
    refreshPermissions();
  };

  // Clear all "seen" flags and jump to Home — its useFocusEffect replays the
  // Home tour immediately; Profile and this screen's own tour replay next time
  // each is opened.
  const handleReplayTutorial = useCallback(async () => {
    await Promise.all([resetTour('home_v2'), resetTour('profile_v1'), resetTour('settings_v1')]);
    (navigation as any).navigate('Main', { screen: 'HomeTab', params: { screen: 'Home' } });
  }, [resetTour, navigation]);

  return (
    <View style={gs.screen}>
      <AppHeader title="Ajustes" showBack onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + SPACING.xxl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Seguridad */}
        <View>
          <CustomTextComponent
            fontSize={FONT_SIZE.xs}
            fontWeight={FONT_WEIGHT.semibold as any}
            color={colors.textTertiary}
            style={styles.sectionLabel}
          >
            SEGURIDAD
          </CustomTextComponent>

          <Card style={styles.card}>
            <View ref={biometricRef} collapsable={false} style={styles.row}>
              <View style={[styles.iconBox, { backgroundColor: colors.primarySurface }]}>
                <Icon name="fingerprint" size={20} color={colors.primary} />
              </View>
              <View style={gs.flex1}>
                <CustomTextComponent fontSize={FONT_SIZE.md} fontWeight={FONT_WEIGHT.medium as any} color={colors.textPrimary}>
                  {biometricType ?? 'Autenticación biométrica'}
                </CustomTextComponent>
                <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} style={{ marginTop: 1 }}>
                  {biometricSupported
                    ? 'Requerir biometría al abrir la app'
                    : 'No disponible en este dispositivo'}
                </CustomTextComponent>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={handleBiometricToggle}
                disabled={!biometricSupported}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>
          </Card>
        </View>

        {/* Alertas de pánico */}
        <View style={{ marginTop: SPACING.md }}>
          <CustomTextComponent
            fontSize={FONT_SIZE.xs}
            fontWeight={FONT_WEIGHT.semibold as any}
            color={colors.textTertiary}
            style={styles.sectionLabel}
          >
            ALERTAS DE PÁNICO
          </CustomTextComponent>

          <Card style={styles.card}>
            {/* Recibir alertas */}
            <View ref={panicAlertsRef} collapsable={false} style={styles.row}>
              <View style={[styles.iconBox, { backgroundColor: '#fdecec' }]}>
                <Icon name="notifications-active" size={20} color="#c00" />
              </View>
              <View style={gs.flex1}>
                <CustomTextComponent fontSize={FONT_SIZE.md} fontWeight={FONT_WEIGHT.medium as any} color={colors.textPrimary}>
                  Recibir alertas de pánico
                </CustomTextComponent>
                <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} style={{ marginTop: 1 }}>
                  Sonar la alarma cuando se active el pánico en el conjunto
                </CustomTextComponent>
              </View>
              <Switch
                value={panicAlertsEnabled}
                onValueChange={handlePanicToggle}
                trackColor={{ false: colors.border, true: '#c00' }}
                thumbColor="#fff"
              />
            </View>

            {/* Batería + autoinicio: entrega de notificaciones (no solo pánico)
                con la app cerrada. No dependen de panicAlertsEnabled. */}
            {isAndroid && (
              <>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <TouchableOpacity
                  ref={batteryRef}
                  style={styles.row}
                  onPress={requestBattery}
                  disabled={batteryExempt}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconBox, { backgroundColor: colors.primarySurface }]}>
                    <Icon name="battery-alert" size={20} color={colors.primary} />
                  </View>
                  <View style={gs.flex1}>
                    <CustomTextComponent fontSize={FONT_SIZE.md} fontWeight={FONT_WEIGHT.medium as any} color={colors.textPrimary}>
                      Ignorar optimización de batería
                    </CustomTextComponent>
                    <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} style={{ marginTop: 1 }}>
                      Asegura que la alarma llegue con la app cerrada
                    </CustomTextComponent>
                  </View>
                  <PermissionStatus granted={batteryExempt} colors={colors} />
                </TouchableOpacity>

                {/* Autoinicio: el fabricante (MIUI/ColorOS/EMUI/…) bloquea que la
                    app despierte para procesar el push si no está activado —
                    sin API pública para verificar el estado, así que no hay check. */}
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <TouchableOpacity
                  ref={autostartRef}
                  style={styles.row}
                  onPress={() => PanicSound?.openAutostartSettings()}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconBox, { backgroundColor: colors.primarySurface }]}>
                    <Icon name="power-settings-new" size={20} color={colors.primary} />
                  </View>
                  <View style={gs.flex1}>
                    <CustomTextComponent fontSize={FONT_SIZE.md} fontWeight={FONT_WEIGHT.medium as any} color={colors.textPrimary}>
                      Permitir inicio automático
                    </CustomTextComponent>
                    <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} style={{ marginTop: 1 }}>
                      Requerido por tu fabricante para recibir notificaciones con la app cerrada
                    </CustomTextComponent>
                  </View>
                  <Icon name="chevron-right" size={24} color={colors.textTertiary} />
                </TouchableOpacity>
              </>
            )}
          </Card>
        </View>

        {/* Ayuda */}
        <View style={{ marginTop: SPACING.md }}>
          <CustomTextComponent
            fontSize={FONT_SIZE.xs}
            fontWeight={FONT_WEIGHT.semibold as any}
            color={colors.textTertiary}
            style={styles.sectionLabel}
          >
            AYUDA
          </CustomTextComponent>

          <Card style={styles.card}>
            <TouchableOpacity style={styles.row} onPress={handleReplayTutorial} activeOpacity={0.7}>
              <View style={[styles.iconBox, { backgroundColor: colors.primarySurface }]}>
                <Icon name="school" size={20} color={colors.primary} />
              </View>
              <View style={gs.flex1}>
                <CustomTextComponent fontSize={FONT_SIZE.md} fontWeight={FONT_WEIGHT.medium as any} color={colors.textPrimary}>
                  Ver tutorial
                </CustomTextComponent>
                <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} style={{ marginTop: 1 }}>
                  Repasa la guía rápida de la pantalla de inicio
                </CustomTextComponent>
              </View>
              <Icon name="chevron-right" size={24} color={colors.textTertiary} />
            </TouchableOpacity>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PermissionStatus({ granted, colors }: { granted: boolean; colors: any }) {
  if (granted) {
    return <Icon name="check-circle" size={22} color="#22a06b" />;
  }
  return <Icon name="chevron-right" size={24} color={colors.textTertiary} />;
}

const styles = StyleSheet.create({
  scroll: {
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  sectionLabel: {
    marginBottom: SPACING.xs,
    marginLeft: SPACING.xs,
    letterSpacing: 0.5,
  },
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minHeight: 56,
    gap: SPACING.sm,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: SPACING.md + 36 + SPACING.sm,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
