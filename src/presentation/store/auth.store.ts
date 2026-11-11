import { create } from 'zustand';
import SecureStorageService from '../../infraestructure/services/SecureStorageService';
import { clearPanicSelfUserId } from '../../infraestructure/services/panicSelfIdentity';
import { requestComplexSwitch } from '../../infraestructure/services/residences.service';
// Ciclo a propósito (los stores del conjunto importan este store): solo se usa
// dentro de switchComplex, nunca al cargar el módulo.
import { resetComplexScopedState } from './resetComplexScope';

export interface ResidentUser {
  id: string;
  name: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  identity: string;
  rating?: number;
}

export interface ResidentBuilding {
  id: string;
  name: string;
  floors: number;
}

export interface ResidentUnit {
  id: string;
  number: string;
  floor: number;
  building: ResidentBuilding;
}

export interface ResidentComplex {
  id: string;
  name: string;
  /** Módulos encendidos. Null o vacío significa "todos", igual que en el servidor. */
  enabledModules?: string[] | null;
}

export interface Resident {
  id: string;
  type: string;
  status: string;
  isMainResident: boolean;
  /** Miembro del consejo: le habilita la bandeja de radicados dirigidos al consejo. */
  isCouncilMember?: boolean;
  startDate: string;
  user: ResidentUser;
  unit: ResidentUnit;
  complex: ResidentComplex;
}

interface AuthState {
  resident: Resident | null;
  token: string | null;
  sessionId: string | null;
  isAuthenticated: boolean;
  hydrating: boolean;
  /**
   * true cuando la sesión viene del Keychain y no de un login recién hecho. Lo
   * usa el ofrecimiento de biometría para no encimarse a los diálogos del
   * primer arranque (clave de acceso obligatoria, inicio automático): el
   * AlertProvider muestra uno a la vez y el segundo pisa al primero.
   */
  sessionRestored: boolean;
  /**
   * Por qué el servidor cerró la sesión (residencia suspendida, cuenta
   * suspendida, sesión cerrada desde otro lado). Sobrevive al `logout` para
   * que el login lo muestre una vez; sin esto el residente volvía al login sin
   * saber qué pasó.
   */
  logoutNotice: string | null;
  /** Nombre del conjunto al que se está cambiando (pantalla de carga); null si no. */
  switchingTo: string | null;

  setSession: (accessToken: string, sessionId: string) => void;
  setResident: (resident: Resident) => void;
  /** Reemplaza la lista cuando el SUPER_ADMIN la cambia (llega por socket). */
  setEnabledModules: (modules: string[]) => void;
  /** ¿El conjunto tiene encendido este módulo? */
  isModuleEnabled: (module: string) => boolean;
  logout: () => Promise<void>;
  /**
   * Cambia el conjunto de la sesión sin cerrarla (residente con varias
   * residencias). Si el servidor lo rechaza, nada cambia y el error sube.
   */
  switchComplex: (complexId: string, complexName: string) => Promise<void>;
  setLogoutNotice: (notice: string | null) => void;
  /** Devuelve el aviso pendiente y lo borra: se muestra una sola vez. */
  consumeLogoutNotice: () => string | null;
  hasRole: (role: string) => boolean;
  hydrateSession: () => Promise<'authenticated' | 'biometric_required' | 'unauthenticated'>;
}

/**
 * La regla de "qué módulo está encendido", suelta del store.
 *
 * Existe aparte para que una pantalla pueda aplicarla sobre la lista que ya
 * tiene suscrita. `isModuleEnabled` lee el store por dentro, así que llamarla
 * desde un `useMemo` deja el resultado congelado: la función nunca cambia de
 * referencia y el memo no se entera de que la lista cambió. Con esto la
 * dependencia es la lista, que es lo que de verdad cambia, y la regla sigue
 * escrita una sola vez.
 */
export const moduleEnabledIn = (
  modules: string[] | null | undefined,
  module: string,
): boolean => {
  // Lista vacía o nula = todos habilitados. Es la misma regla del servidor, y
  // no un descuido: un conjunto que nunca tocó la configuración tiene la lista
  // en blanco, y arrancar escondiéndole todo dejaría la app vacía el primer día.
  if (!modules || modules.length === 0) return true;
  return modules.includes(module);
};

