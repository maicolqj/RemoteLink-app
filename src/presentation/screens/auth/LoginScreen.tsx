import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomTextComponent from '../../components/CustomTextComponent';
import CustomInputComponent from '../../components/CustomInputComponent';
import CustomButtonComponent from '../../components/CustomButtonComponent';
import CodeSegmentInput from '../../components/CodeSegmentInput';
import { useTheme } from '../../providers/context/ThemeContext';
// import { DEBUG_API_URL } from '../../../data/lib/apollo/client';
import {
  defaultDeviceLabel,
  getLastIdentity,
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
import { LOGO_SF } from '../../constants/ImagesApp';
import { LEGAL_LINKS, type LegalDocument } from '../../constants/legal';
import { STAGE } from '@env';
// Misma fuente que el pie del perfil y que `versionName` en build.gradle:
// se bumpea con `yarn version` y los tres quedan sincronizados.
import { version as APP_VERSION } from '../../../../package.json';

const { width: wp, height: hp } = Dimensions.get('screen');
// ─── Constants ────────────────────────────────────────────────────────────────

const HERO_HEIGHT = hp * 0.38;

/** El backend bloquea la CUENTA 15 minutos tras 5 intentos fallidos. */
const LOCK_SECONDS = 15 * 60;

const formatLock = (secs: number) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

/** Mismo criterio que los otros dos flujos de ingreso. */
const isValidIdentity = (v: string) => v.trim().length >= 6;

// ─── Helpers ──────────────────────────────────────────────────────────────────


// ─── Screen ───────────────────────────────────────────────────────────────────

type Nav = NativeStackNavigationProp<AuthStackParamList, 'LoginIdentity'>;
type Route = RouteProp<AuthStackParamList, 'LoginIdentity'>;

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { colors } = useTheme();

  // La pantalla Legal vive en el root stack, así que es alcanzable sin sesión.
  const openLegal = useCallback(
    (doc: LegalDocument) =>
      (navigation as any).navigate('Legal', { url: doc.url, title: doc.title }),
    [navigation],
  );

  // ── Form state ─────────────────────────────────────────────────────────────
  const [identity, setIdentity] = useState('');
  // Aviso que trae la pantalla de la clave cuando el dispositivo dejó de estar
  // vinculado (DEVICE_NOT_LINKED / DEVICE_REVOKED).
  const [notice, setNotice] = useState(route.params?.notice ?? '');
  // El canal de WhatsApp entrante se oculta si el servidor ya respondió
  // WA_LOGIN_NOT_CONFIGURED (le falta WHATSAPP_BUSINESS_NUMBER).
  const [waAvailable, setWaAvailable] = useState(true);
  const [identityError, setIdentityError] = useState('');
  const [identityTouched, setIdentityTouched] = useState(false);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lockRemaining, setLockRemaining] = useState(0);
  const lockTimer = useRef<ReturnType<typeof setInterval> | null>(null);


  // ── Animations ─────────────────────────────────────────────────────────────
  const heroIconScale = useRef(new Animated.Value(1)).current;

  // Prefill del último documento usado + si este equipo ya está vinculado.
  useEffect(() => {
    getLastIdentity().then(v => v && setIdentity(prev => prev || v));
  }, []);

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

  /**
   * Documento + clave. El documento es lo que permite entrar desde un equipo
   * que todavía no está vinculado: el servidor lo usa para identificar al
   * residente y vincular este equipo en el mismo ingreso. Desde un equipo ya
   * vinculado el servidor lo ignora, pero se manda igual — la app no sabe si el
   * vínculo sigue vivo del otro lado.
   */
  const submitCode = useCallback(async () => {
    if (!isValidIdentity(identity)) {
      setIdentityTouched(true);
      setIdentityError('Ingresa tu número de identidad (mínimo 6 dígitos)');
      return;
    }
    setIsSubmitting(true);
    setIdentityError('');
    setCodeError('');
    setNotice('');
    try {
      const result = await loginWithAccessCode(code, identity, defaultDeviceLabel());
      await persistSession(result);
    } catch (e) {
      const err = e as DeviceAuthError;
      setCode('');
      // La lógica ramifica por `code`; `message` ya viene redactado en español
      // (incluye los intentos restantes en ACCESS_CODE_INVALID).
      switch (err.code) {
        case 'ACCESS_CODE_LOCKED':
          startLock();
          setCodeError(err.message);
          break;
        case 'ACCESS_CODE_NOT_SET':
        case 'DEVICE_ENROLLMENT_THROTTLED':
        case 'DEVICE_NOT_LINKED':
        case 'DEVICE_REVOKED':
          // No sirve reintentar acá: hay que probar identidad por otro canal.
          // El aviso queda arriba, junto a los métodos que sí van a funcionar.
          // DEVICE_ENROLLMENT_THROTTLED no es bloqueo de cuenta —los equipos ya
          // vinculados siguen entrando—, por eso no usa la cuenta regresiva.
          setNotice(err.message);
          break;
        default:
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
   */
  const forgotCode = useCallback(() => {
    markAccessCodeForgotten();
    navigation.navigate('LoginWhatsApp', { identity: identity.trim() || undefined });
  }, [identity, navigation]);

  const locked = lockRemaining > 0;
  const canSubmitCode =
    isValidIdentity(identity) && code.length === ACCESS_CODE_LENGTH && !isSubmitting && !locked;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}>

        {/* ── Hero ── */}
        <View style={[styles.hero, { backgroundColor: '#ffff', paddingTop: insets.top + SPACING.md }]}>
          <View style={styles.heroContent}>
            <Animated.View style={{ transform: [{ scale: heroIconScale }] }}>
              <View style={[styles.heroIconWrap, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
                <Image source={LOGO_SF} style={{...styles.heroIcon}} />
              </View>
            </Animated.View>

          </View>
        </View>

        {/* ── Card ── */}
        <View style={styles.cardOuter}>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>

            <CustomTextComponent
              fontSize={FONT_SIZE.xl}
              fontWeight={FONT_WEIGHT.bold}
              color={colors.textPrimary}
              textAlign="center">
              Iniciar sesión
            </CustomTextComponent>

            <CustomTextComponent
              fontSize={FONT_SIZE.sm}
              color={colors.textSecondary}
              textAlign="center"
              style={styles.cardSubtitle}>
              Ingresa tu número de identidad y tu clave de acceso
            </CustomTextComponent>

            {/* ── Aviso traído desde el login con clave ── */}
            {notice ? (
              <View
                style={[styles.infoBanner, { backgroundColor: colors.warning + '14', borderColor: colors.warning + '40' }]}
                accessibilityRole="alert">
                <Icon name="info-outline" size={ICON_SIZE.sm} color={colors.warning} />
                <CustomTextComponent
                  fontSize={FONT_SIZE.sm}
                  color={colors.warning}
                  style={styles.errorBannerText}>
                  {notice}
                </CustomTextComponent>
              </View>
            ) : null}

            {/* ── Identity field ── */}
            <CustomInputComponent
              nameInput="Número de identidad"
              placeholder="Ej. 1234567890"
              value={identity}
              onChangeText={v => { setIdentity(v); setIdentityError(''); setNotice(''); }}
              onBlur={() => setIdentityTouched(true)}
              keyboardType="numeric"
              returnKeyType="next"
              leftIcon={{ name: 'badge', color: colors.primary }}
              error={identityError}
              touched={identityTouched}
              maxLength={20}
              editable={!isSubmitting}
            />

            {/* ── Clave de acceso ── */}
            <View style={styles.codeSection}>
              <CustomTextComponent
                fontSize={FONT_SIZE.xs}
                fontWeight={FONT_WEIGHT.medium}
                color={colors.textSecondary}>
                MI CLAVE DE ACCESO
              </CustomTextComponent>

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
            </View>

            {locked ? (
              <View
                style={[styles.infoBanner, { backgroundColor: colors.error + '14', borderColor: colors.error + '40' }]}
                accessibilityRole="alert">
                <Icon name="lock-clock" size={ICON_SIZE.sm} color={colors.error} />
                <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.error} style={styles.errorBannerText}>
                  Cuenta bloqueada. Podrás reintentar en {formatLock(lockRemaining)}.
                </CustomTextComponent>
              </View>
            ) : null}

            <CustomButtonComponent
              text="Ingresar"
              onPress={submitCode}
              isLoading={isSubmitting}
              disabled={!canSubmitCode}
              loaderColor="#FFFFFF"
              style={[styles.submitBtn, { backgroundColor: canSubmitCode ? colors.primary : colors.border }]}
              textStyle={{
                color: canSubmitCode ? colors.textInverse : colors.textTertiary,
                fontSize: FONT_SIZE.md,
                fontWeight: FONT_WEIGHT.semibold,
              }}
              iconRight={
                !isSubmitting
                  ? { name: 'login', type: 'material', size: 18, color: canSubmitCode ? colors.textInverse : colors.textTertiary }
                  : undefined
              }
            />

            <TouchableOpacity
              onPress={forgotCode}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button">
              <CustomTextComponent
                fontSize={FONT_SIZE.sm}
                fontWeight={FONT_WEIGHT.medium}
                color={colors.primary}
                textAlign="center">
                Olvidé mi clave
              </CustomTextComponent>
            </TouchableOpacity>

            {/* ── Si la clave no alcanza ──
                 Con documento + clave ya se puede entrar desde un equipo nuevo,
                 así que estos caminos quedan para quien no recuerda la clave o
                 todavía no tiene una. */}
            <View style={styles.altBlock}>
              {waAvailable ? (
                <TouchableOpacity
                  style={[styles.altRow, { borderColor: colors.border }]}
                  onPress={() => navigation.navigate('LoginWhatsApp', { identity: identity.trim() || undefined })}
                  activeOpacity={0.7}
                  accessibilityRole="button">
                  <Icon name="chat" size={ICON_SIZE.sm} color="#25D366" />
                  <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textPrimary} style={styles.altText}>
                    Enviando un WhatsApp desde mi celular
                  </CustomTextComponent>
                  <Icon name="chevron-right" size={20} color={colors.textTertiary} />
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                style={[styles.altRow, { borderColor: colors.border }]}
                onPress={() => navigation.navigate('LoginApproval', { identity: identity.trim() || undefined })}
                activeOpacity={0.7}
                accessibilityRole="button">
                <Icon name="phonelink-lock" size={ICON_SIZE.sm} color={colors.primary} />
                <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textPrimary} style={styles.altText}>
                  Aprobando desde mi otro dispositivo
                </CustomTextComponent>
                <Icon name="chevron-right" size={20} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>




            {/* ── Security note ── */}
            <View style={[styles.securityNote, { backgroundColor: colors.background }]}>
              <Icon name="lock-outline" size={14} color={colors.textTertiary} />
              <CustomTextComponent
                fontSize={FONT_SIZE.xs}
                color={colors.textTertiary}
                style={styles.securityText}>
                Conexión cifrada · Tus datos están protegidos
              </CustomTextComponent>
            </View>

            {/* ── Legal ── */}
            <View style={styles.legalBlock}>
              <CustomTextComponent
                fontSize={FONT_SIZE.xs}
                color={colors.textTertiary}
                textAlign="center"
                style={styles.legalIntro}>
                Al ingresar aceptas nuestros
              </CustomTextComponent>
              <View style={styles.legalLinks}>
                <TouchableOpacity
                  onPress={() => openLegal(LEGAL_LINKS.terms)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="link"
                  accessibilityLabel="Ver términos y condiciones">
                  <CustomTextComponent
                    fontSize={FONT_SIZE.xs}
                    fontWeight={FONT_WEIGHT.medium}
                    color={colors.primary}
                    style={styles.legalLinkText}>
                    Términos y condiciones
                  </CustomTextComponent>
                </TouchableOpacity>

                <CustomTextComponent fontSize={FONT_SIZE.xs} color={colors.textTertiary}>
                  ·
                </CustomTextComponent>

                <TouchableOpacity
                  onPress={() => openLegal(LEGAL_LINKS.privacy)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="link"
                  accessibilityLabel="Ver política de privacidad">
                  <CustomTextComponent
                    fontSize={FONT_SIZE.xs}
                    fontWeight={FONT_WEIGHT.medium}
                    color={colors.primary}
                    style={styles.legalLinkText}>
                    Política de privacidad
                  </CustomTextComponent>
                </TouchableOpacity>
              </View>
            </View>

            {/* Indicador de entorno: solo fuera de producción, para no dejar un
                punto de color sin explicación en la pantalla de ingreso. */}
            {STAGE !== 'production' ? (
              <CustomTextComponent fontSize={FONT_SIZE.xs} color={colors.textTertiary} textAlign="center">
                {STAGE}
              </CustomTextComponent>
            ) : null}
          </View>
        </View>

        <CustomTextComponent
          fontSize={FONT_SIZE.xs}
          color={colors.textTertiary}
          textAlign="center"
          style={{ marginBottom: insets.bottom + SPACING.md }}>
          RemoteLink v{APP_VERSION}
        </CustomTextComponent>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const CARD_OVERLAP = 48;

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1 },

  // Hero
  hero: {
    height: HERO_HEIGHT,
    borderBottomLeftRadius: RADIUS.xl + 8,
    borderBottomRightRadius: RADIUS.xl + 8,
  },
  heroContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  heroIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    letterSpacing: 0.5,
  },
  heroIcon: {
    width: wp * 0.5,
    height: hp * 0.3,
    resizeMode: 'contain',
  },
  // Card
  cardOuter: {
    flex: 1,
    marginTop: -CARD_OVERLAP,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  card: {
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
    gap: SPACING.md,
  },
  cardSubtitle: {
    lineHeight: FONT_SIZE.sm * 1.6,
    marginBottom: SPACING.xs,
  },

  // Code
  codeSection: {
    gap: SPACING.sm,
  },
  // Submit
  submitBtn: {
    borderRadius: RADIUS.md,
    minHeight: 52,
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    marginTop: SPACING.xs,
  },

  // WhatsApp helper
  // Info banner
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },

  // Error banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  errorBannerText: {
    flex: 1,
    lineHeight: FONT_SIZE.sm * 1.4,
  },

  // Métodos alternativos
  altBlock: {
    gap: SPACING.sm,
  },
  altDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  altLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  altRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    minHeight: 48,
  },
  altText: {
    flex: 1,
  },

  // Legal
  legalBlock: {
    alignItems: 'center',
    gap: SPACING.xs / 2,
    marginTop: -SPACING.xs,
  },
  legalIntro: {
    lineHeight: FONT_SIZE.xs * 1.4,
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

  // Security
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  securityText: {
    flex: 1,
  },
});
