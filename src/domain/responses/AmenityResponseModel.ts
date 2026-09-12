import type {
  AmenityType,
  AmenityStatus,
  AmenityBookingMode,
  AmenityDurationUnit,
  AmenityFeeType,
  AmenityBookingStatus,
} from '../enums/enums';

export interface AmenitySchedule {
  id: string;
  /** 0 = domingo … 6 = sábado */
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isActive: boolean;
}

export interface Amenity {
  id: string;
  name: string;
  description?: string | null;
  type: AmenityType | string;
  status: AmenityStatus | string;
  location?: string | null;
  rules?: string | null;
  imageUrls?: string[] | null;
  bookingMode: AmenityBookingMode | string;
  /** HOURS: se resuelve dentro de un día. DAYS: jornadas completas. */
  durationUnit: AmenityDurationUnit | string;
  slotDurationMinutes: number;
  minDurationMinutes: number;
  maxDurationMinutes: number;
  capacity: number;
  maxSimultaneousBookings: number;
  advanceBookingDays: number;
  minAdvanceDays: number;
  cancellationDeadlineDays: number;
  /** Se suman a los días para formar el plazo real de cancelación. */
  cancellationDeadlineHours: number;
  /** % de la tarifa que se retiene al cancelar fuera de plazo. */
  lateCancellationFeePercent: number;
  /** Reservas gratis al año por miembro del consejo. 0 = la zona no da el beneficio. */
  councilFreeBookingsPerYear: number;
  requiresApproval: boolean;
  feeType: AmenityFeeType | string;
  feeAmount: number;
  complexId: string;
  schedules?: AmenitySchedule[] | null;
}

/** Franja reservable. En zonas por jornadas, cubre el día completo. */
export interface AmenitySlot {
  startAt: string;
  endAt: string;
  capacityTotal: number;
  capacityUsed: number;
  /** Ya resuelto por el backend: la app no lo recalcula. */
  isAvailable: boolean;
}

export interface AmenityTimeWindow {
  startAt: string;
  endAt: string;
}

export interface AmenityBusyRange {
  startAt: string;
  endAt: string;
  bookingsCount: number;
}

export interface AmenityAvailabilityDay {
  /** YYYY-MM-DD */
  date: string;
  isOpen: boolean;
  /** SIN_HORARIO | BLOQUEADA | ZONA_INACTIVA | FUERA_DE_VENTANA */
  closedReason?: string | null;
  openWindows: AmenityTimeWindow[];
  slots: AmenitySlot[];
  busy: AmenityBusyRange[];
}

export interface AmenityAvailability {
  amenityId: string;
  days: AmenityAvailabilityDay[];
}

/** Cupo anual del consejo que le queda al residente en una zona. */
export interface AmenityCouncilQuota {
  isCouncilMember: boolean;
  bookingsPerYear: number;
  used: number;
  remaining: number;
  year: number;
}

export interface AmenityBooking {
  id: string;
  amenityId: string;
  complexId?: string | null;
  unitId?: string | null;
  startAt: string;
  endAt: string;
  attendees: number;
  purpose?: string | null;
  notes?: string | null;
  status: AmenityBookingStatus | string;
  rejectionReason?: string | null;
  cancellationReason?: string | null;
  /** Código que el residente muestra en portería. Solo cuando está aprobada. */
  accessCode?: string | null;
  checkInAt?: string | null;
  checkOutAt?: string | null;
  feeAmount: number;
  /** Nació gratis por el cupo anual del consejo de administración. */
  isCouncilFreeBooking: boolean;
  /** Parte de la tarifa retenida por cancelar fuera de plazo. 0 si no hubo. */
  lateCancellationAmount: number;
  /** Cobro por daños detectados al entregar la zona. 0 si no hubo. */
  damageAmount: number;
  damageDescription?: string | null;
  createdAt: string;
  amenity?: {
    id: string;
    name: string;
    type: AmenityType | string;
    durationUnit: AmenityDurationUnit | string;
    cancellationDeadlineDays: number;
    cancellationDeadlineHours: number;
    lateCancellationFeePercent: number;
    councilFreeBookingsPerYear: number;
  } | null;
}
