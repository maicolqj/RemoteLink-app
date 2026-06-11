import { create } from 'zustand';

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

  setSession: (accessToken: string, sessionId: string) => void;
  setResident: (resident: Resident) => void;
  logout: () => void;
  hasRole: (role: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  resident: null,
  token: null,
  sessionId: null,
  isAuthenticated: false,

  setSession: (token, sessionId) =>
    set({ token, sessionId, isAuthenticated: true }),

  setResident: (resident) =>
    set({ resident }),

  logout: () =>
    set({ resident: null, token: null, sessionId: null, isAuthenticated: false }),

  hasRole: (role: string) => {
    const { isAuthenticated } = get();
    return isAuthenticated && role === 'RESIDENT';
  },
}));
