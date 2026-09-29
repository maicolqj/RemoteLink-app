import { create } from 'zustand';
import type {
  PanicAlertNewPayload,
  PanicAlertAcknowledgedPayload,
} from '../components/PanicAlertModal';

/** Última ubicación conocida de quien activó el pánico (llega por socket). */
export interface PanicLocation {
  alertId: string;
  latitude: number;
  longitude: number;
  /** Radio de error en metros. */
  accuracy: number;
  capturedAt: string;
}

interface PanicState {
  panicData: PanicAlertNewPayload | null;
  panicLocation: PanicLocation | null;
  setPanicLocation: (location: PanicLocation | null) => void;
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
  panicLocation: null,
  // Una alarma nueva no hereda la ubicación de la anterior.
  setPanicData:        (data) => set({ panicData: data, panicLocation: null }),
  setAcknowledgedData: (data) => set({ acknowledgedData: data }),
  setPanicLocation:    (location) => set({ panicLocation: location }),
  clearPanic:          ()     => set({ panicData: null, acknowledgedData: null, panicLocation: null }),
  fabLift: 0,
  setFabLift: (lift) => set({ fabLift: Math.max(0, Math.round(lift)) }),
}));