export const useAuthStore = create<AuthState>((set, get) => ({
  resident: null,
  token: null,
  sessionId: null,
  isAuthenticated: false,
  hydrating: true,
  sessionRestored: false,
  logoutNotice: null,
  switchingTo: null,

  setSession: (token, sessionId) =>
    set({ token, sessionId, isAuthenticated: true }),

  setResident: (resident) =>
    set({ resident }),

  setEnabledModules: (modules) =>
    set(state =>
      state.resident
        ? { resident: { ...state.resident, complex: { ...state.resident.complex, enabledModules: modules } } }
        : state,
    ),

  /** Ver `moduleEnabledIn`: ahí está la regla y por qué vive suelta. */
  isModuleEnabled: (module) => moduleEnabledIn(get().resident?.complex?.enabledModules, module),

  logout: async () => {
    // Antes de limpiar nada: la mutación exige sesión válida, y sin el
    // desregistro el servidor sigue mandando push —pánico, visitas, finanzas—
    // a un equipo donde ya no hay nadie. Best-effort: sin red no puede impedir
    // que la sesión se cierre, y para ese caso queda la compuerta local.
    const { deactivateFCMToken } = await import('../../infraestructure/services/NotificationService');
    await deactivateFCMToken();

    await SecureStorageService.clearTokens();
    await SecureStorageService.clearUserProfile();
    // Cierra la compuerta nativa del pánico y borra el espejo del usuario. Un id
    // viejo silenciaría un pánico legítimo de ese mismo usuario dirigido a la
    // cuenta que entre después en este equipo.
    await clearPanicSelfUserId();
    set({ resident: null, token: null, sessionId: null, isAuthenticated: false, sessionRestored: false });
  },

  switchComplex: async (complexId, complexName) => {
    set({ switchingTo: complexName });
    try {
      const { accessToken, sessionId } = await requestComplexSwitch(complexId);
      await resetComplexScopedState();
      // Token nuevo → el socket se reconecta a las salas del conjunto nuevo.
      // Ficha en null → ProfileBootstrap carga la del conjunto nuevo.
      set({
        token: accessToken,
        sessionId: sessionId ?? get().sessionId,
        isAuthenticated: true,
        resident: null,
      });
    } finally {
      set({ switchingTo: null });
    }
  },

  setLogoutNotice: (notice) => set({ logoutNotice: notice }),

  consumeLogoutNotice: () => {
    const notice = get().logoutNotice;
    if (notice) set({ logoutNotice: null });
    return notice;
  },

  hasRole: (role: string) => {
    const { isAuthenticated } = get();
    return isAuthenticated && role === 'RESIDENT';
  },

  hydrateSession: async () => {
    try {
      const hasTokens = await SecureStorageService.hasTokens();
      if (!hasTokens) {
        set({ hydrating: false });
        return 'unauthenticated';
      }

      const biometricEnabled = await SecureStorageService.isBiometricEnabled();
      if (biometricEnabled) {
        // AuthGate handles hydrating: false after biometric resolves
        return 'biometric_required';
      }

      const tokens = await SecureStorageService.getTokens();
      if (!tokens?.accessToken) {
        set({ hydrating: false });
        return 'unauthenticated';
      }

      // Verificar accessToken al abrir la app: si está vencido (o por vencer en
      // <60s), canjearlo por uno nuevo con el refreshToken ANTES de marcar la
      // sesión como válida. Evita el ciclo "primer query → 401 → logout".
      const expiringSoon = tokens.accessTokenExpiresAt
        ? tokens.accessTokenExpiresAt - Date.now() < 60_000
        : false;

      if (expiringSoon) {
        const { refreshSession } = await import('../../infraestructure/services/auth.service');
        const newToken = await refreshSession();
        if (!newToken) {
          await SecureStorageService.clearTokens();
          set({ hydrating: false });
          return 'unauthenticated';
        }
        const fresh = await SecureStorageService.getTokens();
        set({
          token: newToken,
          sessionId: fresh?.sessionId ?? tokens.sessionId,
          isAuthenticated: true,
          hydrating: false,
          sessionRestored: true,
        });
        return 'authenticated';
      }

      set({ token: tokens.accessToken, sessionId: tokens.sessionId, isAuthenticated: true, hydrating: false, sessionRestored: true });
      return 'authenticated';
    } catch {
      set({ hydrating: false });
      return 'unauthenticated';
    }
  },
}));
