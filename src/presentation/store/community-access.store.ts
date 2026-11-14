import { create } from 'zustand';

export interface CommunityAccess {
  accessCut: boolean;
  panicAvailable: boolean;
  /** Ya ocurrió si `accessCut`; si no, es la fecha prevista del corte. */
  cutAt: string | null;
}

interface CommunityAccessState {
  access: CommunityAccess | null;
  setAccess: (access: CommunityAccess | null) => void;
  markAccessCut: () => void;
  markPanicCut: () => void;
  reset: () => void;
}

const OPEN: CommunityAccess = { accessCut: false, panicAvailable: true, cutAt: null };

/**
 * Corte de la comunidad porque la administración no renovó la suscripción. Lo
 * encienden la consulta al abrir sesión y cualquier respuesta con el error.
 */
export const useCommunityAccessStore = create<CommunityAccessState>((set, get) => ({
  access: null,
  setAccess: access => set({ access }),
  markAccessCut: () => set({ access: { ...(get().access ?? OPEN), accessCut: true } }),
  markPanicCut: () => set({ access: { ...(get().access ?? OPEN), panicAvailable: false } }),
  reset: () => set({ access: null }),
}));

/** Fecha en calendario de Colombia, sin depender de Intl en Hermes. */
export const formatCutDate = (value: string): string => {
  const bogota = new Date(new Date(value).getTime() - 5 * 60 * 60 * 1000);
  const day = String(bogota.getUTCDate()).padStart(2, '0');
  const month = String(bogota.getUTCMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${bogota.getUTCFullYear()}`;
};
