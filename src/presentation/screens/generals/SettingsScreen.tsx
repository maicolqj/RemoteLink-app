import React, { useCallback, useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Switch, Alert, TouchableOpacity, Platform } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import notifee from '@notifee/react-native';
import CustomTextComponent from '../../components/CustomTextComponent';
import AppHeader from '../../components/AppHeader';
import Card from '../../components/Card';
import { useTheme } from '../../providers/context/ThemeContext';
import { useCoachmark, useCoachmarkTarget, type CoachStep } from '../../providers/context/CoachmarkContext';
import { useGlobalStyles } from '../../styles/useGlobalStyles';
import { useSettingsStore } from '../../store/settings.store';
import { SPACING } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';
import { LEGAL_LINKS, type LegalDocument } from '../../constants/legal';
import PanicSound from '../../../shared/modules/PanicSoundModule';
import { hasAccessCode } from '../../../infraestructure/services/deviceAuth.service';
import { useAlert } from '../../providers/context/AlertContext';

// First-run walkthrough. Bump the persistKey suffix to re-show it to everyone.
// Battery/autostart targets only render on Android — on iOS their refs never
// attach to a node, so the tour skips them automatically (see goToStep/next
// in CoachmarkContext, which measure-and-skip unmeasurable targets). Lo mismo
// aplica a 'settings.fullScreen', que solo se pinta en Android 14+.
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
    targetId: 'settings.fullScreen',
    title: 'Alertas de pantalla completa',
    text: 'Sin este permiso la alarma no enciende la pantalla si el celular está bloqueado. Android no avisa cuando falta.',
  },
  {
    targetId: 'settings.dnd',
    title: 'Sonar en No molestar',
    text: 'Permite que la alarma de pánico suene aunque tengas el modo No molestar activo, por ejemplo de noche.',
    placement: 'top',
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
  // El permiso de pantalla completa solo existe desde Android 14 (API 34); por
  // debajo se concede al instalar y no hay pantalla de ajustes que abrir.
  const supportsFsiSetting = isAndroid && Number(Platform.Version) >= 34;
  const [batteryExempt, setBatteryExempt] = useState(true);
  // Preconditions de entrega del pánico. Optimistas por defecto: se corrigen en
  // el primer refresh y así no se pinta una advertencia en rojo por un instante.
  const [notifsEnabled, setNotifsEnabled] = useState(true);
  const [fullScreenAllowed, setFullScreenAllowed] = useState(true);
  const [dndAccess, setDndAccess] = useState(true);
  // Se pregunta al servidor: la clave es de la cuenta y pudo crearse en otro
  // equipo, así que la vinculación local no responde si ya existe.
  const [accountHasCode, setAccountHasCode] = useState<boolean | null>(null);

  // First-run walkthrough targets + trigger.
  const biometricRef = useCoachmarkTarget('settings.biometric');
  const panicAlertsRef = useCoachmarkTarget('settings.panicAlerts');
  const batteryRef = useCoachmarkTarget('settings.battery');
  const fullScreenRef = useCoachmarkTarget('settings.fullScreen');
  const dndRef = useCoachmarkTarget('settings.dnd');
  const autostartRef = useCoachmarkTarget('settings.autostart');

  const refreshPermissions = useCallback(() => {
    hasAccessCode().then(setAccountHasCode).catch(() => setAccountHasCode(null));
    if (!isAndroid) return;
    // Sin .catch: el wrapper de PanicSound ya atrapa y resuelve un valor seguro.
    PanicSound?.isIgnoringBatteryOptimizations().then(setBatteryExempt);
    PanicSound?.areNotificationsEnabled().then(setNotifsEnabled);
    PanicSound?.canUseFullScreenIntent().then(setFullScreenAllowed);
    PanicSound?.isNotificationPolicyAccessGranted().then(setDndAccess);
  }, [isAndroid]);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  // Re-check on focus — the user may return from the battery settings screen.
  useFocusEffect(refreshPermissions);

  useFocusEffect(
    useCallback(() => {
      // v2: se agregaron los pasos de pantalla completa y No molestar, así que
      // el tour vuelve a mostrarse una vez a quien ya había visto el anterior.
      const t = setTimeout(() => startTour(SETTINGS_TOUR_STEPS, { persistKey: 'settings_v2' }), 700);
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

  const openSystemNotifications = async () => {
    // Ajustes de notificación de la app. Notifee ya expone la pantalla, así que
    // no hace falta un intent propio en Kotlin.
    await notifee.openNotificationSettings();
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

  const requestDndAccess = async () => {
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

  // Clear all "seen" flags and jump to Home — its useFocusEffect replays the
  // Home tour immediately; Profile and this screen's own tour replay next time
  // each is opened.
  // Legal vive en el root stack, no en ProfileStack — de ahí el navigate sin tipar.
  const openLegal = useCallback(
    (doc: LegalDocument) =>
      (navigation as any).navigate('Legal', { url: doc.url, title: doc.title }),
    [navigation],
  );

  const handleReplayTutorial = useCallback(async () => {
    await Promise.all([resetTour('home_v2'), resetTour('profile_v1'), resetTour('settings_v2')]);
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

            {/* Clave de acceso: entrar sin esperar códigos por WhatsApp. */}
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <TouchableOpacity
              style={styles.row}
              // Deshabilitada hasta saber que la cuenta ya tiene clave: crearla
              // desde aquí no aplica, porque ese camino es la pantalla
              // obligatoria del primer ingreso.
              disabled={accountHasCode !== true}
              onPress={() => (navigation as any).navigate('SetAccessCode')}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, { backgroundColor: colors.primarySurface }]}>
                <Icon name="lock" size={20} color={accountHasCode === true ? colors.primary : colors.textTertiary} />
              </View>
              <View style={gs.flex1}>
                <CustomTextComponent
                  fontSize={FONT_SIZE.md}
                  fontWeight={FONT_WEIGHT.medium as any}
                  color={accountHasCode === true ? colors.textPrimary : colors.textTertiary}>
                  Cambiar mi clave de acceso
                </CustomTextComponent>
                <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} style={{ marginTop: 1 }}>
                  {accountHasCode === true
                    ? 'Te pediremos la clave actual para confirmar que eres tú'
                    : 'Disponible cuando tengas una clave creada'}
                </CustomTextComponent>
              </View>
              <Icon name="chevron-right" size={24} color={colors.textTertiary} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <TouchableOpacity
              style={styles.row}
              onPress={() => (navigation as any).navigate('MyDevices')}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, { backgroundColor: colors.primarySurface }]}>
                <Icon name="devices" size={20} color={colors.primary} />
              </View>
              <View style={gs.flex1}>
                <CustomTextComponent fontSize={FONT_SIZE.md} fontWeight={FONT_WEIGHT.medium as any} color={colors.textPrimary}>
                  Dispositivos vinculados
                </CustomTextComponent>
                <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} style={{ marginTop: 1 }}>
                  Revisa y desvincula equipos con acceso a tu cuenta
                </CustomTextComponent>
              </View>
              <Icon name="chevron-right" size={24} color={colors.textTertiary} />
            </TouchableOpacity>
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

            {/* Permisos de entrega (no solo pánico) con la app cerrada. Ninguno
                depende de panicAlertsEnabled: apagar el toggle silencia la
                alarma, pero estos siguen afectando al resto de notificaciones. */}
            {isAndroid && (
              <>
                {/* Primero el más básico: sin esto, nada de lo de abajo importa. */}
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <TouchableOpacity
                  style={styles.row}
                  onPress={openSystemNotifications}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconBox, { backgroundColor: colors.primarySurface }]}>
                    <Icon
                      name={notifsEnabled ? 'notifications' : 'notifications-off'}
                      size={20}
                      color={notifsEnabled ? colors.primary : '#c00'}
                    />
                  </View>
                  <View style={gs.flex1}>
                    <CustomTextComponent fontSize={FONT_SIZE.md} fontWeight={FONT_WEIGHT.medium as any} color={colors.textPrimary}>
                      Notificaciones del sistema
                    </CustomTextComponent>
                    <CustomTextComponent fontSize={FONT_SIZE.sm} color={notifsEnabled ? colors.textSecondary : '#c00'} style={{ marginTop: 1 }}>
                      {notifsEnabled
                        ? 'RemoteLink puede mostrarte notificaciones'
                        : 'Están bloqueadas: no recibirás ninguna alerta'}
                    </CustomTextComponent>
                  </View>
                  <PermissionStatus granted={notifsEnabled} colors={colors} />
                </TouchableOpacity>

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

                {/* Pantalla completa: Android 14+ solo lo concede solo a apps de
                    llamadas o alarmas. Sin él, la alerta NO enciende la pantalla
                    bloqueada — el sistema la degrada a un aviso normal, en
                    silencio y sin error en ningún log. */}
                {supportsFsiSetting && (
                  <>
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <TouchableOpacity
                      ref={fullScreenRef}
                      style={styles.row}
                      onPress={requestFullScreen}
                      disabled={fullScreenAllowed}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.iconBox, { backgroundColor: colors.primarySurface }]}>
                        <Icon name="fullscreen" size={20} color={fullScreenAllowed ? colors.primary : '#c00'} />
                      </View>
                      <View style={gs.flex1}>
                        <CustomTextComponent fontSize={FONT_SIZE.md} fontWeight={FONT_WEIGHT.medium as any} color={colors.textPrimary}>
                          Alertas de pantalla completa
                        </CustomTextComponent>
                        <CustomTextComponent fontSize={FONT_SIZE.sm} color={fullScreenAllowed ? colors.textSecondary : '#c00'} style={{ marginTop: 1 }}>
                          {fullScreenAllowed
                            ? 'La alarma puede encender la pantalla bloqueada'
                            : 'Sin esto la alarma no enciende la pantalla bloqueada'}
                        </CustomTextComponent>
                      </View>
                      <PermissionStatus granted={fullScreenAllowed} colors={colors} />
                    </TouchableOpacity>
                  </>
                )}

                {/* No Molestar: sin este acceso Android ignora el bypassDnd del
                    canal de pánico y la alarma queda muda justo de noche. */}
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <TouchableOpacity
                  ref={dndRef}
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
                    <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} style={{ marginTop: 1 }}>
                      {dndAccess
                        ? 'La alarma suena aunque tengas No molestar activo'
                        : 'Ahora mismo el modo No molestar silencia la alarma'}
                    </CustomTextComponent>
                  </View>
                  <PermissionStatus granted={dndAccess} colors={colors} />
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

        {/* Legal */}
        <View style={{ marginTop: SPACING.md }}>
          <CustomTextComponent
            fontSize={FONT_SIZE.xs}
            fontWeight={FONT_WEIGHT.semibold as any}
            color={colors.textTertiary}
            style={styles.sectionLabel}
          >
            LEGAL
          </CustomTextComponent>

          <Card style={styles.card}>
            <TouchableOpacity
              style={styles.row}
              onPress={() => openLegal(LEGAL_LINKS.terms)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, { backgroundColor: colors.primarySurface }]}>
                <Icon name="description" size={20} color={colors.primary} />
              </View>
              <View style={gs.flex1}>
                <CustomTextComponent fontSize={FONT_SIZE.md} fontWeight={FONT_WEIGHT.medium as any} color={colors.textPrimary}>
                  Términos y condiciones
                </CustomTextComponent>
                <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} style={{ marginTop: 1 }}>
                  Condiciones de uso del servicio
                </CustomTextComponent>
              </View>
              <Icon name="chevron-right" size={24} color={colors.textTertiary} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <TouchableOpacity
              style={styles.row}
              onPress={() => openLegal(LEGAL_LINKS.privacy)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, { backgroundColor: colors.primarySurface }]}>
                <Icon name="privacy-tip" size={20} color={colors.primary} />
              </View>
              <View style={gs.flex1}>
                <CustomTextComponent fontSize={FONT_SIZE.md} fontWeight={FONT_WEIGHT.medium as any} color={colors.textPrimary}>
                  Política de privacidad
                </CustomTextComponent>
                <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} style={{ marginTop: 1 }}>
                  Cómo tratamos tus datos personales
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
