import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomTextComponent from '../../components/CustomTextComponent';
import CustomInputComponent from '../../components/CustomInputComponent';
import CodeSegmentInput from '../../components/CodeSegmentInput';
import AuthScreen from '../../components/auth/AuthScreen';
import AuthBanner from '../../components/auth/AuthBanner';
import AuthButton from '../../components/auth/AuthButton';
import AuthMethodRow from '../../components/auth/AuthMethodRow';
import AuthSection from '../../components/auth/AuthSection';
import { useTheme } from '../../providers/context/ThemeContext';
import { useAlert } from '../../providers/context/AlertContext';
import {
  defaultDeviceLabel,
  getLastIdentity,
  isDeviceLinked,
  isWhatsAppLoginAvailable,
  loginWithAccessCode,
  markAccessCodeForgotten,
  persistSession,
  ACCESS_CODE_LENGTH,
  type DeviceAuthError,
} from '../../../infraestructure/services/deviceAuth.service';
import type { AuthStackParamList } from '../../navigation/types/NavigationTypes';
import { SPACING, RADIUS, ICON_SIZE } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';
import { LEGAL_LINKS, type LegalDocument } from '../../constants/legal';
import { STAGE } from '@env';
import { API_URL } from '../../../data/lib/constants';
import { BuildBadge } from '../../components/BuildBadge';
// Misma fuente que el pie del perfil y que `versionName` en build.gradle:
// se bumpea con `yarn version` y los tres quedan sincronizados.
import { version as APP_VERSION } from '../../../../package.json';

// ─── Constants ────────────────────────────────────────────────────────────────

/** El backend bloquea la CUENTA 15 minutos tras 5 intentos fallidos. */
const LOCK_SECONDS = 15 * 60;

const formatLock = (secs: number) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

/** Mismo criterio que los otros dos flujos de ingreso. */
const isValidIdentity = (v: string) => v.trim().length >= 6;

/** Documento enmascarado para el resumen del paso 2. */
const maskIdentity = (v: string) => {
  const value = v.trim();
  if (value.length <= 4) return value;
  return `${'•'.repeat(Math.min(value.length - 4, 6))}${value.slice(-4)}`;
};

/**
 * La pantalla es un asistente de dos pasos: primero "quién eres", después "cómo
 * entras". El motivo es de comprensión, no estético: pedir una clave de 6
 * caracteres a alguien que abre la app por primera vez —y que nunca tuvo una—
 * era el punto donde la gente se quedaba trabada.
 *
 * Los flujos de autenticación NO cambian: primer ingreso y recuperación siguen
 * yendo por WhatsApp, y quien ya tiene clave entra con documento + clave.
 */
type Step = 'identity' | 'code';

/**
 * Errores que significan "por acá no vas a entrar, por más que reintentes".
 * En vez de un banner pasivo, la pantalla cambia de estado y ofrece el camino
 * que sí funciona.
 */
const DEAD_END_CODES = [
  'ACCESS_CODE_NOT_SET',
  'DEVICE_ENROLLMENT_THROTTLED',
  'DEVICE_NOT_LINKED',
  'DEVICE_REVOKED',
];

const WHATSAPP_GREEN = '#25D366';

// ─── Screen ───────────────────────────────────────────────────────────────────

type Nav = NativeStackNavigationProp<AuthStackParamList, 'LoginIdentity'>;
type Route = RouteProp<AuthStackParamList, 'LoginIdentity'>;

