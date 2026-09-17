import { create } from 'zustand';

/**
 * Estado de votaciones que cambia por fuera de la app.
 *
 * `enabled` decide si el Home ofrece el menú; `version` sube cada vez que el
 * servidor avisa por socket que algo cambió —la administración abrió o cerró
 * una pregunta, o encendió o apagó el módulo— y las pantallas abiertas
 * recargan con eso.
 *
 * El mismo aviso puede llegar dos veces (por la sala del complejo y por el
 * canal propio del residente), así que se descarta el repetido por su clave.
 */
interface VotingState {
  /** null = todavía no se sabe. */
  enabled: boolean | null;
  version: number;
  lastEventKey: string | null;

  setEnabled: (enabled: boolean) => void;
  /** Avisa un cambio; ignora el mismo aviso si llega repetido. */
  bump: (eventKey: string) => void;
}

export const useVotingStore = create<VotingState>((set, get) => ({
  enabled: null,
  version: 0,
  lastEventKey: null,

  setEnabled: enabled => set({ enabled }),

  bump: eventKey => {
    if (get().lastEventKey === eventKey) return;
    set(state => ({ version: state.version + 1, lastEventKey: eventKey }));
  },
}));
