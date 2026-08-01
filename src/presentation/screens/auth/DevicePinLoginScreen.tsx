import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomTextComponent from '../../components/CustomTextComponent';
import PinPadInput from '../../components/PinPadInput';
import { useTheme } from '../../providers/context/ThemeContext';
import type { AuthStackParamList } from '../../navigation/types/NavigationTypes';
import {
  loginWithDevicePin,
  persistSession,
  PIN_LENGTH,
  DeviceAuthError,
} from '../../../infraestructure/services/deviceAuth.service';
import { SPACING, RADIUS, ICON_SIZE } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';
import { LOGO_SF } from '../../constants/ImagesApp';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'LoginPin'>;

/** El backend bloquea el dispositivo 15 minutos tras 5 intentos fallidos. */
const LOCK_SECONDS = 15 * 60;

const formatLock = (secs: number) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

export default function DevicePinLoginScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();

  const [pin, setPin] = useState('');
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

  const submit = useCallback(async (value: string) => {
    setIsSubmitting(true);
    setError('');
    try {
      const result = await loginWithDevicePin(value);
      await persistSession(result);
    } catch (e) {
      const err = e as DeviceAuthError;
      setPin('');
      // La lógica ramifica por `code`; `message` ya viene redactado en español
      // (incluye los intentos restantes en DEVICE_PIN_INVALID) y se muestra tal cual.
      switch (err.code) {
        case 'DEVICE_LOCKED':
          startLock();
          setError(err.message);
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
          Ingresa tu PIN
        </CustomTextComponent>
        <CustomTextComponent
          fontSize={FONT_SIZE.sm}
          color={colors.textSecondary}
          textAlign="center">
          {PIN_LENGTH} dígitos · solo funciona en este dispositivo
        </CustomTextComponent>
      </View>

      {locked ? (
        <View style={[styles.lockBanner, { backgroundColor: colors.errorLight, borderColor: colors.error + '55' }]}>
          <Icon name="lock-clock" size={ICON_SIZE.sm} color={colors.error} />
          <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.error} style={styles.flexText}>
            Dispositivo bloqueado. Podrás reintentar en {formatLock(lockRemaining)}.
          </CustomTextComponent>
        </View>
      ) : null}

      <PinPadInput
        value={pin}
        onChange={v => { setPin(v); if (error) setError(''); }}
        onComplete={submit}
        length={PIN_LENGTH}
        error={error}
        disabled={isSubmitting || locked}
      />

      <View style={styles.altBlock}>
        <TouchableOpacity
          onPress={() => goToIdentityLogin()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button">
          <CustomTextComponent
            fontSize={FONT_SIZE.sm}
            fontWeight={FONT_WEIGHT.medium}
            color={colors.primary}
            textAlign="center">
            Olvidé mi PIN · Ingresar con documento
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
