import { create } from 'zustand';
import { useAuthStore } from './auth.store';
import {
  fetchAmenities as apiFetchAmenities,
  fetchAmenityAvailability as apiFetchAvailability,
  fetchMyUnitBookings as apiFetchMyUnitBookings,
  fetchBookingById as apiFetchBookingById,
  createBooking as apiCreateBooking,
  cancelBooking as apiCancelBooking,
} from '../../infraestructure/services/amenities.service';
import type {
  Amenity,
  AmenityAvailability,
  AmenityBooking,
} from '../../domain/responses/AmenityResponseModel';

export type {
  Amenity,
  AmenitySchedule,
  AmenityAvailability,
  AmenityAvailabilityDay,
  AmenityBusyRange,
  AmenitySlot,
  AmenityBooking,
} from '../../domain/responses/AmenityResponseModel';
export {
  AmenityType,
  AmenityStatus,
  AmenityBookingMode,
  AmenityDurationUnit,
  AmenityFeeType,
  AmenityBookingStatus,
} from '../../domain/enums/enums';

interface AmenitiesState {
  amenities: Amenity[];
  bookings: AmenityBooking[];
  /** Disponibilidad de la zona que se está viendo. Se limpia al cambiar de zona. */
  availability: AmenityAvailability | null;

  isLoading: boolean;
  isLoadingAvailability: boolean;
  isSubmitting: boolean;
  error: string | null;

  fetchAmenities: () => Promise<void>;
  fetchAvailability: (amenityId: string, from: string, to: string) => Promise<void>;
  clearAvailability: () => void;

  fetchBookings: () => Promise<void>;
  fetchBookingById: (bookingId: string) => Promise<AmenityBooking>;
  createBooking: (input: {
    amenityId: string; startAt: string; endAt: string;
    attendees: number; purpose?: string; notes?: string;
    useCouncilFreeQuota?: boolean;
  }) => Promise<AmenityBooking>;
  cancelBooking: (bookingId: string, reason?: string) => Promise<void>;

  clearError: () => void;
}

const messageOf = (e: unknown, fallback: string): string =>
  e instanceof Error && e.message ? e.message : fallback;

export const useAmenitiesStore = create<AmenitiesState>(set => ({
  amenities: [],
  bookings: [],
  availability: null,

  isLoading: false,
  isLoadingAvailability: false,
  isSubmitting: false,
  error: null,

  fetchAmenities: async () => {
    const resident = useAuthStore.getState().resident;
    if (!resident) return;
    set({ isLoading: true, error: null });
    try {
      set({ amenities: await apiFetchAmenities(resident.complex.id), isLoading: false });
    } catch (e: unknown) {
      set({ isLoading: false, error: messageOf(e, 'Error cargando las zonas comunes') });
    }
  },

  fetchAvailability: async (amenityId, from, to) => {
    set({ isLoadingAvailability: true, error: null });
    try {
      set({
        availability: await apiFetchAvailability(amenityId, from, to),
        isLoadingAvailability: false,
      });
    } catch (e: unknown) {
      set({
        isLoadingAvailability: false,
        availability: null,
        error: messageOf(e, 'Error cargando la disponibilidad'),
      });
    }
  },

  clearAvailability: () => set({ availability: null }),

  fetchBookings: async () => {
    const resident = useAuthStore.getState().resident;
    if (!resident) return;
    set({ isLoading: true, error: null });
    try {
      set({ bookings: await apiFetchMyUnitBookings(resident.complex.id), isLoading: false });
    } catch (e: unknown) {
      set({ isLoading: false, error: messageOf(e, 'Error cargando tus reservas') });
    }
  },

  fetchBookingById: async bookingId => {
    const booking = await apiFetchBookingById(bookingId);
    set(s => {
      const exists = s.bookings.some(b => b.id === booking.id);
      return {
        bookings: exists
          ? s.bookings.map(b => (b.id === booking.id ? { ...b, ...booking } : b))
          : [booking, ...s.bookings],
      };
    });
    return booking;
  },

  createBooking: async input => {
    set({ isSubmitting: true, error: null });
    try {
      const booking = await apiCreateBooking(input);
      set(s => ({ bookings: [booking, ...s.bookings], isSubmitting: false }));
      // La franja recién tomada deja de estar libre para todos, así que la
      // disponibilidad en memoria queda obsoleta apenas se confirma.
      set({ availability: null });
      return booking;
    } catch (e: unknown) {
      const msg = messageOf(e, 'No se pudo crear la reserva');
      set({ isSubmitting: false, error: msg });
      throw new Error(msg);
    }
  },

  cancelBooking: async (bookingId, reason) => {
    set({ isSubmitting: true, error: null });
    try {
      const updated = await apiCancelBooking(bookingId, reason);
      set(s => ({
        bookings: s.bookings.map(b => (b.id === updated.id ? { ...b, ...updated } : b)),
        isSubmitting: false,
        availability: null,
      }));
    } catch (e: unknown) {
      const msg = messageOf(e, 'No se pudo cancelar la reserva');
      set({ isSubmitting: false, error: msg });
      throw new Error(msg);
    }
  },

  clearError: () => set({ error: null }),
}));
