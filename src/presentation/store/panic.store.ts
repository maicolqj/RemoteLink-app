import { create } from 'zustand';
import type {
  PanicAlertNewPayload,
  PanicAlertAcknowledgedPayload,
} from '../components/PanicAlertModal';

interface PanicState {
  panicData: PanicAlertNewPayload | null;
  acknowledgedData: PanicAlertAcknowledgedPayload | null;
  setPanicData: (data: PanicAlertNewPayload | null) => void;
  setAcknowledgedData: (data: PanicAlertAcknowledgedPayload | null) => void;
  clearPanic: () => void;
  /**
   * Cuánto sube el botón de pánico en la pantalla actual. Lo usan las
   * pantallas con una barra fija abajo —el chat— para que el botón quede
   * encima de ella en vez de tapar "Enviar". En cero, vuelve a su lugar.
   */
  fabLift: number;
  setFabLift: (lift: number) => void;
}

export const usePanicStore = create<PanicState>((set) => ({
  panicData: null,
  acknowledgedData: null,
  setPanicData:        (data) => set({ panicData: data }),
  setAcknowledgedData: (data) => set({ acknowledgedData: data }),
  clearPanic:          ()     => set({ panicData: null, acknowledgedData: null }),
  fabLift: 0,
  setFabLift: (lift) => set({ fabLift: Math.max(0, Math.round(lift)) }),
}));
