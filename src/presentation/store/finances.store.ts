import { create } from 'zustand';
import type {
  UnitBalanceResponse,
  UnitAccountStatementResponse,
  UnitWalletResponse,
  Payment,
} from '../../domain/responses/FinanceResponseModel';
import {
  fetchUnitBalance,
  fetchUnitAccountStatement,
  fetchUnitWallet,
  fetchPaymentsByCharge,
} from '../../infraestructure/services/finances.service';

// Re-export types so screens import from one place
export type { UnitBalanceResponse, UnitAccountStatementResponse, UnitWalletResponse, Payment };
export type { AccountMovement, WalletEntry } from '../../domain/responses/FinanceResponseModel';

interface FinancesState {
  balance: UnitBalanceResponse | null;
  statement: UnitAccountStatementResponse | null;
  wallet: UnitWalletResponse | null;
  chargePayments: Record<string, Payment[]>; // keyed by chargeId
  isLoadingBalance: boolean;
  isLoadingStatement: boolean;
  isLoadingWallet: boolean;
  error: string | null;

  fetchBalance: (unitId: string, complexId: string) => Promise<void>;
  fetchStatement: (unitId: string, complexId: string, period?: string) => Promise<void>;
  fetchWallet: (unitId: string, complexId: string) => Promise<void>;
  fetchAll: (unitId: string, complexId: string) => Promise<void>;
  fetchChargePayments: (chargeId: string) => Promise<void>;
  clearError: () => void;
}

export const useFinancesStore = create<FinancesState>((set, get) => ({
  balance: null,
  statement: null,
  wallet: null,
  chargePayments: {},
  isLoadingBalance: false,
  isLoadingStatement: false,
  isLoadingWallet: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchBalance: async (unitId, complexId) => {
    set({ isLoadingBalance: true, error: null });
    try {
      const balance = await fetchUnitBalance(unitId, complexId);
      set({ balance });
    } catch (e) {
      set({ error: (e as Error).message });
    } finally {
      set({ isLoadingBalance: false });
    }
  },

  fetchStatement: async (unitId, complexId, period) => {
    set({ isLoadingStatement: true, error: null });
    try {
      const statement = await fetchUnitAccountStatement(unitId, complexId, period);
      set({ statement });
    } catch (e) {
      set({ error: (e as Error).message });
    } finally {
      set({ isLoadingStatement: false });
    }
  },

  fetchWallet: async (unitId, complexId) => {
    set({ isLoadingWallet: true, error: null });
    try {
      const wallet = await fetchUnitWallet(unitId, complexId);
      set({ wallet });
    } catch (e) {
      set({ error: (e as Error).message });
    } finally {
      set({ isLoadingWallet: false });
    }
  },

  fetchAll: async (unitId, complexId) => {
    // Run balance + statement + wallet in parallel
    await Promise.all([
      get().fetchBalance(unitId, complexId),
      get().fetchStatement(unitId, complexId),
      get().fetchWallet(unitId, complexId),
    ]);
  },

  fetchChargePayments: async chargeId => {
    try {
      const payments = await fetchPaymentsByCharge(chargeId);
      set(state => ({
        chargePayments: { ...state.chargePayments, [chargeId]: payments },
      }));
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },
}));
