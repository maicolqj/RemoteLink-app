import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import CustomTextComponent from '../../components/CustomTextComponent';
import CustomInputComponent from '../../components/CustomInputComponent';
import CodeSegmentInput from '../../components/CodeSegmentInput';
import AuthScreen from '../../components/auth/AuthScreen';
import AuthBanner from '../../components/auth/AuthBanner';
import AuthButton from '../../components/auth/AuthButton';
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
import { SPACING, RADIUS } from '../../constants/spacing';
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
      setIdentityError('Escribe tu número de documento (mínimo 6 dígitos)');
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

  // ── Render ─────────────────────────────────────────────────────────────────

  const heading = needsAccessCode
    ? { title: 'Confirma tu clave', subtitle: 'Ya aprobaste desde tu otro equipo. Solo falta confirmar que la cuenta es tuya.' }
    : challenge
      ? { title: 'Revisa tu otro teléfono', subtitle: 'Te llegó una notificación de RemoteLink. Ábrela y compara el código antes de aprobar.' }
      : { title: 'Aprobar desde otro equipo', subtitle: 'Si tienes RemoteLink con la sesión abierta en otro teléfono, puedes autorizar este ingreso desde allí. No tiene costo.' };

  return (
    <AuthScreen
      title={heading.title}
      subtitle={heading.subtitle}
      showBack
      onBack={() => navigation.goBack()}>

      {!challenge ? (
        <>
          <CustomInputComponent
            nameInput="Número de documento"
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

          {error ? <AuthBanner tone="error">{error}</AuthBanner> : null}

          <AuthButton
            text="Enviar solicitud"
            onPress={handleRequest}
            loading={isRequesting}
            disabled={!isValidIdentity(identity)}
            icon="send"
          />
        </>
      ) : needsAccessCode ? (
        <>
          {/* Ya aprobaron desde el otro equipo: falta el segundo factor. */}
          <AuthBanner tone="success" title="Ingreso aprobado">
            Tu cuenta ya tiene una clave asignada. Ingrésala para autorizar este dispositivo.
          </AuthBanner>

          <CodeSegmentInput
            value={accessCode}
            onChange={v => { setAccessCode(v); if (error) setError(''); }}
            length={6}
            prefix={null}
            hint="Toca para ingresar tu clave"
            secure
            error={error}
            editable={!isRedeeming}
          />

          <AuthButton
            text="Autorizar dispositivo"
            onPress={() => redeem(accessCode)}
            loading={isRedeeming}
            disabled={accessCode.length !== 6}
            icon="verified-user"
          />
        </>
      ) : (
        <>
          {/* El código debe verse grande: el residente lo compara contra el que
              le llega al otro dispositivo antes de aprobar. Es la pieza
              principal de la pantalla, así que se trata como tal. */}
          <View style={[styles.codeCard, { backgroundColor: colors.primarySurface, borderColor: colors.primary + '55' }]}>
            <CustomTextComponent
              fontSize={FONT_SIZE.xs}
              fontWeight={FONT_WEIGHT.semibold}
              color={colors.primary}
              textAlign="center"
              style={styles.codeLabel}>
              CÓDIGO DE ESTA SOLICITUD
            </CustomTextComponent>
            <CustomTextComponent
              fontSize={42}
              fontWeight={FONT_WEIGHT.bold}
              color={colors.primary}
              textAlign="center"
              style={styles.code}>
              {challenge.approvalCode}
            </CustomTextComponent>
          </View>

          <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} style={styles.instructions}>
            {challenge.instructions ??
              'Abre RemoteLink en tu otro dispositivo, revisa la notificación y verifica que muestre este mismo código antes de aprobar.'}
          </CustomTextComponent>

          {!finished && !error ? (
            <AuthBanner tone="progress" loading>
              {isRedeeming
                ? 'Aprobado. Iniciando sesión…'
                : `Esperando tu aprobación… (${formatMMSS(remaining)})`}
            </AuthBanner>
          ) : null}

          {error ? (
            <AuthBanner tone="error" icon={finished === 'denied' ? 'block' : undefined}>
              {error}
            </AuthBanner>
          ) : null}

          {finished ? (
            <AuthButton
              text={finished === 'denied' ? 'Volver al inicio' : 'Solicitar de nuevo'}
              onPress={finished === 'denied' ? () => navigation.goBack() : reset}
              icon={finished === 'denied' ? 'arrow-back' : 'refresh'}
            />
          ) : null}
        </>
      )}
    </AuthScreen>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  codeCard: {
    gap: SPACING.xs,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  codeLabel: {
    letterSpacing: 0.6,
  },
  code: {
    letterSpacing: 8,
  },
  instructions: {
    lineHeight: FONT_SIZE.sm * 1.55,
  },
});
