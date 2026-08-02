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
import { loginResident } from '../../../infraestructure/services/auth.service';
// import { DEBUG_API_URL } from '../../../data/lib/apollo/client';
import {
  persistSession,
  saveLastIdentity,
  getLastIdentity,
  isDeviceLinked,
  isWhatsAppLoginAvailable,
} from '../../../infraestructure/services/deviceAuth.service';
import type { AuthStackParamList } from '../../navigation/types/NavigationTypes';
import { SPACING, RADIUS, ICON_SIZE } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';
import { LOGO_SF } from '../../constants/ImagesApp';
import { LEGAL_LINKS, type LegalDocument } from '../../constants/legal';
import { STAGE } from '@env';

const { width: wp, height: hp } = Dimensions.get('screen');
// ─── Constants ────────────────────────────────────────────────────────────────

const HERO_HEIGHT = hp * 0.38;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isValidIdentity = (v: string) => v.trim().length >= 6;
const isValidCode = (v: string) => v.length === 5;

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
  const [deviceLinked, setDeviceLinked] = useState(false);
  // El canal de WhatsApp entrante se oculta si el servidor ya respondió
  // WA_LOGIN_NOT_CONFIGURED (le falta WHATSAPP_BUSINESS_NUMBER).
  const [waAvailable, setWaAvailable] = useState(true);
  const [code, setCode] = useState('');
  const [identityError, setIdentityError] = useState('');
  const [codeError, setCodeError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [identityTouched, setIdentityTouched] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Animations ─────────────────────────────────────────────────────────────
  const heroIconScale = useRef(new Animated.Value(1)).current;

  // Prefill del último documento usado + si este equipo ya está vinculado.
  useEffect(() => {
    getLastIdentity().then(v => v && setIdentity(prev => prev || v));
    isDeviceLinked().then(setDeviceLinked);
  }, []);

  // Se reevalúa en cada foco, no solo al montar: la pantalla sigue montada
  // debajo del stack mientras el usuario visita el flujo de WhatsApp, y es ahí
  // donde el canal puede resultar deshabilitado.
  useFocusEffect(
    useCallback(() => {
      isWhatsAppLoginAvailable().then(setWaAvailable);
    }, []),
  );

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
      await saveLastIdentity(identity);
      await persistSession(result);
    } catch (err: any) {
      // El mensaje ya viene normalizado y legible desde la capa de servicio
      // (auth.service → getApiErrorMessage). Lo mostramos en el banner.
      setSubmitError(err?.message ?? 'No se pudo iniciar sesión. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  }, [identity, code]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const canSubmit = isValidIdentity(identity) && isValidCode(code) && !isSubmitting;

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
              Ingresa tu número de identidad y elige cómo confirmar que eres tú
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
              onChangeText={v => { setIdentity(v); setIdentityError(''); setSubmitError(''); setNotice(''); }}
              onBlur={() => setIdentityTouched(true)}
              keyboardType="numeric"
              returnKeyType="next"
              leftIcon={{ name: 'badge', color: colors.primary }}
              error={identityError}
              touched={identityTouched}
              maxLength={20}
              editable={!isSubmitting}
            />

            {/* <View style={styles.codeSection}>
              <CodeSegmentInput
                value={code}
                onChange={v => { setCode(v); setCodeError(''); setSubmitError(''); }}
                error={codeError}
                editable={!isSubmitting}
              />
            </View> */}

            {/* ── Formas de ingresar sin costo por mensaje ──
                 Van antes del código porque son el camino normal: el codigo de
                 residente ya no se puede pedir desde la app, solo lo entrega la
                 administración. */}
            <View style={styles.altBlock}>
              {deviceLinked ? (
                <TouchableOpacity
                  style={[styles.altRow, { borderColor: colors.border }]}
                  onPress={() => navigation.navigate('LoginAccessCode')}
                  activeOpacity={0.7}
                  accessibilityRole="button">
                  <Icon name="pin" size={ICON_SIZE.sm} color={colors.primary} />
                  <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textPrimary} style={styles.altText}>
                    Con mi clave de acceso
                  </CustomTextComponent>
                  <Icon name="chevron-right" size={20} color={colors.textTertiary} />
                </TouchableOpacity>
              ) : null}

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

            {/* ── Código entregado por la administración ──
            <View style={styles.altDivider}>
              <View style={[styles.altLine, { backgroundColor: colors.border }]} />
              <CustomTextComponent fontSize={FONT_SIZE.xs} color={colors.textTertiary}>
                o con un código de la administración
              </CustomTextComponent>
              <View style={[styles.altLine, { backgroundColor: colors.border }]} />
            </View> */}

            

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

            {/* TEMP DEBUG — remove after confirming URL */}
            <CustomTextComponent fontSize={FONT_SIZE.xs} color="red" textAlign="center">
              {STAGE === 'development' ? <Icon name="brightness1" size={5} color={colors.error} /> : <Icon name="brightness1" size={5} color={colors.successLight} />}
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
