import React, { useCallback, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, BackHandler } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomTextComponent from '../../components/CustomTextComponent';
import CustomInputComponent from '../../components/CustomInputComponent';
import CustomButtonComponent from '../../components/CustomButtonComponent';
import AppHeader from '../../components/AppHeader';
import { useTheme } from '../../providers/context/ThemeContext';
import { useAlert } from '../../providers/context/AlertContext';
import { useAuthStore } from '../../store/auth.store';
import type { ProfileStackParamList } from '../../navigation/types/NavigationTypes';
import {
  setAccessCode,
  hasAccessCode,
  validateAccessCode,
  defaultDeviceLabel,
  ACCESS_CODE_LENGTH,
  type DeviceAuthError,
} from '../../../infraestructure/services/deviceAuth.service';
import { SPACING, RADIUS, ICON_SIZE } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';

type Route = RouteProp<ProfileStackParamList, 'SetAccessCode'>;

// `current` solo aparece al CAMBIAR una clave existente: confirma identidad
// antes de reemplazarla. Al crearla por primera vez, o al llegar por el camino
// del olvido, no hay clave anterior que pedir.
type Step = 'current' | 'create' | 'confirm';

export default function SetAccessCodeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const { colors } = useTheme();
  const { showSuccess, showQuestion } = useAlert();
  const logout = useAuthStore(s => s.logout);

  // Obligatorio: se llega aquí al primer ingreso o tras haber olvidado la clave.
  // No hay forma de saltarlo; la única salida es cerrar sesión.
  const mandatory = route.params?.mandatory === true;

  const [step, setStep] = useState<Step>('create');
  const [currentCode, setCurrentCode] = useState('');
  const [code, setCode] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [label, setLabel] = useState(defaultDeviceLabel());
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // La instancia de esta pantalla puede sobrevivir a una visita anterior cuando
  // se reutiliza la misma ruta. Sin este reinicio, al volver a entrar desde el
  // perfil aparecería en el paso de confirmación o con la clave a medio escribir.
  useFocusEffect(
    useCallback(() => {
      setCurrentCode('');
      setCode('');
      setConfirmCode('');
      setError('');

      // En el flujo obligatorio no hay clave anterior que pedir. Fuera de él se
      // le pregunta al servidor: si la cuenta ya tiene una, el cambio empieza
      // confirmando la actual.
      if (mandatory) {
        setStep('create');
        return;
      }

      let cancelled = false;
      hasAccessCode()
        .then(exists => { if (!cancelled) setStep(exists ? 'current' : 'create'); })
        .catch(() => { if (!cancelled) setStep('create'); });

      return () => { cancelled = true; };
    }, [mandatory]),
  );

  const handleCurrentComplete = useCallback((value: string) => {
    if (value.length !== ACCESS_CODE_LENGTH) return;
    // No se verifica acá: la autoridad es el servidor, que además cuenta el
    // intento fallido. Validarlo en el cliente solo daría una falsa sensación.
    setError('');
    setStep('create');
  }, []);

  const handleCreateComplete = useCallback((value: string) => {
    // Validación local para retroalimentación inmediata; el servidor decide.
    const weak = validateAccessCode(value);
    if (weak) {
      setError(weak);
      return;
    }
    setError('');
    setStep('confirm');
  }, []);

  const save = useCallback(async (value: string) => {
    setIsSaving(true);
    setError('');
    try {
      await setAccessCode(value, label.trim() || undefined, currentCode || undefined);
      showSuccess(
        'A partir de ahora entras con tu clave en este y en tus demás dispositivos.',
        'Clave configurada',
      );
      // Al llegar desde el arranque obligatorio, esta pantalla puede ser la
      // primera del stack de perfil: ahí `goBack` no hace nada y la pantalla se
      // quedaría montada. Se navega explícitamente en ese caso.
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        (navigation as any).navigate('Profile');
      }
    } catch (e) {
      const err = e as DeviceAuthError;
      setCode('');
      setConfirmCode('');

      // La clave actual falta o no coincide: volver a pedirla en vez de dejar
      // al residente reescribiendo la nueva sin saber qué falló.
      if (err.code === 'CURRENT_ACCESS_CODE_REQUIRED' || err.code === 'ACCESS_CODE_INVALID') {
        setCurrentCode('');
        setStep('current');
        setError(err.message);
      } else {
        setStep('create');
        // ACCESS_CODE_TOO_WEAK y el resto llegan ya redactados en español.
        setError(err.message);
      }
    } finally {
      // Siempre, incluso tras navegar: si la pantalla sobrevive —porque se
      // reusa la misma instancia al volver a entrar desde el perfil— quedaría
      // con el teclado deshabilitado para siempre.
      setIsSaving(false);
    }
  }, [label, currentCode, navigation, showSuccess]);

  const handleConfirmComplete = useCallback((value: string) => {
    if (value !== code) {
      setError('Las claves no coinciden. Vuelve a intentarlo.');
      setStep('create');
      setCode('');
      setConfirmCode('');
      return;
    }
    save(value);
  }, [code, save]);

  /**
   * Salida para dispositivos prestados. Sin esto, la clave obligatoria forzaría a
   * vincular el teléfono de un tercero a la cuenta del residente: ese tercero
   * quedaría pudiendo entrar con seis dígitos, y el residente gastaría uno de
   * los espacios de dispositivo que necesita para el suyo.
   */
  const leaveWithoutLinking = useCallback(() => {
    showQuestion(
      'Cerraremos tu sesión y este equipo no quedará vinculado a tu cuenta. Podrás volver a entrar cuando quieras.',
      '¿Este no es tu dispositivo?',
      {
        buttons: [
          { text: 'Seguir aquí', style: 'secondary', onPress: () => {} },
          { text: 'Cerrar sesión', style: 'primary', onPress: () => { logout(); } },
        ],
      },
    );
  }, [logout, showQuestion]);

  // Android: el botón físico de atrás también tiene que respetar la obligación.
  useFocusEffect(
    useCallback(() => {
      if (!mandatory) return;
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        leaveWithoutLinking();
        return true;
      });
      return () => sub.remove();
    }, [mandatory, leaveWithoutLinking]),
  );

  const isConfirm = step === 'confirm';
  const isCurrent = step === 'current';

  // Tres pasos comparten el mismo campo; cada uno con su valor y su acción.
  const fieldValue = isCurrent ? currentCode : isConfirm ? confirmCode : code;
  const setFieldValue = (v: string) => {
    if (isCurrent) setCurrentCode(v);
    else if (isConfirm) setConfirmCode(v);
    else setCode(v);
  };
  const submitStep = () => {
    if (isCurrent) handleCurrentComplete(currentCode);
    else if (isConfirm) handleConfirmComplete(confirmCode);
    else handleCreateComplete(code);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppHeader
        title={route.params?.firstTime ? 'Crea tu clave' : 'Cambiar mi clave'}
        showBack={!mandatory}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + SPACING.xl }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        <View style={[styles.note, { backgroundColor: colors.primarySurface, borderColor: colors.primary + '40' }]}>
          <Icon name="lock" size={ICON_SIZE.sm} color={colors.primary} />
          <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.primary} style={styles.flexText}>
            {mandatory
              ? 'Necesitas una clave para usar la app: con ella entras al instante, sin esperar mensajes. Es la misma en todos tus dispositivos. Tras 5 intentos fallidos la cuenta se bloquea 15 minutos.'
              : 'Tu clave sirve en todos los dispositivos que hayas vinculado. Cambiarla aquí la cambia en todos. Tras 5 intentos fallidos la cuenta se bloquea 15 minutos.'}
          </CustomTextComponent>
        </View>

        {!isConfirm && !isCurrent ? (
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
          {isCurrent
            ? 'Ingresa tu clave actual para confirmar que eres tú'
            : isConfirm
              ? 'Repite tu clave nueva'
              : `Elige una clave de ${ACCESS_CODE_LENGTH} caracteres, con letras y números`}
        </CustomTextComponent>

        <CustomInputComponent
          nameInput={isCurrent ? 'Clave actual' : isConfirm ? 'Repite la clave nueva' : 'Clave nueva'}
          placeholder="Ej. K7M2Q4"
          value={fieldValue}
          onChangeText={v => {
            setFieldValue(v.toUpperCase());
            if (error) setError('');
          }}
          autoCapitalize="characters"
          secureTextEntry
          maxLength={ACCESS_CODE_LENGTH}
          leftIcon={{ name: 'lock', color: colors.primary }}
          error={error}
          touched={!!error}
          editable={!isSaving}
        />

        <CustomButtonComponent
          text={isConfirm ? 'Guardar clave' : 'Continuar'}
          onPress={submitStep}
          isLoading={isSaving}
          disabled={fieldValue.length !== ACCESS_CODE_LENGTH}
          loaderColor="#FFFFFF"
          style={{
            backgroundColor:
              fieldValue.length === ACCESS_CODE_LENGTH ? colors.primary : colors.border,
          }}
          textStyle={{ color: colors.textInverse, fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold }}
        />

        {mandatory ? (
          <TouchableOpacity
            onPress={leaveWithoutLinking}
            disabled={isSaving}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button">
            <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} textAlign="center">
              Este no es mi dispositivo · Cerrar sesión
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
