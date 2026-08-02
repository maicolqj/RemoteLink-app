import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomTextComponent from '../../components/CustomTextComponent';
import CustomInputComponent from '../../components/CustomInputComponent';
import CustomButtonComponent from '../../components/CustomButtonComponent';
import { useTheme } from '../../providers/context/ThemeContext';
import type { AuthStackParamList } from '../../navigation/types/NavigationTypes';
import {
  loginWithAccessCode,
  persistSession,
  markAccessCodeForgotten,
  ACCESS_CODE_LENGTH,
  DeviceAuthError,
} from '../../../infraestructure/services/deviceAuth.service';
import { SPACING, RADIUS, ICON_SIZE } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';
import { LOGO_SF } from '../../constants/ImagesApp';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'LoginAccessCode'>;

/** El backend bloquea la CUENTA 15 minutos tras 5 intentos fallidos. */
const LOCK_SECONDS = 15 * 60;

const formatLock = (secs: number) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

export default function AccessCodeLoginScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lockRemaining, setLockRemaining] = useState(0);
  const lockTimer = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const goToIdentityLogin = useCallback(
    (notice?: string) => navigation.navigate('LoginIdentity', notice ? { notice } : undefined),
    [navigation],
  );

  /**
   * Deja constancia de que esta clave ya no sirve antes de mandar al residente a
   * los otros métodos. Al volver a entrar, la app le pedirá una nueva de forma
   * obligatoria; sin la marca, la cuenta seguiría con la clave que no recuerda y
   * volvería a quedarse afuera en el siguiente arranque.
   */
  const forgotCode = useCallback(() => {
    markAccessCodeForgotten();
    goToIdentityLogin();
  }, [goToIdentityLogin]);

  const submit = useCallback(async (value: string) => {
    setIsSubmitting(true);
    setError('');
    try {
      const result = await loginWithAccessCode(value);
      await persistSession(result);
    } catch (e) {
      const err = e as DeviceAuthError;
      setCode('');
      // La lógica ramifica por `code`; `message` ya viene redactado en español
      // (incluye los intentos restantes en ACCESS_CODE_INVALID) y se muestra tal cual.
      switch (err.code) {
        case 'ACCESS_CODE_LOCKED':
          startLock();
          setError(err.message);
          break;
        case 'ACCESS_CODE_NOT_SET':
          // La cuenta no tiene clave: hay que crearla, y para eso primero entrar
          // por un canal que pruebe identidad.
          goToIdentityLogin(err.message);
          break;
        case 'DEVICE_NOT_LINKED':
        case 'DEVICE_REVOKED':
          // El servicio ya limpió la pista local de vinculación.
          goToIdentityLogin(err.message);
          break;
        default:
          setError(err.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [startLock, goToIdentityLogin]);

  const locked = lockRemaining > 0;

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.scroll,
        { paddingTop: insets.top + SPACING.xl, paddingBottom: insets.bottom + SPACING.lg },
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>

      <Image source={LOGO_SF} style={styles.logo} />

      <View style={styles.headerBlock}>
        <CustomTextComponent
          fontSize={FONT_SIZE.xl}
          fontWeight={FONT_WEIGHT.bold}
          color={colors.textPrimary}
          textAlign="center">
          Ingresa tu clave
        </CustomTextComponent>
        <CustomTextComponent
          fontSize={FONT_SIZE.sm}
          color={colors.textSecondary}
          textAlign="center">
          {ACCESS_CODE_LENGTH} caracteres · solo funciona en este dispositivo
        </CustomTextComponent>
      </View>

      {locked ? (
        <View style={[styles.lockBanner, { backgroundColor: colors.errorLight, borderColor: colors.error + '55' }]}>
          <Icon name="lock-clock" size={ICON_SIZE.sm} color={colors.error} />
          <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.error} style={styles.flexText}>
            Cuenta bloqueada. Podrás reintentar en {formatLock(lockRemaining)}.
          </CustomTextComponent>
        </View>
      ) : null}

      <CustomInputComponent
        nameInput="Clave de acceso"
        placeholder="Ej. K7M2Q4"
        value={code}
        onChangeText={v => { setCode(v.toUpperCase()); if (error) setError(''); }}
        // Alfanumérica: se escribe con el teclado del sistema, en mayúsculas
        // para que coincida con la normalización del servidor.
        autoCapitalize="characters"
        secureTextEntry
        maxLength={ACCESS_CODE_LENGTH}
        leftIcon={{ name: 'lock', color: colors.primary }}
        error={error}
        touched={!!error}
        editable={!isSubmitting && !locked}
      />

      <CustomButtonComponent
        text="Ingresar"
        onPress={() => submit(code)}
        isLoading={isSubmitting}
        disabled={code.length !== ACCESS_CODE_LENGTH || locked}
        loaderColor="#FFFFFF"
        style={{ backgroundColor: code.length === ACCESS_CODE_LENGTH && !locked ? colors.primary : colors.border }}
        textStyle={{ color: colors.textInverse, fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold }}
      />

      <View style={styles.altBlock}>
        <TouchableOpacity
          onPress={forgotCode}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button">
          <CustomTextComponent
            fontSize={FONT_SIZE.sm}
            fontWeight={FONT_WEIGHT.medium}
            color={colors.primary}
            textAlign="center">
            Olvidé mi clave · Ingresar con documento
          </CustomTextComponent>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('LoginApproval')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button">
          <CustomTextComponent
            fontSize={FONT_SIZE.sm}
            color={colors.textSecondary}
            textAlign="center">
            Aprobar desde otro dispositivo
          </CustomTextComponent>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.lg,
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  logo: {
    width: 140,
    height: 64,
    resizeMode: 'contain',
    alignSelf: 'center',
  },
  headerBlock: {
    gap: SPACING.xs,
  },
  lockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  flexText: {
    flex: 1,
    lineHeight: FONT_SIZE.sm * 1.4,
  },
  altBlock: {
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
});
