import React, { useCallback, useState } from 'react';
import { StyleSheet, BackHandler } from 'react-native';
import { StackActions, useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import CustomTextComponent from '../../components/CustomTextComponent';
import CustomInputComponent from '../../components/CustomInputComponent';
import CodeSegmentInput from '../../components/CodeSegmentInput';
import AuthScreen from '../../components/auth/AuthScreen';
import AuthBanner from '../../components/auth/AuthBanner';
import AuthButton from '../../components/auth/AuthButton';
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
import { SPACING } from '../../constants/spacing';
import { FONT_SIZE } from '../../constants/typography';

type Route = RouteProp<ProfileStackParamList, 'SetAccessCode'>;

// `current` solo aparece al CAMBIAR una clave existente: confirma identidad
// antes de reemplazarla. Al crearla por primera vez, o al llegar por el camino
// del olvido, no hay clave anterior que pedir.
type Step = 'current' | 'create' | 'confirm';

export default function SetAccessCodeScreen() {
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
      if (mandatory) {
        // Primer ingreso: crear la clave era el último trámite de la
        // autenticación, así que la app tiene que arrancar en Inicio.
        //
        // No basta con navegar a la pestaña Inicio. Esta pantalla vive DENTRO
        // del stack de Perfil (el arranque la apila sobre `Profile`), y un
        // `goBack` o un simple cambio de pestaña la dejan en el historial de
        // esa pestaña: al volver a Perfil, la pestaña restaura su último
        // estado y la clave vuelve a pedirse aunque ya esté creada.
        //
        // Por eso van los dos pasos: primero se vacía el stack de Perfil, y
        // recién después se cambia de pestaña.
        navigation.dispatch(StackActions.popToTop());
        (navigation as any).navigate('Main', {
          screen: 'HomeTab',
          params: { screen: 'Home' },
        });
      } else if (navigation.canGoBack()) {
        // Cambio voluntario desde Ajustes: se vuelve a donde estaba.
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
  }, [label, currentCode, mandatory, navigation, showSuccess]);

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

  // ── Render ─────────────────────────────────────────────────────────────────

  // Cambiar una clave existente añade un paso al principio (confirmar la
  // actual), así que la numeración no es fija.
  const total = isCurrent || currentCode ? 3 : 2;
  const current = isCurrent ? 1 : isConfirm ? total : total - 1;

  const heading = isCurrent
    ? {
        title: 'Confirma que eres tú',
        subtitle: 'Ingresa la clave que usas hoy antes de reemplazarla.',
      }
    : isConfirm
      ? {
          title: 'Repite tu clave',
          subtitle: 'Escríbela otra vez para descartar un error de tecleo.',
        }
      : {
          title: route.params?.firstTime ? 'Crea tu clave' : 'Tu clave nueva',
          subtitle: `Elige ${ACCESS_CODE_LENGTH} caracteres con letras y números. Es la que usarás para entrar a partir de ahora.`,
        };

  return (
    <AuthScreen
      title={heading.title}
      subtitle={heading.subtitle}
      step={{ current, total }}
      showBack={!mandatory}
      onBack={() => navigation.goBack()}>

      {/* El porqué de la clave, no sus reglas: las reglas ya están en el
          subtítulo, junto al campo donde importan. */}
      <AuthBanner tone="info" icon="lock">
        {mandatory
          ? 'Con tu clave entras al instante, sin esperar mensajes, y sirve en todos tus dispositivos. Tras 5 intentos fallidos la cuenta se bloquea 15 minutos.'
          : 'Tu clave sirve en todos los dispositivos que hayas vinculado: cambiarla aquí la cambia en todos.'}
      </AuthBanner>

      {!isConfirm && !isCurrent ? (
        <CustomInputComponent
          nameInput="Nombre de este dispositivo (opcional)"
          placeholder="Ej. iPhone de Juan"
          value={label}
          onChangeText={setLabel}
          leftIcon={{ name: 'smartphone', color: colors.primary }}
          maxLength={120}
          editable={!isSaving}
        />
      ) : null}

      <CodeSegmentInput
        value={fieldValue}
        onChange={v => {
          setFieldValue(v);
          if (error) setError('');
        }}
        length={ACCESS_CODE_LENGTH}
        prefix={null}
        hint={isCurrent ? 'Toca para ingresar tu clave actual' : 'Toca para ingresar la clave'}
        secure
        error={error}
        editable={!isSaving}
      />

      <AuthButton
        text={isConfirm ? 'Guardar clave' : 'Continuar'}
        onPress={submitStep}
        loading={isSaving}
        disabled={fieldValue.length !== ACCESS_CODE_LENGTH}
        icon={isConfirm ? 'check' : 'arrow-forward'}
      />

      {mandatory ? (
        <>
          <CustomTextComponent fontSize={FONT_SIZE.xs} color={colors.textTertiary} style={styles.borrowedHint}>
            ¿Estás usando el teléfono de otra persona?
          </CustomTextComponent>
          <AuthButton
            text="Este no es mi dispositivo · Cerrar sesión"
            onPress={leaveWithoutLinking}
            variant="text"
            disabled={isSaving}
          />
        </>
      ) : null}
    </AuthScreen>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  borrowedHint: {
    textAlign: 'center',
    marginBottom: -SPACING.sm,
  },
});
