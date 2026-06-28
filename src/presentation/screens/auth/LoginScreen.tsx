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
  ActivityIndicator,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomTextComponent from '../../components/CustomTextComponent';
import CustomInputComponent from '../../components/CustomInputComponent';
import CustomButtonComponent from '../../components/CustomButtonComponent';
import CodeSegmentInput from '../../components/CodeSegmentInput';
import { useTheme } from '../../providers/context/ThemeContext';
import { useAuthStore } from '../../store/auth.store';
import { loginResident } from '../../../infraestructure/services/auth.service';
import { DEBUG_API_URL } from '../../../data/lib/apollo/client';
import SecureStorageService from '../../../infraestructure/services/SecureStorageService';
import { SPACING, RADIUS, ICON_SIZE } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';
import { LOGO_SF } from '../../constants/ImagesApp';

const { width: wp, height: hp } = Dimensions.get('screen');
// ─── Constants ────────────────────────────────────────────────────────────────

const HERO_HEIGHT = hp * 0.38;
const RESEND_COOLDOWN = 60;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isValidIdentity = (v: string) => v.trim().length >= 6;
const isValidCode = (v: string) => v.length === 5;

// ─── Screen ───────────────────────────────────────────────────────────────────

type RequestState = 'idle' | 'loading' | 'sent' | 'error';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const setSession = useAuthStore(s => s.setSession);

  // ── Form state ─────────────────────────────────────────────────────────────
  const [identity, setIdentity] = useState('');
  const [code, setCode] = useState('');
  const [identityError, setIdentityError] = useState('');
  const [codeError, setCodeError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [identityTouched, setIdentityTouched] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestState, setRequestState] = useState<RequestState>('idle');
  const [resendTimer, setResendTimer] = useState(0);

  // ── Animations ─────────────────────────────────────────────────────────────
  const heroIconScale = useRef(new Animated.Value(1)).current;
  const sentBadgeOpacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { timerRef.current && clearInterval(timerRef.current); }, []);

  // ── Resend countdown ───────────────────────────────────────────────────────
  const startResendTimer = useCallback(() => {
    setResendTimer(RESEND_COOLDOWN);
    timerRef.current = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) { clearInterval(timerRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const bounceIcon = useCallback(() => {
    Animated.sequence([
      Animated.timing(heroIconScale, { toValue: 1.2, duration: 140, useNativeDriver: true }),
      Animated.spring(heroIconScale, { toValue: 1, useNativeDriver: true, tension: 200, friction: 7 }),
    ]).start();
  }, [heroIconScale]);

  const showSentBadge = useCallback(() => {
    sentBadgeOpacity.setValue(0);
    Animated.sequence([
      Animated.timing(sentBadgeOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.delay(3000),
      Animated.timing(sentBadgeOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [sentBadgeOpacity]);

  // ── Request code (resend system code via WhatsApp) ─────────────────────────
  const handleRequestCode = useCallback(async () => {
    if (!isValidIdentity(identity)) {
      setIdentityError('Primero ingresa tu número de identidad (mínimo 6 dígitos)');
      setIdentityTouched(true);
      return;
    }
    // TODO: wire to backend resendSystemCode(identity) mutation when available
    setRequestState('loading');
    await new Promise<void>(r => setTimeout(() => r(), 800));
    setRequestState('sent');
    startResendTimer();
    bounceIcon();
    showSentBadge();
  }, [identity, startResendTimer, bounceIcon, showSentBadge]);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    let hasError = false;
    if (!isValidIdentity(identity)) {
      setIdentityError('Ingresa tu número de identidad (mínimo 6 dígitos)');
      setIdentityTouched(true);
      hasError = true;
    }
    if (!isValidCode(code)) {
      setCodeError('El código debe tener 5 caracteres (ej. E5E45)');
      hasError = true;
    }
    if (hasError) return;

    setIsSubmitting(true);
    setIdentityError('');
    setCodeError('');
    setSubmitError('');
    try {
      const systemCode = `RES-${code}`;
      const result = await loginResident(identity.trim(), systemCode);
      await SecureStorageService.saveTokens({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        sessionId: result.sessionId,
        accessTokenExpiresAt: result.expiresIn ? Date.now() + result.expiresIn * 1000 : undefined,
      });
      setSession(result.accessToken, result.sessionId);
    } catch (err: any) {
      // El mensaje ya viene normalizado y legible desde la capa de servicio
      // (auth.service → getApiErrorMessage). Lo mostramos en el banner.
      setSubmitError(err?.message ?? 'No se pudo iniciar sesión. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  }, [identity, code, setSession]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const canSubmit = isValidIdentity(identity) && isValidCode(code) && !isSubmitting;
  const isRequesting = requestState === 'loading';

  const requestLabel = () => {
    if (isRequesting) return null;
    if (resendTimer > 0) return `Reenviar código en ${resendTimer}s`;
    if (requestState === 'sent') return 'Reenviar código';
    return '¿No tienes tu código? Solicitar';
  };

  const requestIconName = requestState === 'sent' ? 'send' : 'sms';

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

            {/* "Código enviado" badge */}
            <Animated.View
              style={[styles.sentBadge, { opacity: sentBadgeOpacity, backgroundColor: colors.success }]}
              pointerEvents="none">
              <Icon name="check-circle" size={14} color="#FFFFFF" />
              <CustomTextComponent fontSize={FONT_SIZE.xs} fontWeight={FONT_WEIGHT.medium} color="#FFFFFF">
                Código enviado a tu WhatsApp
              </CustomTextComponent>
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
              Ingresa tu identidad y tu código de residente
            </CustomTextComponent>

            {/* ── Identity field ── */}
            <CustomInputComponent
              nameInput="Número de identidad"
              placeholder="Ej. 1234567890"
              value={identity}
              onChangeText={v => { setIdentity(v); setIdentityError(''); setSubmitError(''); if (requestState === 'error') setRequestState('idle'); }}
              onBlur={() => setIdentityTouched(true)}
              keyboardType="numeric"
              returnKeyType="next"
              leftIcon={{ name: 'badge', color: colors.primary }}
              error={identityError}
              touched={identityTouched}
              maxLength={20}
              editable={!isSubmitting}
            />

            {/* ── Code field ── */}
            <View style={styles.codeSection}>
              <CustomTextComponent
                fontSize={FONT_SIZE.xs}
                fontWeight={FONT_WEIGHT.medium}
                color={colors.textSecondary}
                style={styles.codeLabel}>
                CÓDIGO DE ACCESO
              </CustomTextComponent>

              <CodeSegmentInput
                value={code}
                onChange={v => { setCode(v); setCodeError(''); setSubmitError(''); }}
                error={codeError}
                editable={!isSubmitting}
              />
            </View>

            {/* ── Request code link ── */}
            <TouchableOpacity
              onPress={handleRequestCode}
              disabled={isRequesting || resendTimer > 0 || isSubmitting}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={[
                styles.requestRow,
                { backgroundColor: colors.primarySurface, borderColor: colors.primary + '30' },
              ]}
              accessibilityRole="button"
              accessibilityLabel={requestLabel() ?? 'Solicitando código'}>
              {isRequesting ? (
                <>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.primary}>
                    Enviando código…
                  </CustomTextComponent>
                </>
              ) : (
                <>
                  <Icon
                    name={requestIconName}
                    size={ICON_SIZE.sm}
                    color={resendTimer > 0 ? colors.textTertiary : colors.primary}
                  />
                  <CustomTextComponent
                    fontSize={FONT_SIZE.sm}
                    fontWeight={FONT_WEIGHT.medium}
                    color={resendTimer > 0 ? colors.textTertiary : colors.primary}>
                    {requestLabel()}
                  </CustomTextComponent>
                </>
              )}
            </TouchableOpacity>

            {/* ── Error banner ── */}
            {submitError ? (
              <View
                style={[styles.errorBanner, { backgroundColor: colors.error + '14', borderColor: colors.error + '40' }]}
                accessibilityRole="alert">
                <Icon name="error-outline" size={ICON_SIZE.sm} color={colors.error} />
                <CustomTextComponent
                  fontSize={FONT_SIZE.sm}
                  color={colors.error}
                  style={styles.errorBannerText}>
                  {submitError}
                </CustomTextComponent>
              </View>
            ) : null}

            {/* ── Submit button ── */}
            <CustomButtonComponent
              text="Ingresar"
              onPress={handleSubmit}
              isLoading={isSubmitting}
              disabled={!canSubmit}
              loaderColor="#FFFFFF"
              style={[
                styles.submitBtn,
                { backgroundColor: canSubmit ? colors.primary : colors.border },
              ]}
              textStyle={{
                color: canSubmit ? colors.textInverse : colors.textTertiary,
                fontSize: FONT_SIZE.md,
                fontWeight: FONT_WEIGHT.semibold,
              }}
              iconRight={
                !isSubmitting
                  ? { name: 'login', type: 'material', size: 18, color: canSubmit ? colors.textInverse : colors.textTertiary }
                  : undefined
              }
            />

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

            {/* TEMP DEBUG — remove after confirming URL */}
            <CustomTextComponent fontSize={FONT_SIZE.xs} color="red" textAlign="center">
              {DEBUG_API_URL}
            </CustomTextComponent>
          </View>
        </View>

        <CustomTextComponent
          fontSize={FONT_SIZE.xs}
          color={colors.textTertiary}
          textAlign="center"
          style={{ marginBottom: insets.bottom + SPACING.md }}>
          RemoteLink v1.0.0
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
  sentBadge: {
    position: 'absolute',
    top: -12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs / 2,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: RADIUS.full,
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
  codeLabel: {
    letterSpacing: 0.8,
  },

  // Request link
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    minHeight: 44,
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
