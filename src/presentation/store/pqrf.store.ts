import { create } from 'zustand';

import {
  fetchMyPqrf, fetchPqrfInbox, openPqrf, resolvePqrf,
} from '../../infraestructure/services/pqrf.service';
import type { Pqrf } from '../../domain/responses/PqrfResponseModel';

/**
 * Radicados del residente y de la bandeja del consejo.
 *
 * Vive en un store y no en el estado de cada pantalla porque el estado del
 * radicado cambia por fuera: cuando otro destinatario lo abre o lo marca como
 * resuelto, el backend lo avisa por socket y la lista y la ficha tienen que
 * reflejarlo sin que nadie recargue.
 */
interface PqrfState {
  mine: Pqrf[];
  inbox: Pqrf[];
  isLoading: boolean;

  load: (complexId: string, includeInbox: boolean) => Promise<void>;
  open: (pqrfId: string) => Promise<Pqrf>;
  resolve: (pqrfId: string) => Promise<Pqrf>;
  /** Aplica lo que llegó por socket sin volver a pedir las listas. */
  applyUpdate: (update: { pqrfId: string; status: string; resolvedAt?: string | null }) => void;
  clear: () => void;
}

/** Reemplaza el radicado en una lista, si está. */
const patch = (list: Pqrf[], pqrfId: string, changes: Partial<Pqrf>): Pqrf[] =>
  list.map(item => (item.id === pqrfId ? { ...item, ...changes } : item));

export const usePqrfStore = create<PqrfState>((set, get) => ({
  mine: [],
  inbox: [],
  isLoading: false,

  load: async (complexId, includeInbox) => {
    set({ isLoading: true });
    try {
      const [mine, inbox] = await Promise.all([
        fetchMyPqrf(complexId),
        includeInbox ? fetchPqrfInbox(complexId) : Promise.resolve([] as Pqrf[]),
      ]);
      set({ mine, inbox });
    } finally {
      set({ isLoading: false });
    }
  },

  open: async (pqrfId) => {
    const updated = await openPqrf(pqrfId);
    set(state => ({
      mine:  patch(state.mine, pqrfId, updated),
      inbox: patch(state.inbox, pqrfId, updated),
    }));
    return updated;
  },

  resolve: async (pqrfId) => {
    const updated = await resolvePqrf(pqrfId);
    set(state => ({
      mine:  patch(state.mine, pqrfId, updated),
      inbox: patch(state.inbox, pqrfId, updated),
    }));
    return updated;
  },

  applyUpdate: ({ pqrfId, status, resolvedAt }) => {
    const { mine, inbox } = get();
    const changes = { status, resolvedAt: resolvedAt ?? null } as Partial<Pqrf>;
    set({
      mine:  patch(mine, pqrfId, changes),
      inbox: patch(inbox, pqrfId, changes),
    });
  },

  clear: () => set({ mine: [], inbox: [] }),
}));
