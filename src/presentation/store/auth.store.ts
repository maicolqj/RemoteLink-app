import { create } from 'zustand';

export interface Resident {
  id: string;
  unitId: string;      // UUID de la unidad en el backend
  complexId: string;   // UUID del conjunto residencial
  name: string;
  lastName: string;
  email: string;
  phone: string;
  unit: string;        // Número de apto visible (ej. "502")
  tower: string;
  avatarUrl?: string;
}

interface AuthState {
  resident: Resident | null;
  token: string | null;
  isAuthenticated: boolean;
  setResident: (resident: Resident, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>(set => ({
  // Dev mock — replace with real login flow
  resident: {
    id: 'resident-uuid',
    unitId: 'unit-uuid-here',
    complexId: 'complex-uuid-here',
    name: 'Carlos',
    lastName: 'Mendoza',
    email: 'carlos.mendoza@email.com',
    phone: '+57 300 123 4567',
    unit: '502',
    tower: 'A',
  },
  token: null,
  isAuthenticated: true,

  setResident: (resident, token) => set({ resident, token, isAuthenticated: true }),
  logout: () => set({ resident: null, token: null, isAuthenticated: false }),
}));