export default function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { colors } = useTheme();
  const { showQuestion } = useAlert();

  // La pantalla Legal vive en el root stack, así que es alcanzable sin sesión.
  const openLegal = useCallback(
    (doc: LegalDocument) =>
      (navigation as any).navigate('Legal', { url: doc.url, title: doc.title }),
    [navigation],
  );

  // ── Form state ─────────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>('identity');
  const [identity, setIdentity] = useState('');
  const [identityError, setIdentityError] = useState('');
  const [identityTouched, setIdentityTouched] = useState(false);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lockRemaining, setLockRemaining] = useState(0);
  const lockTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  /**
   * Mensaje que explica por qué la clave no es camino ahora mismo. Puede venir
   * de la pantalla anterior (el dispositivo dejó de estar vinculado) o de un
   * error del intento. Mientras esté puesto, el paso 2 esconde el campo de
   * clave y muestra la salida por WhatsApp.
   */
  const [deadEnd, setDeadEnd] = useState(route.params?.notice ?? '');

  // El canal de WhatsApp entrante se oculta si el servidor ya respondió
  // WA_LOGIN_NOT_CONFIGURED (le falta WHATSAPP_BUSINESS_NUMBER).
  const [waAvailable, setWaAvailable] = useState(true);

  const userTypedRef = useRef(false);

  /**
   * Atajo para el caso frecuente: mismo teléfono, ya vinculado y con documento
   * recordado. Ese usuario no vuelve a ver el paso 1 — para él la pantalla
   * sigue siendo una sola, la de la clave.
   *
   * No aplica si venimos con un aviso: ahí justamente el vínculo se rompió.
   */
  useEffect(() => {
    let alive = true;
    Promise.all([getLastIdentity(), isDeviceLinked()]).then(([saved, linked]) => {
      // Si el usuario ya empezó a escribir, el almacenamiento llegó tarde: ni le
      // pisamos el documento ni le cambiamos la pantalla debajo del dedo.
      if (!alive || !saved || userTypedRef.current) return;
      setIdentity(saved);
      if (linked && !route.params?.notice) setStep('code');
    });
    return () => { alive = false; };
  }, [route.params?.notice]);

  // Se reevalúa en cada foco, no solo al montar: la pantalla sigue montada
  // debajo del stack mientras el usuario visita el flujo de WhatsApp, y es ahí
  // donde el canal puede resultar deshabilitado.
  useFocusEffect(
    useCallback(() => {
      isWhatsAppLoginAvailable().then(setWaAvailable);
    }, []),
  );

  useEffect(() => () => { lockTimer.current && clearInterval(lockTimer.current); }, []);

  const startLock = useCallback(() => {
    lockTimer.current && clearInterval(lockTimer.current);
    setLockRemaining(LOCK_SECONDS);
    lockTimer.current = setInterval(() => {
      setLockRemaining(prev => {
        if (prev <= 1) { clearInterval(lockTimer.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // ── Navegación entre pasos ─────────────────────────────────────────────────

  const goToWhatsApp = useCallback(
    () => navigation.navigate('LoginWhatsApp', { identity: identity.trim() || undefined }),
    [identity, navigation],
  );

  const goToApproval = useCallback(
    () => navigation.navigate('LoginApproval', { identity: identity.trim() || undefined }),
    [identity, navigation],
  );

  const continueToCode = useCallback(() => {
    if (!isValidIdentity(identity)) {
      setIdentityTouched(true);
      setIdentityError('Escribe tu número de documento (mínimo 6 dígitos)');
      return;
    }
    setIdentityError('');
    // El aviso que traía la pantalla anterior ya cumplió su función informando
    // en el paso 1. No debe bloquear el intento: con documento + clave se puede
    // entrar desde un equipo que perdió el vínculo, y el servidor lo revincula.
    // Si de verdad no hay camino, el error del intento lo vuelve a poner.
    setDeadEnd('');
    setStep('code');
  }, [identity]);

  const backToIdentity = useCallback(() => {
    setStep('identity');
    setCode('');
    setCodeError('');
    setDeadEnd('');
  }, []);

  // ── Ingreso ────────────────────────────────────────────────────────────────

  /**
   * Documento + clave. El documento es lo que permite entrar desde un equipo
   * que todavía no está vinculado: el servidor lo usa para identificar al
   * residente y vincular este equipo en el mismo ingreso. Desde un equipo ya
   * vinculado el servidor lo ignora, pero se manda igual — la app no sabe si el
   * vínculo sigue vivo del otro lado.
   */
  const submitCode = useCallback(async () => {
    setIsSubmitting(true);
    setCodeError('');
    setDeadEnd('');
    try {
      const result = await loginWithAccessCode(code, identity, defaultDeviceLabel());
      await persistSession(result);
    } catch (e) {
      const err = e as DeviceAuthError;
      setCode('');
      // La lógica ramifica por `code`; `message` ya viene redactado en español
      // (incluye los intentos restantes en ACCESS_CODE_INVALID).
      if (err.code === 'ACCESS_CODE_LOCKED') {
        startLock();
        setCodeError(err.message);
      } else if (err.code && DEAD_END_CODES.includes(err.code)) {
        // Reintentar la clave no sirve: hay que probar identidad por otro canal.
        setDeadEnd(err.message);
      } else {
        setCodeError(err.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [code, identity, startLock]);

  /**
   * Deja constancia de que la clave ya no sirve antes de mandar al residente al
   * ingreso por WhatsApp. Al volver a entrar, la app le pedirá una nueva de
   * forma obligatoria; sin la marca, la cuenta seguiría con la que no recuerda.
   *
   * Va detrás de una confirmación porque es destructivo: quien lo toca por
   * curiosidad perdía la clave que sí recordaba, sin ningún aviso.
   */
  const forgotCode = useCallback(() => {
    showQuestion(
      'Vamos a darte una clave nueva. Para eso necesitamos verificar tu número por WhatsApp, y la clave que tienes ahora dejará de funcionar.',
      '¿Olvidaste tu clave?',
      {
        buttons: [
          { text: 'Cancelar', style: 'secondary', onPress: () => {} },
          {
            text: 'Continuar',
            style: 'primary',
            onPress: () => { markAccessCodeForgotten(); goToWhatsApp(); },
          },
        ],
      },
    );
  }, [showQuestion, goToWhatsApp]);

  const locked = lockRemaining > 0;
  const canContinue = isValidIdentity(identity);
  const canSubmitCode = code.length === ACCESS_CODE_LENGTH && !isSubmitting && !locked;
  const isIdentityStep = step === 'identity';

  // ── Piezas reutilizadas entre los dos pasos ────────────────────────────────

  const approvalRow = (
    <AuthMethodRow
      icon="phonelink-lock"
      title="Aprobar desde otro equipo"
      description="Si tienes RemoteLink abierto en otro teléfono, apruebas el ingreso desde allí."
      onPress={goToApproval}
    />
  );

  const footer = (
    <View style={styles.footer}>
      <View style={styles.securityNote}>
        <Icon name="lock-outline" size={13} color={colors.textTertiary} />
        <CustomTextComponent fontSize={FONT_SIZE.xs} color={colors.textTertiary}>
          Conexión cifrada · Tus datos están protegidos
        </CustomTextComponent>
      </View>

      <View style={styles.legalLinks}>
        <TouchableOpacity
          onPress={() => openLegal(LEGAL_LINKS.terms)}
          hitSlop={HIT_SLOP}
          accessibilityRole="link"
          accessibilityLabel="Ver términos y condiciones">
          <CustomTextComponent fontSize={FONT_SIZE.xs} color={colors.textSecondary} style={styles.legalLinkText}>
            Términos y condiciones
          </CustomTextComponent>
        </TouchableOpacity>

        <CustomTextComponent fontSize={FONT_SIZE.xs} color={colors.textTertiary}>·</CustomTextComponent>

        <TouchableOpacity
          onPress={() => openLegal(LEGAL_LINKS.privacy)}
          hitSlop={HIT_SLOP}
          accessibilityRole="link"
          accessibilityLabel="Ver política de privacidad">
          <CustomTextComponent fontSize={FONT_SIZE.xs} color={colors.textSecondary} style={styles.legalLinkText}>
            Política de privacidad
          </CustomTextComponent>
        </TouchableOpacity>
      </View>

      <CustomTextComponent fontSize={FONT_SIZE.xs} color={colors.textTertiary} textAlign="center">
        RemoteLink v{APP_VERSION}
        {STAGE !== 'production' ? ` · ${STAGE}` : ''}
      </CustomTextComponent>
    </View>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <AuthScreen
      title={isIdentityStep ? 'Bienvenido' : 'Tu clave de acceso'}
      subtitle={
        isIdentityStep
          ? 'Para empezar, dinos quién eres.'
          : `Los ${ACCESS_CODE_LENGTH} caracteres que creaste la primera vez que entraste.`
      }
      step={{ current: isIdentityStep ? 1 : 2, total: 2 }}
      showBack={!isIdentityStep}
      onBack={backToIdentity}
      footer={footer}>

      {isIdentityStep ? (
        <>
          {/* El aviso que llega desde otra pantalla (el equipo dejó de estar
              vinculado) se pinta acá, donde el usuario todavía no escribió
              nada, y no encima del formulario de la clave. */}
          {deadEnd ? <AuthBanner tone="warning">{deadEnd}</AuthBanner> : null}

          <View style={styles.field}>
            <CustomInputComponent
              nameInput="Número de documento"
              placeholder="Ej. 1234567890"
              value={identity}
              onChangeText={v => { userTypedRef.current = true; setIdentity(v); setIdentityError(''); }}
              onBlur={() => setIdentityTouched(true)}
              keyboardType="numeric"
              returnKeyType="next"
              leftIcon={{ name: 'badge', color: colors.primary }}
              error={identityError}
              touched={identityTouched}
              maxLength={20}
            />
            <CustomTextComponent fontSize={FONT_SIZE.xs} color={colors.textTertiary} style={styles.fieldHelp}>
              El mismo documento que registraste en la administración de tu conjunto.
            </CustomTextComponent>
          </View>

          <AuthButton
            text="Continuar"
            onPress={continueToCode}
            disabled={!canContinue}
            icon="arrow-forward"
          />

          {/* Primer ingreso: el camino es WhatsApp, y ahora está dicho con todas
              las letras en vez de esconderse entre las alternativas de "olvidé
              mi clave". */}
          <AuthSection label="¿PRIMERA VEZ AQUÍ?">
            {waAvailable ? (
              <AuthMethodRow
                icon="logo-whatsapp"
                iconLibrary="ionicons"
                iconColor={WHATSAPP_GREEN}
                title="Activar mi cuenta mediante WhatsApp" 
                description="Verificamos tu número y creas tu clave. No necesitas clave para este paso."
                onPress={goToWhatsApp}
              />
            ) : (
              <AuthBanner tone="info" icon="support-agent">
                El ingreso por WhatsApp no está habilitado en tu conjunto. Comunícate con la
                administración para que te entreguen tu clave.
              </AuthBanner>
            )}
          </AuthSection>
        </>
      ) : (
        <>
          {/* Resumen de lo ya respondido: el usuario ve con qué documento va a
              entrar y puede corregirlo sin salir de la pantalla. */}
          <TouchableOpacity
            style={[styles.identityChip, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={backToIdentity}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Documento ${maskIdentity(identity)}. Tocar para cambiarlo`}>
            <Icon name="badge" size={ICON_SIZE.sm} color={colors.primary} />
            <View style={styles.chipText}>
              <CustomTextComponent fontSize={FONT_SIZE.xs} color={colors.textTertiary}>
                Documento
              </CustomTextComponent>
              <CustomTextComponent fontSize={FONT_SIZE.sm} fontWeight={FONT_WEIGHT.semibold} color={colors.textPrimary}>
                {maskIdentity(identity)}
              </CustomTextComponent>
            </View>
            <CustomTextComponent fontSize={FONT_SIZE.sm} fontWeight={FONT_WEIGHT.medium} color={colors.primary}>
              Cambiar
            </CustomTextComponent>
          </TouchableOpacity>

          {deadEnd ? (
            /* Sin salida por la clave: en vez de dejar el campo ahí invitando a
               insistir, se esconde y se ofrece el canal que sí resuelve. */
            <>
              <AuthBanner tone="warning">{deadEnd}</AuthBanner>

              <AuthSection label="CÓMO CONTINUAR">
                {waAvailable ? (
                  <AuthMethodRow
                    icon="logo-whatsapp"
                    iconLibrary="ionicons"
                    iconColor={WHATSAPP_GREEN}
                    title="Verificar por WhatsApp"
                    description="Verificamos tu número y creas una clave nueva."
                    onPress={goToWhatsApp}
                  />
                ) : null}
                {approvalRow}
              </AuthSection>

              <AuthButton text="Intentar con mi clave" onPress={() => setDeadEnd('')} variant="text" />
            </>
          ) : (
            <>
              <CodeSegmentInput
                value={code}
                onChange={v => { setCode(v); if (codeError) setCodeError(''); }}
                length={ACCESS_CODE_LENGTH}
                prefix={null}
                secure
                hint="Toca para ingresar tu clave"
                error={codeError}
                editable={!isSubmitting && !locked}
              />

              {locked ? (
                <AuthBanner tone="error" icon="lock-clock">
                  {`Cuenta bloqueada por seguridad. Podrás reintentar en ${formatLock(lockRemaining)}.`}
                </AuthBanner>
              ) : null}

              <AuthButton
                text="Ingresar"
                onPress={submitCode}
                loading={isSubmitting}
                disabled={!canSubmitCode}
                icon="login"
              />

              <AuthSection label="¿NO PUEDES INGRESAR?">
                {waAvailable ? (
                  <AuthMethodRow
                    icon="logo-whatsapp"
                    iconLibrary="ionicons"
                    iconColor={WHATSAPP_GREEN}
                    title="No recuerdo mi clave"
                    description="Verificamos tu número por WhatsApp y creas una clave nueva."
                    onPress={forgotCode}
                  />
                ) : null}
                {approvalRow}
              </AuthSection>
            </>
          )}
        </>
      )}
    </AuthScreen>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 };

const styles = StyleSheet.create({
  field: {
    gap: SPACING.xs,
  },
  fieldHelp: {
    lineHeight: FONT_SIZE.xs * 1.45,
  },

  identityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    minHeight: 56,
  },
  chipText: {
    flex: 1,
    gap: 2,
  },

  footer: {
    alignItems: 'center',
    gap: SPACING.sm,
    paddingTop: SPACING.xs,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  legalLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  legalLinkText: {
    textDecorationLine: 'underline',
  },
});
