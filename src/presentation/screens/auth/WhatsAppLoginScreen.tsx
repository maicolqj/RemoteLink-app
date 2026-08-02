import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Text,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import Share from 'react-native-share';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomTextComponent from '../../components/CustomTextComponent';
import CustomInputComponent from '../../components/CustomInputComponent';
import CodeSegmentInput from '../../components/CodeSegmentInput';
import CustomButtonComponent from '../../components/CustomButtonComponent';
import AppHeader from '../../components/AppHeader';
import { useTheme } from '../../providers/context/ThemeContext';
import type { AuthStackParamList } from '../../navigation/types/NavigationTypes';
import {
  requestWhatsAppLoginChallenge,
  fetchWhatsAppLoginStatus,
  redeemWhatsAppLogin,
  persistSession,
  saveLastIdentity,
  getLastIdentity,
  type WhatsAppLoginChallenge,
  type DeviceAuthError,
} from '../../../infraestructure/services/deviceAuth.service';
import { SPACING, RADIUS, ICON_SIZE } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';

type Route = RouteProp<AuthStackParamList, 'LoginWhatsApp'>;

const POLL_MS = 2500;
/** El challenge vive 2 minutos; cortamos el polling al vencer. */
const CHALLENGE_SECONDS = 120;

const isValidIdentity = (v: string) => v.trim().length >= 6;

