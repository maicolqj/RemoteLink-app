import React, { useCallback, useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Switch, Alert, TouchableOpacity, Platform } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomTextComponent from '../../components/CustomTextComponent';
import AppHeader from '../../components/AppHeader';
import Card from '../../components/Card';
import { useTheme } from '../../providers/context/ThemeContext';
import { useCoachmark } from '../../providers/context/CoachmarkContext';
import { useGlobalStyles } from '../../styles/useGlobalStyles';
import { useSettingsStore } from '../../store/settings.store';
import { SPACING } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';
import PanicSound from '../../../shared/modules/PanicSoundModule';
import { useAlert } from '../../providers/context/AlertContext';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { resetTour } = useCoachmark();
  const { showError, showSuccess, showInfo, showQuestion, showWarning } = useAlert()
  const gs = useGlobalStyles();
  const {
    biometricEnabled, biometricSupported, biometricType, hydrated, hydrate,
    setBiometricEnabled, panicAlertsEnabled, setPanicAlertsEnabled,
  } = useSettingsStore();

  const isAndroid = Platform.OS === 'android';
  const [batteryExempt, setBatteryExempt] = useState(true);

  const refreshPermissions = useCallback(() => {
    if (!isAndroid) return;
    PanicSound?.isIgnoringBatteryOptimizations().then(setBatteryExempt);
  }, [isAndroid]);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  // Re-check on focus — the user may return from the battery settings screen.
  useFocusEffect(refreshPermissions);

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

  // Clear the "seen" flag and jump to Home, where useFocusEffect replays the tour.
  const handleReplayTutorial = useCallback(async () => {
    await resetTour('home_v1');
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
            <View style={styles.row}>
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
            <View style={styles.row}>
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

            {/* Batería: ayuda a que la alarma llegue con la app cerrada */}
            {isAndroid && panicAlertsEnabled && (
              <>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <TouchableOpacity
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
