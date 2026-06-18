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
}

export const usePanicStore = create<PanicState>((set) => ({
  panicData: null,
  acknowledgedData: null,
  setPanicData:        (data) => set({ panicData: data }),
  setAcknowledgedData: (data) => set({ acknowledgedData: data }),
  clearPanic:          ()     => set({ panicData: null, acknowledgedData: null }),
}));
