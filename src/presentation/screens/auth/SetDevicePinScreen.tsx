import React, { useCallback, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomTextComponent from '../../components/CustomTextComponent';
import CustomInputComponent from '../../components/CustomInputComponent';
import AppHeader from '../../components/AppHeader';
import PinPadInput from '../../components/PinPadInput';
import { useTheme } from '../../providers/context/ThemeContext';
import { useAlert } from '../../providers/context/AlertContext';
import type { ProfileStackParamList } from '../../navigation/types/NavigationTypes';
import {
  setResidentDevicePin,
  validatePinStrength,
  defaultDeviceLabel,
  markPinPromptShown,
  PIN_LENGTH,
  type DeviceAuthError,
} from '../../../infraestructure/services/deviceAuth.service';
import { SPACING, RADIUS, ICON_SIZE } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';

type Route = RouteProp<ProfileStackParamList, 'SetDevicePin'>;

type Step = 'create' | 'confirm';

export default function SetDevicePinScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const { colors } = useTheme();
  const { showSuccess } = useAlert();

  const [step, setStep] = useState<Step>('create');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [label, setLabel] = useState(defaultDeviceLabel());
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleCreateComplete = useCallback((value: string) => {
    // Validación local para retroalimentación inmediata; el servidor decide.
    const weak = validatePinStrength(value);
    if (weak) {
      setError(weak);
      setPin('');
      return;
    }
    setError('');
    setStep('confirm');
  }, []);

  const save = useCallback(async (value: string) => {
    setIsSaving(true);
    setError('');
    try {
      await setResidentDevicePin(value, label.trim() || undefined);
      await markPinPromptShown();
      showSuccess(
        'A partir de ahora puedes entrar con tu PIN en este dispositivo.',
        'PIN configurado',
      );
      navigation.goBack();
    } catch (e) {
      const err = e as DeviceAuthError;
      setIsSaving(false);
      setStep('create');
      setPin('');
      setConfirmPin('');
      // DEVICE_PIN_TOO_WEAK y el resto llegan ya redactados en español.
      setError(err.message);
    }
  }, [label, navigation, showSuccess]);

  const handleConfirmComplete = useCallback((value: string) => {
    if (value !== pin) {
      setError('Los PIN no coinciden. Vuelve a intentarlo.');
      setStep('create');
      setPin('');
      setConfirmPin('');
      return;
    }
    save(value);
  }, [pin, save]);

  const skip = useCallback(async () => {
    await markPinPromptShown();
    navigation.goBack();
  }, [navigation]);

  const isConfirm = step === 'confirm';

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppHeader
        title={route.params?.firstTime ? 'Crea tu PIN' : 'PIN de este dispositivo'}
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + SPACING.xl }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        <View style={[styles.note, { backgroundColor: colors.primarySurface, borderColor: colors.primary + '40' }]}>
          <Icon name="lock" size={ICON_SIZE.sm} color={colors.primary} />
          <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.primary} style={styles.flexText}>
            El PIN vincula este dispositivo a tu cuenta: entras sin esperar códigos y sin costo.
            Tras 5 intentos fallidos el dispositivo se bloquea 15 minutos.
          </CustomTextComponent>
        </View>

        {!isConfirm ? (
          <CustomInputComponent
            nameInput="Nombre del dispositivo (opcional)"
            placeholder="Ej. iPhone de Juan"
            value={label}
            onChangeText={setLabel}
            leftIcon={{ name: 'smartphone', color: colors.primary }}
            maxLength={120}
            editable={!isSaving}
          />
        ) : null}

        <CustomTextComponent
          fontSize={FONT_SIZE.md}
          fontWeight={FONT_WEIGHT.medium}
          color={colors.textPrimary}
          textAlign="center">
          {isConfirm ? 'Repite tu PIN' : `Elige un PIN de ${PIN_LENGTH} dígitos`}
        </CustomTextComponent>

        <PinPadInput
          value={isConfirm ? confirmPin : pin}
          onChange={v => {
            if (isConfirm) setConfirmPin(v); else setPin(v);
            if (error) setError('');
          }}
          onComplete={isConfirm ? handleConfirmComplete : handleCreateComplete}
          length={PIN_LENGTH}
          error={error}
          disabled={isSaving}
        />

        {route.params?.firstTime ? (
          <TouchableOpacity
            onPress={skip}
            disabled={isSaving}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button">
            <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} textAlign="center">
              Ahora no
            </CustomTextComponent>
          </TouchableOpacity>
        ) : null}
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
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    padding: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  flexText: {
    flex: 1,
    lineHeight: FONT_SIZE.sm * 1.45,
  },
});
