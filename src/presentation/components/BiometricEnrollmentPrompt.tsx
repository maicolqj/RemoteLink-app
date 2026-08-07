import { useEffect, useRef } from 'react';
import { useAlert } from '../providers/context/AlertContext';
import { useAuthStore } from '../store/auth.store';
import { usePanicStore } from '../store/panic.store';
import { useSettingsStore } from '../store/settings.store';
import SecureStorageService from '../../infraestructure/services/SecureStorageService';

/**
 * Ofrece activar la biometría una vez por instalación.
 *
 * La biometría ya existía —el toggle de Ajustes y el `AuthGate` que la exige al
 * arrancar—, pero nadie la encontraba: había que ir a buscarla. Esto la propone.
 *
 * Se dispara en una sesión RESTAURADA, no justo después del login, y esa
 * demora es deliberada: el primer arranque ya gasta sus diálogos en cosas
 * obligatorias (la clave de acceso, el inicio automático del fabricante) y el
 * `AlertProvider` muestra uno a la vez, así que el segundo pisaría al primero.
 * El costo es que el ofrecimiento llega en la segunda apertura de la app; a
 * cambio no compite con nada y no hay que coordinar el orden de tres flujos.
 *
 * No renderiza nada: usa el alert global, el mismo que el aviso de autostart.
 */
export function BiometricEnrollmentPrompt() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const sessionRestored = useAuthStore(s => s.sessionRestored);

  const hydrated     = useSettingsStore(s => s.hydrated);
  const supported    = useSettingsStore(s => s.biometricSupported);
  const enabled      = useSettingsStore(s => s.biometricEnabled);
  const promptShown  = useSettingsStore(s => s.biometricPromptShown);
  const biometricType = useSettingsStore(s => s.biometricType);

  // Una alerta de pánico puede llegar en cualquier momento, incluso en el
  // arranque. Ofrecer biometría encima de una emergencia es indefendible: si hay
  // pánico activo se espera al siguiente arranque.
  const panicData = usePanicStore(s => s.panicData);

  const { showQuestion, showSuccess, showError } = useAlert();

  // El estado persistido tarda un ciclo en llegar; sin esto el efecto podría
  // volver a preguntar antes de que `biometricPromptShown` se propague.
  const askedRef = useRef(false);

  useEffect(() => {
    if (askedRef.current) return;
    if (!isAuthenticated || !sessionRestored || !hydrated) return;
    if (!supported || enabled || promptShown) return;
    if (panicData) return;

    askedRef.current = true;

    // El equipo dice cómo se llama lo que tiene (Huella dactilar, Face ID…);
    // "biometría" a secas es el último recurso.
    const label = biometricType ?? 'Biometría';
    const lowerLabel = label.toLowerCase();

    const enableBiometric = async () => {
      // Se verifica ANTES de activar: si el lector falla o el usuario no llega a
      // confirmar, no queda una preferencia encendida que solo se note en el
      // próximo arranque, cuando ya estorba.
      const auth = await SecureStorageService.authenticateUser(
        `Confirma tu identidad para activar ${lowerLabel}`,
      );

      if (!auth.success) {
        if (auth.errorCode !== 'cancelled') {
          showError(
            'No se pudo verificar tu identidad. Puedes activarlo cuando quieras desde Ajustes.',
            'No se activó',
          );
        }
        return;
      }

      await useSettingsStore.getState().setBiometricEnabled(true);
      showSuccess(
        `La próxima vez que abras la app te pediremos ${lowerLabel}.`,
        `${label} activada`,
      );
    };

    showQuestion(
      `Entra sin escribir tu código: la próxima vez que abras la app te pedimos ${lowerLabel}. Puedes cambiarlo cuando quieras desde Ajustes.`,
      `Activar ${lowerLabel}`,
      {
        buttons: [
          { text: 'Ahora no', style: 'secondary', onPress: () => {} },
          { text: 'Activar', style: 'primary', onPress: () => { void enableBiometric(); } },
        ],
      },
    );

    // Se marca al MOSTRARLO, no al responderlo: si la app muere con el diálogo
    // abierto, el ofrecimiento ya se hizo y no debe repetirse. Quien lo dejó
    // pasar lo tiene en Ajustes.
    void useSettingsStore.getState().markBiometricPromptShown();
  }, [
    isAuthenticated,
    sessionRestored,
    hydrated,
    supported,
    enabled,
    promptShown,
    biometricType,
    panicData,
    showQuestion,
    showSuccess,
    showError,
  ]);

  return null;
}

export default BiometricEnrollmentPrompt;