export default function WhatsAppLoginScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const { colors } = useTheme();

  const [identity, setIdentity] = useState(route.params?.identity ?? '');
  const [identityError, setIdentityError] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [error, setError] = useState('');
  const [unavailable, setUnavailable] = useState(false);
  const [expired, setExpired] = useState(false);
  const [remaining, setRemaining] = useState(0);

  // Datos visibles del challenge. El `challengeId` NO vive aquí: se guarda solo
  // en memoria (ref) y nunca se muestra en pantalla ni se persiste.
  const [challenge, setChallenge] = useState<Omit<WhatsAppLoginChallenge, 'challengeId'> | null>(null);
  const [needsAccessCode, setNeedsAccessCode] = useState(false);
  const [accessCode, setAccessCode] = useState('');

  const challengeIdRef = useRef<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimers = useCallback(() => {
    pollRef.current && clearInterval(pollRef.current);
    countdownRef.current && clearInterval(countdownRef.current);
    pollRef.current = null;
    countdownRef.current = null;
  }, []);

  useEffect(() => stopTimers, [stopTimers]);

  useEffect(() => {
    if (route.params?.identity) return;
    getLastIdentity().then(v => v && setIdentity(prev => prev || v));
  }, [route.params?.identity]);

  /**
   * `code` solo viaja cuando la cuenta ya tiene clave. El servidor lo exige para
   * vincular un equipo nuevo: enviarse el WhatsApp prueba que se tiene el
   * teléfono, y quien lo roba se lleva también la línea. La clave aporta el
   * factor que el ladrón no tiene.
   */
  const redeem = useCallback(async (code?: string) => {
    const challengeId = challengeIdRef.current;
    if (!challengeId) return;
    stopTimers();
    setIsRedeeming(true);
    try {
      const result = await redeemWhatsAppLogin(challengeId, code);
      await saveLastIdentity(identity);
      await persistSession(result);
    } catch (e) {
      const err = e as DeviceAuthError;
      setIsRedeeming(false);

      // El challenge quedó confirmado y sigue vivo: solo falta la clave. Se pide
      // en esta misma pantalla, sin reiniciar el flujo ni gastar otro mensaje.
      if (err.code === 'ACCESS_CODE_REQUIRED' || err.code === 'ACCESS_CODE_INVALID') {
        setNeedsAccessCode(true);
        setAccessCode('');
        setError(err.code === 'ACCESS_CODE_INVALID' ? err.message : '');
        return;
      }

      setError(err.message);
      if (err.code === 'WA_LOGIN_CHALLENGE_EXPIRED' || err.code === 'WA_LOGIN_CHALLENGE_CONSUMED') {
        setExpired(true);
      }
    }
  }, [identity, stopTimers]);

  const poll = useCallback(async () => {
    const challengeId = challengeIdRef.current;
    if (!challengeId) return;
    try {
      const status = await fetchWhatsAppLoginStatus(challengeId);
      if (status === 'CONFIRMED') {
        await redeem();
      } else if (status === 'EXPIRED' || status === 'CONSUMED') {
        stopTimers();
        setExpired(true);
        setError(
          status === 'EXPIRED'
            ? 'El intento venció. Solicita uno nuevo.'
            : 'Este intento ya se usó. Vuelve a empezar.',
        );
      }
    } catch (e) {
      const err = e as DeviceAuthError;
      // PENDING llega como error tipado en algunos caminos: no es un fallo.
      if (err.code === 'WA_LOGIN_CHALLENGE_PENDING') return;
      if (err.code === 'WA_LOGIN_CHALLENGE_EXPIRED' || err.code === 'WA_LOGIN_CHALLENGE_CONSUMED' || err.code === 'WA_LOGIN_CHALLENGE_NOT_FOUND') {
        stopTimers();
        setExpired(true);
        setError(err.message);
      }
      // Errores de red: se reintenta en el siguiente tick del polling.
    }
  }, [redeem, stopTimers]);

  const startWaiting = useCallback(() => {
    setRemaining(CHALLENGE_SECONDS);
    stopTimers();
    pollRef.current = setInterval(poll, POLL_MS);
    countdownRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          stopTimers();
          setExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [poll, stopTimers]);

  const handleRequest = useCallback(async () => {
    if (!isValidIdentity(identity)) {
      setIdentityError('Ingresa tu número de identidad (mínimo 6 dígitos)');
      return;
    }
    setIsRequesting(true);
    setIdentityError('');
    setError('');
    setExpired(false);
    try {
      const result = await requestWhatsAppLoginChallenge(identity);
      // El challengeId solo vive en la ref: nunca en el estado que se renderiza.
      challengeIdRef.current = result.challengeId;
      setChallenge({
        nonce: result.nonce,
        whatsappUrl: result.whatsappUrl,
        messageText: result.messageText,
        expiresAt: result.expiresAt,
        warning: result.warning,
      });
      await saveLastIdentity(identity);
      startWaiting();
    } catch (e) {
      const err = e as DeviceAuthError;
      setError(err.message);
      if (err.code === 'WA_LOGIN_NOT_CONFIGURED') {
        // Canal deshabilitado en el servidor: reintentar aquí no sirve, así que
        // se manda al usuario a los otros métodos. El servicio recuerda el
        // rechazo mientras dure la sesión de la app para ocultar la opción en el
        // login; al reabrirla se vuelve a intentar.
        setChallenge(null);
        setUnavailable(true);
      }
    } finally {
      setIsRequesting(false);
    }
  }, [identity, startWaiting]);

  const openWhatsApp = useCallback(async () => {
    if (!challenge) return;
    try {
      await Linking.openURL(challenge.whatsappUrl);
    } catch {
      setError('No se pudo abrir WhatsApp. Copia el mensaje y envíalo manualmente.');
    }
  }, [challenge]);

  const shareMessage = useCallback(async () => {
    if (!challenge) return;
    try {
      await Share.open({ message: challenge.messageText });
    } catch {
      // El usuario canceló el diálogo del sistema; no es un error.
    }
  }, [challenge]);

  const goToApproval = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    () => (navigation as any).navigate('LoginApproval', { identity: identity.trim() || undefined }),
    [navigation, identity],
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppHeader title="Ingresar por WhatsApp" showBack onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + SPACING.xl }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} style={styles.lede}>
          En lugar de recibir un código, tú envías un mensaje desde tu WhatsApp. No tiene costo
          y el ingreso se confirma solo en este dispositivo.
        </CustomTextComponent>

        {!challenge ? (
          <>
            <CustomInputComponent
              nameInput="Número de identidad"
              placeholder="Ej. 1234567890"
              value={identity}
              onChangeText={v => { setIdentity(v); setIdentityError(''); if (!unavailable) setError(''); }}
              keyboardType="numeric"
              leftIcon={{ name: 'badge', color: colors.primary }}
              error={identityError}
              touched={!!identityError}
              maxLength={20}
              editable={!isRequesting}
            />

            {error ? (
              <View style={[styles.banner, { backgroundColor: colors.error + '14', borderColor: colors.error + '40' }]}>
                <Icon name="error-outline" size={ICON_SIZE.sm} color={colors.error} />
                <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.error} style={styles.flexText}>
                  {error}
                </CustomTextComponent>
              </View>
            ) : null}

            {unavailable ? (
              <>
                <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} style={styles.lede}>
                  Tu conjunto todavía no tiene habilitado este canal. Usa tu documento y código de
                  residente, o pide la aprobación desde otro dispositivo con tu sesión abierta.
                </CustomTextComponent>
                <CustomButtonComponent
                  text="Aprobar desde otro dispositivo"
                  onPress={goToApproval}
                  style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
                  textStyle={{ color: colors.textInverse, fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold }}
                />
              </>
            ) : (
              <CustomButtonComponent
                text="Continuar"
                onPress={handleRequest}
                isLoading={isRequesting}
                disabled={!isValidIdentity(identity) || isRequesting}
                loaderColor="#FFFFFF"
                style={[styles.primaryBtn, { backgroundColor: isValidIdentity(identity) ? colors.primary : colors.border }]}
                textStyle={{ color: colors.textInverse, fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold }}
              />
            )}
          </>
        ) : needsAccessCode ? (
          <>
            {/* El mensaje ya llegó y el intento quedó confirmado: solo falta el
                segundo factor. Se pide aquí para no gastar otro mensaje ni
                reiniciar el flujo. */}
            <View style={[styles.warning, { backgroundColor: colors.primarySurface, borderColor: colors.primary }]}>
              <View style={styles.warningHead}>
                <Icon name="lock" size={ICON_SIZE.sm} color={colors.primary} />
                <CustomTextComponent fontSize={FONT_SIZE.sm} fontWeight={FONT_WEIGHT.bold} color={colors.primary}>
                  Confirma tu clave
                </CustomTextComponent>
              </View>
              <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textPrimary} style={styles.flexText}>
                Recibimos tu mensaje. Tu cuenta ya tiene una clave asignada: ingrésala para autorizar este dispositivo.
              </CustomTextComponent>
            </View>

            <CodeSegmentInput
              value={accessCode}
              onChange={v => { setAccessCode(v); if (error) setError(''); }}
              length={6}
              prefix={null}
              hint="Toca para ingresar tu clave"
              error={error}
              editable={!isRedeeming}
            />

            <CustomButtonComponent
              text="Autorizar dispositivo"
              onPress={() => redeem(accessCode)}
              isLoading={isRedeeming}
              disabled={accessCode.length !== 6 || isRedeeming}
              loaderColor="#FFFFFF"
              style={[styles.primaryBtn, { backgroundColor: accessCode.length === 6 ? colors.primary : colors.border }]}
              textStyle={{ color: colors.textInverse, fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold }}
            />

            <TouchableOpacity onPress={goToApproval} accessibilityRole="button">
              <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} textAlign="center">
                No recuerdo mi clave · Aprobar desde otro dispositivo
              </CustomTextComponent>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* El aviso es la mitigación del flujo, no un texto de relleno:
                va SIEMPRE antes del botón de enviar. */}
            <View style={[styles.warning, { backgroundColor: colors.errorLight, borderColor: colors.error }]}>
              <View style={styles.warningHead}>
                <Icon name="warning-amber" size={ICON_SIZE.sm} color={colors.error} />
                <CustomTextComponent fontSize={FONT_SIZE.sm} fontWeight={FONT_WEIGHT.bold} color={colors.error}>
                  Antes de enviar, lee esto
                </CustomTextComponent>
              </View>
              <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textPrimary} style={styles.flexText}>
                {challenge.warning}
              </CustomTextComponent>
            </View>

            <CustomButtonComponent
              text="Abrir WhatsApp y enviar"
              onPress={openWhatsApp}
              disabled={expired || isRedeeming}
              style={[styles.primaryBtn, { backgroundColor: expired ? colors.border : '#25D366' }]}
              textStyle={{ color: '#FFFFFF', fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold }}
              iconLeft={{ name: 'chat', type: 'material', size: 18, color: '#FFFFFF' }}
            />

            {/* Fallback visible por si el deep link no abre. */}
            <View style={[styles.fallback, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <CustomTextComponent fontSize={FONT_SIZE.xs} color={colors.textTertiary}>
                ¿No abrió WhatsApp? Envía este mensaje al número de la portería:
              </CustomTextComponent>
              <Text selectable style={[styles.mono, { color: colors.textPrimary }]}>
                {challenge.messageText}
              </Text>
              <TouchableOpacity
                onPress={shareMessage}
                style={styles.shareRow}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button">
                <Icon name="ios-share" size={ICON_SIZE.sm} color={colors.primary} />
                <CustomTextComponent fontSize={FONT_SIZE.sm} fontWeight={FONT_WEIGHT.medium} color={colors.primary}>
                  Compartir mensaje
                </CustomTextComponent>
              </TouchableOpacity>
            </View>

            {/* Estado de espera */}
            {!expired && !error ? (
              <View style={[styles.banner, { backgroundColor: colors.primarySurface, borderColor: colors.primary + '40' }]}>
                <ActivityIndicator size="small" color={colors.primary} />
                <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.primary} style={styles.flexText}>
                  {isRedeeming
                    ? 'Mensaje recibido. Iniciando sesión…'
                    : `Esperando tu mensaje… (${remaining}s)`}
                </CustomTextComponent>
              </View>
            ) : null}

            {error ? (
              <View style={[styles.banner, { backgroundColor: colors.error + '14', borderColor: colors.error + '40' }]}>
                <Icon name="error-outline" size={ICON_SIZE.sm} color={colors.error} />
                <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.error} style={styles.flexText}>
                  {error}
                </CustomTextComponent>
              </View>
            ) : null}

            {expired ? (
              <CustomButtonComponent
                text="Solicitar un intento nuevo"
                onPress={() => { challengeIdRef.current = null; setChallenge(null); setError(''); setExpired(false); }}
                style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
                textStyle={{ color: colors.textInverse, fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold }}
              />
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  lede: {
    lineHeight: FONT_SIZE.sm * 1.5,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  warning: {
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderLeftWidth: 4,
  },
  warningHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  flexText: {
    flex: 1,
    lineHeight: FONT_SIZE.sm * 1.45,
  },
  fallback: {
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  mono: {
    fontFamily: 'monospace',
    fontSize: FONT_SIZE.md,
    letterSpacing: 1,
  },
  shareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  primaryBtn: {
    borderRadius: RADIUS.md,
    minHeight: 52,
  },
});
