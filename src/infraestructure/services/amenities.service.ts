import apolloClient from '../../data/lib/apollo/client';
import {
  GET_AMENITIES,
  GET_AMENITY_AVAILABILITY,
  GET_MY_UNIT_AMENITY_BOOKINGS,
  GET_AMENITY_BOOKING,
  CREATE_AMENITY_BOOKING,
  GET_MY_COUNCIL_QUOTA,
  CANCEL_AMENITY_BOOKING,
} from '../../domain/graphql/amenities.queries';
import { getApiErrorMessage } from '../utils/apiError';
import type {
  Amenity,
  AmenityAvailability,
  AmenityBooking,
  AmenityCouncilQuota,
} from '../../domain/responses/AmenityResponseModel';

/**
 * Todo va con `network-only`: la disponibilidad de una zona cambia porque otro
 * residente reservó, así que una lista servida de caché muestra cupos que ya no
 * existen y el residente se lleva el rechazo al confirmar.
 */

/** Solo zonas activas: al residente no le sirve ver las que están en mantenimiento. */
export async function fetchAmenities(complexId: string): Promise<Amenity[]> {
  const { data } = await apolloClient.query<{ amenities: { items: Amenity[] } }>({
    query: GET_AMENITIES,
    variables: {
      complexId,
      pagination: { page: 1, limit: 100 },
      filters: { status: 'ACTIVE' },
    },
    fetchPolicy: 'network-only',
  });
  return data?.amenities?.items ?? [];
}

/**
 * Cupo del consejo que le queda al residente en la zona. Devuelve null si la
 * consulta falla: el beneficio es un extra, y quedarse sin él no puede impedir
 * reservar.
 */
export async function fetchMyCouncilQuota(amenityId: string): Promise<AmenityCouncilQuota | null> {
  try {
    const { data } = await apolloClient.query<{ myAmenityCouncilQuota: AmenityCouncilQuota }>({
      query: GET_MY_COUNCIL_QUOTA,
      variables: { amenityId },
      fetchPolicy: 'network-only',
    });
    return data?.myAmenityCouncilQuota ?? null;
  } catch {
    return null;
  }
}

/** `from`/`to` son fechas calendario YYYY-MM-DD en hora local del complejo. */
export async function fetchAmenityAvailability(
  amenityId: string,
  from: string,
  to: string,
): Promise<AmenityAvailability> {
  const { data, error } = await apolloClient.query<{ amenityAvailability: AmenityAvailability }>({
    query: GET_AMENITY_AVAILABILITY,
    variables: { input: { amenityId, from, to } },
    fetchPolicy: 'network-only',
  });
  if (error) throw new Error(getApiErrorMessage(error, 'No se pudo cargar la disponibilidad'));
  return data?.amenityAvailability ?? { amenityId, days: [] };
}

export async function fetchMyUnitBookings(complexId: string): Promise<AmenityBooking[]> {
  const { data } = await apolloClient.query<{ myUnitAmenityBookings: { items: AmenityBooking[] } }>({
    query: GET_MY_UNIT_AMENITY_BOOKINGS,
    variables: { complexId, pagination: { page: 1, limit: 100 } },
    fetchPolicy: 'network-only',
  });
  return data?.myUnitAmenityBookings?.items ?? [];
}

export async function fetchBookingById(bookingId: string): Promise<AmenityBooking> {
  const { data, error } = await apolloClient.query<{ amenityBooking: AmenityBooking }>({
    query: GET_AMENITY_BOOKING,
    variables: { bookingId },
    fetchPolicy: 'network-only',
  });
  if (error) throw new Error(getApiErrorMessage(error, 'No se encontró la reserva'));
  if (!data?.amenityBooking) throw new Error('No se encontró la reserva');
  return data.amenityBooking;
}

export async function createBooking(input: {
  amenityId: string;
  startAt: string;
  endAt: string;
  attendees: number;
  purpose?: string;
  notes?: string;
  useCouncilFreeQuota?: boolean;
  cleaningByComplex?: boolean;
}): Promise<AmenityBooking> {
  const { data, error } = await apolloClient.mutate<{ createAmenityBooking: AmenityBooking }>({
    mutation: CREATE_AMENITY_BOOKING,
    variables: { input },
  });
  if (error) throw new Error(getApiErrorMessage(error, 'No se pudo crear la reserva'));
  if (!data?.createAmenityBooking) throw new Error('No se pudo crear la reserva');
  return data.createAmenityBooking;
}

export async function cancelBooking(
  bookingId: string,
  reason?: string,
): Promise<AmenityBooking> {
  const { data, error } = await apolloClient.mutate<{ cancelAmenityBooking: AmenityBooking }>({
    mutation: CANCEL_AMENITY_BOOKING,
    variables: { input: { bookingId, reason } },
  });
  if (error) throw new Error(getApiErrorMessage(error, 'No se pudo cancelar la reserva'));
  if (!data?.cancelAmenityBooking) throw new Error('No se pudo cancelar la reserva');
  return data.cancelAmenityBooking;
}
