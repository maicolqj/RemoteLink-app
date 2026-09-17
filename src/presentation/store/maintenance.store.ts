import { create } from 'zustand';

import {
  fetchMaintenanceTickets,
  fetchMaintenanceTicket,
  endorseMaintenanceTicket,
  rateMaintenanceTicket,
  reopenMaintenanceTicket,
  addMaintenanceComment,
} from '../../infraestructure/services/maintenance.service';
import type { MaintenanceTicket } from '../../domain/responses/MaintenanceResponseModel';

/**
 * Tickets de mantenimiento del conjunto.
 *
 * Vive en un store y no en el estado de la pantalla porque cambia por fuera: la
 * administración asigna un técnico, el proveedor sube la foto del arreglo y el
 * backend lo avisa por socket. El residente tiene que verlo sin recargar —sobre
 * todo cuando el ticket queda en "reparado" y le toca confirmar—.
 */
interface MaintenanceState {
  tickets: MaintenanceTicket[];
  isLoading: boolean;

  load: (complexId: string) => Promise<void>;
  refreshOne: (ticketId: string) => Promise<MaintenanceTicket>;
  endorse: (ticketId: string, comment?: string) => Promise<MaintenanceTicket>;
  rate: (
    ticketId: string,
    rating: number,
    comment?: string,
  ) => Promise<MaintenanceTicket>;
  reopen: (ticketId: string, reason: string) => Promise<MaintenanceTicket>;
  comment: (ticketId: string, message: string) => Promise<MaintenanceTicket>;
  /** Aplica lo que llegó por socket sin volver a pedir la lista. */
  applyUpdate: (update: { ticketId: string; status?: string }) => void;
  clear: () => void;
}

const upsert = (
  list: MaintenanceTicket[],
  ticket: MaintenanceTicket,
): MaintenanceTicket[] => {
  const exists = list.some(item => item.id === ticket.id);
  return exists
    ? list.map(item => (item.id === ticket.id ? { ...item, ...ticket } : item))
    : [ticket, ...list];
};

export const useMaintenanceStore = create<MaintenanceState>((set, get) => ({
  tickets: [],
  isLoading: false,

  load: async complexId => {
    set({ isLoading: true });
    try {
      const tickets = await fetchMaintenanceTickets(complexId);
      set({ tickets });
    } finally {
      set({ isLoading: false });
    }
  },

  refreshOne: async ticketId => {
    const ticket = await fetchMaintenanceTicket(ticketId);
    set(state => ({ tickets: upsert(state.tickets, ticket) }));
    return ticket;
  },

  endorse: async (ticketId, comment) => {
    const updated = await endorseMaintenanceTicket(ticketId, comment);
    set(state => ({ tickets: upsert(state.tickets, updated) }));
    return updated;
  },

  rate: async (ticketId, rating, comment) => {
    const updated = await rateMaintenanceTicket({ ticketId, rating, comment });
    set(state => ({ tickets: upsert(state.tickets, updated) }));
    return updated;
  },

  reopen: async (ticketId, reason) => {
    const updated = await reopenMaintenanceTicket(ticketId, reason);
    set(state => ({ tickets: upsert(state.tickets, updated) }));
    return updated;
  },

  comment: async (ticketId, message) => {
    const updated = await addMaintenanceComment(ticketId, message);
    set(state => ({ tickets: upsert(state.tickets, updated) }));
    return updated;
  },

  /**
   * El socket solo trae el estado. Si el ticket no está en la lista no se
   * inventa nada: puede ser uno privado de otro vecino, y la pantalla vuelve a
   * pedir la lista al enfocarse.
   */
  applyUpdate: ({ ticketId, status }) => {
    if (!status) return;
    const exists = get().tickets.some(item => item.id === ticketId);
    if (!exists) return;

    set(state => ({
      tickets: state.tickets.map(item =>
        item.id === ticketId
          ? { ...item, status: status as MaintenanceTicket['status'] }
          : item,
      ),
    }));
  },

  clear: () => set({ tickets: [], isLoading: false }),
}));
