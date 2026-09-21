import { gql } from '@apollo/client';

/**
 * Zonas comunes desde la app del residente.
 *
 * El residente solo consulta el catálogo y su disponibilidad, y opera sobre sus
 * propias reservas. La configuración de zonas, la aprobación y el cobro por
 * daños viven en el panel web: el backend los deja fuera de su alcance.
 */

// Catálogo de zonas del complejo. Se piden solo los campos que la app usa para
// mostrar la ficha y para armar el selector de horario — la configuración de
// límites por unidad la impone el backend al reservar, no la pinta la app.
export const GET_AMENITIES = gql`
  query Amenities($complexId: String!, $pagination: PaginationInput, $filters: FilterAmenitiesInput) {
    amenities(complexId: $complexId, pagination: $pagination, filters: $filters) {
      items {
        id
        name
        description
        type
        status
        location
        rules
        imageUrls
        bookingMode
        durationUnit
        slotDurationMinutes
        minDurationMinutes
        maxDurationMinutes
        capacity
        maxSimultaneousBookings
        advanceBookingDays
        minAdvanceDays
        cancellationDeadlineDays
        cancellationDeadlineHours
        lateCancellationFeePercent
        councilFreeBookingsPerYear
        requiresApproval
        cleaningServiceAvailable
        defaultCleaningMinutes
        cleaningFeeAmount
        councilQuotaCoversCleaning
        feeType
        feeAmount
        complexId
        schedules {
          id
          dayOfWeek
          openTime
          closeTime
          isActive
        }
      }
      pagination {
        currentPage
        itemsPerPage
        totalItems
        totalPages
        hasNextPage
        hasPreviousPage
      }
    }
  }
`;

// Disponibilidad día a día: horario menos bloqueos menos reservas ajenas. Es lo
// que alimenta el selector; `isAvailable` ya viene resuelto por el backend y la
// app no debe recalcularlo.
export const GET_AMENITY_AVAILABILITY = gql`
  query AmenityAvailability($input: AmenityAvailabilityInput!) {
    amenityAvailability(input: $input) {
      amenityId
      days {
        date
        isOpen
        closedReason
        openWindows {
          startAt
          endAt
        }
        slots {
          startAt
          endAt
          capacityTotal
          capacityUsed
          isAvailable
        }
        busy {
          startAt
          endAt
          cleaningFromAt
          bookingsCount
        }
      }
    }
  }
`;

// Reservas de la unidad del residente. El backend fuerza el scope a su unidad,
// así que no hay que (ni se puede) filtrar por unitId desde el cliente.
export const GET_MY_UNIT_AMENITY_BOOKINGS = gql`
  query MyUnitAmenityBookings($complexId: String!, $pagination: PaginationInput, $filters: FilterAmenityBookingsInput) {
    myUnitAmenityBookings(complexId: $complexId, pagination: $pagination, filters: $filters) {
      items {
        id
        amenityId
        complexId
        unitId
        startAt
        endAt
        attendees
        purpose
        notes
        status
        rejectionReason
        cancellationReason
        accessCode
        checkInAt
        checkOutAt
        feeAmount
        isCouncilFreeBooking
        cleaningMinutes
        blockedUntilAt
        cleaningByComplex
        cleaningFeeAmount
        directIncomeId
        directPaymentAmount
        refundAmount
      refundedAt
        refundedAt
        lateCancellationAmount
        damageAmount
        damageDescription
        createdAt
        amenity {
          id
          name
          type
          durationUnit
          cancellationDeadlineDays
          cancellationDeadlineHours
          lateCancellationFeePercent
          councilFreeBookingsPerYear
          cleaningServiceAvailable
          cleaningFeeAmount
        }
      }
      pagination {
        currentPage
        itemsPerPage
        totalItems
        totalPages
        hasNextPage
        hasPreviousPage
      }
    }
  }
`;

// Reserva puntual — se abre desde una notificación AMENITY_*.
export const GET_AMENITY_BOOKING = gql`
  query AmenityBooking($bookingId: String!) {
    amenityBooking(bookingId: $bookingId) {
      id
      amenityId
      complexId
      unitId
      startAt
      endAt
      attendees
      purpose
      notes
      status
      rejectionReason
      cancellationReason
      accessCode
      checkInAt
      checkOutAt
      feeAmount
      isCouncilFreeBooking
      cleaningMinutes
      blockedUntilAt
      cleaningByComplex
      cleaningFeeAmount
      directIncomeId
      directPaymentAmount
      refundAmount
      refundedAt
      lateCancellationAmount
      damageAmount
      damageDescription
      createdAt
      amenity {
        id
        name
        type
        durationUnit
        cancellationDeadlineDays
        cancellationDeadlineHours
        lateCancellationFeePercent
        councilFreeBookingsPerYear
        cleaningServiceAvailable
        cleaningFeeAmount
      }
    }
  }
`;


/**
 * Cupo del consejo que le queda al residente en una zona. Se pregunta antes de
 * reservar para poder ofrecerlo como decisión suya y no descontarlo por detrás.
 */
export const GET_MY_COUNCIL_QUOTA = gql`
  query MyAmenityCouncilQuota($amenityId: String!) {
    myAmenityCouncilQuota(amenityId: $amenityId) {
      isCouncilMember
      bookingsPerYear
      used
      remaining
      year
    }
  }
`;

export const CREATE_AMENITY_BOOKING = gql`
  mutation CreateAmenityBooking($input: CreateAmenityBookingInput!) {
    createAmenityBooking(input: $input) {
      id
      amenityId
      startAt
      endAt
      attendees
      purpose
      status
      accessCode
      feeAmount
      isCouncilFreeBooking
      cleaningMinutes
      blockedUntilAt
      cleaningByComplex
      cleaningFeeAmount
      directIncomeId
      directPaymentAmount
      refundAmount
      refundedAt
      createdAt
      amenity {
        id
        name
        type
        durationUnit
        cancellationDeadlineDays
        cancellationDeadlineHours
        lateCancellationFeePercent
        councilFreeBookingsPerYear
        cleaningServiceAvailable
        cleaningFeeAmount
      }
    }
  }
`;

export const CANCEL_AMENITY_BOOKING = gql`
  mutation CancelAmenityBooking($input: CancelAmenityBookingInput!) {
    cancelAmenityBooking(input: $input) {
      id
      status
      cancellationReason
      feeAmount
    }
  }
`;
