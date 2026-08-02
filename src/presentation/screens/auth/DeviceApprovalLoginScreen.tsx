import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomTextComponent from '../../components/CustomTextComponent';
import CustomInputComponent from '../../components/CustomInputComponent';
import CustomButtonComponent from '../../components/CustomButtonComponent';
import AppHeader from '../../components/AppHeader';
import { useTheme } from '../../providers/context/ThemeContext';
import type { AuthStackParamList } from '../../navigation/types/NavigationTypes';
import {
  requestDeviceApproval,
  fetchDeviceApprovalStatus,
  redeemDeviceApproval,
  persistSession,
  saveLastIdentity,
  getLastIdentity,
  type DeviceApprovalChallenge,
  type DeviceAuthError,
} from '../../../infraestructure/services/deviceAuth.service';
import { SPACING, RADIUS, ICON_SIZE } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';

type Route = RouteProp<AuthStackParamList, 'LoginApproval'>;

const POLL_MS = 2500;

const isValidIdentity = (v: string) => v.trim().length >= 6;

const secondsUntil = (iso?: string): number => {
  if (!iso) return 5 * 60;
  const diff = Math.floor((new Date(iso).getTime() - Date.now()) / 1000);
  return diff > 0 ? diff : 0;
};

const formatMMSS = (secs: number) => `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;

export default function DeviceApprovalLoginScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const { colors } = useTheme();

  const [identity, setIdentity] = useState(route.params?.identity ?? '');
  const [identityError, setIdentityError] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [error, setError] = useState('');
  const [finished, setFinished] = useState<'denied' | 'expired' | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [needsAccessCode, setNeedsAccessCode] = useState(false);
  const [accessCode, setAccessCode] = useState('');

  // El challengeId se queda en este equipo y es lo único que canjea la sesión;
  // solo vive en memoria y nunca se muestra.
  const [challenge, setChallenge] = useState<Omit<DeviceApprovalChallenge, 'challengeId'> | null>(null);
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
   * `code` solo viaja cuando la cuenta ya tiene clave: aprobar desde el otro
   * equipo no alcanza por sí solo para vincular este. Ver el contrato §3.1.
   */
  const redeem = useCallback(async (code?: string) => {
    const challengeId = challengeIdRef.current;
    if (!challengeId) return;
    stopTimers();
    setIsRedeeming(true);
    try {
      const result = await redeemDeviceApproval(challengeId, code);
      await saveLastIdentity(identity);
      await persistSession(result);
    } catch (e) {
      const err = e as DeviceAuthError;
      setIsRedeeming(false);

      // La aprobación sigue válida: solo falta el segundo factor. Se pide aquí
      // para no obligar al residente a repetir todo el flujo.
      if (err.code === 'ACCESS_CODE_REQUIRED' || err.code === 'ACCESS_CODE_INVALID') {
        setNeedsAccessCode(true);
        setAccessCode('');
        setError(err.code === 'ACCESS_CODE_INVALID' ? err.message : '');
        return;
      }

      setError(err.message);
      if (err.code === 'APPROVAL_EXPIRED') setFinished('expired');
    }
  }, [identity, stopTimers]);

  const poll = useCallback(async () => {
    const challengeId = challengeIdRef.current;
    if (!challengeId) return;
    try {
      const status = await fetchDeviceApprovalStatus(challengeId);
      switch (status) {
        case 'APPROVED':
          await redeem();
          break;
        case 'DENIED':
          stopTimers();
          setFinished('denied');
          setError('Rechazaste este ingreso desde tu otro dispositivo. Si no fuiste tú, cambia tu código de residente con la administración.');
          break;
        case 'EXPIRED':
          stopTimers();
          setFinished('expired');
          setError('La solicitud venció. Puedes pedir una nueva.');
          break;
        case 'CONSUMED':
          stopTimers();
          setFinished('expired');
          setError('Esta solicitud ya se usó. Vuelve a empezar.');
          break;
        default:
          break; // PENDING → seguir esperando
      }
    } catch (e) {
      const err = e as DeviceAuthError;
      if (err.code === 'APPROVAL_PENDING') return;
      if (err.code === 'APPROVAL_DENIED') {
        stopTimers();
        setFinished('denied');
        setError(err.message);
      } else if (err.code === 'APPROVAL_EXPIRED' || err.code === 'APPROVAL_CONSUMED' || err.code === 'APPROVAL_NOT_FOUND') {
        stopTimers();
        setFinished('expired');
        setError(err.message);
      }
      // Red caída: el siguiente tick reintenta.
    }
  }, [redeem, stopTimers]);

  const startWaiting = useCallback((expiresAt?: string) => {
    setRemaining(secondsUntil(expiresAt));
    stopTimers();
    pollRef.current = setInterval(poll, POLL_MS);
    countdownRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          stopTimers();
          setFinished('expired');
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
    setFinished(null);
    try {
      const result = await requestDeviceApproval(identity);
      // El challengeId se queda solo en la ref: no se muestra ni se persiste.
      challengeIdRef.current = result.challengeId;
      setChallenge({
        approvalCode: result.approvalCode,
        expiresAt: result.expiresAt,
        instructions: result.instructions,
      });
      await saveLastIdentity(identity);
      startWaiting(result.expiresAt);
    } catch (e) {
      setError((e as DeviceAuthError).message);
    } finally {
      setIsRequesting(false);
    }
  }, [identity, startWaiting]);

  const reset = useCallback(() => {
    challengeIdRef.current = null;
    setChallenge(null);
    setError('');
    setFinished(null);
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppHeader title="Aprobar desde otro equipo" showBack onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + SPACING.xl }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} style={styles.lede}>
          Si sigues teniendo RemoteLink instalado en otro dispositivo con sesión abierta, puedes
          aprobar este ingreso desde allí. No tiene costo.
        </CustomTextComponent>

        {!challenge ? (
          <>
            <CustomInputComponent
              nameInput="Número de identidad"
              placeholder="Ej. 1234567890"
              value={identity}
              onChangeText={v => { setIdentity(v); setIdentityError(''); setError(''); }}
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

            <CustomButtonComponent
              text="Enviar solicitud"
              onPress={handleRequest}
              isLoading={isRequesting}
              disabled={!isValidIdentity(identity) || isRequesting}
              loaderColor="#FFFFFF"
              style={[styles.primaryBtn, { backgroundColor: isValidIdentity(identity) ? colors.primary : colors.border }]}
              textStyle={{ color: colors.textInverse, fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold }}
            />
          </>
        ) : needsAccessCode ? (
          <>
            {/* Ya aprobaron desde el otro equipo: falta el segundo factor. */}
            <View style={[styles.banner, { backgroundColor: colors.primarySurface, borderColor: colors.primary + '55' }]}>
              <Icon name="lock" size={ICON_SIZE.sm} color={colors.primary} />
              <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textPrimary} style={styles.flexText}>
                Aprobado. Para autorizar este dispositivo ingresa la clave de tu cuenta.
              </CustomTextComponent>
            </View>

            <CustomInputComponent
              nameInput="Clave de acceso"
              placeholder="Ej. K7M2Q4"
              value={accessCode}
              onChangeText={v => { setAccessCode(v.toUpperCase()); if (error) setError(''); }}
              autoCapitalize="characters"
              secureTextEntry
              maxLength={6}
              leftIcon={{ name: 'lock', color: colors.primary }}
              error={error}
              touched={!!error}
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
          </>
        ) : (
          <>
            {/* El código debe verse grande: el residente lo compara contra el
                que le llega al otro dispositivo antes de aprobar. */}
            <View style={[styles.codeCard, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
              <CustomTextComponent fontSize={FONT_SIZE.xs} color={colors.textTertiary} textAlign="center">
                CÓDIGO DE ESTA SOLICITUD
              </CustomTextComponent>
              <CustomTextComponent
                fontSize={44}
                fontWeight={FONT_WEIGHT.bold}
                color={colors.primary}
                textAlign="center"
                style={styles.code}>
                {challenge.approvalCode}
              </CustomTextComponent>
              <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} textAlign="center" style={styles.flexText}>
                {challenge.instructions ??
                  'Abre RemoteLink en tu otro dispositivo, revisa la notificación y verifica que muestre este mismo código antes de aprobar.'}
              </CustomTextComponent>
            </View>

            {!finished && !error ? (
              <View style={[styles.banner, { backgroundColor: colors.primarySurface, borderColor: colors.primary + '40' }]}>
                <ActivityIndicator size="small" color={colors.primary} />
                <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.primary} style={styles.flexText}>
                  {isRedeeming
                    ? 'Aprobado. Iniciando sesión…'
                    : `Esperando tu aprobación… (${formatMMSS(remaining)})`}
                </CustomTextComponent>
              </View>
            ) : null}

            {error ? (
              <View
                style={[
                  styles.banner,
                  { backgroundColor: colors.error + '14', borderColor: colors.error + '40' },
                ]}
                accessibilityRole="alert">
                <Icon name={finished === 'denied' ? 'block' : 'error-outline'} size={ICON_SIZE.sm} color={colors.error} />
                <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.error} style={styles.flexText}>
                  {error}
                </CustomTextComponent>
              </View>
            ) : null}

            {finished ? (
              <CustomButtonComponent
                text={finished === 'denied' ? 'Volver al inicio' : 'Solicitar de nuevo'}
                onPress={finished === 'denied' ? () => navigation.goBack() : reset}
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
  flexText: {
    flex: 1,
    lineHeight: FONT_SIZE.sm * 1.45,
  },
  codeCard: {
    gap: SPACING.sm,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    alignItems: 'stretch',
  },
  code: {
    letterSpacing: 10,
  },
  primaryBtn: {
    borderRadius: RADIUS.md,
    minHeight: 52,
  },
});
