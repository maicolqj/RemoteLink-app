import { create } from 'zustand';
import SecureStorageService from '../../infraestructure/services/SecureStorageService';

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
}

export interface Resident {
  id: string;
  type: string;
  status: string;
  isMainResident: boolean;
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

  setSession: (accessToken: string, sessionId: string) => void;
  setResident: (resident: Resident) => void;
  logout: () => Promise<void>;
  hasRole: (role: string) => boolean;
  hydrateSession: () => Promise<'authenticated' | 'biometric_required' | 'unauthenticated'>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  resident: null,
  token: null,
  sessionId: null,
  isAuthenticated: false,
  hydrating: true,

  setSession: (token, sessionId) =>
    set({ token, sessionId, isAuthenticated: true }),

  setResident: (resident) =>
    set({ resident }),

  logout: async () => {
    await SecureStorageService.clearTokens();
    await SecureStorageService.clearUserProfile();
    set({ resident: null, token: null, sessionId: null, isAuthenticated: false });
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
        });
        return 'authenticated';
      }

      set({ token: tokens.accessToken, sessionId: tokens.sessionId, isAuthenticated: true, hydrating: false });
      return 'authenticated';
    } catch {
      set({ hydrating: false });
      return 'unauthenticated';
    }
  },
}));
