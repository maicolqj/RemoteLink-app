import { create } from 'zustand';
import { useAuthStore } from './auth.store';
import {
  fetchMyUnitPackages as apiFetchMyUnitPackages,
  fetchPackageById as apiFetchPackageById,
} from '../../infraestructure/services/packages.service';
import type { Package } from '../../domain/responses/PackageResponseModel';

export type { Package } from '../../domain/responses/PackageResponseModel';
export { PackageStatus, PackageType } from '../../domain/enums/enums';

interface PackagesState {
  packages: Package[];
  isLoading: boolean;
  error: string | null;

  fetchPackages: () => Promise<void>;
  fetchPackageById: (packageId: string) => Promise<Package>;
  clearError: () => void;
}

export const usePackagesStore = create<PackagesState>((set) => ({
  packages: [],
  isLoading: false,
  error: null,

  fetchPackages: async () => {
    const resident = useAuthStore.getState().resident;
    if (!resident) return;
    set({ isLoading: true, error: null });
    try {
      // Resident-scoped endpoint: backend forces the scope to the resident's unit.
      const items = await apiFetchMyUnitPackages(resident.complex.id);
      set({ packages: items, isLoading: false });
    } catch (e: any) {
      set({ isLoading: false, error: e.message ?? 'Error cargando paquetes' });
    }
  },

  fetchPackageById: async packageId => {
    const pkg = await apiFetchPackageById(packageId);
    set(s => {
      const exists = s.packages.some(p => p.id === pkg.id);
      return {
        packages: exists
          ? s.packages.map(p => (p.id === pkg.id ? { ...p, ...pkg } : p))
          : [pkg, ...s.packages],
      };
    });
    return pkg;
  },

  clearError: () => set({ error: null }),
}));
