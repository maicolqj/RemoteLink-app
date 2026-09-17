import { create } from 'zustand';

import {
  fetchMyPets, fetchMyPetIncidents, addPetIncidentStatement,
  updatePet, removePet, type UpdatePetData,
} from '../../infraestructure/services/pets.service';
import type { Pet, PetIncident } from '../../domain/responses/PetResponseModel';

/**
 * Mascotas de la unidad y reportes de convivencia.
 *
 * Vive en un store y no en el estado de cada pantalla porque ambos cambian por
 * fuera: la administración valida una ficha o da curso a un reporte, el backend
 * lo avisa por socket y el residente tiene que verlo sin recargar. El plazo de
 * descargos corre desde ese momento, así que enterarse tarde le cuesta.
 */
interface PetsState {
  pets: Pet[];
  incidents: PetIncident[];
  isLoading: boolean;

  load: (complexId: string) => Promise<void>;
  edit: (input: UpdatePetData) => Promise<Pet>;
  remove: (petId: string, reason?: string) => Promise<void>;
  sendStatement: (incidentId: string, text: string) => Promise<PetIncident>;
  /** Aplica lo que llegó por socket sin volver a pedir las listas. */
  applyIncidentUpdate: (update: { incidentId: string; status: string }) => void;
  clear: () => void;
}

const patch = (list: PetIncident[], id: string, changes: Partial<PetIncident>): PetIncident[] =>
  list.map(item => (item.id === id ? { ...item, ...changes } : item));

export const usePetsStore = create<PetsState>((set, get) => ({
  pets: [],
  incidents: [],
  isLoading: false,

  load: async (complexId) => {
    set({ isLoading: true });
    try {
      const [pets, incidents] = await Promise.all([
        fetchMyPets(complexId),
        fetchMyPetIncidents(complexId),
      ]);
      set({ pets, incidents });
    } finally {
      set({ isLoading: false });
    }
  },

  edit: async (input) => {
    const updated = await updatePet(input);
    set(state => ({
      pets: state.pets.map(item => (item.id === updated.id ? { ...item, ...updated } : item)),
    }));
    return updated;
  },

  /**
   * La ficha retirada sale de la lista de inmediato. El backend la conserva
   * —los reportes ya radicados la citan—, pero para el residente dejó de estar
   * en su unidad y verla ahí sería mentirle.
   */
  remove: async (petId, reason) => {
    await removePet(petId, reason);
    set(state => ({ pets: state.pets.filter(item => item.id !== petId) }));
  },

  sendStatement: async (incidentId, text) => {
    const updated = await addPetIncidentStatement({ incidentId, text });
    set(state => ({ incidents: patch(state.incidents, incidentId, updated) }));
    return updated;
  },

  /**
   * El socket solo trae el estado. Un reporte que pasa a UNDER_DEFENSE es uno
   * que acaba de abrirse contra la unidad y todavía no está en la lista, así
   * que si no lo encuentra no inventa nada: la pantalla recarga al enfocarse.
   */
  applyIncidentUpdate: ({ incidentId, status }) => {
    const { incidents } = get();
    if (!incidents.some(item => item.id === incidentId)) return;
    set({ incidents: patch(incidents, incidentId, { status }) });
  },

  clear: () => set({ pets: [], incidents: [] }),
}));
