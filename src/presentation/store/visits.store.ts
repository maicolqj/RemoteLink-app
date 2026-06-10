import { create } from 'zustand';
import { useAuthStore } from './auth.store';
import {
  fetchVisits as apiFetchVisits,
  scheduleVisit as apiScheduleVisit,
  approveVisit as apiApproveVisit,
  denyVisit as apiDenyVisit,
  cancelVisit as apiCancelVisit,
  blacklistVisitor as apiBlacklist,
  removeFromBlacklist as apiRemoveBlacklist,
} from '../../infraestructure/services/visits.service';
import type { Visit } from '../../domain/responses/VisitResponseModel';
import type { FilterVisitsInput, ScheduleVisitInput } from '../../domain/inputs/VisitInput';

export type { Visit, VisitStatus, VisitType, VisitorIdentityType } from '../../domain/responses/VisitResponseModel';

interface VisitsState {
  visits: Visit[];
  total: number;
  isLoading: boolean;
  isActionLoading: boolean;
  error: string | null;

  fetchVisits: (filters?: FilterVisitsInput) => Promise<void>;
  scheduleVisit: (
    input: Omit<ScheduleVisitInput, 'hostResidentId' | 'unitId' | 'complexId'>,
  ) => Promise<Visit>;
  approveVisit: (visitId: string) => Promise<void>;
  denyVisit: (visitId: string, reason: string) => Promise<void>;
  cancelVisit: (visitId: string) => Promise<void>;
  blacklistVisitor: (visitorId: string, reason: string) => Promise<void>;
  removeFromBlacklist: (visitorId: string) => Promise<void>;
  addVisit: (visit: Visit) => void;
  updateVisitLocally: (visitId: string, partial: Partial<Visit>) => void;
  clearError: () => void;
}

export const useVisitsStore = create<VisitsState>((set, get) => ({
  visits: [],
  total: 0,
  isLoading: false,
  isActionLoading: false,
  error: null,

  fetchVisits: async filters => {
    const resident = useAuthStore.getState().resident;
    if (!resident) return;
    set({ isLoading: true, error: null });
    try {
      const result = await apiFetchVisits(
        resident.complexId,
        { page: 1, limit: 50 },
        { ...filters, unitId: resident.unitId },
      );
      set({ visits: result.items, total: result.pagination.total, isLoading: false });
    } catch (e: any) {
      set({ isLoading: false, error: e.message ?? 'Error cargando visitas' });
    }
  },

  scheduleVisit: async partialInput => {
    const resident = useAuthStore.getState().resident;
    if (!resident) throw new Error('Sin autenticación');
    set({ isActionLoading: true, error: null });
    try {
      const visit = await apiScheduleVisit({
        ...partialInput,
        hostResidentId: resident.id,
        unitId: resident.unitId,
        complexId: resident.complexId,
      });
      set(s => ({ visits: [visit, ...s.visits], isActionLoading: false }));
      return visit;
    } catch (e: any) {
      set({ isActionLoading: false, error: e.message });
      throw e;
    }
  },

  approveVisit: async visitId => {
    set({ isActionLoading: true });
    try {
      const result = await apiApproveVisit(visitId);
      get().updateVisitLocally(visitId, result as Partial<Visit>);
      set({ isActionLoading: false });
    } catch (e: any) {
      set({ isActionLoading: false, error: e.message });
      throw e;
    }
  },

  denyVisit: async (visitId, reason) => {
    set({ isActionLoading: true });
    try {
      const result = await apiDenyVisit(visitId, reason);
      get().updateVisitLocally(visitId, result as Partial<Visit>);
      set({ isActionLoading: false });
    } catch (e: any) {
      set({ isActionLoading: false, error: e.message });
      throw e;
    }
  },

  cancelVisit: async visitId => {
    set({ isActionLoading: true });
    try {
      const result = await apiCancelVisit(visitId);
      get().updateVisitLocally(visitId, result as Partial<Visit>);
      set({ isActionLoading: false });
    } catch (e: any) {
      set({ isActionLoading: false, error: e.message });
      throw e;
    }
  },

  blacklistVisitor: async (visitorId, reason) => {
    set({ isActionLoading: true });
    try {
      await apiBlacklist({ visitorId, reason });
      set(s => ({
        visits: s.visits.map(v =>
          v.visitor.id === visitorId
            ? { ...v, visitor: { ...v.visitor, isBlacklisted: true, blacklistReason: reason } }
            : v,
        ),
        isActionLoading: false,
      }));
    } catch (e: any) {
      set({ isActionLoading: false, error: e.message });
      throw e;
    }
  },

  removeFromBlacklist: async visitorId => {
    set({ isActionLoading: true });
    try {
      await apiRemoveBlacklist(visitorId);
      set(s => ({
        visits: s.visits.map(v =>
          v.visitor.id === visitorId
            ? { ...v, visitor: { ...v.visitor, isBlacklisted: false, blacklistReason: undefined } }
            : v,
        ),
        isActionLoading: false,
      }));
    } catch (e: any) {
      set({ isActionLoading: false, error: e.message });
      throw e;
    }
  },

  addVisit: visit => set(s => ({ visits: [visit, ...s.visits] })),

  updateVisitLocally: (visitId, partial) =>
    set(s => ({
      visits: s.visits.map(v => (v.id === visitId ? { ...v, ...partial } : v)),
    })),

  clearError: () => set({ error: null }),
}));
