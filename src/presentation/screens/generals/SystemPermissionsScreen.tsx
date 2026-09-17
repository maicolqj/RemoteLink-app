import React, { useCallback, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import notifee from '@notifee/react-native';
import CustomTextComponent from '../../components/CustomTextComponent';
import AppHeader from '../../components/AppHeader';
import Card from '../../components/Card';
import { useTheme } from '../../providers/context/ThemeContext';
import { useGlobalStyles } from '../../styles/useGlobalStyles';
import { useAlert } from '../../providers/context/AlertContext';
import { useSettingsStore } from '../../store/settings.store';
import { SPACING } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';
import PanicSound from '../../../shared/modules/PanicSoundModule';

/**
 * Permisos que concede el sistema operativo, no la app.
 *
 * Viven aparte de Ajustes porque no son preferencias: no se activan con un
 * interruptor, cada uno abre una pantalla de Android y el usuario vuelve sin
 * que la app se entere. Mezclados con biometría y alertas de pánico hacían que
 * Ajustes pareciera una lista interminable de cosas rotas.
 *
 * El orden va de lo más básico a lo más específico: sin las notificaciones del
 * sistema, nada de lo que sigue importa.
 */
export default function SystemPermissionsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const gs = useGlobalStyles();
  const { showInfo, showQuestion } = useAlert();
  const autostartConfirmed = useSettingsStore(s => s.autostartConfirmed);
  const confirmAutostartConfigured = useSettingsStore(s => s.confirmAutostartConfigured);

  const isAndroid = Platform.OS === 'android';
  // El permiso de pantalla completa solo existe desde Android 14 (API 34); por
  // debajo se concede al instalar y no hay pantalla de ajustes que abrir.
  const supportsFsiSetting = isAndroid && Number(Platform.Version) >= 34;

  // Optimistas por defecto: se corrigen en el primer refresh y así no se pinta
  // una advertencia en rojo por un instante al abrir la pantalla.
  const [notifsEnabled, setNotifsEnabled] = useState(true);
  const [batteryExempt, setBatteryExempt] = useState(true);
  const [fullScreenAllowed, setFullScreenAllowed] = useState(true);
  const [dndAccess, setDndAccess] = useState(true);

  const refreshPermissions = useCallback(() => {
    if (!isAndroid) return;
    // Sin .catch: el wrapper de PanicSound ya atrapa y resuelve un valor seguro.
    PanicSound?.areNotificationsEnabled().then(setNotifsEnabled);
    PanicSound?.isIgnoringBatteryOptimizations().then(setBatteryExempt);
    PanicSound?.canUseFullScreenIntent().then(setFullScreenAllowed);
    PanicSound?.isNotificationPolicyAccessGranted().then(setDndAccess);
  }, [isAndroid]);

  // Se revisa en cada foco: el usuario vuelve de los ajustes de Android y la app
  // no recibe ningún aviso de lo que hizo allí.
  useFocusEffect(refreshPermissions);

  const openSystemNotifications = async () => {
    // Notifee ya expone la pantalla de notificaciones de la app, así que no hace
    // falta un intent propio en Kotlin.
    await notifee.openNotificationSettings();
    refreshPermissions();
  };

  const requestBattery = async () => {
    await PanicSound?.requestIgnoreBatteryOptimizations();
    refreshPermissions();
  };

  const requestFullScreen = async () => {
    const opened = await PanicSound?.openFullScreenIntentSettings();
    if (!opened) {
      showInfo(
        'Tu versión de Android no expone esta pantalla. La alerta se mostrará igual sobre la pantalla bloqueada.',
        'No disponible',
      );
    }
    refreshPermissions();
  };

  /**
   * Abre la pantalla del fabricante y, al volver, pregunta si quedó activado.
   * Es la única forma de saberlo: Android no expone el estado de este permiso.
   * Responder que sí corta el recordatorio periódico del arranque.
   */
  const openAutostart = () => {
    PanicSound?.openAutostartSettings();
    // El diálogo se encola detrás de la pantalla del sistema: cuando el usuario
    // vuelve a la app, se lo encuentra esperando.
    showQuestion(
      'Si activaste el inicio automático para RemoteLink, confírmalo y dejaremos de recordártelo.',
      '¿Quedó activado?',
      {
        buttons: [
          { text: 'Todavía no', style: 'secondary', onPress: () => {} },
          { text: 'Sí, lo activé', style: 'primary', onPress: () => { confirmAutostartConfigured(); } },
        ],
      },
    );
  };

  const requestDndAccess = () => {
    // Es una lista de todo el dispositivo, no una pantalla por app: hay que
    // decirle al usuario qué buscar o se queda mirando decenas de apps.
    showInfo(
      'Se abrirá la lista de "Acceso a No molestar". Busca RemoteLink y actívalo para que la alarma suene aunque tengas el modo No molestar encendido.',
      'Buscar RemoteLink en la lista',
      { buttons: [{ text: 'Entendido', style: 'primary', onPress: () => {
        PanicSound?.openNotificationPolicySettings();
      } }] },
    );
  };

  return (
    <View style={gs.screen}>
      <AppHeader title="Permisos del sistema" showBack onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + SPACING.xxl }]}
        showsVerticalScrollIndicator={false}
      >
        <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} style={styles.lede}>
          Estos permisos los concede Android, no RemoteLink. Sin ellos las alertas pueden no
          llegarte con la app cerrada.
        </CustomTextComponent>

        {isAndroid ? (
          <Card style={styles.card}>
            {/* Primero el más básico: sin esto, nada de lo de abajo importa. */}
            <TouchableOpacity style={styles.row} onPress={openSystemNotifications} activeOpacity={0.7}>
              <View style={[styles.iconBox, { backgroundColor: colors.primarySurface }]}>
                <Icon
                  name={notifsEnabled ? 'notifications' : 'notifications-off'}
                  size={20}
                  color={notifsEnabled ? colors.primary : colors.error}
                />
              </View>
              <View style={gs.flex1}>
                <CustomTextComponent fontSize={FONT_SIZE.md} fontWeight={FONT_WEIGHT.medium as any} color={colors.textPrimary}>
                  Notificaciones del sistema
                </CustomTextComponent>
                <CustomTextComponent
                  fontSize={FONT_SIZE.sm}
                  color={notifsEnabled ? colors.textSecondary : colors.error}
                  style={styles.rowSubtitle}>
                  {notifsEnabled
                    ? 'RemoteLink puede mostrarte notificaciones'
                    : 'Están bloqueadas: no recibirás ninguna alerta'}
                </CustomTextComponent>
              </View>
              <PermissionStatus granted={notifsEnabled} colors={colors} />
            </TouchableOpacity>

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
                <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} style={styles.rowSubtitle}>
                  Asegura que la alarma llegue con la app cerrada
                </CustomTextComponent>
              </View>
              <PermissionStatus granted={batteryExempt} colors={colors} />
            </TouchableOpacity>

            {/* Pantalla completa: Android 14+ solo lo concede a apps de llamadas
                o alarmas. Sin él, la alerta NO enciende la pantalla bloqueada —
                el sistema la degrada a un aviso normal, en silencio y sin error
                en ningún log. */}
            {supportsFsiSetting && (
              <>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <TouchableOpacity
                  style={styles.row}
                  onPress={requestFullScreen}
                  disabled={fullScreenAllowed}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconBox, { backgroundColor: colors.primarySurface }]}>
                    <Icon name="fullscreen" size={20} color={fullScreenAllowed ? colors.primary : colors.error} />
                  </View>
                  <View style={gs.flex1}>
                    <CustomTextComponent fontSize={FONT_SIZE.md} fontWeight={FONT_WEIGHT.medium as any} color={colors.textPrimary}>
                      Alertas de pantalla completa
                    </CustomTextComponent>
                    <CustomTextComponent
                      fontSize={FONT_SIZE.sm}
                      color={fullScreenAllowed ? colors.textSecondary : colors.error}
                      style={styles.rowSubtitle}>
                      {fullScreenAllowed
                        ? 'La alarma puede encender la pantalla bloqueada'
                        : 'Sin esto la alarma no enciende la pantalla bloqueada'}
                    </CustomTextComponent>
                  </View>
                  <PermissionStatus granted={fullScreenAllowed} colors={colors} />
                </TouchableOpacity>
              </>
            )}

            {/* No Molestar: sin este acceso Android ignora el bypassDnd del canal
                de pánico y la alarma queda muda justo de noche. */}
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <TouchableOpacity
              style={styles.row}
              onPress={requestDndAccess}
              disabled={dndAccess}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, { backgroundColor: colors.primarySurface }]}>
                <Icon name="do-not-disturb-on" size={20} color={colors.primary} />
              </View>
              <View style={gs.flex1}>
                <CustomTextComponent fontSize={FONT_SIZE.md} fontWeight={FONT_WEIGHT.medium as any} color={colors.textPrimary}>
                  Sonar en modo No molestar
                </CustomTextComponent>
                <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} style={styles.rowSubtitle}>
                  {dndAccess
                    ? 'La alarma suena aunque tengas No molestar activo'
                    : 'Ahora mismo el modo No molestar silencia la alarma'}
                </CustomTextComponent>
              </View>
              <PermissionStatus granted={dndAccess} colors={colors} />
            </TouchableOpacity>

            {/* Autoinicio: el fabricante (MIUI/ColorOS/EMUI/…) bloquea que la app
                despierte para procesar el push si no está activado — sin API
                pública para verificar el estado, así que no hay check. */}
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <TouchableOpacity style={styles.row} onPress={openAutostart} activeOpacity={0.7}>
              <View style={[styles.iconBox, { backgroundColor: colors.primarySurface }]}>
                <Icon name="power-settings-new" size={20} color={colors.primary} />
              </View>
              <View style={gs.flex1}>
                <CustomTextComponent fontSize={FONT_SIZE.md} fontWeight={FONT_WEIGHT.medium as any} color={colors.textPrimary}>
                  Permitir inicio automático
                </CustomTextComponent>
                <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} style={styles.rowSubtitle}>
                  {autostartConfirmed
                    ? 'Lo marcaste como activado'
                    : 'Requerido por tu fabricante para recibir notificaciones con la app cerrada'}
                </CustomTextComponent>
              </View>
              {/* El chulo refleja lo que declaró el usuario, no una lectura del
                  sistema: este permiso no se puede consultar desde la app. */}
              {autostartConfirmed
                ? <Icon name="check-circle" size={22} color={colors.success} />
                : <Icon name="chevron-right" size={24} color={colors.textTertiary} />}
            </TouchableOpacity>
          </Card>
        ) : (
          <Card>
            <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary}>
              En este dispositivo los permisos se administran desde los ajustes del sistema.
            </CustomTextComponent>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PermissionStatus({ granted, colors }: { granted: boolean; colors: any }) {
  if (granted) {
    return <Icon name="check-circle" size={22} color={colors.success} />;
  }
  return <Icon name="chevron-right" size={24} color={colors.textTertiary} />;
}

const styles = StyleSheet.create({
  scroll: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  lede: {
    lineHeight: FONT_SIZE.sm * 1.5,
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
  rowSubtitle: {
    marginTop: 1,
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
