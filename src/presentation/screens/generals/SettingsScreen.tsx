import React, { useCallback, useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Switch, TouchableOpacity, Platform } from 'react-native';
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
import { LEGAL_LINKS, type LegalDocument } from '../../constants/legal';
import { hasAccessCode } from '../../../infraestructure/services/deviceAuth.service';
import { useAlert } from '../../providers/context/AlertContext';

// Texto exigido por la política de eliminación de cuentas de Google Play: hay
// que decir qué se pierde y que no hay vuelta atrás ANTES de mandar al
// formulario. No lo recortes sin revisar la política.
const DELETE_ACCOUNT_WARNING =
  'Al eliminar su cuenta perderá el acceso a la aplicación. No podrá recibir llamadas ' +
  'de citofonía virtual, autorizar visitantes, recibir avisos de correspondencia ni ' +
  'emitir alertas de pánico desde la aplicación.\n\n' +
  'La eliminación es irreversible. Si más adelante desea volver a usar el servicio, ' +
  'deberá solicitar un nuevo registro ante la administración de su conjunto.\n\n' +
  'Si solo desea dejar de recibir notificaciones, no necesita eliminar su cuenta: ' +
  'puede desactivarlas desde la configuración de su dispositivo.';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { resetTour } = useCoachmark();
  const { showError, showQuestion, showWarning } = useAlert()
  const gs = useGlobalStyles();
  const {
    biometricEnabled, biometricSupported, biometricType, hydrated, hydrate,
    setBiometricEnabled, panicAlertsEnabled, setPanicAlertsEnabled,
  } = useSettingsStore();

  const isAndroid = Platform.OS === 'android';
  // Se pregunta al servidor: la clave es de la cuenta y pudo crearse en otro
  // equipo, así que la vinculación local no responde si ya existe.
  const [accountHasCode, setAccountHasCode] = useState<boolean | null>(null);

  const refreshAccessCode = useCallback(() => {
    hasAccessCode().then(setAccountHasCode).catch(() => setAccountHasCode(null));
  }, []);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  // Se revisa en cada foco: la clave pudo crearse en la pantalla anterior.
  useFocusEffect(refreshAccessCode);

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
        'No recibirás la alarma cuando alguien active el botón de pánico en tu conjunto. ¿Continuar?',
        'Desactivar alertas de pánico',
        {buttons: [
          { text: 'Cancelar', style: 'danger', onPress: () => {} },
          { text: 'Desactivar', style: 'primary', onPress: () => setPanicAlertsEnabled(false) },
        ]},
      );
      return;
    }
    await setPanicAlertsEnabled(true);
  };

  // Todos los documentos —legales y el formulario de eliminación— se ven en el
  // WebView de la app (pantalla `Legal`, en el root stack: de ahí el navigate
  // sin tipar). Si la carga falla, esa pantalla muestra la URL y el correo de
  // soporte como salida.
  const openLegal = useCallback(
    (doc: LegalDocument) =>
      (navigation as any).navigate('Legal', { url: doc.url, title: doc.title }),
    [navigation],
  );

  const confirmAccountDeletion = useCallback(() => {
    showWarning(DELETE_ACCOUNT_WARNING, 'Solicitar eliminación de cuenta', {
      position: 'top',
      buttons: [
        { text: 'Cancelar', style: 'secondary', onPress: () => {} },
        {
          text: 'Continuar',
          style: 'primary',
          onPress: () => openLegal(LEGAL_LINKS.deleteAccount),
        },
      ],
    });
  }, [showWarning, openLegal]);

  // Borra la marca de "visto" y salta a Inicio, cuyo useFocusEffect relanza el
  // recorrido de inmediato. Es el único que queda: los de Perfil y Ajustes se
  // retiraron.
  const handleReplayTutorial = useCallback(async () => {
    await resetTour('home_v2');
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

        {/* Cuenta — la eliminación va aquí arriba a propósito: Google Play
            exige que la ruta se encuentre fácil, no enterrada al final de la
            lista de permisos de Android. Un toque abre el diálogo y el segundo
            ("Continuar") abre el formulario. */}
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

            {/* Los permisos de entrega —notificaciones, batería, pantalla
                completa, No molestar, inicio automático— viven en su propia
                pantalla: no son preferencias de la app sino concesiones de
                Android, y apilados aquí convertían Ajustes en una lista
                interminable. Ninguno depende de panicAlertsEnabled: apagar el
                interruptor silencia la alarma, pero esos permisos siguen
                afectando al resto de notificaciones. */}
            {isAndroid && (
              <>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <TouchableOpacity
                  style={styles.row}
                  onPress={() => (navigation as any).navigate('SystemPermissions')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconBox, { backgroundColor: colors.primarySurface }]}>
                    <Icon name="tune" size={20} color={colors.primary} />
                  </View>
                  <View style={gs.flex1}>
                    <CustomTextComponent fontSize={FONT_SIZE.md} fontWeight={FONT_WEIGHT.medium as any} color={colors.textPrimary}>
                      Permisos del sistema
                    </CustomTextComponent>
                    <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} style={{ marginTop: 1 }}>
                      Notificaciones, No molestar e inicio automático
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
                  Términos y Condiciones de Uso
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
                  Política de Privacidad
                </CustomTextComponent>
                <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} style={{ marginTop: 1 }}>
                  Cómo tratamos tus datos personales
                </CustomTextComponent>
              </View>
              <Icon name="chevron-right" size={24} color={colors.textTertiary} />
            </TouchableOpacity>
          </Card>
        </View>

        {/* Cuenta — va de última, separada del resto: es la acción irreversible
            de la pantalla. Sigue cumpliendo la política de Google Play, que
            exige como máximo dos toques desde aquí (ítem → "Continuar");
            desplazarse hasta el final no cuenta como toque. */}
        <View style={{ marginTop: SPACING.md }}>
          <CustomTextComponent
            fontSize={FONT_SIZE.xs}
            fontWeight={FONT_WEIGHT.semibold as any}
            color={colors.textTertiary}
            style={styles.sectionLabel}
          >
            CUENTA
          </CustomTextComponent>

          <Card style={styles.card}>
            <TouchableOpacity
              style={styles.row}
              onPress={confirmAccountDeletion}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Solicitar eliminación de cuenta"
            >
              <View style={[styles.iconBox, { backgroundColor: colors.errorLight }]}>
                <Icon name="person-remove" size={20} color={colors.error} />
              </View>
              <View style={gs.flex1}>
                <CustomTextComponent fontSize={FONT_SIZE.md} fontWeight={FONT_WEIGHT.medium as any} color={colors.error}>
                  Solicitar eliminación de cuenta
                </CustomTextComponent>
                <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} style={{ marginTop: 1 }}>
                  Perderás el acceso a la aplicación de forma permanente
                </CustomTextComponent>
              </View>
              <Icon name="open-in-new" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
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
