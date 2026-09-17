/* eslint-disable */
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** A date-time string at UTC, such as 2019-12-03T09:54:33Z, compliant with the date-time format. */
  DateTime: { input: any; output: any; }
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSON: { input: any; output: any; }
};

/** Estado de la solicitud de acceso del supervisor al complejo */
export type AccessRequestStatus =
  | 'APPROVED'
  | 'PENDING'
  | 'REJECTED';

/** Clase contable PUC (primer dígito del código) */
export type AccountClass =
  | 'ASSET'
  | 'COST'
  | 'EQUITY'
  | 'EXPENSE'
  | 'INCOME'
  | 'LIABILITY';

export type AccountMovement = {
  __typename?: 'AccountMovement';
  balance: Scalars['Float']['output'];
  credit: Scalars['Float']['output'];
  date: Scalars['String']['output'];
  debit: Scalars['Float']['output'];
  description: Scalars['String']['output'];
  id: Scalars['String']['output'];
  reference?: Maybe<Scalars['String']['output']>;
  type: Scalars['String']['output'];
};

/** Naturaleza del saldo de la cuenta contable */
export type AccountNature =
  | 'CREDIT'
  | 'DEBIT';

/** Tipo de comprobante contable del libro diario */
export type AccountingDocumentType =
  | 'ACCOUNTING_NOTE'
  | 'CASH_RECEIPT'
  | 'CREDIT_NOTE'
  | 'EXPENSE_VOUCHER'
  | 'INVOICE';

export type AccountingHeader = {
  __typename?: 'AccountingHeader';
  complexId: Scalars['String']['output'];
  consecutive: Scalars['Int']['output'];
  createdAt: Scalars['DateTime']['output'];
  createdByUserId: Scalars['String']['output'];
  documentDate: Scalars['DateTime']['output'];
  documentType: AccountingDocumentType;
  id: Scalars['ID']['output'];
  lines: Array<AccountingLine>;
  memo?: Maybe<Scalars['String']['output']>;
  period: Scalars['String']['output'];
  reversedByHeaderId?: Maybe<Scalars['String']['output']>;
  reversesHeaderId?: Maybe<Scalars['String']['output']>;
  thirdPartyName?: Maybe<Scalars['String']['output']>;
  totalCredit: Scalars['Float']['output'];
  totalDebit: Scalars['Float']['output'];
  unitId?: Maybe<Scalars['String']['output']>;
};

export type AccountingLine = {
  __typename?: 'AccountingLine';
  complexId: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  credit: Scalars['Float']['output'];
  debit: Scalars['Float']['output'];
  headerId: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  memo?: Maybe<Scalars['String']['output']>;
  pucAccount: PucAccount;
  pucAccountId: Scalars['String']['output'];
  unitId?: Maybe<Scalars['String']['output']>;
};

export type AddMaintenanceCommentInput = {
  isInternal?: InputMaybe<Scalars['Boolean']['input']>;
  message: Scalars['String']['input'];
  ticketId: Scalars['String']['input'];
};

/** Datos para que un administrador restablezca la contraseña de un miembro del personal */
export type AdminResetUserPasswordInput = {
  /** Nueva contraseña asignada por el administrador */
  newPassword: Scalars['String']['input'];
  /** ID del usuario (personal) al que se le restablece la contraseña */
  userId: Scalars['String']['input'];
};

/** Zona común reservable del complejo residencial */
export type Amenity = {
  __typename?: 'Amenity';
  advanceBookingDays: Scalars['Int']['output'];
  /** Si es true, una unidad con saldo vencido no puede reservar */
  blockBookingsOnDebt: Scalars['Boolean']['output'];
  bookingMode: AmenityBookingMode;
  cancellationDeadlineDays: Scalars['Int']['output'];
  /** Se suman a cancellationDeadlineDays para formar el plazo real */
  cancellationDeadlineHours: Scalars['Int']['output'];
  capacity: Scalars['Int']['output'];
  complex?: Maybe<ResidentialComplex>;
  complexId: Scalars['String']['output'];
  /** Reservas gratis al año por miembro del consejo. 0 = sin beneficio */
  councilFreeBookingsPerYear: Scalars['Int']['output'];
  createdAt: Scalars['DateTime']['output'];
  createdByUserId?: Maybe<Scalars['String']['output']>;
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  durationUnit: AmenityDurationUnit;
  feeAmount: Scalars['Float']['output'];
  feeType: AmenityFeeType;
  id: Scalars['ID']['output'];
  /** URLs de fotos de la zona (R2) */
  imageUrls?: Maybe<Array<Scalars['String']['output']>>;
  /** Porcentaje de la tarifa que se retiene al cancelar fuera de plazo */
  lateCancellationFeePercent: Scalars['Int']['output'];
  location?: Maybe<Scalars['String']['output']>;
  maxActiveBookingsPerUnit: Scalars['Int']['output'];
  maxBookingsPerUnitPerMonth: Scalars['Int']['output'];
  maxDurationMinutes: Scalars['Int']['output'];
  maxSimultaneousBookings: Scalars['Int']['output'];
  minAdvanceDays: Scalars['Int']['output'];
  minDurationMinutes: Scalars['Int']['output'];
  /** Nombre visible (ej. Salón Comunal Piso 1) */
  name: Scalars['String']['output'];
  /** Si es true la reserva nace en PENDING y la administración debe aprobarla */
  requiresApproval: Scalars['Boolean']['output'];
  rules?: Maybe<Scalars['String']['output']>;
  schedules?: Maybe<Array<AmenitySchedule>>;
  slotDurationMinutes: Scalars['Int']['output'];
  status: AmenityStatus;
  type: AmenityType;
  updatedAt: Scalars['DateTime']['output'];
  updatedByUserId?: Maybe<Scalars['String']['output']>;
};

/** Disponibilidad de una zona común en un día calendario */
export type AmenityAvailabilityDay = {
  __typename?: 'AmenityAvailabilityDay';
  busy: Array<AmenityBusyRange>;
  closedReason?: Maybe<Scalars['String']['output']>;
  /** Fecha en formato YYYY-MM-DD */
  date: Scalars['String']['output'];
  isOpen: Scalars['Boolean']['output'];
  openWindows: Array<AmenityTimeWindow>;
  slots: Array<AmenitySlot>;
};

export type AmenityAvailabilityInput = {
  amenityId: Scalars['String']['input'];
  /** Primer día a consultar (YYYY-MM-DD) */
  from: Scalars['String']['input'];
  /** Último día a consultar, inclusive (YYYY-MM-DD) */
  to: Scalars['String']['input'];
};

/** Disponibilidad de una zona común en un rango de días */
export type AmenityAvailabilityResponse = {
  __typename?: 'AmenityAvailabilityResponse';
  amenityId: Scalars['String']['output'];
  days: Array<AmenityAvailabilityDay>;
};

/** Bloqueo puntual de una zona común (mantenimiento, evento) */
export type AmenityBlackout = {
  __typename?: 'AmenityBlackout';
  amenity?: Maybe<Amenity>;
  amenityId: Scalars['String']['output'];
  complexId: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  createdByUserId?: Maybe<Scalars['String']['output']>;
  endAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  /** Motivo visible para el residente */
  reason: Scalars['String']['output'];
  startAt: Scalars['DateTime']['output'];
};

/** Reserva de zona común hecha por una unidad */
export type AmenityBooking = {
  __typename?: 'AmenityBooking';
  accessCode?: Maybe<Scalars['String']['output']>;
  amenity?: Maybe<Amenity>;
  amenityId: Scalars['String']['output'];
  approvedAt?: Maybe<Scalars['DateTime']['output']>;
  approvedByUserId?: Maybe<Scalars['String']['output']>;
  attendees: Scalars['Int']['output'];
  cancellationReason?: Maybe<Scalars['String']['output']>;
  cancelledAt?: Maybe<Scalars['DateTime']['output']>;
  cancelledByUserId?: Maybe<Scalars['String']['output']>;
  checkInAt?: Maybe<Scalars['DateTime']['output']>;
  checkOutAt?: Maybe<Scalars['DateTime']['output']>;
  checkedInByUserId?: Maybe<Scalars['String']['output']>;
  complex?: Maybe<ResidentialComplex>;
  complexId: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  damageAmount: Scalars['Float']['output'];
  damageChargeId?: Maybe<Scalars['String']['output']>;
  damageChargedAt?: Maybe<Scalars['DateTime']['output']>;
  damageChargedByUserId?: Maybe<Scalars['String']['output']>;
  damageDescription?: Maybe<Scalars['String']['output']>;
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  endAt: Scalars['DateTime']['output'];
  feeAmount: Scalars['Float']['output'];
  feeChargeId?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  /** Nació gratis por el cupo anual del consejo de administración */
  isCouncilFreeBooking: Scalars['Boolean']['output'];
  lateCancellationAmount: Scalars['Float']['output'];
  lateCancellationChargeId?: Maybe<Scalars['String']['output']>;
  notes?: Maybe<Scalars['String']['output']>;
  purpose?: Maybe<Scalars['String']['output']>;
  rejectionReason?: Maybe<Scalars['String']['output']>;
  reminderSentAt?: Maybe<Scalars['DateTime']['output']>;
  requestedByName?: Maybe<Scalars['String']['output']>;
  requestedByUserId?: Maybe<Scalars['String']['output']>;
  residentId?: Maybe<Scalars['String']['output']>;
  startAt: Scalars['DateTime']['output'];
  status: AmenityBookingStatus;
  unit?: Maybe<Unit>;
  unitId: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

/** Modo en que se reservan las franjas horarias de la zona común */
export type AmenityBookingMode =
  | 'RANGE'
  | 'SLOT';

/** Estado de la reserva de zona común */
export type AmenityBookingStatus =
  | 'APPROVED'
  | 'CANCELLED'
  | 'CHECKED_IN'
  | 'COMPLETED'
  | 'EXPIRED'
  | 'NO_SHOW'
  | 'PENDING'
  | 'REJECTED';

/** Intervalo ocupado por una reserva activa */
export type AmenityBusyRange = {
  __typename?: 'AmenityBusyRange';
  bookingsCount: Scalars['Int']['output'];
  endAt: Scalars['DateTime']['output'];
  startAt: Scalars['DateTime']['output'];
};

/** Cupo anual del consejo de administración en una zona común */
export type AmenityCouncilQuotaResponse = {
  __typename?: 'AmenityCouncilQuotaResponse';
  /** Reservas gratis al año que concede la zona. 0 = no concede el beneficio */
  bookingsPerYear: Scalars['Int']['output'];
  /** Quien pregunta está marcado como miembro del consejo */
  isCouncilMember: Scalars['Boolean']['output'];
  /** Cuántas le quedan este año en esta zona */
  remaining: Scalars['Int']['output'];
  /** Cuántas lleva usadas este año en esta zona */
  used: Scalars['Int']['output'];
  /** Año calendario sobre el que se cuenta */
  year: Scalars['Int']['output'];
};

/** Unidad en que se expresan las duraciones de la zona común */
export type AmenityDurationUnit =
  | 'DAYS'
  | 'HOURS';

/** Forma de cobro de la reserva de zona común */
export type AmenityFeeType =
  | 'FREE'
  | 'PER_BOOKING'
  | 'PER_HOUR';

/** Horario semanal de apertura de una zona común */
export type AmenitySchedule = {
  __typename?: 'AmenitySchedule';
  amenity?: Maybe<Amenity>;
  amenityId: Scalars['String']['output'];
  /** Hora de cierre en formato HH:mm */
  closeTime: Scalars['String']['output'];
  complexId: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  /** 0=domingo, 1=lunes … 6=sábado */
  dayOfWeek: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  /** Hora de apertura en formato HH:mm */
  openTime: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

/** Horario especial de una zona común para una fecha puntual */
export type AmenityScheduleException = {
  __typename?: 'AmenityScheduleException';
  amenity?: Maybe<Amenity>;
  amenityId: Scalars['String']['output'];
  /** Hora de cierre HH:mm */
  closeTime?: Maybe<Scalars['String']['output']>;
  complexId: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  createdByUserId?: Maybe<Scalars['String']['output']>;
  /** Fecha en formato YYYY-MM-DD */
  date: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  /** true: la zona no abre ese día, sin importar el horario semanal */
  isClosed: Scalars['Boolean']['output'];
  /** Hora de apertura HH:mm */
  openTime?: Maybe<Scalars['String']['output']>;
  reason?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
};

export type AmenityScheduleInput = {
  /** Hora de cierre HH:mm */
  closeTime: Scalars['String']['input'];
  /** 0=domingo, 1=lunes … 6=sábado */
  dayOfWeek: Scalars['Int']['input'];
  /** Hora de apertura HH:mm */
  openTime: Scalars['String']['input'];
};

/** Franja reservable de una zona común */
export type AmenitySlot = {
  __typename?: 'AmenitySlot';
  capacityTotal: Scalars['Int']['output'];
  capacityUsed: Scalars['Int']['output'];
  endAt: Scalars['DateTime']['output'];
  isAvailable: Scalars['Boolean']['output'];
  startAt: Scalars['DateTime']['output'];
};

/** Estado operativo de la zona común */
export type AmenityStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'MAINTENANCE';

/** Ventana de apertura de la zona común en un día */
export type AmenityTimeWindow = {
  __typename?: 'AmenityTimeWindow';
  endAt: Scalars['DateTime']['output'];
  startAt: Scalars['DateTime']['output'];
};

/** Tipo de zona común del complejo residencial */
export type AmenityType =
  | 'CANCHA'
  | 'COWORKING'
  | 'GIMNASIO'
  | 'OTRO'
  | 'PARQUE_INFANTIL'
  | 'PISCINA'
  | 'SALON_COMUNAL'
  | 'SAUNA'
  | 'TEATRINO'
  | 'TERRAZA'
  | 'ZONA_BBQ';

export type ApplyMoraInput = {
  complexId: Scalars['String']['input'];
  graceDays: Scalars['Float']['input'];
  period: Scalars['String']['input'];
  rate: Scalars['Float']['input'];
};

export type ApplyWalletResult = {
  __typename?: 'ApplyWalletResult';
  appliedAmount: Scalars['Float']['output'];
  chargeId: Scalars['String']['output'];
  chargeStatus: Scalars['String']['output'];
  remainingWalletBalance: Scalars['Float']['output'];
};

export type ApplyWalletToChargeInput = {
  amount?: InputMaybe<Scalars['Float']['input']>;
  chargeId: Scalars['String']['input'];
  complexId: Scalars['String']['input'];
  unitId: Scalars['String']['input'];
};

export type ApprovePetInput = {
  /** Notas internas de la administración */
  notes?: InputMaybe<Scalars['String']['input']>;
  petId: Scalars['String']['input'];
};

export type ApproveResidentInput = {
  /** Notas opcionales del Compliance Officer */
  notes?: InputMaybe<Scalars['String']['input']>;
  /** ID del registro de residente a aprobar */
  residentId: Scalars['String']['input'];
};

export type AssignChildrenResponse = {
  __typename?: 'AssignChildrenResponse';
  /** Number of ancestor roles affected */
  affectedAncestorsCount: Scalars['Int']['output'];
  /** Results of child assignments */
  assignedChildren: Array<AssignedChildResult>;
  /** Success message */
  message: Scalars['String']['output'];
  /** ID of the parent role */
  parentId: Scalars['String']['output'];
  /** Name of the parent role */
  parentName: Scalars['String']['output'];
};

export type AssignMaintenanceTicketInput = {
  assignedUserId?: InputMaybe<Scalars['String']['input']>;
  assigneeType: MaintenanceAssigneeType;
  notes?: InputMaybe<Scalars['String']['input']>;
  scheduledFor?: InputMaybe<Scalars['DateTime']['input']>;
  ticketId: Scalars['String']['input'];
  vendorId?: InputMaybe<Scalars['String']['input']>;
};

export type AssignedChildResult = {
  __typename?: 'AssignedChildResult';
  /** ID of the child role */
  childId: Scalars['String']['output'];
  /** Name of the child role */
  childName: Scalars['String']['output'];
  /** Error message if assignment failed */
  error?: Maybe<Scalars['String']['output']>;
  /** Whether the assignment was successful */
  success: Scalars['Boolean']['output'];
};

export type AssignedUserRolResponse = {
  __typename?: 'AssignedUserRolResponse';
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

/** Tipo de acción registrada en el historial de auditoría */
export type AuditAction =
  /** Activación o reactivación de una entidad */
  | 'ACTIVATE'
  /** Aprobación de una solicitud o entidad */
  | 'APPROVE'
  /** Llamada entrante contestada */
  | 'CALL_INCOMING'
  /** Llamada entrante no contestada */
  | 'CALL_MISSED'
  /** Llamada saliente contestada */
  | 'CALL_OUTGOING'
  /** Llamada rechazada */
  | 'CALL_REJECTED'
  /** Creación de un registro */
  | 'CREATE'
  /** Eliminación (soft o hard delete) */
  | 'DELETE'
  /** Inicio de sesión */
  | 'LOGIN'
  /** Cierre de sesión */
  | 'LOGOUT'
  /** Rechazo de una solicitud o entidad */
  | 'REJECT'
  /** Restauración de un registro eliminado */
  | 'RESTORE'
  /** Reversión a estado anterior */
  | 'REVERT'
  /** Suspensión de una entidad */
  | 'SUSPEND'
  /** Modificación de un registro existente */
  | 'UPDATE';

/** Tipo de entidad afectada en el historial de auditoría */
export type AuditEntityType =
  | 'Amenity'
  | 'AmenityBooking'
  | 'Building'
  | 'CallLog'
  | 'FeeCharge'
  | 'FeeConfig'
  | 'MaintenanceLocationTag'
  | 'MaintenanceTicket'
  | 'MaintenanceVendor'
  | 'MarketplaceListing'
  | 'Note'
  | 'ParkingConfig'
  | 'ParkingRecord'
  | 'Payment'
  | 'Pet'
  | 'PetIncident'
  | 'Pqrf'
  | 'PucAccount'
  | 'Resident'
  | 'ResidentialComplex'
  | 'SentMessage'
  | 'SpecialNumber'
  | 'SupervisorAccessRequest'
  | 'SupervisorVisit'
  | 'Unit'
  | 'User'
  | 'Vehicle'
  | 'Visit'
  | 'Visitor'
  | 'VisitorVehicle'
  | 'VotingMeeting'
  | 'VotingQuestion';

/** Registro de auditoría de una acción realizada en el sistema */
export type AuditLog = {
  __typename?: 'AuditLog';
  /** Acción realizada */
  action: AuditAction;
  /** ID del complejo (para filtrado multi-tenant) */
  complexId?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  /** Descripción legible de la acción */
  description?: Maybe<Scalars['String']['output']>;
  /** ID de la entidad afectada */
  entityId: Scalars['String']['output'];
  /** Tipo de entidad afectada */
  entityType: AuditEntityType;
  id: Scalars['ID']['output'];
  /** Indica si esta acción fue revertida */
  isReverted: Scalars['Boolean']['output'];
  /** Estado de la entidad DESPUÉS de la acción (null en DELETE) */
  newValue?: Maybe<Scalars['JSON']['output']>;
  /** ID del usuario o complejo que realizó la acción */
  performedById: Scalars['String']['output'];
  /** Nombre para mostrar del actor (email, nombre, etc.) */
  performedByName?: Maybe<Scalars['String']['output']>;
  /** Rol del actor al momento de la acción */
  performedByRole: Scalars['String']['output'];
  /** Estado de la entidad ANTES de la acción (null en CREATE) */
  previousValue?: Maybe<Scalars['JSON']['output']>;
  /** Número de referencia único (AUD-YYYYMMDD-XXXX) */
  referenceNumber: Scalars['String']['output'];
  /** Fecha en que fue revertida */
  revertedAt?: Maybe<Scalars['DateTime']['output']>;
  /** ID del usuario que revirtió la acción */
  revertedById?: Maybe<Scalars['String']['output']>;
};

/** Detalle enriquecido de un registro de auditoría con labels resueltos */
export type AuditLogDetailResponse = {
  __typename?: 'AuditLogDetailResponse';
  /** Registro de auditoría completo */
  auditLog: AuditLog;
  /** Etiqueta legible de la entidad afectada */
  entityLabel?: Maybe<Scalars['String']['output']>;
  /** Nombre del usuario que revirtió la acción */
  revertedByName?: Maybe<Scalars['String']['output']>;
};

/** Respuesta de autenticación exitosa con tokens JWT */
export type AuthResponse = {
  __typename?: 'AuthResponse';
  /** Access token JWT (15 min de vigencia) */
  accessToken: Scalars['String']['output'];
  /** Segundos hasta que expire el access token */
  expiresIn: Scalars['Int']['output'];
  /** Refresh token para renovar el access token */
  refreshToken: Scalars['String']['output'];
  /** ID de la sesión activa */
  sessionId: Scalars['String']['output'];
};

export type BlacklistVisitorInput = {
  /** Razón del bloqueo (obligatoria) */
  reason: Scalars['String']['input'];
  /** ID del visitante a bloquear */
  visitorId: Scalars['String']['input'];
};

/** Torre o edificio dentro de un complejo */
export type Building = {
  __typename?: 'Building';
  /** Complejo al que pertenece */
  complex?: Maybe<ResidentialComplex>;
  /** ID del complejo al que pertenece */
  complexId: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  /** Descripción opcional */
  description?: Maybe<Scalars['String']['output']>;
  /** Número total de pisos */
  floors: Scalars['Int']['output'];
  id: Scalars['String']['output'];
  /** Nombre de la torre/edificio. Ej: "Torre A" */
  name: Scalars['String']['output'];
  /** Estado activo/inactivo */
  status: Scalars['Boolean']['output'];
  units: Array<Unit>;
  updatedAt: Scalars['DateTime']['output'];
};

export type BulkMoveOutResidentsInput = {
  moveOutDate: Scalars['String']['input'];
  moveOutReason: Scalars['String']['input'];
  residentIds: Array<Scalars['String']['input']>;
};

/** Acción a aplicar sobre las notificaciones seleccionadas */
export type BulkNotificationAction =
  | 'DELETE'
  | 'MARK_READ'
  | 'MARK_UNREAD'
  | 'STAR'
  | 'UNSTAR';

export type BulkNotificationActionInput = {
  action: BulkNotificationAction;
  notificationIds: Array<Scalars['String']['input']>;
};

/** Resultado de una acción en lote sobre la bandeja */
export type BulkNotificationActionResult = {
  __typename?: 'BulkNotificationActionResult';
  affected: Scalars['Int']['output'];
  skipped: Scalars['Int']['output'];
};

/** Dirección de la llamada */
export type CallDirection =
  | 'INCOMING'
  | 'OUTGOING';

/** Registro de llamada realizada o recibida por el guardia */
export type CallLog = {
  __typename?: 'CallLog';
  /** Guardia/agente que realizó o recibió la llamada */
  agent?: Maybe<User>;
  agentName: Scalars['String']['output'];
  agentUserId?: Maybe<Scalars['String']['output']>;
  answeredAt?: Maybe<Scalars['DateTime']['output']>;
  buildingName?: Maybe<Scalars['String']['output']>;
  complex?: Maybe<ResidentialComplex>;
  complexId: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  direction: CallDirection;
  durationSeconds: Scalars['Int']['output'];
  endedAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['String']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  outcome: CallOutcome;
  phoneNumber: Scalars['String']['output'];
  residentId?: Maybe<Scalars['String']['output']>;
  residentName?: Maybe<Scalars['String']['output']>;
  startedAt: Scalars['DateTime']['output'];
  unitId?: Maybe<Scalars['String']['output']>;
  unitNumber?: Maybe<Scalars['String']['output']>;
};

export type CallLogsInput = {
  agentUserId?: InputMaybe<Scalars['String']['input']>;
  complexId: Scalars['String']['input'];
  dateFrom?: InputMaybe<Scalars['String']['input']>;
  dateTo?: InputMaybe<Scalars['String']['input']>;
  direction?: InputMaybe<CallDirection>;
  outcome?: InputMaybe<CallOutcome>;
  pagination?: InputMaybe<PaginationInput>;
};

export type CallLogsPage = {
  __typename?: 'CallLogsPage';
  currentPage: Scalars['Int']['output'];
  items: Array<CallLog>;
  totalItems: Scalars['Int']['output'];
  totalPages: Scalars['Int']['output'];
};

/** Resultado de la llamada */
export type CallOutcome =
  | 'ANSWERED'
  | 'FAILED'
  | 'MISSED'
  | 'REJECTED';

export type CancelAmenityBookingInput = {
  bookingId: Scalars['String']['input'];
  reason?: InputMaybe<Scalars['String']['input']>;
};

export type ChangeMaintenanceStatusInput = {
  message?: InputMaybe<Scalars['String']['input']>;
  status: MaintenanceTicketStatus;
  ticketId: Scalars['String']['input'];
};

export type ChangeParentResponse = {
  __typename?: 'ChangeParentResponse';
  /** Number of roles affected by this change */
  affectedRolesCount: Scalars['Int']['output'];
  /** Success message */
  message: Scalars['String']['output'];
  /** New parent role information */
  newParent?: Maybe<SimpleRoleResponse>;
  /** Previous parent role information */
  oldParent?: Maybe<SimpleRoleResponse>;
  /** ID of the role that was moved */
  roleId: Scalars['String']['output'];
  /** Name of the role that was moved */
  roleName: ValidRoles;
};

export type ChangePasswordInput = {
  /** Confirmación de la nueva contraseña */
  confirmPassword: Scalars['String']['input'];
  /** Contraseña actual del usuario */
  currentPassword: Scalars['String']['input'];
  /** Nueva contraseña */
  newPassword: Scalars['String']['input'];
};

export type ChangePasswordResponse = {
  __typename?: 'ChangePasswordResponse';
  changedAt?: Maybe<Scalars['DateTime']['output']>;
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type ChargeAmenityDamageInput = {
  /** Valor a cargar a la unidad */
  amount: Scalars['Float']['input'];
  bookingId: Scalars['String']['input'];
  /** Qué se dañó y por qué se cobra. Lo ve el residente en su estado de cuenta */
  description: Scalars['String']['input'];
};

/** Método de cálculo del monto por unidad en una regla de emisión */
export type ChargeCalculationMethod =
  | 'BY_AREA'
  | 'BY_COEFFICIENT'
  | 'FIXED'
  | 'PER_ATTRIBUTE';

export type ChargeCategory = {
  __typename?: 'ChargeCategory';
  color?: Maybe<Scalars['String']['output']>;
  complexId: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type ChargeEmission = {
  __typename?: 'ChargeEmission';
  billingMode: FeeConfigBillingMode;
  cancellationReason?: Maybe<Scalars['String']['output']>;
  category?: Maybe<ChargeCategory>;
  categoryId?: Maybe<Scalars['String']['output']>;
  complexId: Scalars['String']['output'];
  conceptName: Scalars['String']['output'];
  confirmedAt?: Maybe<Scalars['DateTime']['output']>;
  createdAt: Scalars['DateTime']['output'];
  createdByUserId: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  dueDate: Scalars['DateTime']['output'];
  generatedCount: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  period: Scalars['String']['output'];
  rules: Array<ChargeRule>;
  status: ChargeEmissionStatus;
  updatedAt: Scalars['DateTime']['output'];
};

export type ChargeEmissionPreviewLine = {
  __typename?: 'ChargeEmissionPreviewLine';
  amount: Scalars['Float']['output'];
  ruleIndex: Scalars['Int']['output'];
  unitId: Scalars['String']['output'];
  unitNumber: Scalars['String']['output'];
};

export type ChargeEmissionPreviewResponse = {
  __typename?: 'ChargeEmissionPreviewResponse';
  conceptName: Scalars['String']['output'];
  conflicts: Array<ChargeRuleConflict>;
  emissionId: Scalars['String']['output'];
  lines: Array<ChargeEmissionPreviewLine>;
  period: Scalars['String']['output'];
  total: Scalars['Float']['output'];
  uncoveredUnits: Array<Scalars['String']['output']>;
  unitsCharged: Scalars['Int']['output'];
  warnings: Array<Scalars['String']['output']>;
};

/** Estado de una emisión de cargos */
export type ChargeEmissionStatus =
  | 'CANCELLED'
  | 'CONFIRMED'
  | 'DRAFT';

export type ChargeRule = {
  __typename?: 'ChargeRule';
  amount?: Maybe<Scalars['Float']['output']>;
  attributeKey?: Maybe<Scalars['String']['output']>;
  calculationMethod: ChargeCalculationMethod;
  ratePerSqm?: Maybe<Scalars['Float']['output']>;
  targetType: ChargeRuleTargetType;
  targetValue?: Maybe<Scalars['JSON']['output']>;
  totalAmount?: Maybe<Scalars['Float']['output']>;
};

export type ChargeRuleConflict = {
  __typename?: 'ChargeRuleConflict';
  ruleIndexes: Array<Scalars['Int']['output']>;
  unitId: Scalars['String']['output'];
  unitNumber: Scalars['String']['output'];
};

export type ChargeRuleInput = {
  amount?: InputMaybe<Scalars['Float']['input']>;
  attributeKey?: InputMaybe<Scalars['String']['input']>;
  calculationMethod: ChargeCalculationMethod;
  ratePerSqm?: InputMaybe<Scalars['Float']['input']>;
  targetType: ChargeRuleTargetType;
  targetValue?: InputMaybe<Scalars['JSON']['input']>;
  totalAmount?: InputMaybe<Scalars['Float']['input']>;
};

/** Alcance de una regla de emisión de cargos */
export type ChargeRuleTargetType =
  | 'ALL'
  | 'SPECIFIC_UNITS'
  | 'TARGET_RULES'
  | 'UNIT_TYPE';

/** Estado de un cargo (cuota) de una unidad */
export type ChargeStatus =
  | 'CANCELLED'
  | 'OVERDUE'
  | 'PAID'
  | 'PARTIALLY_PAID'
  | 'PENDING'
  | 'WAIVED';

/** Tipo de recurrencia de la configuración de cuota */
export type ChargeType =
  /** Recurrente por un número fijo de cuotas */
  | 'LIMITED'
  /** Recurrente indefinido (mes a mes hasta cancelación manual) */
  | 'MONTHLY'
  /** Cobro único, se genera una sola vez */
  | 'ONCE';

export type CheckMaintenanceDuplicateInput = {
  amenityId?: InputMaybe<Scalars['String']['input']>;
  buildingId?: InputMaybe<Scalars['String']['input']>;
  category: MaintenanceCategory;
  complexId: Scalars['String']['input'];
  floor?: InputMaybe<Scalars['Int']['input']>;
  gpsAccuracyMeters?: InputMaybe<Scalars['Int']['input']>;
  lat?: InputMaybe<Scalars['Float']['input']>;
  lng?: InputMaybe<Scalars['Float']['input']>;
  locationTagCode?: InputMaybe<Scalars['String']['input']>;
  locationText?: InputMaybe<Scalars['String']['input']>;
  locationType: MaintenanceLocationType;
};

/** Pesos para derivar el coeficiente de copropiedad por características */
export type CoefficientWeighting = {
  __typename?: 'CoefficientWeighting';
  /** Base del score: 'AREA' | 'UNIT' */
  base: Scalars['String']['output'];
  complexId: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  /** Puntos si la unidad usa/paga ascensor */
  elevatorPoints: Scalars['Float']['output'];
  /** Puntos por cada piso de la casa */
  houseFloorPoints: Scalars['Float']['output'];
  id: Scalars['ID']['output'];
  /** Puntos por baño */
  perBathroom: Scalars['Float']['output'];
  /** Puntos por alcoba */
  perBedroom: Scalars['Float']['output'];
  /** Puntos por cada parqueadero */
  perParking: Scalars['Float']['output'];
  /** Puntos por cada depósito */
  perStorage: Scalars['Float']['output'];
  /** Multiplicador por tipo de unidad (clave = UnitType) */
  typeMultipliers: Scalars['JSON']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type ComplexExpense = {
  __typename?: 'ComplexExpense';
  amount: Scalars['Float']['output'];
  category: ExpenseCategory;
  complex: ResidentialComplex;
  complexId: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  description: Scalars['String']['output'];
  expenseDate: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  isReversed: Scalars['Boolean']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  period: Scalars['String']['output'];
  receiptUrl?: Maybe<Scalars['String']['output']>;
  registeredByUserId?: Maybe<Scalars['String']['output']>;
  reversalReason?: Maybe<Scalars['String']['output']>;
  reversedAt?: Maybe<Scalars['DateTime']['output']>;
  reversedByUserId?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
};

export type ComplexFinanceConfig = {
  __typename?: 'ComplexFinanceConfig';
  autoApplyMora: Scalars['Boolean']['output'];
  autoGenerateCharges: Scalars['Boolean']['output'];
  complexId: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  earlyDiscountDay?: Maybe<Scalars['Int']['output']>;
  earlyDiscountPct: Scalars['Float']['output'];
  id: Scalars['ID']['output'];
  moraGraceDays: Scalars['Int']['output'];
  moraRate: Scalars['Float']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type ComplexFinancialSummaryResponse = {
  __typename?: 'ComplexFinancialSummaryResponse';
  collectionRate: Scalars['Float']['output'];
  complexId: Scalars['String']['output'];
  directIncome: Scalars['Float']['output'];
  netCashFlow: Scalars['Float']['output'];
  period: Scalars['String']['output'];
  periodOutstanding: Scalars['Float']['output'];
  totalCharged: Scalars['Float']['output'];
  totalCollected: Scalars['Float']['output'];
  totalExpenses: Scalars['Float']['output'];
  totalMora: Scalars['Float']['output'];
  totalOutstanding: Scalars['Float']['output'];
  unitsFullyPaid: Scalars['Int']['output'];
  unitsWithDebt: Scalars['Int']['output'];
};

/** Módulos funcionales disponibles para un complejo residencial */
export type ComplexModule =
  | 'CLASIFICADOS'
  | 'EDIFICIOS'
  | 'FINANZAS'
  | 'MANTENIMIENTO'
  | 'MASCOTAS'
  | 'MENSAJES'
  | 'MOVIMIENTOS'
  | 'NOTAS'
  | 'NOTIFICACIONES'
  | 'PAQUETES'
  | 'PARKING_BILLING'
  | 'PARKING_ROTATION'
  | 'PERSONAL'
  | 'PQRF'
  | 'RESIDENTES'
  | 'UNIDADES'
  | 'VEHICULOS'
  | 'VISITAS'
  | 'VOTACIONES'
  | 'ZONAS_COMUNES';

/** Plan de suscripción del complejo residencial */
export type ComplexPlan =
  /** Básico, hasta 50 unidades */
  | 'BASIC'
  /** Enterprise, ilimitado */
  | 'ENTERPRISE'
  /** Gratuito, hasta 10 unidades */
  | 'FREE'
  /** Pro, hasta 200 unidades */
  | 'PRO';

/** Estado operativo del complejo residencial */
export type ComplexStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'PENDING_REVIEW'
  | 'PENDING_SETUP'
  | 'SUSPENDED';

/** Tipo de complejo residencial */
export type ComplexType =
  /** Conjunto cerrado de apartamentos */
  | 'APARTMENT_COMPLEX'
  /** Urbanización de casas */
  | 'HOUSES_COMMUNITY'
  /** Uso mixto residencial apartamentos y casas */
  | 'MIXED_COMPLEX';

/** Datos para configurar la rotación de parqueaderos del complejo */
export type ConfigureRotationInput = {
  /** ID del complejo residencial */
  complexId: Scalars['String']['input'];
  /** Activar o desactivar la rotación. Por defecto: true */
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  /** Unidad de tiempo del intervalo (DAYS | WEEKS | MONTHS) */
  rotationIntervalUnit: RotationIntervalUnit;
  /** Valor numérico del intervalo de rotación (ej: 3 para "cada 3 meses") */
  rotationIntervalValue: Scalars['Int']['input'];
  /** Lista de cupos disponibles por tipo de vehículo. Ej: [{ vehicleType: "CAR", slots: 20 }, { vehicleType: "MOTORCYCLE", slots: 13 }]. Solo los tipos listados participarán en la rotación. */
  slotsByType: Array<ParkingSlotByTypeInput>;
};

export type ConfirmDeliveryInput = {
  notes?: InputMaybe<Scalars['String']['input']>;
  packageId: Scalars['String']['input'];
  receivedByIdentity?: InputMaybe<Scalars['String']['input']>;
  receivedByName?: InputMaybe<Scalars['String']['input']>;
};

/** CountryCode */
export type Country = {
  __typename?: 'Country';
  code: Scalars['String']['output'];
  dialCode: Scalars['String']['output'];
  flag: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

/** Código de país para el número de teléfono */
export type CountryCode = {
  code: Scalars['String']['input'];
  dialCode: Scalars['String']['input'];
  flag: Scalars['String']['input'];
  name: Scalars['String']['input'];
};

/** Datos para crear un usuario administrativo (no residente) */
export type CreateAdminUserInput = {
  complexId?: InputMaybe<Scalars['String']['input']>;
  countryCode?: InputMaybe<CountryCode>;
  email: Scalars['String']['input'];
  identity?: InputMaybe<Scalars['String']['input']>;
  lastName: Scalars['String']['input'];
  name: Scalars['String']['input'];
  password: Scalars['String']['input'];
  phoneNumber: Scalars['String']['input'];
  /** Rol a asignar. Permitidos: COMPILANCE_OFFICER_ROL, COMPLEX_ROL, ACCOUNTANT_ROL, SUPERVISOR_ROL */
  role: ValidRoles;
};

export type CreateAmenityBlackoutInput = {
  amenityId: Scalars['String']['input'];
  /** Fin del bloqueo (ISO 8601) */
  endAt: Scalars['String']['input'];
  /** Motivo visible para el residente */
  reason: Scalars['String']['input'];
  /** Inicio del bloqueo (ISO 8601) */
  startAt: Scalars['String']['input'];
};

export type CreateAmenityBookingInput = {
  amenityId: Scalars['String']['input'];
  attendees?: Scalars['Int']['input'];
  /** Fin de la reserva (ISO 8601). Exclusivo: 12:00 no choca con una reserva que empieza a las 12:00 */
  endAt: Scalars['String']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  /** Motivo del evento (ej. cumpleaños) */
  purpose?: InputMaybe<Scalars['String']['input']>;
  /** Inicio de la reserva (ISO 8601) */
  startAt: Scalars['String']['input'];
  /** Unidad a nombre de la cual se reserva (solo staff) */
  unitId?: InputMaybe<Scalars['String']['input']>;
  /** Usar el cupo anual del consejo si aplica */
  useCouncilFreeQuota?: Scalars['Boolean']['input'];
};

export type CreateAmenityInput = {
  advanceBookingDays?: Scalars['Int']['input'];
  blockBookingsOnDebt?: Scalars['Boolean']['input'];
  bookingMode?: AmenityBookingMode;
  /** Días antes del inicio en que aún se puede cancelar sin quedar con el cobro */
  cancellationDeadlineDays?: Scalars['Int']['input'];
  /** Horas que se suman al plazo de cancelación en días */
  cancellationDeadlineHours?: Scalars['Int']['input'];
  /** Aforo por reserva. 0 = sin control */
  capacity?: Scalars['Int']['input'];
  complexId: Scalars['String']['input'];
  /** Reservas gratis al año por miembro del consejo. 0 = sin beneficio */
  councilFreeBookingsPerYear?: Scalars['Int']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  durationUnit?: AmenityDurationUnit;
  feeAmount?: Scalars['Float']['input'];
  feeType?: AmenityFeeType;
  imageUrls?: InputMaybe<Array<Scalars['String']['input']>>;
  /** % de la tarifa que se retiene al cancelar fuera de plazo */
  lateCancellationFeePercent?: Scalars['Int']['input'];
  location?: InputMaybe<Scalars['String']['input']>;
  /** 0 = sin límite */
  maxActiveBookingsPerUnit?: Scalars['Int']['input'];
  /** 0 = sin límite */
  maxBookingsPerUnitPerMonth?: Scalars['Int']['input'];
  /** Solo RANGE: duración máxima en minutos. El rango válido depende de durationUnit */
  maxDurationMinutes?: Scalars['Int']['input'];
  /** Reservas que caben a la misma hora (ej. 4 asadores) */
  maxSimultaneousBookings?: Scalars['Int']['input'];
  /** Anticipación mínima en días. 0 = se puede reservar para hoy */
  minAdvanceDays?: Scalars['Int']['input'];
  /** Solo RANGE: duración mínima en minutos. El rango válido depende de durationUnit */
  minDurationMinutes?: Scalars['Int']['input'];
  name: Scalars['String']['input'];
  requiresApproval?: Scalars['Boolean']['input'];
  /** Reglamento de uso que ve el residente al reservar */
  rules?: InputMaybe<Scalars['String']['input']>;
  schedules?: InputMaybe<Array<AmenityScheduleInput>>;
  /** Solo SLOT: minutos de cada bloque. El rango válido depende de durationUnit */
  slotDurationMinutes?: Scalars['Int']['input'];
  status?: AmenityStatus;
  type?: AmenityType;
};

export type CreateBuildingInput = {
  /** ID del complejo */
  complexId: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  /** Número de pisos */
  floors?: Scalars['Int']['input'];
  /** Nombre de la torre. Ej: "Torre A", "Edificio Norte" */
  name: Scalars['String']['input'];
};

export type CreateChargeCategoryInput = {
  color?: InputMaybe<Scalars['String']['input']>;
  complexId: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
};

export type CreateChargeEmissionInput = {
  billingMode?: FeeConfigBillingMode;
  categoryId?: InputMaybe<Scalars['String']['input']>;
  complexId: Scalars['String']['input'];
  /** Nombre del concepto. Ej: "Cuota de Administración" */
  conceptName: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  /** Día del mes de vencimiento (1-28) */
  dueDayOfMonth?: Scalars['Int']['input'];
  /** Período de facturación YYYY-MM */
  period: Scalars['String']['input'];
  rules: Array<ChargeRuleInput>;
};

export type CreateComplexInput = {
  address: Scalars['String']['input'];
  city: Scalars['String']['input'];
  country?: Scalars['String']['input'];
  countryCode?: InputMaybe<CountryCode>;
  coverUrl?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  /** Radio en metros para validar presencia GPS (por defecto 200 m) */
  gpsRadius?: InputMaybe<Scalars['Int']['input']>;
  /** Latitud GPS del complejo para validación de presencia de supervisores */
  latitude?: InputMaybe<Scalars['Float']['input']>;
  /** ID (UUID) del representante legal */
  legalRepresentativeId?: InputMaybe<Scalars['String']['input']>;
  logoUrl?: InputMaybe<Scalars['String']['input']>;
  /** Longitud GPS del complejo para validación de presencia de supervisores */
  longitude?: InputMaybe<Scalars['Float']['input']>;
  name: Scalars['String']['input'];
  nit?: InputMaybe<Scalars['String']['input']>;
  /** Contraseña de acceso al portal del complejo */
  password?: InputMaybe<Scalars['String']['input']>;
  phoneNumber?: InputMaybe<Scalars['String']['input']>;
  plan?: ComplexPlan;
  /** Horas entre recordatorios. 0 = sin recordatorios */
  pqrfReminderIntervalHours?: InputMaybe<Scalars['Int']['input']>;
  /** Días antes del vencimiento en que empiezan los recordatorios */
  pqrfReminderLeadDays?: InputMaybe<Scalars['Int']['input']>;
  /** Días para resolver un PQRF (calendario) */
  pqrfResolutionDays?: InputMaybe<Scalars['Int']['input']>;
  settings?: InputMaybe<Scalars['JSON']['input']>;
  state: Scalars['String']['input'];
  type?: ComplexType;
  website?: InputMaybe<Scalars['String']['input']>;
  zipCode?: InputMaybe<Scalars['String']['input']>;
};

export type CreateDirectChargesInput = {
  amount: Scalars['Float']['input'];
  complexId: Scalars['String']['input'];
  description: Scalars['String']['input'];
  period: Scalars['String']['input'];
  unitIds: Array<Scalars['String']['input']>;
};

export type CreateDirectChargesResponse = {
  __typename?: 'CreateDirectChargesResponse';
  created: Scalars['Int']['output'];
  skipped: Scalars['Int']['output'];
};

export type CreateExpenseInput = {
  complexId: Scalars['String']['input'];
  documentDate: Scalars['DateTime']['input'];
  lines: Array<ExpenseLineInput>;
  memo: Scalars['String']['input'];
  paymentAccountId: Scalars['String']['input'];
  period: Scalars['String']['input'];
  thirdPartyName?: InputMaybe<Scalars['String']['input']>;
};

export type CreateFeeConfigInput = {
  amount: Scalars['Float']['input'];
  billingMode?: FeeConfigBillingMode;
  categoryId?: InputMaybe<Scalars['String']['input']>;
  chargeType?: ChargeType;
  complexId: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  dueDayOfMonth?: Scalars['Int']['input'];
  earlyPaymentAmount?: InputMaybe<Scalars['Float']['input']>;
  earlyPaymentDueDayOfMonth?: InputMaybe<Scalars['Int']['input']>;
  frequency?: FeeFrequency;
  installments?: InputMaybe<Scalars['Int']['input']>;
  isOptional?: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
  prelacionConcept?: PrelacionConcept;
  targetRules?: InputMaybe<FeeConfigTargetRulesInput>;
  triggerType?: InputMaybe<FeeConfigTriggerType>;
  unitId?: InputMaybe<Scalars['String']['input']>;
  unitType?: InputMaybe<UnitType>;
};

export type CreateLegalDocumentInput = {
  /** PUBLIC por defecto */
  audience?: InputMaybe<LegalAudience>;
  description?: InputMaybe<Scalars['String']['input']>;
  /** Archivo .docx en base64 (sin prefijo data URI). Se convierte a HTML en el servidor. */
  docxBase64?: InputMaybe<Scalars['String']['input']>;
  /** Si ofrece descarga (requiere pdfBase64) */
  isDownloadable?: InputMaybe<Scalars['Boolean']['input']>;
  /** PDF descargable en base64 (sin prefijo data URI). */
  pdfBase64?: InputMaybe<Scalars['String']['input']>;
  /** Nombre del archivo PDF (para la descarga). */
  pdfFileName?: InputMaybe<Scalars['String']['input']>;
  /** Identificador de URL (kebab-case) */
  slug: Scalars['String']['input'];
  title: Scalars['String']['input'];
};

export type CreateMaintenanceLocationTagInput = {
  amenityId?: InputMaybe<Scalars['String']['input']>;
  buildingId?: InputMaybe<Scalars['String']['input']>;
  code: Scalars['String']['input'];
  complexId: Scalars['String']['input'];
  defaultCategory?: InputMaybe<MaintenanceCategory>;
  description?: InputMaybe<Scalars['String']['input']>;
  /** Negativo para sótanos */
  floor?: InputMaybe<Scalars['Int']['input']>;
  kind?: InputMaybe<MaintenanceTagKind>;
  lat?: InputMaybe<Scalars['Float']['input']>;
  lng?: InputMaybe<Scalars['Float']['input']>;
  name: Scalars['String']['input'];
};

export type CreateMaintenanceVendorInput = {
  complexId: Scalars['String']['input'];
  contactName?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  /** NIT o cédula */
  legalId?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  specialties?: InputMaybe<Array<MaintenanceCategory>>;
};

/** Datos requeridos para crear un nuevo permiso */
export type CreatePermissionInput = {
  /** Obliges to have a previous permission to assign another (e.g., need "user:read" to get "user:edit"). */
  dependsOn: Array<PermissionDependencyInput>;
  /** description of the permission */
  description: Scalars['String']['input'];
  /** Recurso del sistema al que aplica el permiso */
  group: Scalars['String']['input'];
  /** Si es true, no podrá borrarse por API */
  isSystem?: InputMaybe<Scalars['Boolean']['input']>;
  /** Nombre legible para mostrar en la UI */
  label: Scalars['String']['input'];
  /** level of the permission */
  level: PermissionLevel;
  /** name of the permission */
  name: ValidPermissions;
  /** Estado inicial del permiso */
  status?: InputMaybe<Scalars['Boolean']['input']>;
};

export type CreatePermissionResponse = {
  __typename?: 'CreatePermissionResponse';
  /** category to which a permit belongs */
  category?: Maybe<Scalars['String']['output']>;
  /** Creation timestamp */
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  /** indicates the permissions on which the saved permission depends */
  dependsOn?: Maybe<Array<PermissionDependencyResponse>>;
  /** description of the permission */
  description?: Maybe<Scalars['String']['output']>;
  /** id of the permission */
  id: Scalars['String']['output'];
  /** Select critical permissions that cannot be removed */
  isSystem?: Maybe<Scalars['Boolean']['output']>;
  /** level of the permission */
  level?: Maybe<PermissionLevel>;
  /** Stores dynamic rules (e.g., access schedules, usage limits). */
  metadata?: Maybe<Scalars['JSON']['output']>;
  /** name of the permission */
  name: ValidPermissions;
  /** indicates if permission is active */
  status?: Maybe<Scalars['Boolean']['output']>;
};

export type CreatePetIncidentStatementInput = {
  incidentId: Scalars['String']['input'];
  /** Respuesta de la unidad */
  text: Scalars['String']['input'];
};

export type CreatePqrfInput = {
  addressee?: PqrfAddressee;
  complexId: Scalars['String']['input'];
  /** Cuerpo del radicado */
  description: Scalars['String']['input'];
  /** Asunto en una línea */
  subject: Scalars['String']['input'];
  type: PqrfType;
};

export type CreatePucAccountInput = {
  accountClass: AccountClass;
  code: Scalars['String']['input'];
  complexId: Scalars['String']['input'];
  isPostable?: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
  nature: AccountNature;
  parentId?: InputMaybe<Scalars['String']['input']>;
};

export type CreateRecurringChargeInput = {
  amount: Scalars['Float']['input'];
  billingDay?: Scalars['Int']['input'];
  billingMode?: InputMaybe<FeeConfigBillingMode>;
  complexId: Scalars['String']['input'];
  concept: Scalars['String']['input'];
  distribution?: InputMaybe<RecurringChargeDistribution>;
  earlyDiscountDay?: InputMaybe<Scalars['Int']['input']>;
  earlyDiscountPct?: InputMaybe<Scalars['Float']['input']>;
  incomeAccountId: Scalars['String']['input'];
  prorateByCoefficient?: InputMaybe<Scalars['Boolean']['input']>;
  targetRules?: InputMaybe<FeeConfigTargetRulesInput>;
  targetUnitIds?: InputMaybe<Array<Scalars['String']['input']>>;
  totalInstallments?: InputMaybe<Scalars['Int']['input']>;
  triggerType?: InputMaybe<RecurringChargeTrigger>;
  type: RecurringChargeType;
  unitId?: InputMaybe<Scalars['String']['input']>;
  vehicleTypes?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type CreateResidentInput = {
  /** ID del complejo residencial */
  complexId: Scalars['String']['input'];
  /** Correo electrónico del residente */
  email: Scalars['String']['input'];
  /** Apellido del contacto de emergencia */
  emergencyContactLastName: Scalars['String']['input'];
  /** Nombre del contacto de emergencia */
  emergencyContactName: Scalars['String']['input'];
  /** Teléfono del contacto de emergencia */
  emergencyContactPhone: Scalars['String']['input'];
  endDate?: InputMaybe<Scalars['String']['input']>;
  /** Número de documento de identidad del residente */
  identityNumber: Scalars['String']['input'];
  /** Tipo de documento de identidad del residente */
  identityType?: UserIdentityType;
  /** Miembro del consejo de administración */
  isCouncilMember?: Scalars['Boolean']['input'];
  isMainResident?: Scalars['Boolean']['input'];
  /** Apellido del residente */
  lastName: Scalars['String']['input'];
  /** Nombre del residente */
  name: Scalars['String']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  /** Número de teléfono del residente */
  phoneNumber: Scalars['String']['input'];
  startDate?: InputMaybe<Scalars['String']['input']>;
  type?: ResidentType;
  /** ID de la unidad a la que se asignará */
  unitId: Scalars['String']['input'];
};

/** Datos para registrar un residente en el sistema */
export type CreateResidentUserInput = {
  /** ID del complejo residencial */
  complexId: Scalars['String']['input'];
  /** Correo electrónico (opcional) */
  email?: InputMaybe<Scalars['String']['input']>;
  /** Número de documento de identidad */
  identityNumber: Scalars['String']['input'];
  /** Apellido(s) del residente */
  lastName: Scalars['String']['input'];
  /** Nombre(s) del residente */
  name: Scalars['String']['input'];
  /** Número de celular (solo Colombia, ej: 3001234567) */
  phoneNumber: Scalars['String']['input'];
  /** ID de la unidad (apartamento) asignada */
  unitId: Scalars['String']['input'];
};

export type CreateRoleInput = {
  /** description of the permisison */
  description: Scalars['String']['input'];
  /** name of the permisison visiblen to end user */
  frontName: Scalars['String']['input'];
  /** level of the permisison */
  hierarchyLevel?: InputMaybe<Scalars['Int']['input']>;
  /** icon of the permisison */
  icon: Scalars['String']['input'];
  isSystem?: InputMaybe<Scalars['Boolean']['input']>;
  /** Stores dynamic rules (e.g., access schedules, usage limits). */
  metadata: Scalars['JSON']['input'];
  /** name of the permisison */
  name: ValidRoles;
  parentId?: InputMaybe<Scalars['String']['input']>;
  permissionIds: Array<Scalars['String']['input']>;
};

export type CreateSpecialNumberInput = {
  category: SpecialNumberCategory;
  /** Requerido para números de complejo; omitir para números globales (solo SUPER_ADMIN) */
  complexId?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  /** true = número global visible en todos los complejos (solo SUPER_ADMIN) */
  isGlobal?: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
  order?: InputMaybe<Scalars['Int']['input']>;
  phoneNumber: Scalars['String']['input'];
};

/** Datos para crear un miembro del personal del complejo (guardia o contador) */
export type CreateStaffMemberInput = {
  /** ID del complejo al que se asigna el personal */
  complexId: Scalars['String']['input'];
  email: Scalars['String']['input'];
  identity: Scalars['String']['input'];
  identityNumber?: InputMaybe<Scalars['String']['input']>;
  /** Tipo de documento de identidad */
  identityType?: InputMaybe<UserIdentityType>;
  lastName: Scalars['String']['input'];
  name: Scalars['String']['input'];
  password?: InputMaybe<Scalars['String']['input']>;
  phoneNumber: Scalars['String']['input'];
  /** Rol a asignar: SECURITY_ROL | ACCOUNTANT_ROL */
  role: ValidRoles;
  /** Turno asignado (MAÑANA, TARDE, NOCHE) */
  shift?: InputMaybe<Scalars['String']['input']>;
};

/** Resultado de crear o reintegrar un miembro del personal */
export type CreateStaffMemberResponse = {
  __typename?: 'CreateStaffMemberResponse';
  action: StaffMemberAction;
  complexId?: Maybe<Scalars['String']['output']>;
  email: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  identity: Scalars['String']['output'];
  lastName: Scalars['String']['output'];
  name: Scalars['String']['output'];
  phoneNumber: Scalars['String']['output'];
  status: UserStatus;
};

export type CreateUnitInput = {
  /** Área en m² */
  area?: InputMaybe<Scalars['Float']['input']>;
  /** Número de baños */
  bathrooms?: InputMaybe<Scalars['Int']['input']>;
  /** Número de habitaciones */
  bedrooms?: InputMaybe<Scalars['Int']['input']>;
  /** ID de la torre (opcional, para complejos con edificios) */
  buildingId?: InputMaybe<Scalars['String']['input']>;
  /** Coeficiente de copropiedad (fracción, suma=1). Ej: 0.012345 */
  coefficient?: InputMaybe<Scalars['Float']['input']>;
  /** ID del complejo */
  complexId: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  /** Piso donde se ubica la unidad */
  floor?: Scalars['Int']['input'];
  /** Si la unidad usa/paga ascensor */
  hasElevator?: InputMaybe<Scalars['Boolean']['input']>;
  /** Número de pisos de la casa (solo casas) */
  houseFloors?: InputMaybe<Scalars['Int']['input']>;
  /** Número o código de la unidad. Ej: "101", "B-302" */
  number: Scalars['String']['input'];
  /** Cupos de parqueadero */
  parkingSpots?: Scalars['Int']['input'];
  /** Cuartos de bodega */
  storageRooms?: Scalars['Int']['input'];
  /** Tipo de unidad */
  type?: UnitType;
};

export type CreateVotingMeetingInput = {
  complexId: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  kind: VotingMeetingKind;
  scheduledAt: Scalars['DateTime']['input'];
  title: Scalars['String']['input'];
};

export type CreateVotingQuestionInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  meetingId: Scalars['String']['input'];
  /** Opciones de respuesta, de 2 a 10 */
  options: Array<Scalars['String']['input']>;
  secrecy?: InputMaybe<VoteSecrecy>;
  text: Scalars['String']['input'];
  /** Solo asambleas: COEFFICIENT (por defecto) o UNIT. En el consejo vota cada miembro */
  weighting?: InputMaybe<VoteWeighting>;
};

export type CreateWalletCreditInput = {
  amount: Scalars['Float']['input'];
  complexId: Scalars['String']['input'];
  description: Scalars['String']['input'];
  unitId: Scalars['String']['input'];
};

export type DateRangeInput = {
  from?: InputMaybe<Scalars['String']['input']>;
  to?: InputMaybe<Scalars['String']['input']>;
};

/** Solicitud de ingreso pendiente de aprobación desde un dispositivo confiable */
export type DeviceApprovalResponse = {
  __typename?: 'DeviceApprovalResponse';
  /** Código a MOSTRAR en pantalla. El residente debe verificar que coincida con el del push antes de aprobar */
  approvalCode: Scalars['String']['output'];
  /** Identificador del intento. Requerido para consultar estado y canjear */
  challengeId: Scalars['ID']['output'];
  expiresAt: Scalars['DateTime']['output'];
  /** Texto a mostrar al usuario mientras espera la aprobación */
  instructions: Scalars['String']['output'];
};

/** Estado de una solicitud de ingreso pendiente de aprobación por push */
export type DeviceApprovalStatus =
  | 'APPROVED'
  | 'CONSUMED'
  | 'DENIED'
  | 'EXPIRED'
  | 'PENDING';

/** Estado de una solicitud de ingreso por aprobación push */
export type DeviceApprovalStatusResponse = {
  __typename?: 'DeviceApprovalStatusResponse';
  expiresAt: Scalars['DateTime']['output'];
  /** PENDING mientras el residente no responde; APPROVED habilita el canje */
  status: DeviceApprovalStatus;
};

export type DeviceInfo = {
  __typename?: 'DeviceInfo';
  appVersion?: Maybe<Scalars['String']['output']>;
  deviceId?: Maybe<Scalars['String']['output']>;
  ip: Scalars['String']['output'];
  platform: Scalars['String']['output'];
  userAgent: Scalars['String']['output'];
};

export type DevicePushHealthStatus = {
  __typename?: 'DevicePushHealthStatus';
  consecutiveFailures: Scalars['Int']['output'];
  healthId: Scalars['String']['output'];
  isHealthy: Scalars['Boolean']['output'];
  lastCheckAcknowledged: Scalars['Boolean']['output'];
  lastTestAckAt?: Maybe<Scalars['DateTime']['output']>;
  lastTestSentAt?: Maybe<Scalars['DateTime']['output']>;
  onboardingCompletedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type DirectIncome = {
  __typename?: 'DirectIncome';
  amount: Scalars['Float']['output'];
  category: IncomeCategory;
  complex: ResidentialComplex;
  complexId: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  description: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  incomeDate: Scalars['DateTime']['output'];
  isReversed: Scalars['Boolean']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  period: Scalars['String']['output'];
  receiptUrl?: Maybe<Scalars['String']['output']>;
  registeredByUserId?: Maybe<Scalars['String']['output']>;
  reversalReason?: Maybe<Scalars['String']['output']>;
  reversedAt?: Maybe<Scalars['DateTime']['output']>;
  reversedByUserId?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
};

/** Estado de validación del DPA firmado subido por un complejo */
export type DpaValidationStatus =
  | 'APPROVED'
  | 'PENDING'
  | 'REJECTED';

export type ExecuteNotificationActionInput = {
  actionCode: Scalars['String']['input'];
  complexId?: InputMaybe<Scalars['String']['input']>;
  notificationId: Scalars['String']['input'];
  /** Respuestas a los campos que pide la acción */
  values?: InputMaybe<Scalars['JSON']['input']>;
};

/** Categoría del gasto operativo del complejo */
export type ExpenseCategory =
  /** Gastos administrativos */
  | 'ADMINISTRATIVE'
  /** Seguros */
  | 'INSURANCE'
  /** Mantenimiento preventivo */
  | 'MAINTENANCE'
  /** Otros */
  | 'OTHER'
  /** Reparaciones y obras */
  | 'REPAIRS'
  /** Salarios y nómina */
  | 'SALARIES'
  /** Vigilancia y seguridad */
  | 'SECURITY'
  /** Insumos y materiales */
  | 'SUPPLIES'
  /** Servicios públicos */
  | 'UTILITIES';

export type ExpenseCategoryBreakdown = {
  __typename?: 'ExpenseCategoryBreakdown';
  category: ExpenseCategory;
  count: Scalars['Float']['output'];
  total: Scalars['Float']['output'];
};

export type ExpenseLineInput = {
  amount: Scalars['Float']['input'];
  memo: Scalars['String']['input'];
  pucAccountId: Scalars['String']['input'];
  unitId?: InputMaybe<Scalars['String']['input']>;
};

export type FeeCharge = {
  __typename?: 'FeeCharge';
  amount: Scalars['Float']['output'];
  balance: Scalars['Float']['output'];
  cancellationReason?: Maybe<Scalars['String']['output']>;
  cancelledAt?: Maybe<Scalars['DateTime']['output']>;
  cancelledByUserId?: Maybe<Scalars['String']['output']>;
  complex: ResidentialComplex;
  complexId: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  description: Scalars['String']['output'];
  dueDate?: Maybe<Scalars['DateTime']['output']>;
  earlyPaymentDueDate?: Maybe<Scalars['DateTime']['output']>;
  effectiveStatus: ChargeStatus;
  feeConfig?: Maybe<FeeConfig>;
  feeConfigId?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  incomeAccountId?: Maybe<Scalars['String']['output']>;
  moraAmount?: Maybe<Scalars['Float']['output']>;
  normalAmount?: Maybe<Scalars['Float']['output']>;
  paidAmount: Scalars['Float']['output'];
  period: Scalars['String']['output'];
  prelacionConcept: PrelacionConcept;
  sourceChargeId?: Maybe<Scalars['String']['output']>;
  status: ChargeStatus;
  unit: Unit;
  unitId: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type FeeConfig = {
  __typename?: 'FeeConfig';
  amount: Scalars['Float']['output'];
  billingMode: FeeConfigBillingMode;
  category?: Maybe<ChargeCategory>;
  categoryId?: Maybe<Scalars['String']['output']>;
  chargeType: ChargeType;
  complex: ResidentialComplex;
  complexId: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  createdByUserId: Scalars['String']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  dueDayOfMonth: Scalars['Float']['output'];
  earlyPaymentAmount?: Maybe<Scalars['Float']['output']>;
  earlyPaymentDueDayOfMonth?: Maybe<Scalars['Int']['output']>;
  frequency: FeeFrequency;
  id: Scalars['ID']['output'];
  installments?: Maybe<Scalars['Int']['output']>;
  installmentsPaid: Scalars['Int']['output'];
  isActive: Scalars['Boolean']['output'];
  isOptional: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  prelacionConcept: PrelacionConcept;
  targetRules?: Maybe<FeeConfigTargetRules>;
  triggerType?: Maybe<FeeConfigTriggerType>;
  unit?: Maybe<Unit>;
  unitId?: Maybe<Scalars['String']['output']>;
  unitType?: Maybe<UnitType>;
  updatedAt: Scalars['DateTime']['output'];
};

export type FeeConfigBillingMode =
  | 'ADVANCE'
  | 'ARREARS';

export type FeeConfigTargetRules = {
  __typename?: 'FeeConfigTargetRules';
  buildingIds?: Maybe<Array<Scalars['String']['output']>>;
  excludeFloor1?: Maybe<Scalars['Boolean']['output']>;
  floorMax?: Maybe<Scalars['Int']['output']>;
  floorMin?: Maybe<Scalars['Int']['output']>;
  unitTypes?: Maybe<Array<Scalars['String']['output']>>;
};

export type FeeConfigTargetRulesInput = {
  buildingIds?: InputMaybe<Array<Scalars['String']['input']>>;
  excludeFloor1?: InputMaybe<Scalars['Boolean']['input']>;
  floorMax?: InputMaybe<Scalars['Int']['input']>;
  floorMin?: InputMaybe<Scalars['Int']['input']>;
  unitTypes?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type FeeConfigTriggerType =
  | 'VEHICLE';

/** Frecuencia de facturación de una configuración de cuota */
export type FeeFrequency =
  | 'ANNUAL'
  | 'BIMONTHLY'
  | 'MONTHLY'
  | 'ONE_TIME'
  | 'QUARTERLY'
  | 'SEMIANNUAL';

export type FilterAccountingDocumentsInput = {
  complexId: Scalars['String']['input'];
  documentType?: InputMaybe<AccountingDocumentType>;
  period?: InputMaybe<Scalars['String']['input']>;
  unitId?: InputMaybe<Scalars['String']['input']>;
};

export type FilterAmenitiesInput = {
  /** Búsqueda por nombre */
  search?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<AmenityStatus>;
  type?: InputMaybe<AmenityType>;
};

export type FilterAmenityBookingsInput = {
  amenityId?: InputMaybe<Scalars['String']['input']>;
  /** Reservas que inician desde esta fecha (ISO 8601) */
  startFrom?: InputMaybe<Scalars['String']['input']>;
  /** Reservas que inician hasta esta fecha (ISO 8601) */
  startUntil?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<AmenityBookingStatus>;
  unitId?: InputMaybe<Scalars['String']['input']>;
};

/** Filtros para consultar el historial de auditoría */
export type FilterAuditLogsInput = {
  /** Filtrar por tipo de acción */
  action?: InputMaybe<AuditAction>;
  /** Filtrar por ID del complejo */
  complexId?: InputMaybe<Scalars['String']['input']>;
  /** Filtrar por ID de la entidad */
  entityId?: InputMaybe<Scalars['String']['input']>;
  /** Filtrar por tipo de entidad */
  entityType?: InputMaybe<AuditEntityType>;
  /** Desde esta fecha (ISO 8601) */
  from?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  /** Filtrar por ID del actor */
  performedById?: InputMaybe<Scalars['String']['input']>;
  /** Filtrar por rol del actor */
  performedByRole?: InputMaybe<Scalars['String']['input']>;
  /** Número de referencia exacto */
  referenceNumber?: InputMaybe<Scalars['String']['input']>;
  /** Hasta esta fecha (ISO 8601) */
  to?: InputMaybe<Scalars['String']['input']>;
};

export type FilterChargesInput = {
  feeConfigId?: InputMaybe<Scalars['String']['input']>;
  period?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<ChargeStatus>;
  unitId?: InputMaybe<Scalars['String']['input']>;
  unitSearch?: InputMaybe<Scalars['String']['input']>;
};

export type FilterComplexInput = {
  /** Filtrar por ciudad */
  city?: InputMaybe<Scalars['String']['input']>;
  plan?: InputMaybe<ComplexPlan>;
  /** Buscar por nombre, ciudad o dirección */
  search?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<ComplexStatus>;
  type?: InputMaybe<ComplexType>;
};

export type FilterExpensesInput = {
  category?: InputMaybe<ExpenseCategory>;
  endDate?: InputMaybe<Scalars['DateTime']['input']>;
  includeReversed?: InputMaybe<Scalars['Boolean']['input']>;
  period?: InputMaybe<Scalars['String']['input']>;
  startDate?: InputMaybe<Scalars['DateTime']['input']>;
};

export type FilterIncomesInput = {
  category?: InputMaybe<IncomeCategory>;
  endDate?: InputMaybe<Scalars['DateTime']['input']>;
  includeReversed?: InputMaybe<Scalars['Boolean']['input']>;
  period?: InputMaybe<Scalars['String']['input']>;
  startDate?: InputMaybe<Scalars['DateTime']['input']>;
};

export type FilterListingsInput = {
  categoryId?: InputMaybe<Scalars['String']['input']>;
  maxPrice?: InputMaybe<Scalars['Float']['input']>;
  minPrice?: InputMaybe<Scalars['Float']['input']>;
  /** Solo las que guardé como favoritas */
  onlyFavorites?: InputMaybe<Scalars['Boolean']['input']>;
  /** Solo mis publicaciones */
  onlyMine?: InputMaybe<Scalars['Boolean']['input']>;
  /** Solo las que tienen reportes sin resolver */
  onlyReported?: InputMaybe<Scalars['Boolean']['input']>;
  priceType?: InputMaybe<MarketplacePriceType>;
  /** Busca en el título y en la descripción */
  search?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<MarketplaceListingStatus>;
  type?: InputMaybe<MarketplaceListingType>;
  /** Solo para la administración: avisos de una unidad */
  unitId?: InputMaybe<Scalars['String']['input']>;
};

export type FilterMaintenanceTicketsInput = {
  amenityId?: InputMaybe<Scalars['String']['input']>;
  assignedUserId?: InputMaybe<Scalars['String']['input']>;
  assigneeType?: InputMaybe<MaintenanceAssigneeType>;
  buildingId?: InputMaybe<Scalars['String']['input']>;
  category?: InputMaybe<MaintenanceCategory>;
  dateFrom?: InputMaybe<Scalars['String']['input']>;
  dateTo?: InputMaybe<Scalars['String']['input']>;
  locationTagId?: InputMaybe<Scalars['String']['input']>;
  onlyMine?: InputMaybe<Scalars['Boolean']['input']>;
  onlyOverdue?: InputMaybe<Scalars['Boolean']['input']>;
  onlyUnassigned?: InputMaybe<Scalars['Boolean']['input']>;
  priority?: InputMaybe<MaintenancePriority>;
  /** Calificación exacta 1-5 */
  rating?: InputMaybe<Scalars['Int']['input']>;
  /** Busca por número del ticket, título o descripción */
  search?: InputMaybe<Scalars['String']['input']>;
  /** Varios estados a la vez: el tablero pide columnas, no una */
  statuses?: InputMaybe<Array<MaintenanceTicketStatus>>;
  vendorId?: InputMaybe<Scalars['String']['input']>;
};

export type FilterNotesInput = {
  /** Filtrar por uno o varios roles creadores. Cada rol solo puede filtrar dentro de los roles que tiene visibilidad */
  createdByRoles?: InputMaybe<Array<Scalars['String']['input']>>;
  /** Filtrar por usuario creador (solo SUPER_ADMIN y COMPLEX_ROL) */
  createdByUserId?: InputMaybe<Scalars['String']['input']>;
  /** Fecha de inicio del rango (ISO 8601) */
  dateFrom?: InputMaybe<Scalars['String']['input']>;
  /** Fecha de fin del rango (ISO 8601) */
  dateTo?: InputMaybe<Scalars['String']['input']>;
};

export type FilterNotificationsInput = {
  isRead?: InputMaybe<Scalars['Boolean']['input']>;
  isStarred?: InputMaybe<Scalars['Boolean']['input']>;
  priority?: InputMaybe<NotificationPriority>;
  search?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<NotificationType>;
};

export type FilterPackagesInput = {
  receivedFrom?: InputMaybe<Scalars['String']['input']>;
  receivedUntil?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<PackageStatus>;
  trackingCode?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<PackageType>;
  unitId?: InputMaybe<Scalars['String']['input']>;
};

export type FilterPetIncidentsInput = {
  dateFrom?: InputMaybe<Scalars['String']['input']>;
  dateTo?: InputMaybe<Scalars['String']['input']>;
  /** Solo los reportes sin mascota identificada */
  onlyUnidentified?: InputMaybe<Scalars['String']['input']>;
  petId?: InputMaybe<Scalars['String']['input']>;
  /** Busca por número del reporte o por el relato */
  search?: InputMaybe<Scalars['String']['input']>;
  severity?: InputMaybe<PetIncidentSeverity>;
  status?: InputMaybe<PetIncidentStatus>;
  type?: InputMaybe<PetIncidentType>;
  unitId?: InputMaybe<Scalars['String']['input']>;
};

export type FilterPetsInput = {
  /** Solo razas de manejo especial */
  isSpecialBreed?: InputMaybe<Scalars['Boolean']['input']>;
  residentId?: InputMaybe<Scalars['String']['input']>;
  /** Busca por nombre, raza, color o microchip */
  search?: InputMaybe<Scalars['String']['input']>;
  species?: InputMaybe<PetSpecies>;
  status?: InputMaybe<PetStatus>;
  unitId?: InputMaybe<Scalars['String']['input']>;
};

export type FilterPqrfInput = {
  addressee?: InputMaybe<PqrfAddressee>;
  /** Busca en el número de radicado y en el asunto */
  search?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<PqrfStatus>;
  type?: InputMaybe<PqrfType>;
};

export type FilterResidentsInput = {
  /** Filtrar por edificio/torre (UUID) */
  buildingId?: InputMaybe<Scalars['String']['input']>;
  /** Nombre de torre/edificio (ej: "5", "TORRE A"). Búsqueda exacta. */
  buildingName?: InputMaybe<Scalars['String']['input']>;
  /** Buscar por nombre, apellido o email del usuario */
  search?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<ResidentStatus>;
  type?: InputMaybe<ResidentType>;
  /** Filtrar por unidad específica (UUID) */
  unitId?: InputMaybe<Scalars['String']['input']>;
  /** Número/identificador de la unidad (ej: "39", "601") */
  unitNumber?: InputMaybe<Scalars['String']['input']>;
  /** Tipo de unidad: HOUSE, APARTMENT, OFFICE... */
  unitType?: InputMaybe<UnitType>;
};

export type FilterVehiclesInput = {
  /** Filtrar por residente */
  residentId?: InputMaybe<Scalars['String']['input']>;
  /** Buscar por placa, marca, modelo o color */
  search?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<VehicleStatus>;
  type?: InputMaybe<VehicleType>;
  /** Filtrar por unidad */
  unitId?: InputMaybe<Scalars['String']['input']>;
};

/** Filtros para listar vehículos visitantes */
export type FilterVisitorVehiclesInput = {
  /** ID del complejo residencial */
  complexId: Scalars['String']['input'];
  /** Registros con ingreso desde esta fecha */
  dateFrom?: InputMaybe<Scalars['DateTime']['input']>;
  /** Registros con ingreso hasta esta fecha */
  dateTo?: InputMaybe<Scalars['DateTime']['input']>;
  /** Filtrar por residente anfitrión */
  hostResidentId?: InputMaybe<Scalars['String']['input']>;
  /** Buscar por placa (parcial o completa) */
  plate?: InputMaybe<Scalars['String']['input']>;
  /** Filtrar por estado del registro */
  status?: InputMaybe<ParkingRecordStatus>;
  /** Filtrar por tipo de vehículo */
  vehicleType?: InputMaybe<VehicleType>;
};

export type FilterVisitsInput = {
  /** Desde esta fecha (ISO 8601) */
  dateFrom?: InputMaybe<Scalars['String']['input']>;
  /** Hasta esta fecha (ISO 8601) */
  dateTo?: InputMaybe<Scalars['String']['input']>;
  /** Filtrar por residente anfitrión */
  hostResidentId?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<VisitStatus>;
  type?: InputMaybe<VisitType>;
  /** Filtrar por unidad */
  unitId?: InputMaybe<Scalars['String']['input']>;
};

/** Opciones de género disponibles */
export type Gender =
  | 'FEMALE'
  | 'MALE'
  | 'PREFER_NOT_TO_SAY';

export type GenerateChargesInput = {
  complexId: Scalars['String']['input'];
  period: Scalars['String']['input'];
};

export type GenerateChargesResponse = {
  __typename?: 'GenerateChargesResponse';
  generated: Scalars['Int']['output'];
  period: Scalars['String']['output'];
  skipped: Scalars['Int']['output'];
};

export type HierarchyRoleInfo = {
  __typename?: 'HierarchyRoleInfo';
  /** Distance from the reference role */
  distance: Scalars['Int']['output'];
  /** Hierarchy level */
  hierarchyLevel: Scalars['Int']['output'];
  /** Role ID */
  id: Scalars['String']['output'];
  /** Role name */
  name: ValidRoles;
};

export type HierarchyStats = {
  __typename?: 'HierarchyStats';
  /** Number of ancestors */
  ancestorCount: Scalars['Int']['output'];
  /** Number of descendants */
  descendantCount: Scalars['Int']['output'];
  /** Number of direct permissions */
  directPermissionCount: Scalars['Int']['output'];
  /** Number of effective permissions */
  effectivePermissionCount: Scalars['Int']['output'];
};

/** Categoría de ingreso directo (caja/banco) del complejo */
export type IncomeCategory =
  /** Donaciones y aportes */
  | 'DONATION'
  /** Multas y sanciones */
  | 'FINES'
  /** Alquiler de salón / zonas comunes */
  | 'HALL_RENTAL'
  /** Rendimientos financieros */
  | 'INTEREST'
  /** Otros ingresos */
  | 'OTHER'
  /** Parqueadero de visitantes */
  | 'PARKING'
  /** Venta de activos */
  | 'SALE';

export type IncomeCategoryBreakdown = {
  __typename?: 'IncomeCategoryBreakdown';
  category: IncomeCategory;
  count: Scalars['Float']['output'];
  total: Scalars['Float']['output'];
};

/** Audiencia de un documento legal (público o solo complejos registrados) */
export type LegalAudience =
  | 'COMPLEX'
  | 'PUBLIC';

/** Documento legal público del sistema */
export type LegalDocument = {
  __typename?: 'LegalDocument';
  /** Audiencia: PUBLIC (/legal) o COMPLEX (solo complejos registrados) */
  audience: LegalAudience;
  /** Contenido HTML sanitizado */
  contentHtml?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  /** Descripción corta para el índice */
  description?: Maybe<Scalars['String']['output']>;
  /** Nombre del archivo descargable */
  downloadFileName?: Maybe<Scalars['String']['output']>;
  /** URL del PDF descargable (R2) */
  downloadFileUrl?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  /** Si ofrece un archivo descargable (PDF) */
  isDownloadable: Scalars['Boolean']['output'];
  /** Si está publicado (visible/activo) */
  isPublished: Scalars['Boolean']['output'];
  /** Identificador de URL: /legal/<slug> */
  slug: Scalars['String']['output'];
  /** Título del documento */
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  /** ID del usuario que actualizó por última vez */
  updatedById?: Maybe<Scalars['String']['output']>;
  /** Versión, incrementa en cada actualización de contenido */
  version: Scalars['Int']['output'];
};

/** Datos de contacto del publicador */
export type ListingContactResponse = {
  __typename?: 'ListingContactResponse';
  /** Nombre visible del publicador */
  displayName: Scalars['String']['output'];
  /** El canal quedó reducido al aviso dentro de la app */
  inAppOnly: Scalars['Boolean']['output'];
  /** Teléfono. Nulo si no se destapó o el conjunto no lo permite */
  phone?: Maybe<Scalars['String']['output']>;
  preference: MarketplaceContactPreference;
  /** Unidad del publicador */
  unitLabel?: Maybe<Scalars['String']['output']>;
};

export type LogCallInput = {
  answeredAt?: InputMaybe<Scalars['String']['input']>;
  buildingName?: InputMaybe<Scalars['String']['input']>;
  complexId: Scalars['String']['input'];
  direction: CallDirection;
  durationSeconds: Scalars['Int']['input'];
  endedAt?: InputMaybe<Scalars['String']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  outcome: CallOutcome;
  phoneNumber: Scalars['String']['input'];
  residentId?: InputMaybe<Scalars['String']['input']>;
  residentName?: InputMaybe<Scalars['String']['input']>;
  startedAt: Scalars['String']['input'];
  unitId?: InputMaybe<Scalars['String']['input']>;
  unitNumber?: InputMaybe<Scalars['String']['input']>;
};

/** Credenciales de login con la clave de acceso del residente */
export type LoginAccessCodeInput = {
  /** Clave alfanumérica de 6 caracteres */
  code: Scalars['String']['input'];
  /** Documento del residente. Obligatorio solo cuando el x-device-id todavía no está vinculado; desde un equipo vinculado el servidor lo ignora. */
  identity?: InputMaybe<Scalars['String']['input']>;
  /** Nombre del dispositivo que se vincula en este ingreso (ej. "Mi Android") */
  label?: InputMaybe<Scalars['String']['input']>;
};

/** Credenciales para inicio de sesión con email y contraseña */
export type LoginEmailInput = {
  /** Correo electrónico */
  email: Scalars['String']['input'];
  /** Contraseña */
  password: Scalars['String']['input'];
  /** Mantener sesión activa por más tiempo */
  rememberMe?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Credenciales para inicio de sesión de residentes (documento + código de sistema) */
export type LoginResidentInput = {
  /** Número de documento de identidad del residente */
  identity: Scalars['String']['input'];
  /** Código de sistema asignado al residente (formato RES-xxxxx) */
  systemCode: Scalars['String']['input'];
};

/** Credenciales para inicio de sesión con email y código de sistema */
export type LoginSystemCodeInput = {
  /** Correo electrónico del usuario */
  identity: Scalars['String']['input'];
  /** Contraseña */
  password: Scalars['String']['input'];
};

/** Naturaleza del responsable asignado al ticket */
export type MaintenanceAssigneeType =
  | 'INTERNAL'
  | 'VENDOR';

export type MaintenanceBoardColumn = {
  __typename?: 'MaintenanceBoardColumn';
  status: MaintenanceTicketStatus;
  tickets: Array<MaintenanceTicket>;
  total: Scalars['Int']['output'];
};

export type MaintenanceBoardResponse = {
  __typename?: 'MaintenanceBoardResponse';
  columns: Array<MaintenanceBoardColumn>;
  /** Tickets abiertos con el SLA vencido */
  overdueCount: Scalars['Int']['output'];
};

/** Tipo de daño reportado en zonas comunes */
export type MaintenanceCategory =
  | 'ASCENSORES'
  | 'ASEO'
  | 'ELECTRICO'
  | 'ESTRUCTURA'
  | 'GAS'
  | 'ILUMINACION'
  | 'JARDINERIA'
  | 'OTRO'
  | 'PISCINA'
  | 'PLOMERIA'
  | 'PUERTAS_Y_ACCESOS'
  | 'SEGURIDAD';

export type MaintenanceCategoryCount = {
  __typename?: 'MaintenanceCategoryCount';
  category: MaintenanceCategory;
  count: Scalars['Int']['output'];
};

/** Tipo de anotación en la bitácora del ticket */
export type MaintenanceEventType =
  | 'ASSIGNED'
  | 'CLOSED'
  | 'COMMENT'
  | 'CREATED'
  | 'ENDORSED'
  | 'PROGRESS'
  | 'RATED'
  | 'REOPENED'
  | 'RESOLVED'
  | 'SLA_BREACHED'
  | 'STATUS_CHANGED'
  | 'TRIAGED';

/** Concentración de incidencias por sitio */
export type MaintenanceHeatmapCell = {
  __typename?: 'MaintenanceHeatmapCell';
  /** Identificador del sitio agrupado */
  key: Scalars['String']['output'];
  /** Nombre visible del sitio */
  label: Scalars['String']['output'];
  lat?: Maybe<Scalars['Float']['output']>;
  lng?: Maybe<Scalars['Float']['output']>;
  /** Los que siguen sin resolver */
  openCount: Scalars['Int']['output'];
  /** Los que vencieron su plazo */
  overdueCount: Scalars['Int']['output'];
  /** Categoría que más se repite en el sitio */
  topCategory?: Maybe<MaintenanceCategory>;
  total: Scalars['Int']['output'];
};

/** Punto de ubicación con QR o NFC dentro del complejo */
export type MaintenanceLocationTag = {
  __typename?: 'MaintenanceLocationTag';
  amenity?: Maybe<Amenity>;
  amenityId?: Maybe<Scalars['String']['output']>;
  building?: Maybe<Building>;
  buildingId?: Maybe<Scalars['String']['output']>;
  /** Código impreso en el sticker */
  code: Scalars['String']['output'];
  complex?: Maybe<ResidentialComplex>;
  complexId: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  createdByUserId?: Maybe<Scalars['String']['output']>;
  defaultCategory?: Maybe<MaintenanceCategory>;
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  floor?: Maybe<Scalars['Int']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  kind: MaintenanceTagKind;
  lat?: Maybe<Scalars['Float']['output']>;
  lng?: Maybe<Scalars['Float']['output']>;
  /** Nombre visible del punto */
  name: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

/** Método con el que se fijó la ubicación del daño */
export type MaintenanceLocationType =
  | 'AMENITY'
  | 'GPS'
  | 'TAG'
  | 'TREE';

/** Punto del mapa de incidencias */
export type MaintenanceMapPinResponse = {
  __typename?: 'MaintenanceMapPinResponse';
  category: MaintenanceCategory;
  code: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  endorsementCount: Scalars['Int']['output'];
  gpsAccuracyMeters?: Maybe<Scalars['Int']['output']>;
  id: Scalars['ID']['output'];
  isOverdue: Scalars['Boolean']['output'];
  isPrecise: Scalars['Boolean']['output'];
  lat: Scalars['Float']['output'];
  lng: Scalars['Float']['output'];
  locationType: MaintenanceLocationType;
  priority: MaintenancePriority;
  status: MaintenanceTicketStatus;
  title: Scalars['String']['output'];
};

/** Prioridad de atención del ticket de mantenimiento */
export type MaintenancePriority =
  | 'CRITICAL'
  | 'HIGH'
  | 'LOW'
  | 'MEDIUM';

/** Opciones de ubicación para radicar un ticket */
export type MaintenanceReportOptionsResponse = {
  __typename?: 'MaintenanceReportOptionsResponse';
  amenities: Array<Amenity>;
  buildings: Array<Building>;
  /** Error máximo del GPS aceptado como ubicación confiable */
  gpsAccuracyMeters: Scalars['Int']['output'];
  residentReportingEnabled: Scalars['Boolean']['output'];
  tags: Array<MaintenanceLocationTag>;
};

/** Plazo de atención comprometido por categoría */
export type MaintenanceSlaConfig = {
  __typename?: 'MaintenanceSlaConfig';
  category: MaintenanceCategory;
  complex?: Maybe<ResidentialComplex>;
  complexId: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  priority: MaintenancePriority;
  /** Horas para dejarlo reparado */
  resolutionHours: Scalars['Int']['output'];
  /** Horas para asignar responsable */
  responseHours: Scalars['Int']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

/** Resumen de mantenimiento del complejo */
export type MaintenanceStatsResponse = {
  __typename?: 'MaintenanceStatsResponse';
  /** Calificación promedio */
  averageRating?: Maybe<Scalars['Float']['output']>;
  /** Horas promedio entre radicar y resolver */
  averageResolutionHours?: Maybe<Scalars['Float']['output']>;
  byCategory: Array<MaintenanceCategoryCount>;
  byStatus: Array<MaintenanceStatusCount>;
  openTickets: Scalars['Int']['output'];
  overdueTickets: Scalars['Int']['output'];
  ratedTickets: Scalars['Int']['output'];
  /** Porcentaje de resueltos dentro del plazo */
  slaComplianceRate?: Maybe<Scalars['Float']['output']>;
  /** Costo acumulado de las reparaciones cerradas */
  totalCost?: Maybe<Scalars['Float']['output']>;
  totalTickets: Scalars['Int']['output'];
};

export type MaintenanceStatusCount = {
  __typename?: 'MaintenanceStatusCount';
  count: Scalars['Int']['output'];
  status: MaintenanceTicketStatus;
};

/** Soporte físico del punto de ubicación */
export type MaintenanceTagKind =
  | 'BOTH'
  | 'NFC'
  | 'QR';

/** Ticket de mantenimiento en zonas comunes */
export type MaintenanceTicket = {
  __typename?: 'MaintenanceTicket';
  actualCost?: Maybe<Scalars['Float']['output']>;
  amenity?: Maybe<Amenity>;
  amenityId?: Maybe<Scalars['String']['output']>;
  assignedAt?: Maybe<Scalars['DateTime']['output']>;
  assignedByUserId?: Maybe<Scalars['String']['output']>;
  assignedUser?: Maybe<User>;
  /** Personal interno asignado */
  assignedUserId?: Maybe<Scalars['String']['output']>;
  assigneeType?: Maybe<MaintenanceAssigneeType>;
  building?: Maybe<Building>;
  buildingId?: Maybe<Scalars['String']['output']>;
  category: MaintenanceCategory;
  closedAt?: Maybe<Scalars['DateTime']['output']>;
  closedByUserId?: Maybe<Scalars['String']['output']>;
  closurePhotoHashes?: Maybe<Array<Scalars['String']['output']>>;
  /** Fotos de la reparación terminada (R2) */
  closurePhotoUrls?: Maybe<Array<Scalars['String']['output']>>;
  /** Número del ticket, consecutivo */
  code: Scalars['String']['output'];
  complex?: Maybe<ResidentialComplex>;
  complexId: Scalars['String']['output'];
  consecutive: Scalars['Int']['output'];
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  description: Scalars['String']['output'];
  /** Ticket original cuando este se marcó como duplicado */
  duplicateOfTicketId?: Maybe<Scalars['String']['output']>;
  endorsementCount: Scalars['Int']['output'];
  events?: Maybe<Array<MaintenanceTicketEvent>>;
  floor?: Maybe<Scalars['Int']['output']>;
  gpsAccuracyMeters?: Maybe<Scalars['Int']['output']>;
  id: Scalars['ID']['output'];
  lastReopenedAt?: Maybe<Scalars['DateTime']['output']>;
  lat?: Maybe<Scalars['Float']['output']>;
  lng?: Maybe<Scalars['Float']['output']>;
  locationTag?: Maybe<MaintenanceLocationTag>;
  locationTagId?: Maybe<Scalars['String']['output']>;
  /** Referencia escrita del sitio (junto al parqueadero 45) */
  locationText?: Maybe<Scalars['String']['output']>;
  locationType: MaintenanceLocationType;
  occurredAt: Scalars['DateTime']['output'];
  onHoldReason?: Maybe<Scalars['String']['output']>;
  photoHashes?: Maybe<Array<Scalars['String']['output']>>;
  /** Fotos del daño (R2) */
  photoUrls?: Maybe<Array<Scalars['String']['output']>>;
  priority: MaintenancePriority;
  ratedAt?: Maybe<Scalars['DateTime']['output']>;
  /** Calificación de 1 a 5 */
  rating?: Maybe<Scalars['Int']['output']>;
  ratingComment?: Maybe<Scalars['String']['output']>;
  rejectionReason?: Maybe<Scalars['String']['output']>;
  reopenCount: Scalars['Int']['output'];
  reportedByName?: Maybe<Scalars['String']['output']>;
  /** Rol de quien reportó, congelado al radicar */
  reportedByRole?: Maybe<Scalars['String']['output']>;
  reportedByUnit?: Maybe<Unit>;
  reportedByUnitId?: Maybe<Scalars['String']['output']>;
  reportedByUserId?: Maybe<Scalars['String']['output']>;
  resolutionNotes?: Maybe<Scalars['String']['output']>;
  resolvedAt?: Maybe<Scalars['DateTime']['output']>;
  resolvedByUserId?: Maybe<Scalars['String']['output']>;
  scheduledFor?: Maybe<Scalars['DateTime']['output']>;
  slaBreachedAt?: Maybe<Scalars['DateTime']['output']>;
  /** Vencimiento del SLA */
  slaDueAt?: Maybe<Scalars['DateTime']['output']>;
  slaHours?: Maybe<Scalars['Int']['output']>;
  startedAt?: Maybe<Scalars['DateTime']['output']>;
  status: MaintenanceTicketStatus;
  /** Resumen corto del daño */
  title: Scalars['String']['output'];
  triagedAt?: Maybe<Scalars['DateTime']['output']>;
  triagedByUserId?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  vendor?: Maybe<MaintenanceVendor>;
  /** Proveedor externo asignado */
  vendorId?: Maybe<Scalars['String']['output']>;
  videoHash?: Maybe<Scalars['String']['output']>;
  /** Video corto del daño (R2) */
  videoUrl?: Maybe<Scalars['String']['output']>;
  visibility: MaintenanceVisibility;
};

/** Anotación en la bitácora de un ticket */
export type MaintenanceTicketEvent = {
  __typename?: 'MaintenanceTicketEvent';
  author?: Maybe<User>;
  authorName?: Maybe<Scalars['String']['output']>;
  authorRole?: Maybe<Scalars['String']['output']>;
  authorUserId?: Maybe<Scalars['String']['output']>;
  complexId: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  fromStatus?: Maybe<MaintenanceTicketStatus>;
  id: Scalars['ID']['output'];
  imageHashes?: Maybe<Array<Scalars['String']['output']>>;
  /** Fotos de avance (R2) */
  imageUrls?: Maybe<Array<Scalars['String']['output']>>;
  isInternal: Scalars['Boolean']['output'];
  message?: Maybe<Scalars['String']['output']>;
  ticket?: Maybe<MaintenanceTicket>;
  ticketId: Scalars['String']['output'];
  toStatus?: Maybe<MaintenanceTicketStatus>;
  type: MaintenanceEventType;
};

/** Estado del ticket en el tablero de mantenimiento */
export type MaintenanceTicketStatus =
  | 'ASSIGNED'
  | 'CLOSED'
  | 'DUPLICATE'
  | 'IN_PROGRESS'
  | 'NEW'
  | 'ON_HOLD'
  | 'REJECTED'
  | 'RESOLVED'
  | 'TRIAGED';

/** Proveedor externo de mantenimiento */
export type MaintenanceVendor = {
  __typename?: 'MaintenanceVendor';
  complex?: Maybe<ResidentialComplex>;
  complexId: Scalars['String']['output'];
  contactName?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  createdByUserId?: Maybe<Scalars['String']['output']>;
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  /** NIT o cédula */
  legalId?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  phone?: Maybe<Scalars['String']['output']>;
  specialties?: Maybe<Array<MaintenanceCategory>>;
  updatedAt: Scalars['DateTime']['output'];
};

/** Alcance de lectura del ticket dentro del complejo */
export type MaintenanceVisibility =
  | 'PRIVATE'
  | 'PUBLIC';

/** Categoría de publicaciones del complejo */
export type MarketplaceCategory = {
  __typename?: 'MarketplaceCategory';
  complex?: Maybe<ResidentialComplex>;
  complexId: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  createdByUserId?: Maybe<Scalars['String']['output']>;
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  /** Ícono sugerido para la web y la app */
  icon?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  kind: MarketplaceCategoryKind;
  /** Nombre visible */
  name: Scalars['String']['output'];
  slug: Scalars['String']['output'];
  /** Orden en la vitrina */
  sortOrder: Scalars['Int']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

/** Vitrina a la que pertenece la categoría */
export type MarketplaceCategoryKind =
  /** Clasificados y comercio interno */
  | 'CLASSIFIED'
  /** Directorio de servicios */
  | 'SERVICE';

/** Canal por el que el publicador quiere recibir interesados */
export type MarketplaceContactPreference =
  /** Aviso dentro de la app, sin exponer el teléfono */
  | 'IN_APP'
  /** Llamada al teléfono del publicador */
  | 'PHONE'
  /** WhatsApp al teléfono del publicador */
  | 'WHATSAPP';

/** Estado de conservación del artículo */
export type MarketplaceItemCondition =
  /** Para repuestos o reparar */
  | 'FOR_PARTS'
  /** Como nuevo */
  | 'LIKE_NEW'
  /** Nuevo, sin usar */
  | 'NEW'
  /** Usado, en buen estado */
  | 'USED';

/** Publicación de clasificados del complejo */
export type MarketplaceListing = {
  __typename?: 'MarketplaceListing';
  acceptedTermsAt?: Maybe<Scalars['DateTime']['output']>;
  category?: Maybe<MarketplaceCategory>;
  /** Categoría de la vitrina */
  categoryId: Scalars['String']['output'];
  complex?: Maybe<ResidentialComplex>;
  /** Complejo (multi-tenant) */
  complexId: Scalars['String']['output'];
  /** Estado de conservación. Solo aplica a artículos */
  condition?: Maybe<MarketplaceItemCondition>;
  /** Cómo contactar al publicador */
  contact: ListingContactResponse;
  contactPreference: MarketplaceContactPreference;
  contactsCount: Scalars['Int']['output'];
  createdAt: Scalars['DateTime']['output'];
  currency: Scalars['String']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  description: Scalars['String']['output'];
  expiresAt?: Maybe<Scalars['DateTime']['output']>;
  expiryNotifiedAt?: Maybe<Scalars['DateTime']['output']>;
  favoritesCount: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  imageUrls: Array<Scalars['String']['output']>;
  moderatedAt?: Maybe<Scalars['DateTime']['output']>;
  moderatedByUserId?: Maybe<Scalars['String']['output']>;
  owner?: Maybe<User>;
  /** Usuario que publicó */
  ownerUserId: Scalars['String']['output'];
  pendingReportsCount: Scalars['Int']['output'];
  priceAmount?: Maybe<Scalars['Float']['output']>;
  priceType: MarketplacePriceType;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  /** Motivo del rechazo o del retiro */
  rejectionReason?: Maybe<Scalars['String']['output']>;
  renewedAt?: Maybe<Scalars['DateTime']['output']>;
  resident?: Maybe<Resident>;
  residentId?: Maybe<Scalars['String']['output']>;
  showPhone: Scalars['Boolean']['output'];
  soldAt?: Maybe<Scalars['DateTime']['output']>;
  status: MarketplaceListingStatus;
  title: Scalars['String']['output'];
  type: MarketplaceListingType;
  unit?: Maybe<Unit>;
  /** Unidad del publicador */
  unitId: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  updatedByUserId?: Maybe<Scalars['String']['output']>;
  /** Quien consulta ya registró interés */
  viewerHasContacted: Scalars['Boolean']['output'];
  /** Quien consulta la tiene guardada como favorita */
  viewerHasFavorited: Scalars['Boolean']['output'];
  /** La publicación es de quien consulta */
  viewerIsOwner: Scalars['Boolean']['output'];
  viewsCount: Scalars['Int']['output'];
};

/** Reporte de abuso sobre una publicación */
export type MarketplaceListingReport = {
  __typename?: 'MarketplaceListingReport';
  comment?: Maybe<Scalars['String']['output']>;
  complex?: Maybe<ResidentialComplex>;
  complexId: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  listing?: Maybe<MarketplaceListing>;
  listingId: Scalars['String']['output'];
  reason: MarketplaceReportReason;
  reporterUnitId?: Maybe<Scalars['String']['output']>;
  reporterUserId?: Maybe<Scalars['String']['output']>;
  resolutionNote?: Maybe<Scalars['String']['output']>;
  resolvedAt?: Maybe<Scalars['DateTime']['output']>;
  resolvedByUserId?: Maybe<Scalars['String']['output']>;
  status: MarketplaceReportStatus;
  updatedAt: Scalars['DateTime']['output'];
};

/** Estado de la publicación */
export type MarketplaceListingStatus =
  /** Borrador: solo la ve quien la escribió */
  | 'DRAFT'
  /** Venció la vigencia y nadie la renovó */
  | 'EXPIRED'
  /** Oculta temporalmente (por el dueño o por reportes) */
  | 'PAUSED'
  /** Esperando aprobación de la administración */
  | 'PENDING_REVIEW'
  /** Visible para el conjunto */
  | 'PUBLISHED'
  /** La administración la rechazó, con motivo */
  | 'REJECTED'
  /** Retirada definitivamente */
  | 'REMOVED'
  /** Ya se vendió o se entregó */
  | 'SOLD';

/** Naturaleza de la publicación del clasificado */
export type MarketplaceListingType =
  /** Se regala o se dona */
  | 'GIVEAWAY'
  /** Venta de un artículo */
  | 'PRODUCT'
  /** Arriendo o préstamo temporal */
  | 'RENTAL'
  /** Servicio ofrecido por un vecino */
  | 'SERVICE'
  /** Busco / necesito. El complejo puede apagarlo desde los ajustes */
  | 'WANTED';

/** Política de moderación de publicaciones */
export type MarketplaceModerationMode =
  /** Se publica de inmediato; se modera si alguien reporta */
  | 'AUTO'
  /** La administración aprueba antes de publicar */
  | 'PREVIA';

/** Forma en que se expresa el precio */
export type MarketplacePriceType =
  /** Permuta o intercambio */
  | 'EXCHANGE'
  /** Precio fijo */
  | 'FIXED'
  /** Gratis */
  | 'FREE'
  /** Precio negociable */
  | 'NEGOTIABLE'
  /** A convenir: se pregunta al publicador */
  | 'ON_REQUEST';

/** Motivo del reporte sobre una publicación */
export type MarketplaceReportReason =
  /** Ya se vendió y sigue publicada */
  | 'ALREADY_SOLD'
  /** Publicación repetida */
  | 'DUPLICATE'
  /** Contenido ofensivo o inapropiado */
  | 'OFFENSIVE'
  /** Otro motivo */
  | 'OTHER'
  /** Artículo o actividad prohibida por el reglamento */
  | 'PROHIBITED_ITEM'
  /** Estafa o engaño */
  | 'SCAM'
  /** Categoría equivocada */
  | 'WRONG_CATEGORY';

/** Estado de un reporte de publicación */
export type MarketplaceReportStatus =
  /** Procede: la publicación se retira */
  | 'ACCEPTED'
  /** No procede: la publicación vuelve */
  | 'DISMISSED'
  /** Sin revisar */
  | 'PENDING';

/** Ajustes del módulo de clasificados del complejo */
export type MarketplaceSettings = {
  __typename?: 'MarketplaceSettings';
  allowPhoneContact: Scalars['Boolean']['output'];
  allowWantedListings: Scalars['Boolean']['output'];
  /** Reportes que pausan el aviso solo */
  autoPauseAfterReports: Scalars['Int']['output'];
  complex?: Maybe<ResidentialComplex>;
  complexId: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  /** Días que dura publicado un aviso */
  listingDurationDays: Scalars['Int']['output'];
  /** Avisos activos que puede tener una unidad */
  maxActiveListingsPerUnit: Scalars['Int']['output'];
  /** Fotos por publicación */
  maxImagesPerListing: Scalars['Int']['output'];
  moderationMode: MarketplaceModerationMode;
  termsText?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  updatedByUserId?: Maybe<Scalars['String']['output']>;
};

/** Resumen del módulo de clasificados */
export type MarketplaceStatsResponse = {
  __typename?: 'MarketplaceStatsResponse';
  /** Vencen en los próximos 7 días */
  expiringSoon: Scalars['Int']['output'];
  /** Pausadas, por su dueño o por reportes */
  paused: Scalars['Int']['output'];
  /** Reportes sin resolver */
  pendingReports: Scalars['Int']['output'];
  /** Esperando aprobación */
  pendingReview: Scalars['Int']['output'];
  /** Publicadas y vigentes */
  published: Scalars['Int']['output'];
};

export type MeResponse = ResidentialComplex | User;

/** Canal por el que se envió el mensaje */
export type MessageChannel =
  | 'SMS'
  | 'WHATSAPP';

/** Tipo/categoría del mensaje enviado */
export type MessageType =
  | 'ALERTA'
  | 'COMUNICADO'
  | 'INFORMATIVO'
  | 'RECORDATORIO'
  | 'URGENTE';

export type ModerateListingInput = {
  listingId: Scalars['String']['input'];
  reason?: InputMaybe<Scalars['String']['input']>;
};

export type MoraApplicationResult = {
  __typename?: 'MoraApplicationResult';
  applied: Scalars['Int']['output'];
  period: Scalars['String']['output'];
  skipped: Scalars['Int']['output'];
  totalMoraAmount: Scalars['Float']['output'];
};

export type MoveOutResidentInput = {
  /** Fecha de mudanza (YYYY-MM-DD) */
  moveOutDate?: InputMaybe<Scalars['String']['input']>;
  /** Razón de la salida */
  moveOutReason?: InputMaybe<Scalars['String']['input']>;
  /** ID del registro de residente */
  residentId: Scalars['String']['input'];
};

export type MoveResidentsToUnitInput = {
  newMainResidentId?: InputMaybe<Scalars['String']['input']>;
  newUnitId: Scalars['String']['input'];
  residentIds: Array<Scalars['String']['input']>;
};

export type MoveSubtreeResponse = {
  __typename?: 'MoveSubtreeResponse';
  /** Total number of roles affected by this move */
  affectedRolesCount: Scalars['Int']['output'];
  /** Number of descendant roles that were also moved */
  descendantsCount: Scalars['Int']['output'];
  /** Success message */
  message: Scalars['String']['output'];
  /** ID of the root role that was moved */
  movedRoleId: Scalars['String']['output'];
  /** Name of the root role that was moved */
  movedRoleName: Scalars['String']['output'];
  /** New parent role information */
  newParent?: Maybe<SimpleRoleResponse>;
};

export type Mutation = {
  __typename?: 'Mutation';
  acknowledgePanicAlert: Notification;
  addMaintenanceComment: MaintenanceTicket;
  addPetIncidentStatement: PetIncident;
  /** Permite al administrador del complejo (o SUPER_ADMIN) restablecer directamente la contraseña de un miembro de su personal (SECURITY_ROL, SUPERVISOR_ROL, ACCOUNTANT_ROL). Uso: el empleado olvidó su contraseña y no tiene forma de solicitar el reset por email/OTP. */
  adminResetUserPassword: SetPasswordResponse;
  applyMoraAllPeriods: MoraApplicationResult;
  applyMoraToPeriod: MoraApplicationResult;
  applyPrepaidBalances: PrepaidApplicationResult;
  applyWalletToCharge: ApplyWalletResult;
  /** Aprueba la solicitud de acceso de un supervisor. Crea automáticamente la asignación UserComplexAssignment (ACTIVE). El supervisor podrá hacer check-in inmediatamente después. */
  approveAccessRequest: SupervisorAccessRequest;
  approveAmenityBooking: AmenityBooking;
  /** Autoriza el ingreso. Antes de llamarla, la interfaz DEBE hacer que el residente compare el código de esta pantalla con el del dispositivo que pide entrar. */
  approveDeviceApproval: Scalars['Boolean']['output'];
  approveListing: MarketplaceListing;
  approvePet: Pet;
  approveResident: Resident;
  approveVisitEntry: Visit;
  assignMaintenanceTicket: MaintenanceTicket;
  assignMultipleChildren: AssignChildrenResponse;
  /** Asigna un rol a un usuario */
  assignRoleToUser: AssignedUserRolResponse;
  blacklistVisitor: Visitor;
  bulkMoveOutResidents: Array<Resident>;
  bulkNotificationAction: BulkNotificationActionResult;
  cancelAmenityBooking: AmenityBooking;
  cancelChargeEmission: ChargeEmission;
  cancelVisit: Visit;
  cancelVisitorVehicleEntry: VisitorVehicle;
  /** Un voto por unidad (asamblea) o por consejero */
  castVote: VotingQuestion;
  causeRecurringCharges: RecurringCausationResult;
  causeRecurringChargesRange: RecurringCausationResult;
  changeComplexStatus: ResidentialComplex;
  changeMaintenanceTicketStatus: MaintenanceTicket;
  /** Cambiar la contraseña del usuario autenticado */
  changePassword: ChangePasswordResponse;
  changeRoleParent: ChangeParentResponse;
  chargeAmenityDamage: AmenityBooking;
  checkInAmenityBooking: AmenityBooking;
  checkOutAmenityBooking: AmenityBooking;
  closeMaintenanceTicket: MaintenanceTicket;
  closeVotingQuestion: VotingQuestion;
  configureRotation: ParkingRotationConfig;
  confirmChargeEmission: ChargeEmission;
  confirmPackageDelivery: Package;
  /** Crea un usuario administrativo (COMPLIANCE_OFFICER, COMPLEX, ACCOUNTANT, SUPERVISOR). Requiere rol SUPER_ADMIN_ROL. */
  createAdminUser: User;
  createAmenity: Amenity;
  createAmenityBlackout: AmenityBlackout;
  createAmenityBooking: AmenityBooking;
  createBuilding: Building;
  createChargeCategory: ChargeCategory;
  createChargeEmission: ChargeEmission;
  createComplex: ResidentialComplex;
  createDirectCharges: CreateDirectChargesResponse;
  createExpenseVoucher: AccountingHeader;
  createFeeConfig: FeeConfig;
  /** Crea un documento legal. Solo SUPER_ADMIN. */
  createLegalDocument: LegalDocument;
  createMaintenanceLocationTag: MaintenanceLocationTag;
  createMaintenanceVendor: MaintenanceVendor;
  createPermission: CreatePermissionResponse;
  /** Radica un PQRF */
  createPqrf: Pqrf;
  createPucAccount: PucAccount;
  createRecurringCharge: RecurringCharge;
  createResident: Resident;
  createRole: SimpleRoleResponse;
  createSpecialNumber: SpecialNumber;
  /** Crea personal del complejo: guardia (SECURITY_ROL), supervisor (SUPERVISOR_ROL) o contador (ACCOUNTANT_ROL). El campo `role` determina el tipo. Requiere rol COMPLEX_ROL o SUPER_ADMIN_ROL. */
  createStaffMember: CreateStaffMemberResponse;
  createUnit: Unit;
  createVotingMeeting: VotingMeeting;
  createVotingQuestion: VotingQuestion;
  createWalletCredit: WalletEntryObject;
  deactivateMaintenanceLocationTag: MaintenanceLocationTag;
  deactivateMaintenanceVendor: MaintenanceVendor;
  deactivateMobileToken: PushSubscriptionResult;
  deleteAmenity: Scalars['Boolean']['output'];
  deleteAmenityBlackout: Scalars['Boolean']['output'];
  deleteAmenityScheduleException: Scalars['Boolean']['output'];
  deleteChargeCategory: Scalars['Boolean']['output'];
  deleteFeeConfig: Scalars['Boolean']['output'];
  /** Elimina un documento legal. Solo SUPER_ADMIN. */
  deleteLegalDocument: Scalars['Boolean']['output'];
  deleteNote: Note;
  deleteNotification: Scalars['Boolean']['output'];
  deletePucAccount: Scalars['Boolean']['output'];
  deleteRecurringCharge: Scalars['Boolean']['output'];
  /** Elimina (soft delete) un usuario del sistema */
  deleteUser: User;
  deleteVotingMeeting: Scalars['Boolean']['output'];
  deleteVotingQuestion: Scalars['Boolean']['output'];
  /** Rechaza el ingreso. Es terminal: el solicitante debe pedir una nueva autorización. */
  denyDeviceApproval: Scalars['Boolean']['output'];
  denyVisitEntry: Visit;
  dismissPetIncident: PetIncident;
  endorseMaintenanceTicket: MaintenanceTicket;
  executeNotificationAction: NotificationEntitySnapshot;
  executeRotation: RotationStatusResponse;
  generateCharges: GenerateChargesResponse;
  /** Genera un token QR de un solo uso (72 h de vigencia) para que un usuario inicie sesión sin contraseña. Solo accesible por SUPER_ADMIN. */
  generateQrLoginToken: QrLoginTokenResponse;
  logCall: CallLog;
  /** Inicia sesión como residente usando número de identidad y código de sistema. Exclusivo para RESIDENT_ROL. */
  loginResident: AuthResponse;
  /** Inicia sesión con la clave de acceso (header x-device-id). Desde un equipo ya vinculado basta la clave; desde uno nuevo hay que enviar además `identity`, y el ingreso vincula el equipo y avisa por push a los demás. Exclusivo para RESIDENT_ROL. No envía ningún mensaje de WhatsApp. */
  loginWithAccessCode: AuthResponse;
  /** Inicia sesión con email y contraseña. Disponible para: SUPER_ADMIN_ROL, COMPILANCE_OFFICER_ROL, COMPLEX_ROL, ACCOUNTANT_ROL */
  loginWithEmail: AuthResponse;
  /** Inicia sesión con email y código de sistema. Disponible para: SUPERVISOR_ROL, SECURITY_ROL, RESIDENT_ROL */
  loginWithIdentityNum: AuthResponse;
  /** Cierra la sesión actual e invalida los tokens. */
  logout: Scalars['Boolean']['output'];
  markAllNotificationsAsRead: Scalars['Int']['output'];
  markListingAsSold: MarketplaceListing;
  markMaintenanceTicketDuplicate: MaintenanceTicket;
  markNotificationAsRead: Notification;
  markPackageAsLost: Package;
  markPackageAsNotified: Package;
  markPackageAsReadyForPickup: Package;
  moveOutResident: Resident;
  moveResidentsToUnit: Array<Resident>;
  moveRoleSubtree: MoveSubtreeResponse;
  /** Marca el radicado como abierto por quien lo atiende */
  openPqrf: Pqrf;
  openVotingQuestion: VotingQuestion;
  pauseListing: MarketplaceListing;
  rateMaintenanceTicket: MaintenanceTicket;
  reactivatePet: Pet;
  reactivateResident: Resident;
  /** Reactiva un usuario suspendido */
  reactivateUser: User;
  reactivateVehicle: Vehicle;
  /** Canjea una solicitud APPROVED por los tokens de sesión. Un solo uso, y solo desde el dispositivo donde se inició el flujo. */
  redeemDeviceApproval: AuthResponse;
  /** Canjea el token QR de un solo uso validando el PIN (últimos 4 dígitos del NIT del complejo, sin dígito de verificación). No requiere autenticación previa. */
  redeemQrToken: AuthResponse;
  /** Canjea un challenge CONFIRMED por los tokens de sesión. Un solo uso, y solo desde el dispositivo donde se inició el flujo. */
  redeemWhatsAppLoginChallenge: AuthResponse;
  /** Renueva el access token usando el refresh token. Implementa rotación de tokens. */
  refreshToken: AuthResponse;
  registerBulkPayment: RegisterBulkPaymentResponse;
  registerDirectIncome: DirectIncome;
  registerExpense: ComplexExpense;
  registerListingInterest: MarketplaceListing;
  registerPackage: Package;
  registerPayment: Payment;
  /** Registra un nuevo residente en el complejo. Requiere rol COMPLEX_ROL. El residente recibirá su código de acceso. */
  registerResident: User;
  /** Auto-registro público para supervisores. La cuenta queda en PENDING_VERIFICATION hasta verificar el correo. */
  registerSupervisor: RegisterSupervisorResponse;
  registerVehicle: Vehicle;
  registerVisitorEntry: Visit;
  registerVisitorExit: Visit;
  registerVisitorVehicleEntry: VisitorVehicle;
  registerVisitorVehicleExit: VisitorVehicle;
  registerWalkIn: Visit;
  /** Rechaza la solicitud de acceso de un supervisor con un motivo opcional. */
  rejectAccessRequest: SupervisorAccessRequest;
  rejectAmenityBooking: AmenityBooking;
  rejectListing: MarketplaceListing;
  rejectMaintenanceTicket: MaintenanceTicket;
  rejectPet: Pet;
  rejectResident: Resident;
  removeBuilding: Scalars['Boolean']['output'];
  removeComplex: Scalars['Boolean']['output'];
  removeListing: Scalars['Boolean']['output'];
  removeMaintenanceSla: Scalars['Boolean']['output'];
  removeMarketplaceCategory: Scalars['Boolean']['output'];
  /** Soft delete a permission by setting status to false */
  removePermission: RemovePermissionResponse;
  removePet: Scalars['Boolean']['output'];
  removeResident: Scalars['Boolean']['output'];
  /** Soft delete a role by setting status to false */
  removeRole: RemoveRoleResponse;
  removeSpecialNumber: Scalars['Boolean']['output'];
  /** Elimina a un miembro del personal del complejo. Si el usuario tiene residencia activa en algún complejo, solo se le quita el rol de personal. Si no tiene ninguna residencia activa, se elimina del sistema. Requiere rol COMPLEX_ROL o SUPER_ADMIN_ROL. */
  removeStaffMember: RemoveStaffMemberResponse;
  removeUnit: Scalars['Boolean']['output'];
  removeVehicle: Scalars['Boolean']['output'];
  removeVisitorFromBlacklist: Visitor;
  renewListing: MarketplaceListing;
  reopenMaintenanceTicket: MaintenanceTicket;
  /** Reordena los números especiales globales. Solo SUPER_ADMIN. */
  reorderGlobalSpecialNumbers: Array<SpecialNumber>;
  reorderSpecialNumbers: Array<SpecialNumber>;
  reportDevicePermissions: DevicePushHealthStatus;
  reportListing: MarketplaceListingReport;
  /** El supervisor solicita acceso a un complejo al que no está asignado. El administrador del complejo recibe la solicitud y puede aprobarla o rechazarla remotamente. */
  requestComplexAccess: SupervisorAccessRequest;
  /** Pide autorización de ingreso y avisa por push a los dispositivos vinculados del residente. No consume mensajes de WhatsApp. Responde igual exista o no la identidad, y no revela cuántos dispositivos se notificaron. */
  requestDeviceApproval: DeviceApprovalResponse;
  /** Solicita un código OTP al número de celular. Exclusivo para residentes (RESIDENT_ROL). El código se envía por SMS y tiene validez de 5 minutos. */
  requestOtp: OtpRequestResponse;
  /** Solicita restablecimiento de contraseña por email. Respuesta genérica para no revelar si el email existe. */
  requestPasswordReset: RequestPasswordResetResponse;
  requestSecurityCall: RequestSecurityCallResult;
  /** Genera un link wa.me con un código que el residente debe ENVIAR desde su WhatsApp. No consume mensajes de plantilla: los mensajes entrantes no tienen costo. Responde igual exista o no la identidad, para no revelar qué documentos están registrados. */
  requestWhatsAppLoginChallenge: WhatsAppLoginChallengeResponse;
  /** Reenvía el código de sistema del residente (RES-xxxxx) por WhatsApp al teléfono registrado. Respuesta genérica: no revela si la identidad existe. Rate limit por identidad e IP. */
  resendResidentSystemCode: OtpRequestResponse;
  /** Reenvía el enlace de verificación al correo ya registrado. Sujeto a un enfriamiento del servidor; responde igual para un registro inexistente o ya verificado, para no revelar cuál es cuál. */
  resendSupervisorVerification: RegisterSupervisorResponse;
  /** Establece nueva contraseña usando el token recibido por email. Token de un solo uso, válido 1 hora. */
  resetPassword: SetPasswordResponse;
  resolveListingReport: MarketplaceListingReport;
  resolvePanicAlert: PanicAlert;
  /** Marca el radicado como resuelto por quien lo atiende */
  resolvePqrf: Pqrf;
  restoreComplex: ResidentialComplex;
  /** Restore a soft deleted permission by setting status to true */
  restorePermission: RestorePermissionResponse;
  /** Restore a soft deleted role by setting status to true */
  restoreRole: RestoreRoleResponse;
  /** Restaura un usuario previamente eliminado (soft delete), dejándolo activo */
  restoreUser: User;
  resumeListing: MarketplaceListing;
  returnPackage: Package;
  reverseDirectIncome: DirectIncome;
  reverseExpense: ComplexExpense;
  reversePayment: Payment;
  /** Revierte una acción registrada en el historial a su estado anterior. Solo disponible para SUPER_ADMIN_ROL. Una acción solo puede revertirse una vez. */
  revertAudit: RevertAuditResponse;
  reviewSignedDpa: ResidentialComplex;
  /** Desvincula todos los equipos del residente salvo el actual y cierra sus sesiones. Pensado para el celular perdido: se entra desde el equipo nuevo y se corta el acceso del anterior. Devuelve cuántos se revocaron. */
  revokeMyOtherDevices: Scalars['Float']['output'];
  /** Desvincula un dispositivo (ej. celular perdido) y cierra su sesión. Las sesiones de los demás dispositivos del residente no se ven afectadas. */
  revokeResidentDevice: Scalars['Boolean']['output'];
  runPushHealthCheck: PushHealthCheckResult;
  sanctionPetIncident: PetIncident;
  saveMobileToken: PushSubscriptionResult;
  savePushSubscription: PushSubscriptionResult;
  saveSentMessage: SentMessage;
  scheduleVisit: Visit;
  seedPucAccounts: Array<PucAccount>;
  sendNotification: SendNotificationResult;
  setAmenitySchedules: Amenity;
  /** Establece la contraseña inicial del usuario autenticado. Diseñado para el flujo post-login por QR donde el usuario aún no tiene contraseña propia. */
  setInitialPassword: SetPasswordResponse;
  setNotificationStarred: Notification;
  setParkingRate: VisitorParkingConfig;
  /** Fija o cambia la clave de acceso del residente autenticado y vincula el dispositivo actual (header x-device-id). La clave es una sola por cuenta y sirve en todos sus equipos vinculados. Cambiarla exige enviar `currentCode`, salvo que el ingreso reciente haya sido por WhatsApp entrante o por aprobación desde otro equipo, que es el camino del olvido. */
  setResidentAccessCode: ResidentDevice;
  setVotingEnabled: Scalars['Boolean']['output'];
  submitListing: MarketplaceListing;
  /** Registra el check-in del supervisor en un complejo residencial. Requiere asignación activa al complejo y validación GPS. Solo puede existir una visita ACTIVA por complejo a la vez. */
  supervisorCheckIn: SupervisorVisit;
  /** Registra el check-out del supervisor. Cierra la visita activa (status: CLOSED). */
  supervisorCheckOut: SupervisorVisit;
  suspendPet: Pet;
  suspendResident: Resident;
  /** Suspende la cuenta de un usuario */
  suspendUser: User;
  suspendVehicle: Vehicle;
  toggleBuildingStatus: Building;
  toggleFeeConfig: FeeConfig;
  /** Devuelve true si quedó guardada como favorita */
  toggleListingFavorite: Scalars['Boolean']['output'];
  toggleParkingRate: VisitorParkingConfig;
  togglePucAccount: PucAccount;
  triageMaintenanceTicket: MaintenanceTicket;
  triggerPanicAlert: TriggerPanicAlertResult;
  undoMoveOutResident: Resident;
  updateAmenity: Amenity;
  updateBuilding: Building;
  updateChargeCategory: ChargeCategory;
  updateComplex: ResidentialComplex;
  updateComplexModules: ResidentialComplex;
  updateFeeConfig: FeeConfig;
  /** Actualiza metadatos/contenido/publicación de un documento legal. Solo SUPER_ADMIN. */
  updateLegalDocument: LegalDocument;
  updateListing: MarketplaceListing;
  updateMaintenanceLocationTag: MaintenanceLocationTag;
  updateMaintenanceVendor: MaintenanceVendor;
  updateMarketplaceSettings: MarketplaceSettings;
  /** Update an existing permission */
  updatePermission: UpdatePermissionResponse;
  updatePet: Pet;
  updatePqrfCouncilResolvers: Array<PqrfCouncilMember>;
  updatePucAccount: PucAccount;
  updateRecurringCharge: RecurringCharge;
  updateResident: Resident;
  updateRole: Role;
  updateSpecialNumber: SpecialNumber;
  updateUnit: Unit;
  updateUser: User;
  /** Edita el tipo y número de documento de identidad de un usuario */
  updateUserIdentity: User;
  updateVehicle: Vehicle;
  updateVisitorParkingConfig: VisitorParkingConfig;
  updateVotingCouncilVoiceOnly: Array<VotingCouncilMember>;
  updateVotingQuestion: VotingQuestion;
  uploadSignedDpa: ResidentialComplex;
  upsertAmenityScheduleException: AmenityScheduleException;
  upsertCoefficientWeighting: CoefficientWeighting;
  upsertComplexFinanceConfig: ComplexFinanceConfig;
  upsertMaintenanceSla: MaintenanceSlaConfig;
  upsertMarketplaceCategory: MarketplaceCategory;
  /** Asigna un rol a un usuario */
  userHasRole: AssignedUserRolResponse;
  validatePetIncident: PetIncident;
  validateQrAccess: QrValidationResponse;
  /** Verifica el código OTP del residente y devuelve los tokens JWT de acceso. */
  verifyOtp: AuthResponse;
  /** Verifica el correo del supervisor con el token enviado por email. Activa la cuenta y devuelve tokens JWT. */
  verifySupervisorEmail: AuthResponse;
  waiveCharge: FeeCharge;
};


export type MutationAcknowledgePanicAlertArgs = {
  notificationId: Scalars['String']['input'];
};


export type MutationAddMaintenanceCommentArgs = {
  input: AddMaintenanceCommentInput;
};


export type MutationAddPetIncidentStatementArgs = {
  input: CreatePetIncidentStatementInput;
};


export type MutationAdminResetUserPasswordArgs = {
  input: AdminResetUserPasswordInput;
};


export type MutationApplyMoraAllPeriodsArgs = {
  complexId: Scalars['String']['input'];
};


export type MutationApplyMoraToPeriodArgs = {
  input: ApplyMoraInput;
};


export type MutationApplyPrepaidBalancesArgs = {
  input: ProcessPrepaidBalancesInput;
};


export type MutationApplyWalletToChargeArgs = {
  input: ApplyWalletToChargeInput;
};


export type MutationApproveAccessRequestArgs = {
  requestId: Scalars['String']['input'];
};


export type MutationApproveAmenityBookingArgs = {
  bookingId: Scalars['String']['input'];
};


export type MutationApproveDeviceApprovalArgs = {
  approvalId: Scalars['ID']['input'];
};


export type MutationApproveListingArgs = {
  input: ModerateListingInput;
};


export type MutationApprovePetArgs = {
  input: ApprovePetInput;
};


export type MutationApproveResidentArgs = {
  input: ApproveResidentInput;
};


export type MutationApproveVisitEntryArgs = {
  visitId: Scalars['String']['input'];
};


export type MutationAssignMaintenanceTicketArgs = {
  input: AssignMaintenanceTicketInput;
};


export type MutationAssignMultipleChildrenArgs = {
  childrenIds: Array<Scalars['String']['input']>;
  parentId: Scalars['String']['input'];
};


export type MutationAssignRoleToUserArgs = {
  roleName: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};


export type MutationBlacklistVisitorArgs = {
  input: BlacklistVisitorInput;
};


export type MutationBulkMoveOutResidentsArgs = {
  input: BulkMoveOutResidentsInput;
};


export type MutationBulkNotificationActionArgs = {
  input: BulkNotificationActionInput;
};


export type MutationCancelAmenityBookingArgs = {
  input: CancelAmenityBookingInput;
};


export type MutationCancelChargeEmissionArgs = {
  emissionId: Scalars['String']['input'];
  reason?: InputMaybe<Scalars['String']['input']>;
};


export type MutationCancelVisitArgs = {
  visitId: Scalars['String']['input'];
};


export type MutationCancelVisitorVehicleEntryArgs = {
  cancellationReason: Scalars['String']['input'];
  visitorVehicleId: Scalars['String']['input'];
};


export type MutationCastVoteArgs = {
  optionId: Scalars['String']['input'];
  questionId: Scalars['String']['input'];
};


export type MutationCauseRecurringChargesArgs = {
  complexId: Scalars['String']['input'];
  period: Scalars['String']['input'];
};


export type MutationCauseRecurringChargesRangeArgs = {
  applyMora?: InputMaybe<Scalars['Boolean']['input']>;
  complexId: Scalars['String']['input'];
  fromPeriod: Scalars['String']['input'];
  toPeriod: Scalars['String']['input'];
};


export type MutationChangeComplexStatusArgs = {
  id: Scalars['String']['input'];
  status: ComplexStatus;
};


export type MutationChangeMaintenanceTicketStatusArgs = {
  input: ChangeMaintenanceStatusInput;
};


export type MutationChangePasswordArgs = {
  input: ChangePasswordInput;
};


export type MutationChangeRoleParentArgs = {
  newParentId?: InputMaybe<Scalars['String']['input']>;
  roleId: Scalars['String']['input'];
};


export type MutationChargeAmenityDamageArgs = {
  input: ChargeAmenityDamageInput;
};


export type MutationCheckInAmenityBookingArgs = {
  accessCode: Scalars['String']['input'];
  complexId: Scalars['String']['input'];
};


export type MutationCheckOutAmenityBookingArgs = {
  bookingId: Scalars['String']['input'];
};


export type MutationCloseMaintenanceTicketArgs = {
  ticketId: Scalars['String']['input'];
};


export type MutationCloseVotingQuestionArgs = {
  questionId: Scalars['String']['input'];
};


export type MutationConfigureRotationArgs = {
  input: ConfigureRotationInput;
};


export type MutationConfirmChargeEmissionArgs = {
  emissionId: Scalars['String']['input'];
};


export type MutationConfirmPackageDeliveryArgs = {
  input: ConfirmDeliveryInput;
};


export type MutationCreateAdminUserArgs = {
  input: CreateAdminUserInput;
};


export type MutationCreateAmenityArgs = {
  input: CreateAmenityInput;
};


export type MutationCreateAmenityBlackoutArgs = {
  input: CreateAmenityBlackoutInput;
};


export type MutationCreateAmenityBookingArgs = {
  input: CreateAmenityBookingInput;
};


export type MutationCreateBuildingArgs = {
  input: CreateBuildingInput;
};


export type MutationCreateChargeCategoryArgs = {
  input: CreateChargeCategoryInput;
};


export type MutationCreateChargeEmissionArgs = {
  input: CreateChargeEmissionInput;
};


export type MutationCreateComplexArgs = {
  input: CreateComplexInput;
};


export type MutationCreateDirectChargesArgs = {
  input: CreateDirectChargesInput;
};


export type MutationCreateExpenseVoucherArgs = {
  input: CreateExpenseInput;
};


export type MutationCreateFeeConfigArgs = {
  input: CreateFeeConfigInput;
};


export type MutationCreateLegalDocumentArgs = {
  input: CreateLegalDocumentInput;
};


export type MutationCreateMaintenanceLocationTagArgs = {
  input: CreateMaintenanceLocationTagInput;
};


export type MutationCreateMaintenanceVendorArgs = {
  input: CreateMaintenanceVendorInput;
};


export type MutationCreatePermissionArgs = {
  input: CreatePermissionInput;
};


export type MutationCreatePqrfArgs = {
  input: CreatePqrfInput;
};


export type MutationCreatePucAccountArgs = {
  input: CreatePucAccountInput;
};


export type MutationCreateRecurringChargeArgs = {
  input: CreateRecurringChargeInput;
};


export type MutationCreateResidentArgs = {
  input: CreateResidentInput;
};


export type MutationCreateRoleArgs = {
  input: CreateRoleInput;
};


export type MutationCreateSpecialNumberArgs = {
  input: CreateSpecialNumberInput;
};


export type MutationCreateStaffMemberArgs = {
  input: CreateStaffMemberInput;
};


export type MutationCreateUnitArgs = {
  input: CreateUnitInput;
};


export type MutationCreateVotingMeetingArgs = {
  input: CreateVotingMeetingInput;
};


export type MutationCreateVotingQuestionArgs = {
  input: CreateVotingQuestionInput;
};


export type MutationCreateWalletCreditArgs = {
  input: CreateWalletCreditInput;
};


export type MutationDeactivateMaintenanceLocationTagArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeactivateMaintenanceVendorArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeactivateMobileTokenArgs = {
  deviceToken: Scalars['String']['input'];
};


export type MutationDeleteAmenityArgs = {
  amenityId: Scalars['String']['input'];
};


export type MutationDeleteAmenityBlackoutArgs = {
  blackoutId: Scalars['String']['input'];
};


export type MutationDeleteAmenityScheduleExceptionArgs = {
  exceptionId: Scalars['String']['input'];
};


export type MutationDeleteChargeCategoryArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteFeeConfigArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteLegalDocumentArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteNoteArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteNotificationArgs = {
  notificationId: Scalars['String']['input'];
};


export type MutationDeletePucAccountArgs = {
  complexId: Scalars['String']['input'];
  id: Scalars['String']['input'];
};


export type MutationDeleteRecurringChargeArgs = {
  complexId: Scalars['String']['input'];
  id: Scalars['String']['input'];
};


export type MutationDeleteUserArgs = {
  userId: Scalars['String']['input'];
};


export type MutationDeleteVotingMeetingArgs = {
  meetingId: Scalars['String']['input'];
};


export type MutationDeleteVotingQuestionArgs = {
  questionId: Scalars['String']['input'];
};


export type MutationDenyDeviceApprovalArgs = {
  approvalId: Scalars['ID']['input'];
};


export type MutationDenyVisitEntryArgs = {
  reason: Scalars['String']['input'];
  visitId: Scalars['String']['input'];
};


export type MutationDismissPetIncidentArgs = {
  incidentId: Scalars['String']['input'];
  reason: Scalars['String']['input'];
};


export type MutationEndorseMaintenanceTicketArgs = {
  comment?: InputMaybe<Scalars['String']['input']>;
  ticketId: Scalars['String']['input'];
};


export type MutationExecuteNotificationActionArgs = {
  input: ExecuteNotificationActionInput;
};


export type MutationExecuteRotationArgs = {
  complexId: Scalars['String']['input'];
};


export type MutationGenerateChargesArgs = {
  input: GenerateChargesInput;
};


export type MutationGenerateQrLoginTokenArgs = {
  complexId: Scalars['String']['input'];
};


export type MutationLogCallArgs = {
  input: LogCallInput;
};


export type MutationLoginResidentArgs = {
  input: LoginResidentInput;
};


export type MutationLoginWithAccessCodeArgs = {
  input: LoginAccessCodeInput;
};


export type MutationLoginWithEmailArgs = {
  input: LoginEmailInput;
};


export type MutationLoginWithIdentityNumArgs = {
  input: LoginSystemCodeInput;
};


export type MutationMarkAllNotificationsAsReadArgs = {
  complexId?: InputMaybe<Scalars['String']['input']>;
};


export type MutationMarkListingAsSoldArgs = {
  listingId: Scalars['String']['input'];
};


export type MutationMarkMaintenanceTicketDuplicateArgs = {
  originalTicketId: Scalars['String']['input'];
  ticketId: Scalars['String']['input'];
};


export type MutationMarkNotificationAsReadArgs = {
  notificationId: Scalars['String']['input'];
};


export type MutationMarkPackageAsLostArgs = {
  packageId: Scalars['String']['input'];
  reason: Scalars['String']['input'];
};


export type MutationMarkPackageAsNotifiedArgs = {
  packageId: Scalars['String']['input'];
};


export type MutationMarkPackageAsReadyForPickupArgs = {
  packageId: Scalars['String']['input'];
};


export type MutationMoveOutResidentArgs = {
  input: MoveOutResidentInput;
};


export type MutationMoveResidentsToUnitArgs = {
  input: MoveResidentsToUnitInput;
};


export type MutationMoveRoleSubtreeArgs = {
  newParentId?: InputMaybe<Scalars['String']['input']>;
  roleId: Scalars['String']['input'];
};


export type MutationOpenPqrfArgs = {
  pqrfId: Scalars['String']['input'];
};


export type MutationOpenVotingQuestionArgs = {
  questionId: Scalars['String']['input'];
};


export type MutationPauseListingArgs = {
  listingId: Scalars['String']['input'];
};


export type MutationRateMaintenanceTicketArgs = {
  input: RateMaintenanceTicketInput;
};


export type MutationReactivatePetArgs = {
  petId: Scalars['String']['input'];
};


export type MutationReactivateResidentArgs = {
  residentId: Scalars['String']['input'];
};


export type MutationReactivateUserArgs = {
  userId: Scalars['String']['input'];
};


export type MutationReactivateVehicleArgs = {
  vehicleId: Scalars['String']['input'];
};


export type MutationRedeemDeviceApprovalArgs = {
  accessCode?: InputMaybe<Scalars['String']['input']>;
  challengeId: Scalars['ID']['input'];
};


export type MutationRedeemQrTokenArgs = {
  pin: Scalars['String']['input'];
  token: Scalars['String']['input'];
};


export type MutationRedeemWhatsAppLoginChallengeArgs = {
  accessCode?: InputMaybe<Scalars['String']['input']>;
  challengeId: Scalars['ID']['input'];
};


export type MutationRefreshTokenArgs = {
  refreshToken: Scalars['String']['input'];
};


export type MutationRegisterBulkPaymentArgs = {
  input: RegisterBulkPaymentInput;
};


export type MutationRegisterDirectIncomeArgs = {
  input: RegisterDirectIncomeInput;
};


export type MutationRegisterExpenseArgs = {
  input: RegisterExpenseInput;
};


export type MutationRegisterListingInterestArgs = {
  input: RegisterListingInterestInput;
};


export type MutationRegisterPackageArgs = {
  input: RegisterPackageInput;
};


export type MutationRegisterPaymentArgs = {
  input: RegisterPaymentInput;
};


export type MutationRegisterResidentArgs = {
  input: CreateResidentUserInput;
};


export type MutationRegisterSupervisorArgs = {
  input: RegisterSupervisorInput;
};


export type MutationRegisterVehicleArgs = {
  input: RegisterVehicleInput;
};


export type MutationRegisterVisitorEntryArgs = {
  accessToken?: InputMaybe<Scalars['String']['input']>;
  visitId: Scalars['String']['input'];
};


export type MutationRegisterVisitorExitArgs = {
  notes?: InputMaybe<Scalars['String']['input']>;
  visitId: Scalars['String']['input'];
};


export type MutationRegisterVisitorVehicleEntryArgs = {
  input: RegisterVisitorVehicleInput;
};


export type MutationRegisterVisitorVehicleExitArgs = {
  input: ResgiterExitVehicle;
};


export type MutationRegisterWalkInArgs = {
  input: RegisterWalkInInput;
};


export type MutationRejectAccessRequestArgs = {
  input: RejectAccessRequestInput;
};


export type MutationRejectAmenityBookingArgs = {
  input: RejectAmenityBookingInput;
};


export type MutationRejectListingArgs = {
  input: ModerateListingInput;
};


export type MutationRejectMaintenanceTicketArgs = {
  reason: Scalars['String']['input'];
  ticketId: Scalars['String']['input'];
};


export type MutationRejectPetArgs = {
  petId: Scalars['String']['input'];
  reason: Scalars['String']['input'];
};


export type MutationRejectResidentArgs = {
  input: RejectResidentInput;
};


export type MutationRemoveBuildingArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemoveComplexArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemoveListingArgs = {
  listingId: Scalars['String']['input'];
  reason?: InputMaybe<Scalars['String']['input']>;
};


export type MutationRemoveMaintenanceSlaArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemoveMarketplaceCategoryArgs = {
  categoryId: Scalars['String']['input'];
};


export type MutationRemovePermissionArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemovePetArgs = {
  petId: Scalars['String']['input'];
  reason?: InputMaybe<Scalars['String']['input']>;
};


export type MutationRemoveResidentArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemoveRoleArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemoveSpecialNumberArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemoveStaffMemberArgs = {
  input: RemoveStaffMemberInput;
};


export type MutationRemoveUnitArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemoveVehicleArgs = {
  vehicleId: Scalars['String']['input'];
};


export type MutationRemoveVisitorFromBlacklistArgs = {
  visitorId: Scalars['String']['input'];
};


export type MutationRenewListingArgs = {
  listingId: Scalars['String']['input'];
};


export type MutationReopenMaintenanceTicketArgs = {
  reason: Scalars['String']['input'];
  ticketId: Scalars['String']['input'];
};


export type MutationReorderGlobalSpecialNumbersArgs = {
  ids: Array<Scalars['String']['input']>;
};


export type MutationReorderSpecialNumbersArgs = {
  complexId: Scalars['String']['input'];
  ids: Array<Scalars['String']['input']>;
};


export type MutationReportDevicePermissionsArgs = {
  deviceToken: Scalars['String']['input'];
  hasBatteryOptimizationDisabled?: InputMaybe<Scalars['Boolean']['input']>;
  hasFullScreenIntentPermission?: InputMaybe<Scalars['Boolean']['input']>;
  hasNotificationPermission?: InputMaybe<Scalars['Boolean']['input']>;
  onboardingCompleted?: InputMaybe<Scalars['Boolean']['input']>;
};


export type MutationReportListingArgs = {
  input: ReportListingInput;
};


export type MutationRequestComplexAccessArgs = {
  input: RequestComplexAccessInput;
};


export type MutationRequestDeviceApprovalArgs = {
  identity: Scalars['String']['input'];
};


export type MutationRequestOtpArgs = {
  input: RequestOtpInput;
};


export type MutationRequestPasswordResetArgs = {
  email: Scalars['String']['input'];
};


export type MutationRequestSecurityCallArgs = {
  complexId: Scalars['String']['input'];
};


export type MutationRequestWhatsAppLoginChallengeArgs = {
  identity: Scalars['String']['input'];
};


export type MutationResendResidentSystemCodeArgs = {
  identity: Scalars['String']['input'];
};


export type MutationResendSupervisorVerificationArgs = {
  supervisorId: Scalars['String']['input'];
};


export type MutationResetPasswordArgs = {
  input: ResetPasswordInput;
};


export type MutationResolveListingReportArgs = {
  input: ResolveListingReportInput;
};


export type MutationResolvePanicAlertArgs = {
  falseAlarm?: InputMaybe<Scalars['Boolean']['input']>;
  panicAlertId: Scalars['String']['input'];
  resolutionNotes?: InputMaybe<Scalars['String']['input']>;
};


export type MutationResolvePqrfArgs = {
  pqrfId: Scalars['String']['input'];
};


export type MutationRestoreComplexArgs = {
  id: Scalars['String']['input'];
};


export type MutationRestorePermissionArgs = {
  id: Scalars['String']['input'];
};


export type MutationRestoreRoleArgs = {
  id: Scalars['String']['input'];
};


export type MutationRestoreUserArgs = {
  userId: Scalars['String']['input'];
};


export type MutationResumeListingArgs = {
  listingId: Scalars['String']['input'];
};


export type MutationReturnPackageArgs = {
  packageId: Scalars['String']['input'];
  reason: Scalars['String']['input'];
};


export type MutationReverseDirectIncomeArgs = {
  incomeId: Scalars['String']['input'];
  reason: Scalars['String']['input'];
};


export type MutationReverseExpenseArgs = {
  expenseId: Scalars['String']['input'];
  reason: Scalars['String']['input'];
};


export type MutationReversePaymentArgs = {
  paymentId: Scalars['String']['input'];
  reason: Scalars['String']['input'];
};


export type MutationRevertAuditArgs = {
  referenceNumber: Scalars['String']['input'];
};


export type MutationReviewSignedDpaArgs = {
  complexId: Scalars['String']['input'];
  reason?: InputMaybe<Scalars['String']['input']>;
  status: DpaValidationStatus;
};


export type MutationRevokeResidentDeviceArgs = {
  deviceId: Scalars['ID']['input'];
};


export type MutationRunPushHealthCheckArgs = {
  deviceToken: Scalars['String']['input'];
};


export type MutationSanctionPetIncidentArgs = {
  input: SanctionPetIncidentInput;
};


export type MutationSaveMobileTokenArgs = {
  input: SaveMobileTokenInput;
};


export type MutationSavePushSubscriptionArgs = {
  input: SavePushSubscriptionInput;
};


export type MutationSaveSentMessageArgs = {
  input: SaveSentMessageInput;
};


export type MutationScheduleVisitArgs = {
  input: ScheduleVisitInput;
};


export type MutationSeedPucAccountsArgs = {
  complexId: Scalars['String']['input'];
};


export type MutationSendNotificationArgs = {
  input: SendNotificationInput;
};


export type MutationSetAmenitySchedulesArgs = {
  input: SetAmenitySchedulesInput;
};


export type MutationSetInitialPasswordArgs = {
  newPassword: Scalars['String']['input'];
};


export type MutationSetNotificationStarredArgs = {
  notificationId: Scalars['String']['input'];
  starred: Scalars['Boolean']['input'];
};


export type MutationSetParkingRateArgs = {
  input: SetParkingRateInput;
};


export type MutationSetResidentAccessCodeArgs = {
  input: SetAccessCodeInput;
};


export type MutationSetVotingEnabledArgs = {
  audience: VotingAudience;
  complexId: Scalars['String']['input'];
  enabled: Scalars['Boolean']['input'];
};


export type MutationSubmitListingArgs = {
  listingId: Scalars['String']['input'];
};


export type MutationSupervisorCheckInArgs = {
  input: SupervisorCheckInInput;
};


export type MutationSupervisorCheckOutArgs = {
  input: SupervisorCheckOutInput;
};


export type MutationSuspendPetArgs = {
  petId: Scalars['String']['input'];
  reason: Scalars['String']['input'];
};


export type MutationSuspendResidentArgs = {
  reason: Scalars['String']['input'];
  residentId: Scalars['String']['input'];
};


export type MutationSuspendUserArgs = {
  reason: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};


export type MutationSuspendVehicleArgs = {
  reason: Scalars['String']['input'];
  vehicleId: Scalars['String']['input'];
};


export type MutationToggleBuildingStatusArgs = {
  id: Scalars['String']['input'];
};


export type MutationToggleFeeConfigArgs = {
  configId: Scalars['String']['input'];
};


export type MutationToggleListingFavoriteArgs = {
  listingId: Scalars['String']['input'];
};


export type MutationToggleParkingRateArgs = {
  rateId: Scalars['String']['input'];
};


export type MutationTogglePucAccountArgs = {
  complexId: Scalars['String']['input'];
  id: Scalars['String']['input'];
};


export type MutationTriageMaintenanceTicketArgs = {
  input: TriageMaintenanceTicketInput;
};


export type MutationTriggerPanicAlertArgs = {
  complexId: Scalars['String']['input'];
};


export type MutationUndoMoveOutResidentArgs = {
  residentId: Scalars['String']['input'];
};


export type MutationUpdateAmenityArgs = {
  input: UpdateAmenityInput;
};


export type MutationUpdateBuildingArgs = {
  input: UpdateBuildingInput;
};


export type MutationUpdateChargeCategoryArgs = {
  input: UpdateChargeCategoryInput;
};


export type MutationUpdateComplexArgs = {
  input: UpdateComplexInput;
};


export type MutationUpdateComplexModulesArgs = {
  complexId: Scalars['String']['input'];
  modules: Array<ComplexModule>;
};


export type MutationUpdateFeeConfigArgs = {
  input: UpdateFeeConfigInput;
};


export type MutationUpdateLegalDocumentArgs = {
  id: Scalars['ID']['input'];
  input: UpdateLegalDocumentInput;
};


export type MutationUpdateListingArgs = {
  input: UpdateListingInput;
};


export type MutationUpdateMaintenanceLocationTagArgs = {
  input: UpdateMaintenanceLocationTagInput;
};


export type MutationUpdateMaintenanceVendorArgs = {
  input: UpdateMaintenanceVendorInput;
};


export type MutationUpdateMarketplaceSettingsArgs = {
  input: UpdateMarketplaceSettingsInput;
};


export type MutationUpdatePermissionArgs = {
  id: Scalars['String']['input'];
  updatePermissionInput: UpdatePermissionInput;
};


export type MutationUpdatePetArgs = {
  input: UpdatePetInput;
};


export type MutationUpdatePqrfCouncilResolversArgs = {
  complexId: Scalars['String']['input'];
  userIds: Array<Scalars['String']['input']>;
};


export type MutationUpdatePucAccountArgs = {
  input: UpdatePucAccountInput;
};


export type MutationUpdateRecurringChargeArgs = {
  input: UpdateRecurringChargeInput;
};


export type MutationUpdateResidentArgs = {
  input: UpdateResidentInput;
};


export type MutationUpdateRoleArgs = {
  id: Scalars['String']['input'];
  input: UpdateRoleInput;
};


export type MutationUpdateSpecialNumberArgs = {
  input: UpdateSpecialNumberInput;
};


export type MutationUpdateUnitArgs = {
  input: UpdateUnitInput;
};


export type MutationUpdateUserArgs = {
  updateUserInput: UpdateUserInput;
};


export type MutationUpdateUserIdentityArgs = {
  input: UpdateUserIdentityInput;
};


export type MutationUpdateVehicleArgs = {
  input: UpdateVehicleInput;
};


export type MutationUpdateVisitorParkingConfigArgs = {
  input: UpdateVisitorParkingConfigInput;
};


export type MutationUpdateVotingCouncilVoiceOnlyArgs = {
  complexId: Scalars['String']['input'];
  voiceOnlyUserIds: Array<Scalars['String']['input']>;
};


export type MutationUpdateVotingQuestionArgs = {
  input: UpdateVotingQuestionInput;
};


export type MutationUploadSignedDpaArgs = {
  fileName?: InputMaybe<Scalars['String']['input']>;
  pdfBase64: Scalars['String']['input'];
};


export type MutationUpsertAmenityScheduleExceptionArgs = {
  input: UpsertScheduleExceptionInput;
};


export type MutationUpsertCoefficientWeightingArgs = {
  input: UpsertCoefficientWeightingInput;
};


export type MutationUpsertComplexFinanceConfigArgs = {
  input: UpsertComplexFinanceConfigInput;
};


export type MutationUpsertMaintenanceSlaArgs = {
  input: UpsertMaintenanceSlaInput;
};


export type MutationUpsertMarketplaceCategoryArgs = {
  input: UpsertMarketplaceCategoryInput;
};


export type MutationUserHasRoleArgs = {
  roleName: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};


export type MutationValidatePetIncidentArgs = {
  input: ValidatePetIncidentInput;
};


export type MutationValidateQrAccessArgs = {
  qrToken: Scalars['String']['input'];
};


export type MutationVerifyOtpArgs = {
  input: VerifyOtpInput;
};


export type MutationVerifySupervisorEmailArgs = {
  token: Scalars['String']['input'];
};


export type MutationWaiveChargeArgs = {
  chargeId: Scalars['String']['input'];
  reason: Scalars['String']['input'];
};

export type NearbyComplexResponse = {
  __typename?: 'NearbyComplexResponse';
  address: Scalars['String']['output'];
  city: Scalars['String']['output'];
  /** Distancia en metros desde la posición del supervisor */
  distanceMeters: Scalars['Int']['output'];
  /** Radio GPS configurado en el complejo (metros) */
  gpsRadius?: Maybe<Scalars['Int']['output']>;
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

/** Nota/minuta operativa del complejo residencial */
export type Note = {
  __typename?: 'Note';
  complex?: Maybe<ResidentialComplex>;
  complexId: Scalars['String']['output'];
  /** Cuerpo de la nota */
  content: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  /** Rol del creador al momento de registrar la nota */
  createdByRole?: Maybe<Scalars['String']['output']>;
  /** Usuario que creó la nota */
  createdByUser?: Maybe<User>;
  createdByUserId?: Maybe<Scalars['String']['output']>;
  /** Fecha de eliminación lógica (solo SUPER_ADMIN) */
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['String']['output'];
  /** URLs de imágenes adjuntas (R2) */
  imageUrls?: Maybe<Array<Scalars['String']['output']>>;
  /** ID de la visita activa del supervisor bajo la cual se creó esta nota */
  supervisorVisitId?: Maybe<Scalars['String']['output']>;
  /** Título de la nota */
  title: Scalars['String']['output'];
};

export type Notification = {
  __typename?: 'Notification';
  actionLabel?: Maybe<Scalars['String']['output']>;
  actionResult?: Maybe<NotificationActionResult>;
  actionTakenAt?: Maybe<Scalars['DateTime']['output']>;
  actionTakenByUserId?: Maybe<Scalars['String']['output']>;
  actionType?: Maybe<NotificationActionType>;
  body: Scalars['String']['output'];
  complexId: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  createdByUserId?: Maybe<Scalars['String']['output']>;
  entityId?: Maybe<Scalars['String']['output']>;
  entityType?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isActionable: Scalars['Boolean']['output'];
  isBroadcast: Scalars['Boolean']['output'];
  isRead: Scalars['Boolean']['output'];
  isStarred: Scalars['Boolean']['output'];
  metadata?: Maybe<Scalars['JSON']['output']>;
  panicAlertId?: Maybe<Scalars['String']['output']>;
  priority: NotificationPriority;
  readAt?: Maybe<Scalars['DateTime']['output']>;
  recipientUserId?: Maybe<Scalars['String']['output']>;
  targetRoles?: Maybe<Array<Scalars['String']['output']>>;
  title: Scalars['String']['output'];
  type: NotificationType;
  updatedAt: Scalars['DateTime']['output'];
};

/** Dato que la acción pide antes de ejecutarse */
export type NotificationActionField = {
  __typename?: 'NotificationActionField';
  defaultLabel?: Maybe<Scalars['String']['output']>;
  defaultValue?: Maybe<Scalars['String']['output']>;
  helpText?: Maybe<Scalars['String']['output']>;
  kind: NotificationActionFieldKind;
  label: Scalars['String']['output'];
  max?: Maybe<Scalars['Float']['output']>;
  min?: Maybe<Scalars['Float']['output']>;
  minLength?: Maybe<Scalars['Int']['output']>;
  name: Scalars['String']['output'];
  options?: Maybe<Array<NotificationActionOption>>;
  placeholder?: Maybe<Scalars['String']['output']>;
  required: Scalars['Boolean']['output'];
};

/** Tipo de dato que pide una acción antes de ejecutarse */
export type NotificationActionFieldKind =
  | 'BOOLEAN'
  | 'DATE'
  | 'MONEY'
  | 'NUMBER'
  | 'SELECT'
  | 'TEXT'
  | 'TEXTAREA'
  | 'UNIT';

/** Opción de una lista cerrada */
export type NotificationActionOption = {
  __typename?: 'NotificationActionOption';
  hint?: Maybe<Scalars['String']['output']>;
  label: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

/** Resultado de la acción tomada sobre la notificación */
export type NotificationActionResult =
  /** Alerta reconocida */
  | 'ACKNOWLEDGED'
  /** Acción aprobada */
  | 'APPROVED'
  /** Acción rechazada */
  | 'REJECTED';

/** Peso visual del botón de la acción */
export type NotificationActionTone =
  | 'DANGER'
  | 'NEUTRAL'
  | 'PRIMARY'
  | 'WARNING';

/** Escenario de acción requerida. El frontend usa este valor para determinar qué botones mostrar. */
export type NotificationActionType =
  /** Solicitud de acceso de supervisor — [Aprobar acceso] [Rechazar] */
  | 'ACCESS_REQUEST'
  /** Alerta que requiere confirmación — [Reconocer] */
  | 'ACKNOWLEDGE'
  /** Publicación de clasificados por revisar — [Aprobar] [Rechazar] */
  | 'LISTING_APPROVAL'
  /** Nueva solicitud de residencia — [Aprobar] [Rechazar] */
  | 'RESIDENT_APPROVAL'
  /** Nuevo vehículo pendiente — [Aprobar] [Rechazar] */
  | 'VEHICLE_APPROVAL'
  /** Visita walk-in esperando entrada — [Autorizar] [Denegar] */
  | 'VISIT_APPROVAL';

export type NotificationDetailResponse = {
  __typename?: 'NotificationDetailResponse';
  actionLabel?: Maybe<Scalars['String']['output']>;
  actionResult?: Maybe<NotificationActionResult>;
  actionTakenAt?: Maybe<Scalars['DateTime']['output']>;
  actionTakenByUser?: Maybe<NotificationUserInfo>;
  actionTakenByUserId?: Maybe<Scalars['String']['output']>;
  actionType?: Maybe<NotificationActionType>;
  body: Scalars['String']['output'];
  complexId: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  createdByUser?: Maybe<NotificationUserInfo>;
  createdByUserId?: Maybe<Scalars['String']['output']>;
  entity?: Maybe<NotificationEntitySnapshot>;
  entityId?: Maybe<Scalars['String']['output']>;
  entityType?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isActionable: Scalars['Boolean']['output'];
  isBroadcast: Scalars['Boolean']['output'];
  isRead: Scalars['Boolean']['output'];
  isStarred: Scalars['Boolean']['output'];
  metadata?: Maybe<Scalars['JSON']['output']>;
  priority: NotificationPriority;
  readAt?: Maybe<Scalars['DateTime']['output']>;
  recipientUser?: Maybe<NotificationUserInfo>;
  recipientUserId?: Maybe<Scalars['String']['output']>;
  targetRoles?: Maybe<Array<Scalars['String']['output']>>;
  title: Scalars['String']['output'];
  type: NotificationType;
  updatedAt: Scalars['DateTime']['output'];
};

/** Datos completos de lo que originó la notificación */
export type NotificationEntitySnapshot = {
  __typename?: 'NotificationEntitySnapshot';
  actions: Array<NotificationSnapshotAction>;
  entityId?: Maybe<Scalars['String']['output']>;
  entityType?: Maybe<Scalars['String']['output']>;
  files: Array<NotificationSnapshotFile>;
  headline?: Maybe<Scalars['String']['output']>;
  images: Array<NotificationSnapshotImage>;
  isMissing: Scalars['Boolean']['output'];
  sections: Array<NotificationSnapshotSection>;
  source: NotificationSnapshotSource;
  statusCode?: Maybe<Scalars['String']['output']>;
  statusLabel?: Maybe<Scalars['String']['output']>;
  statusTone: NotificationSnapshotTone;
};

/** Formato de lectura de un campo del expediente */
export type NotificationFieldKind =
  | 'BADGE'
  | 'DATE'
  | 'LINK'
  | 'LOCATION'
  | 'MONEY'
  | 'MULTILINE'
  | 'PHONE'
  | 'TEXT';

/** Prioridad de entrega de la notificación */
export type NotificationPriority =
  | 'HIGH'
  | 'LOW'
  | 'NORMAL'
  | 'URGENT';

/** Acción disponible sobre lo que originó el aviso */
export type NotificationSnapshotAction = {
  __typename?: 'NotificationSnapshotAction';
  code: Scalars['String']['output'];
  confirmText?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  disabledReason?: Maybe<Scalars['String']['output']>;
  fields: Array<NotificationActionField>;
  isEnabled: Scalars['Boolean']['output'];
  label: Scalars['String']['output'];
  tone: NotificationActionTone;
};

/** Un dato del expediente, ya con nombre legible */
export type NotificationSnapshotField = {
  __typename?: 'NotificationSnapshotField';
  href?: Maybe<Scalars['String']['output']>;
  kind: NotificationFieldKind;
  label: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

/** Archivo adjunto del expediente (PDF, carné…) */
export type NotificationSnapshotFile = {
  __typename?: 'NotificationSnapshotFile';
  label: Scalars['String']['output'];
  url: Scalars['String']['output'];
};

/** Imagen del expediente */
export type NotificationSnapshotImage = {
  __typename?: 'NotificationSnapshotImage';
  caption?: Maybe<Scalars['String']['output']>;
  sealHash?: Maybe<Scalars['String']['output']>;
  url: Scalars['String']['output'];
};

/** Bloque de datos del expediente */
export type NotificationSnapshotSection = {
  __typename?: 'NotificationSnapshotSection';
  fields: Array<NotificationSnapshotField>;
  title?: Maybe<Scalars['String']['output']>;
};

/** Origen de los datos del expediente */
export type NotificationSnapshotSource =
  | 'LIVE'
  | 'METADATA';

/** Tono con el que se muestra el estado del expediente */
export type NotificationSnapshotTone =
  | 'DANGER'
  | 'NEUTRAL'
  | 'POSITIVE'
  | 'WARNING';

/** Tipo de evento que originó la notificación */
export type NotificationType =
  | 'ACCESS_REQUEST_APPROVED'
  | 'ACCESS_REQUEST_REJECTED'
  | 'ACCESS_REVOKED_INACTIVITY'
  | 'AMENITY_BOOKING_APPROVED'
  | 'AMENITY_BOOKING_CANCELLED'
  | 'AMENITY_BOOKING_NO_SHOW'
  | 'AMENITY_BOOKING_REJECTED'
  | 'AMENITY_BOOKING_REQUESTED'
  | 'AMENITY_DAMAGE_CHARGED'
  | 'AMENITY_REMINDER'
  | 'CHARGE_ADDED'
  | 'CHARGE_WAIVED'
  | 'COMPLEX_ALERT'
  | 'DIRECT_CHARGE'
  | 'DPA_APPROVED'
  | 'DPA_REJECTED'
  | 'DPA_SIGNED'
  | 'LISTING_APPROVED'
  | 'LISTING_EXPIRED'
  | 'LISTING_EXPIRING'
  | 'LISTING_INTEREST'
  | 'LISTING_PAUSED_BY_REPORTS'
  | 'LISTING_PENDING_REVIEW'
  | 'LISTING_REJECTED'
  | 'LISTING_REPORTED'
  | 'LOGIN_APPROVAL_REQUEST'
  | 'MAINTENANCE_RATING_REQUESTED'
  | 'MAINTENANCE_SLA_BREACHED'
  | 'MAINTENANCE_TICKET_ASSIGNED'
  | 'MAINTENANCE_TICKET_REJECTED'
  | 'MAINTENANCE_TICKET_REOPENED'
  | 'MAINTENANCE_TICKET_REPORTED'
  | 'MAINTENANCE_TICKET_RESOLVED'
  | 'MAINTENANCE_TICKET_UPDATED'
  | 'MORA_APPLIED'
  | 'NEW_DEVICE_LINKED'
  | 'PACKAGE_DELIVERED'
  | 'PACKAGE_LOST'
  | 'PACKAGE_READY'
  | 'PACKAGE_RECEIVED'
  | 'PACKAGE_RETURNED'
  | 'PANIC_ALERT'
  | 'PARKING_ASSIGNED'
  | 'PAYMENT_CONFIRMED'
  | 'PAYMENT_DUE'
  | 'PAYMENT_OVERDUE'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_REVERSED'
  | 'PET_APPROVED'
  | 'PET_DOCUMENT_EXPIRING'
  | 'PET_FINE_CHARGED'
  | 'PET_INCIDENT_DISMISSED'
  | 'PET_INCIDENT_REPORTED'
  | 'PET_INCIDENT_VALIDATED'
  | 'PET_REACTIVATED'
  | 'PET_REGISTERED'
  | 'PET_REJECTED'
  | 'PET_REMOVED'
  | 'PET_STATEMENT_RECEIVED'
  | 'PET_SUSPENDED'
  | 'PET_WARNING_ISSUED'
  | 'PQRF_RECEIVED'
  | 'PQRF_REMINDER'
  | 'PQRF_RESOLVED'
  | 'PROFILE_UPDATED'
  | 'RESIDENT_APPROVED'
  | 'RESIDENT_PENDING'
  | 'RESIDENT_REJECTED'
  | 'SECURITY_CALL_REQUEST'
  | 'SYSTEM_ANNOUNCEMENT'
  | 'VEHICLE_APPROVED'
  | 'VEHICLE_PENDING'
  | 'VEHICLE_REACTIVATED'
  | 'VEHICLE_REGISTERED'
  | 'VEHICLE_REJECTED'
  | 'VEHICLE_REMOVED'
  | 'VEHICLE_SUSPENDED'
  | 'VISITOR_ARRIVED'
  | 'VISITOR_BLACKLISTED'
  | 'VISITOR_WALK_IN'
  | 'VISIT_APPROVED'
  | 'VISIT_DENIED'
  | 'VISIT_REMINDER'
  | 'VOTING_OPENED'
  | 'WALLET_APPLIED'
  | 'WALLET_CREDIT';

export type NotificationUserInfo = {
  __typename?: 'NotificationUserInfo';
  email: Scalars['String']['output'];
  fullName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  identity?: Maybe<Scalars['String']['output']>;
  lastName: Scalars['String']['output'];
  name: Scalars['String']['output'];
  phoneNumber?: Maybe<Scalars['String']['output']>;
  profilePicture?: Maybe<Scalars['String']['output']>;
  roles: Array<Scalars['String']['output']>;
};

/** Respuesta al solicitar OTP */
export type OtpRequestResponse = {
  __typename?: 'OtpRequestResponse';
  debugCode?: Maybe<Scalars['String']['output']>;
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type Package = {
  __typename?: 'Package';
  complex: ResidentialComplex;
  complexId: Scalars['String']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  deliveredAt?: Maybe<Scalars['DateTime']['output']>;
  deliveredBy?: Maybe<User>;
  deliveredByUserId?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  maxStorageDays?: Maybe<Scalars['Float']['output']>;
  notes?: Maybe<Scalars['String']['output']>;
  notifiedAt?: Maybe<Scalars['DateTime']['output']>;
  photoUrl?: Maybe<Scalars['String']['output']>;
  receivedAt: Scalars['DateTime']['output'];
  receivedByIdentity?: Maybe<Scalars['String']['output']>;
  receivedByName?: Maybe<Scalars['String']['output']>;
  recipientName?: Maybe<Scalars['String']['output']>;
  registeredBy?: Maybe<User>;
  registeredByUserId?: Maybe<Scalars['String']['output']>;
  returnReason?: Maybe<Scalars['String']['output']>;
  returnedAt?: Maybe<Scalars['DateTime']['output']>;
  senderName: Scalars['String']['output'];
  status: PackageStatus;
  trackingCode?: Maybe<Scalars['String']['output']>;
  type: PackageType;
  unit: Unit;
  unitId: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

/** Estado del paquete en el ciclo de vida de la paquetería */
export type PackageStatus =
  | 'DELIVERED'
  | 'LOST'
  | 'NOTIFIED'
  | 'READY_FOR_PICKUP'
  | 'RECEIVED'
  | 'RETURNED';

/** Tipo / categoría del paquete recibido */
export type PackageType =
  | 'DOCUMENT'
  | 'ENVELOPE'
  | 'FOOD'
  | 'FRAGILE'
  | 'OTHER'
  | 'PARCEL';

export type PaginatedAccountingDocumentsResponse = {
  __typename?: 'PaginatedAccountingDocumentsResponse';
  items: Array<AccountingHeader>;
  pagination: PaginationReponse;
};

export type PaginatedAmenitiesResponse = {
  __typename?: 'PaginatedAmenitiesResponse';
  items: Array<Amenity>;
  pagination: PaginationReponse;
};

export type PaginatedAmenityBookingsResponse = {
  __typename?: 'PaginatedAmenityBookingsResponse';
  items: Array<AmenityBooking>;
  pagination: PaginationReponse;
};

/** Lista paginada de registros de auditoría */
export type PaginatedAuditLogsResponse = {
  __typename?: 'PaginatedAuditLogsResponse';
  items: Array<AuditLog>;
  limit: Scalars['Int']['output'];
  offset: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

export type PaginatedBuildingsResponse = {
  __typename?: 'PaginatedBuildingsResponse';
  items: Array<Building>;
  pagination: PaginationReponse;
};

export type PaginatedChargesResponse = {
  __typename?: 'PaginatedChargesResponse';
  items: Array<FeeCharge>;
  pagination: PaginationReponse;
};

export type PaginatedComplexesResponse = {
  __typename?: 'PaginatedComplexesResponse';
  items: Array<ResidentialComplex>;
  pagination: PaginationReponse;
};

export type PaginatedExpensesResponse = {
  __typename?: 'PaginatedExpensesResponse';
  byCategory: Array<ExpenseCategoryBreakdown>;
  items: Array<ComplexExpense>;
  pagination: PaginationReponse;
  totalAmount: Scalars['Float']['output'];
};

export type PaginatedIncomesResponse = {
  __typename?: 'PaginatedIncomesResponse';
  byCategory: Array<IncomeCategoryBreakdown>;
  items: Array<DirectIncome>;
  pagination: PaginationReponse;
  totalAmount: Scalars['Float']['output'];
};

export type PaginatedListingReportsResponse = {
  __typename?: 'PaginatedListingReportsResponse';
  items: Array<MarketplaceListingReport>;
  pagination: PaginationReponse;
};

export type PaginatedListingsResponse = {
  __typename?: 'PaginatedListingsResponse';
  items: Array<MarketplaceListing>;
  pagination: PaginationReponse;
};

export type PaginatedMaintenanceTicketsResponse = {
  __typename?: 'PaginatedMaintenanceTicketsResponse';
  items: Array<MaintenanceTicket>;
  pagination: PaginationReponse;
};

export type PaginatedNotesResponse = {
  __typename?: 'PaginatedNotesResponse';
  items: Array<Note>;
  pagination: PaginationReponse;
};

export type PaginatedNotificationsResponse = {
  __typename?: 'PaginatedNotificationsResponse';
  items: Array<Notification>;
  pagination: PaginationReponse;
};

export type PaginatedPackagesResponse = {
  __typename?: 'PaginatedPackagesResponse';
  items: Array<Package>;
  pagination: PaginationReponse;
};

export type PaginatedPermissionsResponse = {
  __typename?: 'PaginatedPermissionsResponse';
  items: Array<Permission>;
  meta: PaginationReponse;
};

export type PaginatedPetIncidentsResponse = {
  __typename?: 'PaginatedPetIncidentsResponse';
  items: Array<PetIncident>;
  pagination: PaginationReponse;
};

export type PaginatedPetsResponse = {
  __typename?: 'PaginatedPetsResponse';
  items: Array<Pet>;
  pagination: PaginationReponse;
};

/** Radicados PQRF paginados */
export type PaginatedPqrfResponse = {
  __typename?: 'PaginatedPqrfResponse';
  items: Array<Pqrf>;
  pagination: PaginationReponse;
};

export type PaginatedResidentsResponse = {
  __typename?: 'PaginatedResidentsResponse';
  items: Array<Resident>;
  pagination: PaginationReponse;
};

export type PaginatedRolesResponse = {
  __typename?: 'PaginatedRolesResponse';
  items: Array<Role>;
  meta: PaginationReponse;
};

export type PaginatedSentMessagesResponse = {
  __typename?: 'PaginatedSentMessagesResponse';
  items: Array<SentMessage>;
  pagination: PaginationReponse;
};

export type PaginatedUnitsResponse = {
  __typename?: 'PaginatedUnitsResponse';
  items: Array<Unit>;
  pagination: PaginationReponse;
};

export type PaginatedVehiclesResponse = {
  __typename?: 'PaginatedVehiclesResponse';
  items: Array<Vehicle>;
  pagination: PaginationReponse;
};

export type PaginatedVisitorVehiclesResponse = {
  __typename?: 'PaginatedVisitorVehiclesResponse';
  items: Array<VisitorVehicle>;
  pagination: PaginationReponse;
};

export type PaginatedVisitorsResponse = {
  __typename?: 'PaginatedVisitorsResponse';
  items: Array<Visitor>;
  pagination: PaginationReponse;
};

export type PaginatedVisitsResponse = {
  __typename?: 'PaginatedVisitsResponse';
  items: Array<Visit>;
  pagination: PaginationReponse;
};

export type PaginationInput = {
  limit?: Scalars['Int']['input'];
  page?: Scalars['Int']['input'];
};

export type PaginationReponse = {
  __typename?: 'PaginationReponse';
  currentPage: Scalars['Int']['output'];
  hasNextPage: Scalars['Boolean']['output'];
  hasPreviousPage: Scalars['Boolean']['output'];
  itemsPerPage: Scalars['Int']['output'];
  totalItems: Scalars['Int']['output'];
  totalPages: Scalars['Int']['output'];
};

export type PanicAlert = {
  __typename?: 'PanicAlert';
  accuracy?: Maybe<Scalars['Float']['output']>;
  acknowledgedAt?: Maybe<Scalars['DateTime']['output']>;
  acknowledgedByUserId?: Maybe<Scalars['String']['output']>;
  complexId: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  deliveredAt?: Maybe<Scalars['DateTime']['output']>;
  escalationLevel: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  latitude?: Maybe<Scalars['Float']['output']>;
  longitude?: Maybe<Scalars['Float']['output']>;
  residentId?: Maybe<Scalars['String']['output']>;
  resolutionNotes?: Maybe<Scalars['String']['output']>;
  resolvedAt?: Maybe<Scalars['DateTime']['output']>;
  resolvedByUserId?: Maybe<Scalars['String']['output']>;
  status: PanicAlertStatus;
  triggeredByLabel?: Maybe<Scalars['String']['output']>;
  triggeredByUserId: Scalars['String']['output'];
  type: PanicAlertType;
  unitId?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
};

/** Estado de una alerta de pánico */
export type PanicAlertStatus =
  | 'ACKNOWLEDGED'
  | 'DELIVERED'
  | 'FALSE_ALARM'
  | 'PENDING'
  | 'RESOLVED';

/** Tipo de emergencia de una alerta de pánico */
export type PanicAlertType =
  | 'FIRE'
  | 'INTRUSION'
  | 'MEDICAL'
  | 'PANIC';

/** Método de pago del parqueadero visitante */
export type ParkingPaymentMethod =
  /** Efectivo */
  | 'CASH'
  /** Cargo a la cuenta de la unidad visitada */
  | 'CHARGE_TO_UNIT'
  /** Transferencia bancaria / QR */
  | 'TRANSFER';

/** Tipo de tarifa aplicada en el parqueadero */
export type ParkingRateType =
  /** Cobro por día (se redondea al alza) */
  | 'DAILY'
  /** Tarifa especial de evento */
  | 'EVENT'
  /** Tarifa fija independiente del tiempo */
  | 'FIXED'
  /** Cobro por hora (se redondea al alza) */
  | 'PER_HOUR'
  /** Cobro por minuto */
  | 'PER_MINUTE';

/** Estado del registro de parqueadero visitante */
export type ParkingRecordStatus =
  /** Registro anulado */
  | 'CANCELLED'
  /** Cobro cargado a la cuenta de la unidad visitada */
  | 'CHARGED_TO_UNIT'
  /** Vehículo dentro del parqueadero, sin liquidar */
  | 'OPEN'
  /** Cobro liquidado (efectivo o transferencia) */
  | 'PAID';

/** Configuración de rotación de parqueaderos del complejo */
export type ParkingRotationConfig = {
  __typename?: 'ParkingRotationConfig';
  /** ID del complejo al que pertenece la configuración */
  complexId: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  createdByUser?: Maybe<User>;
  createdByUserId?: Maybe<Scalars['String']['output']>;
  /** Número del gran ciclo actual por tipo de vehículo. Se incrementa cuando todos los vehículos de ese tipo han rotado al menos una vez. */
  grandCycleByType: Scalars['JSON']['output'];
  id: Scalars['String']['output'];
  /** Si la rotación automática está habilitada */
  isActive: Scalars['Boolean']['output'];
  /** Última vez que se ejecutó la rotación */
  lastExecutedAt?: Maybe<Scalars['DateTime']['output']>;
  /** Próxima ejecución programada de la rotación */
  nextExecutionAt?: Maybe<Scalars['DateTime']['output']>;
  /** Unidad de tiempo del intervalo (DAYS | WEEKS | MONTHS) */
  rotationIntervalUnit: RotationIntervalUnit;
  /** Valor numérico del intervalo (ej: 3 si es "cada 3 meses") */
  rotationIntervalValue: Scalars['Int']['output'];
  /** Mapa de cupos disponibles por tipo de vehículo. Ej: { "CAR": 20, "MOTORCYCLE": 13 }. Solo los tipos listados participan en la rotación. */
  slotsByType: Scalars['JSON']['output'];
  updatedAt: Scalars['DateTime']['output'];
  updatedByUser?: Maybe<User>;
  updatedByUserId?: Maybe<Scalars['String']['output']>;
};

/** Cupos de parqueadero disponibles para un tipo de vehículo */
export type ParkingSlotByTypeInput = {
  /** Cantidad de cupos disponibles para ese tipo */
  slots: Scalars['Int']['input'];
  /** Tipo de vehículo (ej: "CAR", "MOTORCYCLE", "TRUCK", "VAN") */
  vehicleType: Scalars['String']['input'];
};

export type Payment = {
  __typename?: 'Payment';
  amount: Scalars['Float']['output'];
  charge: FeeCharge;
  chargeId: Scalars['String']['output'];
  complex: ResidentialComplex;
  complexId: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  isReversed: Scalars['Boolean']['output'];
  method: PaymentMethod;
  notes?: Maybe<Scalars['String']['output']>;
  paidAt: Scalars['DateTime']['output'];
  receiptUrl?: Maybe<Scalars['String']['output']>;
  reference?: Maybe<Scalars['String']['output']>;
  registeredBy?: Maybe<User>;
  registeredByUserId?: Maybe<Scalars['String']['output']>;
  reversalReason?: Maybe<Scalars['String']['output']>;
  reversedAt?: Maybe<Scalars['DateTime']['output']>;
  reversedByUserId?: Maybe<Scalars['String']['output']>;
  unit: Unit;
  unitId: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

/** Método de pago utilizado */
export type PaymentMethod =
  | 'BANK_TRANSFER'
  | 'CASH'
  | 'CREDIT_CARD'
  | 'DAVIPLATA'
  | 'DEBIT_CARD'
  | 'NEQUI'
  | 'OTHER'
  | 'PSE';

/** Solicitud de ingreso esperando que el residente la apruebe o rechace */
export type PendingDeviceApproval = {
  __typename?: 'PendingDeviceApproval';
  /** Código a comparar con el mostrado en el dispositivo que pide entrar */
  approvalCode: Scalars['String']['output'];
  /** Identificador para aprobar o rechazar */
  approvalId: Scalars['ID']['output'];
  createdAt: Scalars['DateTime']['output'];
  expiresAt: Scalars['DateTime']['output'];
  /** IP de origen de la solicitud */
  requestedFromIp?: Maybe<Scalars['String']['output']>;
  /** Equipo desde el que se pide el ingreso */
  requestedFromLabel?: Maybe<Scalars['String']['output']>;
};

/** Permiso del sistema granular. */
export type Permission = {
  __typename?: 'Permission';
  createdAt: Scalars['DateTime']['output'];
  /** Usuario que creó el registro */
  createdBy?: Maybe<Scalars['String']['output']>;
  createdByUser: User;
  dependentPermissions?: Maybe<Array<Maybe<Permission>>>;
  dependsOn?: Maybe<Array<Maybe<Permission>>>;
  description?: Maybe<Scalars['String']['output']>;
  /** Categoría (ej: AUTH, USERS, BILLING) */
  group: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isSystem: Scalars['Boolean']['output'];
  /** Nombre legible (ej: CREAR_USUARIO) */
  label: Scalars['String']['output'];
  /** Define si el permiso es crítico o informativo */
  level: Scalars['String']['output'];
  name: ValidPermissions;
  status: Scalars['Boolean']['output'];
  updatedAt: Scalars['DateTime']['output'];
  updatedByUser: User;
};

export type PermissionDependencyInput = {
  /** ID of the dependency permission */
  id: Scalars['String']['input'];
};

export type PermissionDependencyRemoveResponse = {
  __typename?: 'PermissionDependencyRemoveResponse';
  id: Scalars['String']['output'];
  name: ValidPermissions;
};

export type PermissionDependencyResponse = {
  __typename?: 'PermissionDependencyResponse';
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  name: ValidPermissions;
};

export type PermissionFiltersInput = {
  category?: InputMaybe<Scalars['String']['input']>;
  createdAt?: InputMaybe<DateRangeInput>;
  hasDependentPermissions?: InputMaybe<Scalars['Boolean']['input']>;
  isSystem?: InputMaybe<Scalars['Boolean']['input']>;
  level?: InputMaybe<PermissionLevel>;
  search?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Scalars['Boolean']['input']>;
};

export type PermissionLevel =
  | 'CRITICAL'
  | 'HIGH'
  | 'LOW'
  | 'MEDIUM';

export type PermissionWithSource = {
  __typename?: 'PermissionWithSource';
  /** Permission ID */
  id: Scalars['String']['output'];
  /** Permission name */
  name: ValidPermissions;
  /** Source of the permission (DIRECT or INHERITED) */
  source: Scalars['String']['output'];
};

/** Mascota registrada por un residente */
export type Pet = {
  __typename?: 'Pet';
  /** Fecha de aprobación */
  approvedAt?: Maybe<Scalars['DateTime']['output']>;
  approvedByUser?: Maybe<User>;
  /** Usuario que aprobó o rechazó la ficha */
  approvedByUserId?: Maybe<Scalars['String']['output']>;
  /** Fecha de nacimiento (aproximada si no se conoce) */
  birthDate?: Maybe<Scalars['String']['output']>;
  /** Raza */
  breed?: Maybe<Scalars['String']['output']>;
  /** Color predominante */
  color?: Maybe<Scalars['String']['output']>;
  complex?: Maybe<ResidentialComplex>;
  /** Complejo (multi-tenant) */
  complexId: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  createdByUserId?: Maybe<Scalars['String']['output']>;
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  /** Señas particulares (manchas, collar, cicatrices) */
  distinguishingMarks?: Maybe<Scalars['String']['output']>;
  /** Tiene microchip implantado */
  hasMicrochip: Scalars['Boolean']['output'];
  id: Scalars['String']['output'];
  /** Aseguradora de la póliza de RC extracontractual */
  insuranceCompany?: Maybe<Scalars['String']['output']>;
  /** Vencimiento de la póliza */
  insuranceExpiresAt?: Maybe<Scalars['String']['output']>;
  /** Número de la póliza de RC extracontractual */
  insurancePolicyNumber?: Maybe<Scalars['String']['output']>;
  /** Pertenece a una raza de manejo especial */
  isSpecialBreed: Scalars['Boolean']['output'];
  /** Número del microchip */
  microchipCode?: Maybe<Scalars['String']['output']>;
  /** Nombre de la mascota */
  name: Scalars['String']['output'];
  /** Notas internas de la administración */
  notes?: Maybe<Scalars['String']['output']>;
  /** URL de la foto (R2) */
  photoUrl?: Maybe<Scalars['String']['output']>;
  /** Fecha de la última vacuna antirrábica */
  rabiesVaccineAt?: Maybe<Scalars['String']['output']>;
  /** Razón del rechazo o la suspensión */
  rejectionReason?: Maybe<Scalars['String']['output']>;
  resident?: Maybe<Resident>;
  /** Residente responsable de la mascota */
  residentId?: Maybe<Scalars['String']['output']>;
  /** Sexo */
  sex?: Maybe<PetSex>;
  /** Porte */
  size?: Maybe<PetSize>;
  /** Especie */
  species: PetSpecies;
  /** Estado dentro del complejo */
  status: PetStatus;
  /** Esterilizada */
  sterilized?: Maybe<Scalars['Boolean']['output']>;
  unit?: Maybe<Unit>;
  /** Unidad donde vive la mascota */
  unitId: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  /** URL del carné de vacunación (R2) */
  vaccinationCardUrl?: Maybe<Scalars['String']['output']>;
};

/** Reporte de convivencia asociado a una mascota */
export type PetIncident = {
  __typename?: 'PetIncident';
  /** Número del reporte, consecutivo */
  code: Scalars['String']['output'];
  complex?: Maybe<ResidentialComplex>;
  complexId: Scalars['String']['output'];
  consecutive: Scalars['Int']['output'];
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  /** Relato de lo ocurrido */
  description: Scalars['String']['output'];
  /** Valor de la multa cargada a la unidad */
  fineAmount?: Maybe<Scalars['Float']['output']>;
  fineChargeId?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  lat?: Maybe<Scalars['Float']['output']>;
  lng?: Maybe<Scalars['Float']['output']>;
  /** Lugar del hecho (pasillo, zona verde, ascensor…) */
  location?: Maybe<Scalars['String']['output']>;
  /** Momento del hecho, según quien reporta */
  occurredAt: Scalars['DateTime']['output'];
  pet?: Maybe<Pet>;
  /** Mascota señalada. Null mientras no se identifique */
  petId?: Maybe<Scalars['String']['output']>;
  /** SHA-256 de cada foto, en el orden de photoUrls */
  photoHashes?: Maybe<Array<Scalars['String']['output']>>;
  /** Fotos de evidencia (R2) */
  photoUrls?: Maybe<Array<Scalars['String']['output']>>;
  reportedByName?: Maybe<Scalars['String']['output']>;
  /** Rol de quien reportó, congelado al radicar */
  reportedByRole?: Maybe<Scalars['String']['output']>;
  /** Unidad desde la que se reportó */
  reportedByUnitId?: Maybe<Scalars['String']['output']>;
  reportedByUserId?: Maybe<Scalars['String']['output']>;
  /** Decisión de la administración */
  resolutionNotes?: Maybe<Scalars['String']['output']>;
  resolvedAt?: Maybe<Scalars['DateTime']['output']>;
  reviewedAt?: Maybe<Scalars['DateTime']['output']>;
  reviewedByUserId?: Maybe<Scalars['String']['output']>;
  severity: PetIncidentSeverity;
  /** Vencimiento del plazo de descargos */
  statementDueAt?: Maybe<Scalars['DateTime']['output']>;
  statements?: Maybe<Array<PetIncidentStatement>>;
  status: PetIncidentStatus;
  type: PetIncidentType;
  unit?: Maybe<Unit>;
  /** Unidad señalada. Null mientras no se identifique */
  unitId?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
};

/** Gravedad del incidente reportado */
export type PetIncidentSeverity =
  /** Riesgo para personas o animales */
  | 'HIGH'
  /** Falta leve */
  | 'LOW'
  /** Falta reiterada o con molestia a terceros */
  | 'MEDIUM';

/** Descargo de la unidad ante un reporte */
export type PetIncidentStatement = {
  __typename?: 'PetIncidentStatement';
  author?: Maybe<User>;
  authorName?: Maybe<Scalars['String']['output']>;
  /** Rol de quien responde, congelado al momento del descargo */
  authorRole?: Maybe<Scalars['String']['output']>;
  authorUserId?: Maybe<Scalars['String']['output']>;
  complexId: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['String']['output'];
  /** Soportes adjuntos (R2) */
  imageUrls?: Maybe<Array<Scalars['String']['output']>>;
  incident?: Maybe<PetIncident>;
  incidentId: Scalars['String']['output'];
  /** Texto del descargo */
  text: Scalars['String']['output'];
};

/** Estado del reporte de convivencia */
export type PetIncidentStatus =
  /** Desestimado */
  | 'DISMISSED'
  /** Resuelto con multa */
  | 'FINED'
  /** Pendiente de revisión */
  | 'REPORTED'
  /** Notificado, en plazo de descargos */
  | 'UNDER_DEFENSE'
  /** Resuelto con llamado de atención */
  | 'WARNED';

/** Motivo del reporte de convivencia */
export type PetIncidentType =
  /** Agresión o mordedura */
  | 'AGGRESSION'
  /** Maltrato o abandono del animal */
  | 'ANIMAL_ABUSE'
  /** Ruido o ladridos persistentes */
  | 'NOISE'
  /** Sin correa o sin bozal */
  | 'NO_LEASH_OR_MUZZLE'
  /** Otro motivo */
  | 'OTHER'
  /** Mascota suelta o sin acompañante */
  | 'UNATTENDED'
  /** Uso de zonas no autorizadas */
  | 'UNAUTHORIZED_AREA'
  /** Deposiciones no recogidas */
  | 'WASTE_NOT_PICKED_UP';

/** Sanción con la que se cierra un reporte validado */
export type PetSanction =
  /** Multa cargada a la unidad */
  | 'FINE'
  /** Llamado de atención */
  | 'WARNING';

/** Sexo de la mascota */
export type PetSex =
  /** Hembra */
  | 'FEMALE'
  /** Macho */
  | 'MALE'
  /** Sin determinar */
  | 'UNKNOWN';

/** Porte de la mascota */
export type PetSize =
  /** Grande (más de ~25 kg) */
  | 'LARGE'
  /** Mediano (~10 a 25 kg) */
  | 'MEDIUM'
  /** Pequeño (hasta ~10 kg) */
  | 'SMALL';

/** Especie de la mascota */
export type PetSpecies =
  /** Gato */
  | 'CAT'
  /** Perro */
  | 'DOG'
  /** Otra especie (ave, roedor, reptil…) */
  | 'OTHER';

/** Estado de la mascota dentro del complejo */
export type PetStatus =
  /** Censada y autorizada */
  | 'ACTIVE'
  /** Fallecida */
  | 'DECEASED'
  /** Esperando validación de la ficha */
  | 'PENDING_APPROVAL'
  /** Ficha rechazada */
  | 'REJECTED'
  /** Retirada del complejo */
  | 'REMOVED'
  /** Autorización suspendida */
  | 'SUSPENDED';

export type PlateCheckResponse = {
  __typename?: 'PlateCheckResponse';
  /** Vehículo autorizado para ingresar */
  isAuthorized: Scalars['Boolean']['output'];
  /** Placa registrada en el complejo */
  isRegistered: Scalars['Boolean']['output'];
  /** Mensaje explicativo para el guardia */
  message: Scalars['String']['output'];
  /** Datos del vehículo si está registrado */
  vehicle?: Maybe<Vehicle>;
};

/** Radicado PQRF de un residente */
export type Pqrf = {
  __typename?: 'Pqrf';
  acknowledgements?: Maybe<Array<PqrfAcknowledgement>>;
  /** A quién se dirige: define quién puede leerlo */
  addressee: PqrfAddressee;
  /** Número de radicado, consecutivo por complejo */
  code: Scalars['String']['output'];
  complex?: Maybe<ResidentialComplex>;
  complexId: Scalars['String']['output'];
  consecutive: Scalars['Int']['output'];
  createdAt: Scalars['DateTime']['output'];
  description: Scalars['String']['output'];
  dueAt: Scalars['DateTime']['output'];
  id: Scalars['String']['output'];
  requestedByName?: Maybe<Scalars['String']['output']>;
  requestedByUserId?: Maybe<Scalars['String']['output']>;
  residentId?: Maybe<Scalars['String']['output']>;
  resolvedAt?: Maybe<Scalars['DateTime']['output']>;
  /** Resuelto por silencio administrativo positivo */
  resolvedBySilence: Scalars['Boolean']['output'];
  status: PqrfStatus;
  subject: Scalars['String']['output'];
  type: PqrfType;
  unit?: Maybe<Unit>;
  unitId?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  /** Quien consulta puede marcarlo como resuelto */
  viewerCanResolve: Scalars['Boolean']['output'];
  /** Quien consulta ya marcó su parte */
  viewerHasResolved: Scalars['Boolean']['output'];
  /** Quien consulta es del consejo pero no le toca responderlo */
  viewerIsCouncilObserver: Scalars['Boolean']['output'];
};

/** Paso de un destinatario sobre el radicado */
export type PqrfAcknowledgement = {
  __typename?: 'PqrfAcknowledgement';
  id: Scalars['String']['output'];
  instance: PqrfAddressee;
  openedAt: Scalars['DateTime']['output'];
  pqrfId: Scalars['String']['output'];
  resolvedAt?: Maybe<Scalars['DateTime']['output']>;
  userId: Scalars['String']['output'];
  userName?: Maybe<Scalars['String']['output']>;
};

/** Instancia a la que se dirige el radicado */
export type PqrfAddressee =
  | 'ADMINISTRACION'
  | 'AMBOS'
  | 'CONSEJO';

/** Miembro del consejo y si responde los PQRF */
export type PqrfCouncilMember = {
  __typename?: 'PqrfCouncilMember';
  /** Le toca responder los PQRF dirigidos al consejo */
  canResolve: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  unitLabel?: Maybe<Scalars['String']['output']>;
  userId: Scalars['String']['output'];
};

/** Estado del radicado PQRF */
export type PqrfStatus =
  | 'EN_TRAMITE'
  | 'RADICADO'
  | 'RESUELTO';

/** Tipo de radicado: petición, queja, reclamo, sugerencia o felicitación */
export type PqrfType =
  | 'FELICITACION'
  | 'PETICION'
  | 'QUEJA'
  | 'RECLAMO'
  | 'SUGERENCIA';

/** Concepto del cargo para la prelación legal de imputación de pagos */
export type PrelacionConcept =
  | 'EXTRAORDINARY'
  | 'FINE'
  | 'INTEREST_MORA'
  | 'ORDINARY';

export type PrepaidApplicationItem = {
  __typename?: 'PrepaidApplicationItem';
  accountingHeaderId?: Maybe<Scalars['String']['output']>;
  appliedAmount: Scalars['Float']['output'];
  remainingDebt: Scalars['Float']['output'];
  remainingPrepaid: Scalars['Float']['output'];
  unitId: Scalars['String']['output'];
};

export type PrepaidApplicationResult = {
  __typename?: 'PrepaidApplicationResult';
  dryRun: Scalars['Boolean']['output'];
  items: Array<PrepaidApplicationItem>;
  totalApplied: Scalars['Float']['output'];
  unitsProcessed: Scalars['Int']['output'];
};

export type ProcessPrepaidBalancesInput = {
  complexId: Scalars['String']['input'];
  dryRun?: InputMaybe<Scalars['Boolean']['input']>;
  period: Scalars['String']['input'];
  unitIds?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type PropertyAccountStatus = {
  __typename?: 'PropertyAccountStatus';
  complexId: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  currentBalance: Scalars['Float']['output'];
  id: Scalars['ID']['output'];
  lastMovementAt?: Maybe<Scalars['DateTime']['output']>;
  prepaidBalance: Scalars['Float']['output'];
  unitId: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['Int']['output'];
};

export type PucAccount = {
  __typename?: 'PucAccount';
  accountClass: AccountClass;
  children?: Maybe<Array<PucAccount>>;
  code: Scalars['String']['output'];
  complexId: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isPostable: Scalars['Boolean']['output'];
  level: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  nature: AccountNature;
  parentId?: Maybe<Scalars['String']['output']>;
};

export type PushHealthCheckResult = {
  __typename?: 'PushHealthCheckResult';
  healthId: Scalars['String']['output'];
  sentAt: Scalars['DateTime']['output'];
};

/** Plataforma de destino para notificaciones push */
export type PushPlatform =
  | 'ANDROID'
  | 'IOS'
  | 'WEB';

export type PushSubscriptionResult = {
  __typename?: 'PushSubscriptionResult';
  success: Scalars['Boolean']['output'];
};

/** Respuesta con el token QR generado y su fecha de expiración */
export type QrLoginTokenResponse = {
  __typename?: 'QrLoginTokenResponse';
  /** Fecha y hora de expiración del token (72 horas) */
  expiresAt: Scalars['DateTime']['output'];
  /** PIN: últimos 4 dígitos del NIT base (antes del guion). El complejo ya lo conoce. */
  pin: Scalars['String']['output'];
  /** Token UUID de un solo uso para el login por QR */
  token: Scalars['String']['output'];
};

export type QrValidationResponse = {
  __typename?: 'QrValidationResponse';
  /** Token de acceso de un solo uso. Presente solo cuando isValid === true; debe enviarse a registerVisitorEntry para confirmar el ingreso de una visita programada. */
  accessToken?: Maybe<Scalars['String']['output']>;
  /** Indica si el QR es válido y permite ingreso */
  isValid: Scalars['Boolean']['output'];
  /** Mensaje de resultado del escaneo */
  message: Scalars['String']['output'];
  /** Datos de la visita si el QR es válido */
  visit?: Maybe<Visit>;
  /** Datos del visitante */
  visitor?: Maybe<Visitor>;
};

export type Query = {
  __typename?: 'Query';
  accountingDocument: AccountingHeader;
  accountingDocuments: PaginatedAccountingDocumentsResponse;
  activePanicAlerts: Array<Notification>;
  /** Retorna la visita activa del supervisor en el complejo indicado, o null. */
  activeSupervisorVisit?: Maybe<SupervisorVisit>;
  activeVisitorVehicles: Array<VisitorVehicle>;
  activeVisits: Array<Visit>;
  amenities: PaginatedAmenitiesResponse;
  amenity: Amenity;
  amenityAvailability: AmenityAvailabilityResponse;
  amenityBlackouts: Array<AmenityBlackout>;
  amenityBooking: AmenityBooking;
  amenityBookings: PaginatedAmenityBookingsResponse;
  amenityScheduleExceptions: Array<AmenityScheduleException>;
  /** Obtiene un registro de auditoría por su número de referencia (AUD-YYYYMMDD-XXXX) con labels enriquecidos. */
  auditLog: AuditLogDetailResponse;
  /** Historial de auditoría paginado. SUPER_ADMIN ve todo el sistema. COMPLEX_ROL solo ve las acciones de ACCOUNTANT_ROL, SUPERVISOR_ROL y SECURITY_ROL de su complejo. */
  auditLogs: PaginatedAuditLogsResponse;
  /** Retorna todos los módulos disponibles en el sistema */
  availableModules: Array<ComplexModule>;
  building: Building;
  buildings: PaginatedBuildingsResponse;
  callLogs: CallLogsPage;
  chargeCategories: Array<ChargeCategory>;
  chargeEmission: ChargeEmission;
  chargeEmissions: Array<ChargeEmission>;
  charges: PaginatedChargesResponse;
  checkPlate: PlateCheckResponse;
  coefficientWeighting?: Maybe<CoefficientWeighting>;
  complex: ResidentialComplex;
  complexExpenses: PaginatedExpensesResponse;
  complexFinanceConfig: ComplexFinanceConfig;
  complexFinancialSummary: ComplexFinancialSummaryResponse;
  complexIncomes: PaginatedIncomesResponse;
  /** Documentos legales dirigidos a complejos registrados (audience COMPLEX, publicados). Ej: Anexo B2B / DPA a firmar. Disponible para complejos autenticados. */
  complexLegalDocuments: Array<LegalDocument>;
  complexNotifications: PaginatedNotificationsResponse;
  complexes: PaginatedComplexesResponse;
  /** Consulta si el residente ya aprobó. El cliente hace polling hasta APPROVED. Solo responde al mismo dispositivo que pidió la autorización. */
  deviceApprovalStatus: DeviceApprovalStatusResponse;
  devicePushHealth: DevicePushHealthStatus;
  feeConfigs: Array<FeeConfig>;
  findnotes: PaginatedNotesResponse;
  getRoleHierarchy: RoleHierarchyResponse;
  /** Todos los documentos legales (incluidos no publicados). Solo SUPER_ADMIN. */
  legalDocumentsAdmin: Array<LegalDocument>;
  listingReports: PaginatedListingReportsResponse;
  maintenanceBoard: MaintenanceBoardResponse;
  maintenanceDuplicateCandidates: Array<MaintenanceTicket>;
  maintenanceHeatmap: Array<MaintenanceHeatmapCell>;
  maintenanceLocationTagByCode: MaintenanceLocationTag;
  maintenanceLocationTags: Array<MaintenanceLocationTag>;
  maintenanceMapPins: Array<MaintenanceMapPinResponse>;
  maintenanceReportOptions: MaintenanceReportOptionsResponse;
  maintenanceSlaConfigs: Array<MaintenanceSlaConfig>;
  maintenanceStats: MaintenanceStatsResponse;
  maintenanceTicket: MaintenanceTicket;
  maintenanceTickets: PaginatedMaintenanceTicketsResponse;
  maintenanceVendors: Array<MaintenanceVendor>;
  marketplaceCategories: Array<MarketplaceCategory>;
  marketplaceListing: MarketplaceListing;
  marketplaceListings: PaginatedListingsResponse;
  marketplaceSettings: MarketplaceSettings;
  marketplaceStats: MarketplaceStatsResponse;
  /** Perfil completo del usuario autenticado (usuario o complejo residencial) */
  me: MeResponse;
  /** Retorna el historial de solicitudes de acceso del supervisor (últimas 50). */
  myAccessRequests: Array<SupervisorAccessRequest>;
  myAmenityCouncilQuota: AmenityCouncilQuotaResponse;
  /** Retorna los complejos con asignación activa del supervisor. Solo puede hacer check-in en estos complejos. */
  myAssignedComplexes: Array<ResidentialComplex>;
  myNotifications: PaginatedNotificationsResponse;
  myPets: Array<Pet>;
  myPqrfRequests: PaginatedPqrfResponse;
  /** Lista los dispositivos vinculados del residente autenticado. */
  myResidentDevices: Array<ResidentDevice>;
  myResidentProfile: Resident;
  /** Retorna las últimas 50 visitas del supervisor. Filtrable por estado. */
  mySupervisorVisits: Array<SupervisorVisit>;
  myUnitAmenityBookings: PaginatedAmenityBookingsResponse;
  myUnitPackages: PaginatedPackagesResponse;
  myVisits: PaginatedVisitsResponse;
  /** Lo que el residente puede votar o consultar */
  myVotingMeetings: Array<VotingMeeting>;
  nearbyComplexes: Array<NearbyComplexResponse>;
  note: Note;
  notificationDetail: NotificationDetailResponse;
  package: Package;
  packages: PaginatedPackagesResponse;
  parkingRates: Array<VisitorParkingRate>;
  paymentsByCharge: Array<Payment>;
  /** Retorna las solicitudes de acceso PENDIENTES para un complejo. Permite al COMPLEX_ROL gestionar los supervisores que solicitan acceso. */
  pendingAccessRequests: Array<SupervisorAccessRequest>;
  /** Retorna el número de solicitudes de acceso PENDIENTES para un complejo. Úsalo para mostrar el badge numérico en la sección Supervisores del panel. */
  pendingAccessRequestsCount: Scalars['Int']['output'];
  pendingApprovalVisits: Array<Visit>;
  /** Solicitudes de ingreso esperando respuesta. Sirve de respaldo cuando el push no llegó. */
  pendingDeviceApprovals: Array<PendingDeviceApproval>;
  pendingPackagesByUnit: Array<Package>;
  pendingResidents: PaginatedResidentsResponse;
  permission: Permission;
  permissions: PaginatedPermissionsResponse;
  pet: Pet;
  petIncident: PetIncident;
  petIncidents: PaginatedPetIncidentsResponse;
  petIncidentsByPet: Array<PetIncident>;
  pets: PaginatedPetsResponse;
  petsByUnit: Array<Pet>;
  /** Verifica conectividad con el backend. Siempre retorna "pong". */
  ping: Scalars['String']['output'];
  pqrfCouncilMembers: Array<PqrfCouncilMember>;
  pqrfRequest: Pqrf;
  pqrfRequests: PaginatedPqrfResponse;
  previewChargeEmission: ChargeEmissionPreviewResponse;
  pucAccounts: Array<PucAccount>;
  recurringCharges: Array<RecurringCharge>;
  resident: Resident;
  residentByUserId?: Maybe<Resident>;
  /** Indica si la cuenta ya tiene clave de acceso. El cliente la consulta tras iniciar sesión para exigir su creación cuando falta. */
  residentHasAccessCode: Scalars['Boolean']['output'];
  residentHistoryByUnit: Array<Resident>;
  residentStats: ResidentStatsResponse;
  residents: PaginatedResidentsResponse;
  role: Role;
  roles: PaginatedRolesResponse;
  rotationStatus: RotationStatusResponse;
  scheduledVisitsToday: Array<Visit>;
  sentMessages: PaginatedSentMessagesResponse;
  sentNotifications: SentNotificationPaginatedResult;
  specialNumbers: Array<SpecialNumber>;
  /** Estado del registro mientras la app espera en "Revisa tu correo". El enlace se abre en el navegador, así que la app solo puede enterarse consultando. No devuelve datos del usuario. */
  supervisorVerificationStatus: SupervisorVerificationStatusResponse;
  unit: Unit;
  unitAccountStatement: UnitAccountStatementResponse;
  unitAccountStatus?: Maybe<PropertyAccountStatus>;
  unitBalance: UnitBalanceResponse;
  unitWallet: UnitWalletResponse;
  units: PaginatedUnitsResponse;
  unitsFinancialStatus: UnitFinancialStatusPaginated;
  unreadNotificationsCount: UnreadCountResponse;
  user?: Maybe<UserInfoCompleteResponse>;
  /** Lista paginada de usuarios. Filtrable por status y complexId. */
  users: UsersListResponse;
  vapidPublicKey: Scalars['String']['output'];
  vehicle: Vehicle;
  vehicles: PaginatedVehiclesResponse;
  vehiclesByResident: Array<Vehicle>;
  visit: Visit;
  visitor: Visitor;
  visitorParkingConfig?: Maybe<VisitorParkingConfig>;
  visitorVehicle: VisitorVehicle;
  visitorVehicles: PaginatedVisitorVehiclesResponse;
  visitors: PaginatedVisitorsResponse;
  visits: PaginatedVisitsResponse;
  /** El consejo y quién tiene voto */
  votingCouncilMembers: Array<VotingCouncilMember>;
  votingEnabled: Scalars['Boolean']['output'];
  /** Todas las reuniones (administración) */
  votingMeetings: Array<VotingMeeting>;
  votingQuestion: VotingQuestion;
  votingSettings: VotingSettings;
  walletsSummary: WalletSummaryPaginated;
  /** Indica si el canal de login por WhatsApp entrante está habilitado en el servidor. El cliente la consulta antes de ofrecer la opción, en vez de descubrirlo fallando con WA_LOGIN_NOT_CONFIGURED. No revela nada del residente: solo refleja la configuración. */
  whatsAppLoginAvailable: Scalars['Boolean']['output'];
  /** Consulta si ya llegó el mensaje del residente. El cliente hace polling hasta CONFIRMED. Solo responde al mismo dispositivo que pidió el challenge. */
  whatsAppLoginChallengeStatus: WhatsAppLoginStatusResponse;
};


export type QueryAccountingDocumentArgs = {
  complexId: Scalars['String']['input'];
  id: Scalars['String']['input'];
};


export type QueryAccountingDocumentsArgs = {
  filter: FilterAccountingDocumentsInput;
  pagination?: InputMaybe<PaginationInput>;
};


export type QueryActivePanicAlertsArgs = {
  complexId: Scalars['String']['input'];
};


export type QueryActiveSupervisorVisitArgs = {
  complexId: Scalars['String']['input'];
};


export type QueryActiveVisitorVehiclesArgs = {
  complexId: Scalars['String']['input'];
};


export type QueryActiveVisitsArgs = {
  complexId: Scalars['String']['input'];
};


export type QueryAmenitiesArgs = {
  complexId: Scalars['String']['input'];
  filters?: InputMaybe<FilterAmenitiesInput>;
  pagination?: InputMaybe<PaginationInput>;
};


export type QueryAmenityArgs = {
  amenityId: Scalars['String']['input'];
};


export type QueryAmenityAvailabilityArgs = {
  input: AmenityAvailabilityInput;
};


export type QueryAmenityBlackoutsArgs = {
  amenityId: Scalars['String']['input'];
};


export type QueryAmenityBookingArgs = {
  bookingId: Scalars['String']['input'];
};


export type QueryAmenityBookingsArgs = {
  complexId: Scalars['String']['input'];
  filters?: InputMaybe<FilterAmenityBookingsInput>;
  pagination?: InputMaybe<PaginationInput>;
};


export type QueryAmenityScheduleExceptionsArgs = {
  amenityId: Scalars['String']['input'];
  from: Scalars['String']['input'];
  to: Scalars['String']['input'];
};


export type QueryAuditLogArgs = {
  referenceNumber: Scalars['String']['input'];
};


export type QueryAuditLogsArgs = {
  filter?: InputMaybe<FilterAuditLogsInput>;
};


export type QueryBuildingArgs = {
  id: Scalars['String']['input'];
};


export type QueryBuildingsArgs = {
  complexId: Scalars['String']['input'];
  pagination?: InputMaybe<PaginationInput>;
};


export type QueryCallLogsArgs = {
  input: CallLogsInput;
};


export type QueryChargeCategoriesArgs = {
  complexId: Scalars['String']['input'];
};


export type QueryChargeEmissionArgs = {
  emissionId: Scalars['String']['input'];
};


export type QueryChargeEmissionsArgs = {
  complexId: Scalars['String']['input'];
  period?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<ChargeEmissionStatus>;
};


export type QueryChargesArgs = {
  complexId: Scalars['String']['input'];
  filters?: InputMaybe<FilterChargesInput>;
  pagination?: InputMaybe<PaginationInput>;
};


export type QueryCheckPlateArgs = {
  complexId: Scalars['String']['input'];
  plate: Scalars['String']['input'];
};


export type QueryCoefficientWeightingArgs = {
  complexId: Scalars['String']['input'];
};


export type QueryComplexArgs = {
  id: Scalars['String']['input'];
};


export type QueryComplexExpensesArgs = {
  complexId: Scalars['String']['input'];
  filters?: InputMaybe<FilterExpensesInput>;
  pagination?: InputMaybe<PaginationInput>;
};


export type QueryComplexFinanceConfigArgs = {
  complexId: Scalars['String']['input'];
};


export type QueryComplexFinancialSummaryArgs = {
  complexId: Scalars['String']['input'];
  period: Scalars['String']['input'];
};


export type QueryComplexIncomesArgs = {
  complexId: Scalars['String']['input'];
  filters?: InputMaybe<FilterIncomesInput>;
  pagination?: InputMaybe<PaginationInput>;
};


export type QueryComplexNotificationsArgs = {
  complexId: Scalars['String']['input'];
  filters?: InputMaybe<FilterNotificationsInput>;
  pagination?: InputMaybe<PaginationInput>;
};


export type QueryComplexesArgs = {
  filters?: InputMaybe<FilterComplexInput>;
  pagination?: InputMaybe<PaginationInput>;
};


export type QueryDeviceApprovalStatusArgs = {
  challengeId: Scalars['ID']['input'];
};


export type QueryDevicePushHealthArgs = {
  deviceToken: Scalars['String']['input'];
};


export type QueryFeeConfigsArgs = {
  complexId: Scalars['String']['input'];
};


export type QueryFindnotesArgs = {
  complexId: Scalars['String']['input'];
  filters?: InputMaybe<FilterNotesInput>;
  pagination?: InputMaybe<PaginationInput>;
};


export type QueryGetRoleHierarchyArgs = {
  roleId: Scalars['String']['input'];
};


export type QueryListingReportsArgs = {
  complexId: Scalars['String']['input'];
  pagination?: InputMaybe<PaginationInput>;
  status?: InputMaybe<MarketplaceReportStatus>;
};


export type QueryMaintenanceBoardArgs = {
  complexId: Scalars['String']['input'];
  filters?: InputMaybe<FilterMaintenanceTicketsInput>;
};


export type QueryMaintenanceDuplicateCandidatesArgs = {
  input: CheckMaintenanceDuplicateInput;
};


export type QueryMaintenanceHeatmapArgs = {
  complexId: Scalars['String']['input'];
  days?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryMaintenanceLocationTagByCodeArgs = {
  code: Scalars['String']['input'];
  complexId: Scalars['String']['input'];
};


export type QueryMaintenanceLocationTagsArgs = {
  complexId: Scalars['String']['input'];
  onlyActive?: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryMaintenanceMapPinsArgs = {
  complexId: Scalars['String']['input'];
  filters?: InputMaybe<FilterMaintenanceTicketsInput>;
};


export type QueryMaintenanceReportOptionsArgs = {
  complexId: Scalars['String']['input'];
};


export type QueryMaintenanceSlaConfigsArgs = {
  complexId: Scalars['String']['input'];
};


export type QueryMaintenanceStatsArgs = {
  complexId: Scalars['String']['input'];
  days?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryMaintenanceTicketArgs = {
  id: Scalars['String']['input'];
};


export type QueryMaintenanceTicketsArgs = {
  complexId: Scalars['String']['input'];
  filters?: InputMaybe<FilterMaintenanceTicketsInput>;
  pagination?: InputMaybe<PaginationInput>;
};


export type QueryMaintenanceVendorsArgs = {
  complexId: Scalars['String']['input'];
  onlyActive?: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryMarketplaceCategoriesArgs = {
  complexId: Scalars['String']['input'];
  includeInactive?: InputMaybe<Scalars['Boolean']['input']>;
  kind?: InputMaybe<MarketplaceCategoryKind>;
};


export type QueryMarketplaceListingArgs = {
  listingId: Scalars['String']['input'];
};


export type QueryMarketplaceListingsArgs = {
  complexId: Scalars['String']['input'];
  filters?: InputMaybe<FilterListingsInput>;
  pagination?: InputMaybe<PaginationInput>;
};


export type QueryMarketplaceSettingsArgs = {
  complexId: Scalars['String']['input'];
};


export type QueryMarketplaceStatsArgs = {
  complexId: Scalars['String']['input'];
};


export type QueryMyAmenityCouncilQuotaArgs = {
  amenityId: Scalars['String']['input'];
};


export type QueryMyNotificationsArgs = {
  complexId?: InputMaybe<Scalars['String']['input']>;
  filters?: InputMaybe<FilterNotificationsInput>;
  pagination?: InputMaybe<PaginationInput>;
};


export type QueryMyPetsArgs = {
  complexId: Scalars['String']['input'];
};


export type QueryMyPqrfRequestsArgs = {
  complexId: Scalars['String']['input'];
  filters?: InputMaybe<FilterPqrfInput>;
  pagination?: InputMaybe<PaginationInput>;
};


export type QueryMySupervisorVisitsArgs = {
  status?: InputMaybe<SupervisorVisitStatus>;
};


export type QueryMyUnitAmenityBookingsArgs = {
  complexId: Scalars['String']['input'];
  filters?: InputMaybe<FilterAmenityBookingsInput>;
  pagination?: InputMaybe<PaginationInput>;
};


export type QueryMyUnitPackagesArgs = {
  complexId: Scalars['String']['input'];
  filters?: InputMaybe<FilterPackagesInput>;
  pagination?: InputMaybe<PaginationInput>;
};


export type QueryMyVisitsArgs = {
  filters?: InputMaybe<FilterVisitsInput>;
  pagination?: InputMaybe<PaginationInput>;
};


export type QueryMyVotingMeetingsArgs = {
  complexId: Scalars['String']['input'];
};


export type QueryNearbyComplexesArgs = {
  lat: Scalars['Float']['input'];
  lng: Scalars['Float']['input'];
  radiusMeters?: InputMaybe<Scalars['Float']['input']>;
};


export type QueryNoteArgs = {
  id: Scalars['String']['input'];
};


export type QueryNotificationDetailArgs = {
  complexId?: InputMaybe<Scalars['String']['input']>;
  notificationId: Scalars['String']['input'];
};


export type QueryPackageArgs = {
  packageId: Scalars['String']['input'];
};


export type QueryPackagesArgs = {
  complexId: Scalars['String']['input'];
  filters?: InputMaybe<FilterPackagesInput>;
  pagination?: InputMaybe<PaginationInput>;
};


export type QueryParkingRatesArgs = {
  complexId: Scalars['String']['input'];
};


export type QueryPaymentsByChargeArgs = {
  chargeId: Scalars['String']['input'];
};


export type QueryPendingAccessRequestsArgs = {
  complexId: Scalars['String']['input'];
};


export type QueryPendingAccessRequestsCountArgs = {
  complexId: Scalars['String']['input'];
};


export type QueryPendingApprovalVisitsArgs = {
  complexId: Scalars['String']['input'];
};


export type QueryPendingPackagesByUnitArgs = {
  complexId: Scalars['String']['input'];
  unitId: Scalars['String']['input'];
};


export type QueryPendingResidentsArgs = {
  pagination?: InputMaybe<PaginationInput>;
};


export type QueryPermissionArgs = {
  id: Scalars['String']['input'];
};


export type QueryPermissionsArgs = {
  input: SearchPermissionsInput;
};


export type QueryPetArgs = {
  id: Scalars['String']['input'];
};


export type QueryPetIncidentArgs = {
  id: Scalars['String']['input'];
};


export type QueryPetIncidentsArgs = {
  complexId: Scalars['String']['input'];
  filters?: InputMaybe<FilterPetIncidentsInput>;
  pagination?: InputMaybe<PaginationInput>;
};


export type QueryPetIncidentsByPetArgs = {
  petId: Scalars['String']['input'];
};


export type QueryPetsArgs = {
  complexId: Scalars['String']['input'];
  filters?: InputMaybe<FilterPetsInput>;
  pagination?: InputMaybe<PaginationInput>;
};


export type QueryPetsByUnitArgs = {
  unitId: Scalars['String']['input'];
};


export type QueryPqrfCouncilMembersArgs = {
  complexId: Scalars['String']['input'];
};


export type QueryPqrfRequestArgs = {
  pqrfId: Scalars['String']['input'];
};


export type QueryPqrfRequestsArgs = {
  complexId: Scalars['String']['input'];
  filters?: InputMaybe<FilterPqrfInput>;
  pagination?: InputMaybe<PaginationInput>;
};


export type QueryPreviewChargeEmissionArgs = {
  emissionId: Scalars['String']['input'];
};


export type QueryPucAccountsArgs = {
  complexId: Scalars['String']['input'];
  onlyPostable?: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryRecurringChargesArgs = {
  complexId: Scalars['String']['input'];
  onlyActive?: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryResidentArgs = {
  id: Scalars['String']['input'];
};


export type QueryResidentByUserIdArgs = {
  userId: Scalars['String']['input'];
};


export type QueryResidentHistoryByUnitArgs = {
  unitId: Scalars['String']['input'];
};


export type QueryResidentStatsArgs = {
  complexId: Scalars['String']['input'];
};


export type QueryResidentsArgs = {
  complexId: Scalars['String']['input'];
  filters?: InputMaybe<FilterResidentsInput>;
  pagination?: InputMaybe<PaginationInput>;
};


export type QueryRoleArgs = {
  term: Scalars['String']['input'];
};


export type QueryRolesArgs = {
  input: SearchRolesInput;
};


export type QueryRotationStatusArgs = {
  complexId: Scalars['String']['input'];
};


export type QueryScheduledVisitsTodayArgs = {
  complexId: Scalars['String']['input'];
};


export type QuerySentMessagesArgs = {
  complexId: Scalars['String']['input'];
  pagination?: InputMaybe<PaginationInput>;
};


export type QuerySentNotificationsArgs = {
  complexId: Scalars['String']['input'];
  pagination?: InputMaybe<PaginationInput>;
};


export type QuerySpecialNumbersArgs = {
  complexId: Scalars['String']['input'];
};


export type QuerySupervisorVerificationStatusArgs = {
  supervisorId: Scalars['String']['input'];
};


export type QueryUnitArgs = {
  id: Scalars['String']['input'];
};


export type QueryUnitAccountStatementArgs = {
  complexId: Scalars['String']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  period?: InputMaybe<Scalars['String']['input']>;
  unitId: Scalars['String']['input'];
};


export type QueryUnitAccountStatusArgs = {
  complexId: Scalars['String']['input'];
  unitId: Scalars['String']['input'];
};


export type QueryUnitBalanceArgs = {
  complexId: Scalars['String']['input'];
  unitId: Scalars['String']['input'];
};


export type QueryUnitWalletArgs = {
  complexId: Scalars['String']['input'];
  unitId: Scalars['String']['input'];
};


export type QueryUnitsArgs = {
  buildingId?: InputMaybe<Scalars['String']['input']>;
  complexId: Scalars['String']['input'];
  pagination?: InputMaybe<PaginationInput>;
  search?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<UnitStatus>;
};


export type QueryUnitsFinancialStatusArgs = {
  complexId: Scalars['String']['input'];
  pagination?: InputMaybe<PaginationInput>;
  status?: InputMaybe<Scalars['String']['input']>;
};


export type QueryUnreadNotificationsCountArgs = {
  complexId?: InputMaybe<Scalars['String']['input']>;
};


export type QueryUserArgs = {
  id: Scalars['String']['input'];
};


export type QueryUsersArgs = {
  input?: InputMaybe<UsersFilterInput>;
};


export type QueryVehicleArgs = {
  id: Scalars['String']['input'];
};


export type QueryVehiclesArgs = {
  complexId: Scalars['String']['input'];
  filters?: InputMaybe<FilterVehiclesInput>;
  pagination?: InputMaybe<PaginationInput>;
};


export type QueryVehiclesByResidentArgs = {
  residentId: Scalars['String']['input'];
};


export type QueryVisitArgs = {
  id: Scalars['String']['input'];
};


export type QueryVisitorArgs = {
  id: Scalars['String']['input'];
};


export type QueryVisitorParkingConfigArgs = {
  complexId: Scalars['String']['input'];
};


export type QueryVisitorVehicleArgs = {
  id: Scalars['String']['input'];
};


export type QueryVisitorVehiclesArgs = {
  filters: FilterVisitorVehiclesInput;
  pagination?: PaginationInput;
};


export type QueryVisitorsArgs = {
  complexId: Scalars['String']['input'];
  onlyBlacklisted?: InputMaybe<Scalars['Boolean']['input']>;
  pagination?: InputMaybe<PaginationInput>;
  search?: InputMaybe<Scalars['String']['input']>;
};


export type QueryVisitsArgs = {
  complexId: Scalars['String']['input'];
  filters?: InputMaybe<FilterVisitsInput>;
  pagination?: InputMaybe<PaginationInput>;
};


export type QueryVotingCouncilMembersArgs = {
  complexId: Scalars['String']['input'];
};


export type QueryVotingEnabledArgs = {
  complexId: Scalars['String']['input'];
};


export type QueryVotingMeetingsArgs = {
  complexId: Scalars['String']['input'];
};


export type QueryVotingQuestionArgs = {
  questionId: Scalars['String']['input'];
};


export type QueryVotingSettingsArgs = {
  complexId: Scalars['String']['input'];
};


export type QueryWalletsSummaryArgs = {
  complexId: Scalars['String']['input'];
  pagination?: InputMaybe<PaginationInput>;
};


export type QueryWhatsAppLoginChallengeStatusArgs = {
  challengeId: Scalars['ID']['input'];
};

export type RateMaintenanceTicketInput = {
  comment?: InputMaybe<Scalars['String']['input']>;
  /** De 1 a 5 */
  rating: Scalars['Int']['input'];
  ticketId: Scalars['String']['input'];
};

export type RecurringCausationResult = {
  __typename?: 'RecurringCausationResult';
  caused: Scalars['Int']['output'];
  skipped: Scalars['Int']['output'];
  totalAmount: Scalars['Float']['output'];
};

export type RecurringCharge = {
  __typename?: 'RecurringCharge';
  amount: Scalars['Float']['output'];
  billingDay: Scalars['Int']['output'];
  billingMode: FeeConfigBillingMode;
  complexId: Scalars['String']['output'];
  concept: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  createdByUserId: Scalars['String']['output'];
  currentInstallment: Scalars['Int']['output'];
  distribution: RecurringChargeDistribution;
  earlyDiscountDay?: Maybe<Scalars['Int']['output']>;
  earlyDiscountPct?: Maybe<Scalars['Float']['output']>;
  id: Scalars['ID']['output'];
  incomeAccountId: Scalars['String']['output'];
  isActive: Scalars['Boolean']['output'];
  lastBilledPeriod?: Maybe<Scalars['String']['output']>;
  prorateByCoefficient: Scalars['Boolean']['output'];
  targetRules?: Maybe<FeeConfigTargetRules>;
  targetUnitIds?: Maybe<Array<Scalars['String']['output']>>;
  totalInstallments?: Maybe<Scalars['Int']['output']>;
  triggerType: RecurringChargeTrigger;
  type: RecurringChargeType;
  unitId?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  vehicleTypes?: Maybe<Array<Scalars['String']['output']>>;
};

/** Método de reparto del monto de un cobro recurrente */
export type RecurringChargeDistribution =
  | 'COEFFICIENT'
  | 'EQUAL'
  | 'FIXED_PER_UNIT';

/** Mecanismo de asignación de un cobro recurrente */
export type RecurringChargeTrigger =
  | 'MANUAL'
  | 'VEHICLE';

/** Modalidad de recurrencia de un cobro programado */
export type RecurringChargeType =
  | 'DEFERRED'
  | 'INDEFINITE'
  | 'ONE_TIME';

export type RegisterBulkPaymentInput = {
  amount: Scalars['Float']['input'];
  complexId: Scalars['String']['input'];
  method: PaymentMethod;
  notes?: InputMaybe<Scalars['String']['input']>;
  paidAt: Scalars['String']['input'];
  reference?: InputMaybe<Scalars['String']['input']>;
  unitId: Scalars['String']['input'];
};

export type RegisterBulkPaymentResponse = {
  __typename?: 'RegisterBulkPaymentResponse';
  created: Scalars['Int']['output'];
  paid: Scalars['Int']['output'];
};

export type RegisterDirectIncomeInput = {
  amount: Scalars['Float']['input'];
  category: IncomeCategory;
  complexId: Scalars['String']['input'];
  description: Scalars['String']['input'];
  incomeDate: Scalars['DateTime']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  period: Scalars['String']['input'];
  receiptUrl?: InputMaybe<Scalars['String']['input']>;
};

export type RegisterExpenseInput = {
  amount: Scalars['Float']['input'];
  category: ExpenseCategory;
  complexId: Scalars['String']['input'];
  description: Scalars['String']['input'];
  expenseDate: Scalars['DateTime']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  period: Scalars['String']['input'];
  receiptUrl?: InputMaybe<Scalars['String']['input']>;
};

export type RegisterListingInterestInput = {
  listingId: Scalars['String']['input'];
  /** Mensaje corto para el publicador */
  message?: InputMaybe<Scalars['String']['input']>;
};

export type RegisterPackageInput = {
  complexId: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  maxStorageDays?: InputMaybe<Scalars['Float']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  photoUrl?: InputMaybe<Scalars['String']['input']>;
  recipientName?: InputMaybe<Scalars['String']['input']>;
  senderName: Scalars['String']['input'];
  trackingCode?: InputMaybe<Scalars['String']['input']>;
  type?: PackageType;
  unitId: Scalars['String']['input'];
};

export type RegisterPaymentInput = {
  amount: Scalars['Float']['input'];
  chargeId: Scalars['String']['input'];
  method: PaymentMethod;
  notes?: InputMaybe<Scalars['String']['input']>;
  paidAt: Scalars['String']['input'];
  receiptUrl?: InputMaybe<Scalars['String']['input']>;
  reference?: InputMaybe<Scalars['String']['input']>;
};

/** Datos para el auto-registro de un supervisor en la plataforma */
export type RegisterSupervisorInput = {
  /** Número de documento de identidad */
  documentNumber: Scalars['String']['input'];
  /** Correo electrónico */
  email: Scalars['String']['input'];
  /** Nombre completo del supervisor */
  fullName: Scalars['String']['input'];
  /** Contraseña (mínimo 8 caracteres) */
  password: Scalars['String']['input'];
  /** Número de teléfono celular colombiano (ej: 3001234567) */
  phone: Scalars['String']['input'];
};

/** Respuesta al auto-registro de supervisor */
export type RegisterSupervisorResponse = {
  __typename?: 'RegisterSupervisorResponse';
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
  /** ID del supervisor creado; null si hubo error o el correo ya existe */
  supervisorId?: Maybe<Scalars['String']['output']>;
};

export type RegisterVehicleInput = {
  /** Marca. Ej: Toyota, Renault */
  brand?: InputMaybe<Scalars['String']['input']>;
  /** Color del vehículo */
  color?: InputMaybe<Scalars['String']['input']>;
  /** ID del complejo */
  complexId: Scalars['String']['input'];
  fuelType?: InputMaybe<VehicleFuelType>;
  /** Modelo. Ej: Corolla, Logan */
  model?: InputMaybe<Scalars['String']['input']>;
  /** Notas adicionales */
  notes?: InputMaybe<Scalars['String']['input']>;
  /** Número de parqueadero asignado (opcional) */
  parkingSpot?: InputMaybe<Scalars['String']['input']>;
  /** URL de la foto del vehículo */
  photoUrl?: InputMaybe<Scalars['String']['input']>;
  /** Placa del vehículo. Ej: ABC123, ABC12D */
  plate: Scalars['String']['input'];
  /** Tipo de vehículo */
  type?: VehicleType;
  /** ID de la unidad a la que pertenece el vehículo */
  unitId: Scalars['String']['input'];
  /** Año del modelo */
  year?: InputMaybe<Scalars['Int']['input']>;
};

/** Datos para registrar el ingreso de un vehículo visitante */
export type RegisterVisitorVehicleInput = {
  /** ID del complejo residencial */
  complexId: Scalars['String']['input'];
  /** Nombre del conductor (opcional) */
  driverName?: InputMaybe<Scalars['String']['input']>;
  /** ID del residente anfitrión que recibe la visita */
  hostResidentId: Scalars['String']['input'];
  /** Notas adicionales */
  notes?: InputMaybe<Scalars['String']['input']>;
  /** Placa del vehículo visitante */
  plate: Scalars['String']['input'];
  /** Tipo de vehículo (carro, moto, etc.) */
  vehicleType: VehicleType;
};

export type RegisterWalkInInput = {
  /** ID del complejo */
  complexId: Scalars['String']['input'];
  /** ID del residente anfitrión */
  hostResidentId: Scalars['String']['input'];
  /** Datos del documento; se guardan en el visitante */
  metadata?: InputMaybe<Scalars['JSON']['input']>;
  /** Observaciones del guardia */
  notes?: InputMaybe<Scalars['String']['input']>;
  /** Motivo de la visita */
  purpose?: InputMaybe<Scalars['String']['input']>;
  type?: VisitType;
  /** ID de la unidad destino */
  unitId: Scalars['String']['input'];
  /** Placa del vehículo (si aplica) */
  vehiclePlate?: InputMaybe<Scalars['String']['input']>;
  /** Número de documento */
  visitorIdentity: Scalars['String']['input'];
  visitorLastName: Scalars['String']['input'];
  visitorName: Scalars['String']['input'];
  /** Teléfono del visitante */
  visitorPhone?: InputMaybe<Scalars['String']['input']>;
  /** URL de la foto capturada en portería */
  visitorPhotoUrl?: InputMaybe<Scalars['String']['input']>;
};

export type RejectAccessRequestInput = {
  /** Motivo del rechazo (visible para el supervisor) */
  reason?: InputMaybe<Scalars['String']['input']>;
  /** ID de la solicitud a rechazar */
  requestId: Scalars['String']['input'];
};

export type RejectAmenityBookingInput = {
  bookingId: Scalars['String']['input'];
  /** Motivo del rechazo. Obligatorio: el residente debe saber por qué */
  reason: Scalars['String']['input'];
};

export type RejectResidentInput = {
  /** Razón del rechazo (obligatoria) */
  rejectionReason: Scalars['String']['input'];
  /** ID del registro de residente a rechazar */
  residentId: Scalars['String']['input'];
};

export type RemovePermissionResponse = {
  __typename?: 'RemovePermissionResponse';
  /** Date when the permission was created */
  createdAt: Scalars['DateTime']['output'];
  /** Date when the permission was deleted */
  deletedAt: Scalars['DateTime']['output'];
  /** Permission dependencies */
  dependsOn: Array<PermissionDependencyRemoveResponse>;
  /** Description of the permission */
  description: Scalars['String']['output'];
  /** Category of the permission */
  group: Scalars['String']['output'];
  /** Unique identifier of the permission */
  id: Scalars['String']['output'];
  /** Indicates if it is a system permission */
  isSystem: Scalars['Boolean']['output'];
  /** Additional metadata */
  labbel?: Maybe<Scalars['String']['output']>;
  /** Level of the permission */
  level: PermissionLevel;
  /** Success message */
  message: Scalars['String']['output'];
  /** Name of the permission */
  name: ValidPermissions;
  /** Status of the permission (false when deleted) */
  status: Scalars['Boolean']['output'];
};

export type RemoveRoleResponse = {
  __typename?: 'RemoveRoleResponse';
  /** Number of ancestor roles affected by this deletion */
  affectedAncestorsCount: Scalars['Int']['output'];
  /** Creation timestamp */
  createdAt: Scalars['DateTime']['output'];
  /** Deletion timestamp */
  deletedAt: Scalars['DateTime']['output'];
  /** description of the role */
  description?: Maybe<Scalars['String']['output']>;
  /** Hierarchy level (0=highest, 1=second, 2=third, 3=fourth, 4=lowest) */
  hierarchyLevel: Scalars['Int']['output'];
  /** id of the role */
  id: Scalars['String']['output'];
  /** indicates if role is system role */
  isSystem: Scalars['Boolean']['output'];
  /** Success message about the deletion */
  message: Scalars['String']['output'];
  /** Stores dynamic rules and deletion metadata. */
  metadata?: Maybe<Scalars['JSON']['output']>;
  /** name of the role */
  name: ValidRoles;
  /** parent role for hierarchy */
  parent?: Maybe<SimpleRoleResponse>;
  /** permissions assigned to this role */
  permissions?: Maybe<Array<SimplePermissionResponse>>;
  /** indicates if role is active */
  status: Scalars['Boolean']['output'];
};

/** Resultado de la operación de eliminación de personal */
export type RemoveStaffAction =
  /** Se quitó el rol de personal; el usuario continúa como residente */
  | 'STAFF_ROLE_REMOVED'
  /** El usuario fue dado de baja (soft delete); sus credenciales quedan disponibles para nuevos registros */
  | 'USER_DELETED';

/** Datos para eliminar un miembro del personal del complejo */
export type RemoveStaffMemberInput = {
  /** ID del complejo del que se elimina al personal */
  complexId: Scalars['String']['input'];
  /** Rol específico a revocar: SECURITY_ROL | SUPERVISOR_ROL | ACCOUNTANT_ROL */
  role: ValidRoles;
  /** ID del usuario a eliminar del personal */
  userId: Scalars['String']['input'];
};

/** Resultado de eliminar un miembro del personal */
export type RemoveStaffMemberResponse = {
  __typename?: 'RemoveStaffMemberResponse';
  action: RemoveStaffAction;
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type ReportListingInput = {
  comment?: InputMaybe<Scalars['String']['input']>;
  listingId: Scalars['String']['input'];
  reason: MarketplaceReportReason;
};

export type RequestComplexAccessInput = {
  /** ID del complejo al que el supervisor solicita acceso */
  complexId: Scalars['String']['input'];
  /** Latitud GPS actual del supervisor (-90 a 90) */
  lat: Scalars['Float']['input'];
  /** Longitud GPS actual del supervisor (-180 a 180) */
  lng: Scalars['Float']['input'];
  /** Mensaje opcional para el administrador del complejo */
  message?: InputMaybe<Scalars['String']['input']>;
};

/** Solicitud de OTP para residentes */
export type RequestOtpInput = {
  /** Número de celular del residente (ej: 3001234567) */
  phoneNumber: Scalars['String']['input'];
};

export type RequestPasswordResetResponse = {
  __typename?: 'RequestPasswordResetResponse';
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type RequestSecurityCallResult = {
  __typename?: 'RequestSecurityCallResult';
  message?: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
};

export type ResetPasswordInput = {
  newPassword: Scalars['String']['input'];
  token: Scalars['String']['input'];
};

/** Datos para registrar la salida de vehículos visitantes */
export type ResgiterExitVehicle = {
  /** Metodos de pago del parqueadero */
  paymentMethod?: ParkingPaymentMethod;
  /** ID del vehiculo en parqueadero */
  visitorVehicleId: Scalars['String']['input'];
};

/** Relación entre un Usuario y una Unidad dentro de un Complejo */
export type Resident = {
  __typename?: 'Resident';
  /** Fecha de aprobación */
  approvedAt?: Maybe<Scalars['DateTime']['output']>;
  /** Compliance Officer que aprobó/rechazó */
  approvedByUser?: Maybe<User>;
  /** ID del Compliance Officer que aprobó/rechazó */
  approvedByUserId?: Maybe<Scalars['String']['output']>;
  /** Complejo al que pertenece */
  complex?: Maybe<ResidentialComplex>;
  /** ID del complejo (desnormalizado para multi-tenant) */
  complexId: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  /** Apellido del contacto de emergencia */
  emergencyContactLastName?: Maybe<Scalars['String']['output']>;
  /** Nombre del contacto de emergencia */
  emergencyContactName?: Maybe<Scalars['String']['output']>;
  /** Teléfono del contacto de emergencia */
  emergencyContactPhone?: Maybe<Scalars['String']['output']>;
  /** Fecha de fin de contrato (para arrendatarios) */
  endDate?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['String']['output'];
  /** Miembro del consejo de administración */
  isCouncilMember: Scalars['Boolean']['output'];
  /** Es el residente principal de la unidad */
  isMainResident: Scalars['Boolean']['output'];
  /** Fecha real de mudanza */
  moveOutDate?: Maybe<Scalars['DateTime']['output']>;
  /** Razón de salida */
  moveOutReason?: Maybe<Scalars['String']['output']>;
  /** Notas internas del administrador */
  notes?: Maybe<Scalars['String']['output']>;
  /** Razón de rechazo por el Compliance Officer */
  rejectionReason?: Maybe<Scalars['String']['output']>;
  /** Fecha de inicio de residencia */
  startDate: Scalars['String']['output'];
  /** Estado actual del residente */
  status: ResidentStatus;
  /** Rol del residente respecto a la unidad */
  type: ResidentType;
  /** Unidad asignada */
  unit?: Maybe<Unit>;
  /** ID de la unidad asignada */
  unitId: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  /** Usuario residente */
  user?: Maybe<User>;
  /** ID del usuario residente */
  userId: Scalars['String']['output'];
};

/** Dispositivo vinculado a un residente */
export type ResidentDevice = {
  __typename?: 'ResidentDevice';
  createdAt: Scalars['DateTime']['output'];
  /** Identificador del dispositivo (header x-device-id) */
  deviceId: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isRevoked: Scalars['Boolean']['output'];
  /** Nombre legible del dispositivo */
  label?: Maybe<Scalars['String']['output']>;
  lastUsedAt?: Maybe<Scalars['DateTime']['output']>;
  platform?: Maybe<Scalars['String']['output']>;
  revokedReason?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  userId: Scalars['String']['output'];
};

/** Estadísticas del módulo de residentes para un complejo */
export type ResidentStatsResponse = {
  __typename?: 'ResidentStatsResponse';
  /** Residentes activos y verificados */
  active: Scalars['Int']['output'];
  /** Desglose por tipo de residente (solo activos) */
  byType: ResidentTypeBreakdown;
  /** Residentes principales activos (uno por unidad) */
  mainResidents: Scalars['Int']['output'];
  /** Residentes que se mudaron */
  movedOut: Scalars['Int']['output'];
  /** Solicitudes pendientes de aprobación */
  pendingApproval: Scalars['Int']['output'];
  /** Solicitudes rechazadas */
  rejected: Scalars['Int']['output'];
  /** Residentes actualmente suspendidos */
  suspended: Scalars['Int']['output'];
  /** Total de registros activos (no eliminados) */
  total: Scalars['Int']['output'];
};

/** Estado del residente dentro del complejo */
export type ResidentStatus =
  /** Residente activo y verificado */
  | 'ACTIVE'
  /** Se mudó de la unidad */
  | 'MOVED_OUT'
  /** Esperando aprobación del Compliance Officer */
  | 'PENDING_APPROVAL'
  /** Solicitud rechazada por documentación inválida */
  | 'REJECTED'
  /** Suspendido temporalmente */
  | 'SUSPENDED';

/** Tipo de residente respecto a la unidad */
export type ResidentType =
  /** Cuidador o empleado doméstico permanente */
  | 'CARETAKER'
  /** Familiar del propietario o inquilino */
  | 'FAMILY_MEMBER'
  /** Propietario del inmueble */
  | 'OWNER'
  /** Arrendatario o inquilino */
  | 'TENANT';

export type ResidentTypeBreakdown = {
  __typename?: 'ResidentTypeBreakdown';
  caretakers: Scalars['Int']['output'];
  familyMembers: Scalars['Int']['output'];
  owners: Scalars['Int']['output'];
  tenants: Scalars['Int']['output'];
};

/** Complejo residencial del sistema */
export type ResidentialComplex = {
  __typename?: 'ResidentialComplex';
  /** Fecha/hora en que se aceptaron Términos, Privacidad y DPA durante el registro */
  acceptedTermsAt?: Maybe<Scalars['DateTime']['output']>;
  /** Date until which the account is blocked due to failed attempts */
  accountLockedUntil?: Maybe<Scalars['DateTime']['output']>;
  /** Dirección principal del complejo */
  address?: Maybe<Scalars['String']['output']>;
  /** Torres o edificios del complejo */
  buildings?: Maybe<Array<Building>>;
  /** Ciudad */
  city?: Maybe<Scalars['String']['output']>;
  /** País */
  country: Scalars['String']['output'];
  /** CountryCode */
  countryCode: Country;
  /** URL de imagen de portada */
  coverUrl?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  /** Descripción del complejo */
  description?: Maybe<Scalars['String']['output']>;
  /** Email administrativo */
  email?: Maybe<Scalars['String']['output']>;
  /** Módulos habilitados para este complejo. Si es null o vacío, todos los módulos están habilitados. */
  enabledModules?: Maybe<Array<Scalars['String']['output']>>;
  /** Date until which the account is blocked due to failed attempts */
  failedLoginAttempts?: Maybe<Scalars['DateTime']['output']>;
  /** Radio en metros para validar presencia GPS (por defecto 200 m) */
  gpsRadius?: Maybe<Scalars['Int']['output']>;
  id: Scalars['String']['output'];
  /** Date of last password change */
  lastPasswordChange?: Maybe<Scalars['DateTime']['output']>;
  /** Latitud GPS del complejo para validación de presencia */
  latitude?: Maybe<Scalars['Float']['output']>;
  /** URL del documento del representante legal (R2) */
  legalRepDocumentUrl?: Maybe<Scalars['String']['output']>;
  legalRepresentative?: Maybe<User>;
  /** ID del usuario representante legal */
  legalRepresentativeId?: Maybe<Scalars['String']['output']>;
  /** Nombre del representante legal */
  legalRepresentativeName?: Maybe<Scalars['String']['output']>;
  /** URL del logo del complejo */
  logoUrl?: Maybe<Scalars['String']['output']>;
  /** Longitud GPS del complejo para validación de presencia */
  longitude?: Maybe<Scalars['Float']['output']>;
  /** Días para el autocierre de un reparado */
  maintenanceAutoCloseDays: Scalars['Int']['output'];
  /** Horas para detectar reportes duplicados */
  maintenanceDuplicateWindowHours: Scalars['Int']['output'];
  /** Precisión mínima del GPS para pintar el pin (metros) */
  maintenanceGpsAccuracyMeters: Scalars['Int']['output'];
  /** Días para reabrir un ticket cerrado */
  maintenanceReopenWindowDays: Scalars['Int']['output'];
  /** Los residentes pueden radicar tickets de mantenimiento */
  maintenanceResidentReportingEnabled: Scalars['Boolean']['output'];
  /** Máximo de unidades permitidas por el plan */
  maxUnits: Scalars['Int']['output'];
  /** Nombre del complejo */
  name: Scalars['String']['output'];
  /** NIT o identificación fiscal */
  nit?: Maybe<Scalars['String']['output']>;
  /** Número de torres (APARTMENT_COMPLEX / MIXED_COMPLEX) */
  numberOfTowers?: Maybe<Scalars['Int']['output']>;
  /** Propietario/administrador principal */
  owner?: Maybe<User>;
  /** ID del propietario/administrador principal */
  ownerId: Scalars['String']['output'];
  /** Password */
  password?: Maybe<Scalars['String']['output']>;
  /** Indica si el usuario tiene contraseña establecida */
  passwordSet: Scalars['Boolean']['output'];
  /** Días de anticipación del aviso de vencimiento */
  petsExpiryReminderDays: Scalars['Int']['output'];
  /** Máximo de mascotas por unidad. 0 = sin límite */
  petsMaxPerUnit: Scalars['Int']['output'];
  /** Los residentes pueden reportar incumplimientos */
  petsResidentReportingEnabled: Scalars['Boolean']['output'];
  /** Días de plazo para presentar descargos */
  petsStatementDays: Scalars['Int']['output'];
  /** Teléfono de administración */
  phoneNumber?: Maybe<Scalars['String']['output']>;
  /** Plan de suscripción activo */
  plan: ComplexPlan;
  /** Consejeros que responden los PQRF. Vacío = todo el consejo */
  pqrfCouncilResolverUserIds: Array<Scalars['String']['output']>;
  /** Horas entre recordatorios. 0 = sin recordatorios */
  pqrfReminderIntervalHours: Scalars['Int']['output'];
  /** Días antes del vencimiento en que empiezan los recordatorios */
  pqrfReminderLeadDays: Scalars['Int']['output'];
  /** Días que tiene el complejo para resolver un PQRF */
  pqrfResolutionDays: Scalars['Int']['output'];
  /** Rol fijo del complejo residencial */
  roles: Array<ValidRoles>;
  /** URL del RUT del complejo (R2) */
  rutFileUrl?: Maybe<Scalars['String']['output']>;
  /** Configuración avanzada del complejo */
  settings?: Maybe<Scalars['JSON']['output']>;
  /** Nombre del archivo del DPA firmado */
  signedDpaFileName?: Maybe<Scalars['String']['output']>;
  /** Motivo del rechazo del DPA firmado (si fue rechazado) */
  signedDpaRejectionReason?: Maybe<Scalars['String']['output']>;
  /** Fecha en que el SUPER_ADMIN revisó (aprobó/rechazó) el DPA firmado */
  signedDpaReviewedAt?: Maybe<Scalars['DateTime']['output']>;
  /** Estado de validación del DPA firmado (revisión del SUPER_ADMIN) */
  signedDpaStatus?: Maybe<DpaValidationStatus>;
  /** Fecha de subida del DPA firmado */
  signedDpaUploadedAt?: Maybe<Scalars['DateTime']['output']>;
  /** URL del DPA (Anexo B2B) firmado, subido por el complejo (R2) */
  signedDpaUrl?: Maybe<Scalars['String']['output']>;
  /** Slug único derivado del nombre */
  slug: Scalars['String']['output'];
  /** Departamento o estado */
  state?: Maybe<Scalars['String']['output']>;
  /** Estado operativo del complejo */
  status: ComplexStatus;
  /** token version */
  tokenVersion?: Maybe<Scalars['String']['output']>;
  /** Total de unidades declaradas al registrar */
  totalUnits?: Maybe<Scalars['Int']['output']>;
  /** Tipo de complejo residencial */
  type: ComplexType;
  updatedAt: Scalars['DateTime']['output'];
  /** Reuniones del consejo visibles para el consejo */
  votingCouncilEnabled: Scalars['Boolean']['output'];
  /** Consejeros con voz pero sin voto en las reuniones del consejo */
  votingCouncilVoiceOnlyUserIds: Array<Scalars['String']['output']>;
  /** Asambleas visibles para los residentes */
  votingEnabled: Scalars['Boolean']['output'];
  /** Sitio web */
  website?: Maybe<Scalars['String']['output']>;
  /** Código postal */
  zipCode?: Maybe<Scalars['String']['output']>;
};

export type ResolveListingReportInput = {
  accept: Scalars['Boolean']['input'];
  note?: InputMaybe<Scalars['String']['input']>;
  reportId: Scalars['String']['input'];
};

export type RestorePermissionResponse = {
  __typename?: 'RestorePermissionResponse';
  /** Date when the permission was created */
  createdAt: Scalars['DateTime']['output'];
  /** Permission dependencies */
  dependsOn: Array<PermissionDependencyRemoveResponse>;
  /** Description of the permission */
  description: Scalars['String']['output'];
  /** group of the permission */
  group: Scalars['String']['output'];
  /** Unique identifier of the permission */
  id: Scalars['String']['output'];
  /** Indicates if it is a system permission */
  isSystem: Scalars['Boolean']['output'];
  /** Additional metadata */
  label?: Maybe<Scalars['String']['output']>;
  /** Level of the permission */
  level: PermissionLevel;
  /** Success message */
  message: Scalars['String']['output'];
  /** Name of the permission */
  name: ValidPermissions;
  /** Date when the permission was restored */
  restoredAt: Scalars['DateTime']['output'];
  /** Status of the permission (true when restored) */
  status: Scalars['Boolean']['output'];
};

export type RestoreRoleResponse = {
  __typename?: 'RestoreRoleResponse';
  /** Number of ancestor roles affected by this restoration */
  affectedAncestorsCount?: Maybe<Scalars['Int']['output']>;
  /** Creation timestamp */
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  /** description of the role */
  description?: Maybe<Scalars['String']['output']>;
  /** Hierarchy level (0=highest, 1=second, 2=third, 3=fourth, 4=lowest) */
  hierarchyLevel?: Maybe<Scalars['Int']['output']>;
  /** id of the role */
  id: Scalars['String']['output'];
  /** indicates if role is system role */
  isSystem?: Maybe<Scalars['Boolean']['output']>;
  /** Success message about the restoration */
  message?: Maybe<Scalars['String']['output']>;
  /** Stores dynamic rules and restoration metadata. */
  metadata?: Maybe<Scalars['JSON']['output']>;
  /** name of the role */
  name: ValidRoles;
  /** parent role for hierarchy */
  parent?: Maybe<SimpleRoleResponse>;
  /** permissions assigned to this role */
  permissions?: Maybe<Array<SimplePermissionResponse>>;
  /** Restoration timestamp */
  restoredAt?: Maybe<Scalars['DateTime']['output']>;
  /** indicates if role is active */
  status?: Maybe<Scalars['Boolean']['output']>;
};

/** Resultado de la reversión de una acción de auditoría */
export type RevertAuditResponse = {
  __typename?: 'RevertAuditResponse';
  /** El registro de auditoría que fue revertido */
  auditLog: AuditLog;
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type Role = {
  __typename?: 'Role';
  /** child roles in hierarchy */
  children?: Maybe<Array<SimpleRoleResponse>>;
  createdAt: Scalars['DateTime']['output'];
  createdByUser?: Maybe<User>;
  /** description of the role */
  description?: Maybe<Scalars['String']['output']>;
  /** name of the role */
  frontName: Scalars['String']['output'];
  /** Hierarchy level (0=highest, 1=second, 2=third, 3=fourth, 4=lowest) */
  hierarchyLevel: Scalars['Int']['output'];
  /** icon of the role that will be visible in the frontend  */
  icon: Scalars['String']['output'];
  /** id of the role */
  id: Scalars['String']['output'];
  /** indicates if role is system role */
  isSystem: Scalars['Boolean']['output'];
  /** Stores dynamic rules. */
  metadata?: Maybe<Scalars['JSON']['output']>;
  /** name of the role */
  name: ValidRoles;
  /** parent role for hierarchy */
  parent?: Maybe<Role>;
  /** permissions assigned to this role */
  permissions?: Maybe<Array<Permission>>;
  /** indicates if role is active */
  status: Scalars['Boolean']['output'];
  updatedAt: Scalars['DateTime']['output'];
  updatedByUser?: Maybe<User>;
  userRoles?: Maybe<Array<UserRole>>;
};

export type RoleHierarchyResponse = {
  __typename?: 'RoleHierarchyResponse';
  /** Ancestor roles */
  ancestors: Array<HierarchyRoleInfo>;
  /** Descendant roles */
  descendants: Array<HierarchyRoleInfo>;
  /** Direct permissions */
  directPermissions: Array<PermissionWithSource>;
  /** All effective permissions */
  effectivePermissions: Array<PermissionWithSource>;
  /** Role information */
  role: SimpleRoleResponse;
  /** Hierarchy statistics */
  stats: HierarchyStats;
};

export type RolesFiltersInput = {
  createdAt?: InputMaybe<DateRangeInput>;
  hierarchyLevel?: InputMaybe<Scalars['Int']['input']>;
  isSystem?: InputMaybe<Scalars['Boolean']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Unidad de tiempo para el intervalo de rotación de parqueaderos */
export type RotationIntervalUnit =
  /** Días (ej: cada 30 días) */
  | 'DAYS'
  /** Meses (ej: cada 3 meses) */
  | 'MONTHS'
  /** Semanas (ej: cada 2 semanas) */
  | 'WEEKS';

/** Estado completo de la rotación de parqueaderos del complejo */
export type RotationStatusResponse = {
  __typename?: 'RotationStatusResponse';
  /** Estado de la rotación desglosado por tipo de vehículo */
  byType: Array<RotationTypeStatus>;
  /** Configuración activa de la rotación */
  config?: Maybe<ParkingRotationConfig>;
  /** Si hay configuración de rotación definida para el complejo */
  isConfigured: Scalars['Boolean']['output'];
};

/** Estado de la rotación para un tipo de vehículo */
export type RotationTypeStatus = {
  __typename?: 'RotationTypeStatus';
  /** Vehículos activos con acceso a parqueadero */
  activeVehicles: Scalars['Int']['output'];
  /** Cupos de parqueadero disponibles para este tipo */
  availableSlots: Scalars['Int']['output'];
  /** Exceso de vehículos (totalVehicles - availableSlots). 0 si no hay exceso. */
  excessVehicles: Scalars['Int']['output'];
  /** Número del gran ciclo actual para este tipo */
  grandCycleNumber: Scalars['Int']['output'];
  /** Próximos candidatos a ser suspendidos en la siguiente rotación (ordenados por prioridad: menos rotaciones → más antiguo en rotación) */
  nextRotationCandidates: Array<Vehicle>;
  /** Vehículos actualmente fuera por rotación */
  suspendedByRotationCount: Scalars['Int']['output'];
  /** Total de vehículos registrados activos y en rotación */
  totalVehicles: Scalars['Int']['output'];
  /** Tipo de vehículo (ej: CAR, MOTORCYCLE) */
  vehicleType: Scalars['String']['output'];
  /** Vehículos actualmente fuera por rotación */
  vehiclesSuspendedByRotation: Array<Vehicle>;
};

export type SanctionPetIncidentInput = {
  /** Valor de la multa. Requerido si sanction = FINE */
  fineAmount?: InputMaybe<Scalars['Float']['input']>;
  incidentId: Scalars['String']['input'];
  /** Motivación de la decisión */
  resolutionNotes: Scalars['String']['input'];
  /** Llamado de atención o multa */
  sanction: PetSanction;
};

export type SaveMobileTokenInput = {
  appVersion?: InputMaybe<Scalars['String']['input']>;
  complexId: Scalars['String']['input'];
  deviceModel?: InputMaybe<Scalars['String']['input']>;
  deviceToken: Scalars['String']['input'];
  manufacturer?: InputMaybe<Scalars['String']['input']>;
  osVersion?: InputMaybe<Scalars['String']['input']>;
  platform: PushPlatform;
};

export type SavePushSubscriptionInput = {
  auth: Scalars['String']['input'];
  complexId: Scalars['String']['input'];
  endpoint: Scalars['String']['input'];
  p256dh: Scalars['String']['input'];
};

export type SaveSentMessageInput = {
  body: Scalars['String']['input'];
  channel: MessageChannel;
  complexId: Scalars['String']['input'];
  messageType: MessageType;
  recipientCount: Scalars['Int']['input'];
  recipientPhones: Array<Scalars['String']['input']>;
  unitId: Scalars['String']['input'];
  unitNumber: Scalars['String']['input'];
};

export type ScheduleVisitInput = {
  /** ID del complejo */
  complexId: Scalars['String']['input'];
  /** Fecha y hora de llegada esperada (ISO 8601) */
  expectedArrivalAt: Scalars['String']['input'];
  /** Fecha y hora límite de llegada (ISO 8601) */
  expectedArrivalUntil?: InputMaybe<Scalars['String']['input']>;
  /** ID del residente que agenda (anfitrión) */
  hostResidentId: Scalars['String']['input'];
  /** Tipo de documento del visitante */
  identityType?: VisitorIdentityType;
  notes?: InputMaybe<Scalars['String']['input']>;
  /** Motivo de la visita */
  purpose?: InputMaybe<Scalars['String']['input']>;
  /** ID de la unidad destino */
  unitId: Scalars['String']['input'];
  /** Placa del vehículo (si aplica) */
  vehiclePlate?: InputMaybe<Scalars['String']['input']>;
  /** Número de documento del visitante */
  visitorIdentity: Scalars['String']['input'];
  visitorLastName: Scalars['String']['input'];
  visitorName: Scalars['String']['input'];
  visitorPhone?: InputMaybe<Scalars['String']['input']>;
};

export type SearchPermissionsInput = {
  filters?: InputMaybe<PermissionFiltersInput>;
  pagination?: InputMaybe<PaginationInput>;
  sort?: InputMaybe<SortInput>;
};

export type SearchRolesInput = {
  filters?: InputMaybe<RolesFiltersInput>;
  pagination?: InputMaybe<PaginationInput>;
  sort?: InputMaybe<SortInput>;
};

export type SendNotificationInput = {
  body: Scalars['String']['input'];
  complexId: Scalars['String']['input'];
  metadata?: InputMaybe<Scalars['JSON']['input']>;
  priority?: InputMaybe<NotificationPriority>;
  targetRoles?: InputMaybe<Array<Scalars['String']['input']>>;
  targetUnitId?: InputMaybe<Scalars['String']['input']>;
  title: Scalars['String']['input'];
  type?: InputMaybe<NotificationType>;
};

export type SendNotificationResult = {
  __typename?: 'SendNotificationResult';
  body: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  title: Scalars['String']['output'];
};

/** Mensaje enviado a residentes del complejo */
export type SentMessage = {
  __typename?: 'SentMessage';
  body: Scalars['String']['output'];
  channel: MessageChannel;
  complex?: Maybe<ResidentialComplex>;
  complexId: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['String']['output'];
  messageType: MessageType;
  recipientCount: Scalars['Int']['output'];
  recipientPhones: Array<Scalars['String']['output']>;
  sentAt: Scalars['DateTime']['output'];
  /** Usuario que envió el mensaje */
  sentBy?: Maybe<User>;
  sentByUserId: Scalars['String']['output'];
  unitId: Scalars['String']['output'];
  /** Número de unidad desnormalizado para queries rápidas */
  unitNumber: Scalars['String']['output'];
};

/** Notificación masiva enviada por el administrador */
export type SentNotification = {
  __typename?: 'SentNotification';
  body: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  priority: NotificationPriority;
  /** Total de destinatarios al momento del envío */
  recipientsCount: Scalars['Int']['output'];
  /** Roles destinatarios. Vacío = todos los usuarios. */
  targetRoles?: Maybe<Array<Scalars['String']['output']>>;
  title: Scalars['String']['output'];
  type: NotificationType;
};

export type SentNotificationPaginatedResult = {
  __typename?: 'SentNotificationPaginatedResult';
  items: Array<SentNotification>;
  pagination: PaginationReponse;
};

/** Fija o cambia la clave de acceso del residente autenticado */
export type SetAccessCodeInput = {
  /** Clave alfanumérica de 6 caracteres */
  code: Scalars['String']['input'];
  /** Clave actual, requerida al cambiarla */
  currentCode?: InputMaybe<Scalars['String']['input']>;
  /** Nombre del dispositivo (ej. "iPhone de Juan") */
  label?: InputMaybe<Scalars['String']['input']>;
};

export type SetAmenitySchedulesInput = {
  amenityId: Scalars['String']['input'];
  schedules: Array<AmenityScheduleInput>;
};

/** Datos para configurar o actualizar la tarifa de parqueadero */
export type SetParkingRateInput = {
  /** ID del complejo residencial */
  complexId: Scalars['String']['input'];
  /** Descripción o etiqueta de la tarifa */
  description?: InputMaybe<Scalars['String']['input']>;
  /** Si la tarifa está activa */
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  /** Tarifa cobrada por minuto de parqueo (en moneda local) */
  rateType: ParkingRateType;
  /** Tipo de vehículo al que aplica la tarifa */
  vehicleType: VehicleType;
};

export type SetPasswordResponse = {
  __typename?: 'SetPasswordResponse';
  success: Scalars['Boolean']['output'];
};

export type SimplePermissionResponse = {
  __typename?: 'SimplePermissionResponse';
  /** category of the permission */
  category?: Maybe<Scalars['String']['output']>;
  /** description of the permission */
  description?: Maybe<Scalars['String']['output']>;
  /** id of the permission */
  id: Scalars['String']['output'];
  /** level of the permission */
  level?: Maybe<Scalars['String']['output']>;
  /** name of the permission */
  name: ValidPermissions;
};

export type SimpleRoleResponse = {
  __typename?: 'SimpleRoleResponse';
  /** child roles in hierarchy */
  children?: Maybe<Array<SimpleRoleResponse>>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  createdByUser?: Maybe<User>;
  /** description of the role */
  description?: Maybe<Scalars['String']['output']>;
  /** name of the role */
  frontName?: Maybe<Scalars['String']['output']>;
  /** Hierarchy level (0=highest, 1=second, 2=third, 3=fourth, 4=lowest) */
  hierarchyLevel?: Maybe<Scalars['Int']['output']>;
  /** icon of the role */
  icon?: Maybe<Scalars['String']['output']>;
  /** id of the role */
  id: Scalars['String']['output'];
  /** indicates if role is system role */
  isSystem?: Maybe<Scalars['Boolean']['output']>;
  /** Stores dynamic rules. */
  metadata?: Maybe<Scalars['JSON']['output']>;
  /** name of the role */
  name?: Maybe<ValidRoles>;
  /** parent role for hierarchy */
  parent?: Maybe<SimpleRoleResponse>;
  /** permissions assigned to this role */
  permissions?: Maybe<Array<SimplePermissionResponse>>;
  /** indicates if role is active */
  status?: Maybe<Scalars['Boolean']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  updatedByUser?: Maybe<User>;
  userRoles?: Maybe<Array<UserRole>>;
};

/** Dirección del ordenamiento */
export type SortDirection =
  | 'ASC'
  | 'DESC';

export type SortInput = {
  direction?: InputMaybe<SortDirection>;
  field?: InputMaybe<Scalars['String']['input']>;
};

/** Número especial de marcado rápido configurado en el complejo */
export type SpecialNumber = {
  __typename?: 'SpecialNumber';
  category: SpecialNumberCategory;
  /** null para números globales; UUID del complejo para números específicos */
  complexId?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  /** Descripción opcional del número */
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  /** Si es true: creado por SUPER_ADMIN, visible en todos los complejos y no editable por ningún otro rol */
  isGlobal: Scalars['Boolean']['output'];
  /** Nombre descriptivo (ej: Policía Nacional) */
  name: Scalars['String']['output'];
  /** Orden de visualización ascendente */
  order: Scalars['Int']['output'];
  /** Número de teléfono de marcado rápido */
  phoneNumber: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

/** Categoría del número especial de marcado rápido */
export type SpecialNumberCategory =
  /** Administración */
  | 'ADMINISTRATION'
  /** Emergencias (policía, bomberos, ambulancia) */
  | 'EMERGENCY'
  /** Mantenimiento del conjunto */
  | 'MAINTENANCE'
  /** Otro */
  | 'OTHER'
  /** Seguridad interna (supervisor, central de monitoreo) */
  | 'SECURITY';

/** Resultado de la operación createStaffMember */
export type StaffMemberAction =
  /** Usuario existente asignado a este complejo adicional (sin alterar sus otras asignaciones) */
  | 'ADDED_TO_COMPLEX'
  /** Usuario nuevo creado e incorporado al complejo */
  | 'CREATED'
  /** Usuario existente reactivado y reintegrado a este complejo */
  | 'REINTEGRATED';

/** Solicitud de acceso de un supervisor a un complejo residencial */
export type SupervisorAccessRequest = {
  __typename?: 'SupervisorAccessRequest';
  complex?: Maybe<ResidentialComplex>;
  complexId: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['String']['output'];
  /** Mensaje opcional del supervisor al solicitar acceso */
  message?: Maybe<Scalars['String']['output']>;
  /** Motivo de rechazo (solo cuando status = REJECTED) */
  rejectionReason?: Maybe<Scalars['String']['output']>;
  /** Latitud GPS del supervisor al solicitar acceso */
  requestLat?: Maybe<Scalars['Float']['output']>;
  /** Longitud GPS del supervisor al solicitar acceso */
  requestLng?: Maybe<Scalars['Float']['output']>;
  resolvedAt?: Maybe<Scalars['DateTime']['output']>;
  /** Admin que resolvió la solicitud */
  resolvedBy?: Maybe<User>;
  /** ID del usuario que aprobó o rechazó la solicitud */
  resolvedById?: Maybe<Scalars['String']['output']>;
  status: AccessRequestStatus;
  /** Supervisor que solicitó el acceso */
  supervisor?: Maybe<User>;
  supervisorId: Scalars['String']['output'];
};

export type SupervisorCheckInInput = {
  /** ID del complejo residencial donde el supervisor hace check-in */
  complexId: Scalars['String']['input'];
  /** Latitud GPS actual del supervisor (-90 a 90) */
  lat: Scalars['Float']['input'];
  /** Longitud GPS actual del supervisor (-180 a 180) */
  lng: Scalars['Float']['input'];
};

export type SupervisorCheckOutInput = {
  /** ID del complejo del que el supervisor hace check-out */
  complexId: Scalars['String']['input'];
};

/** Estado de verificación del correo de un supervisor recién registrado */
export type SupervisorVerificationStatusResponse = {
  __typename?: 'SupervisorVerificationStatusResponse';
  /** Segundos que faltan para poder reenviar. 0 = el botón de reenvío ya está habilitado. Lo decide el servidor: el cliente puede reiniciarse y perder su cuenta atrás. */
  resendAvailableInSeconds: Scalars['Int']['output'];
  /** True cuando el supervisor ya abrió el enlace y su cuenta quedó activa */
  verified: Scalars['Boolean']['output'];
};

/** Registro de visita de supervisor a un complejo residencial */
export type SupervisorVisit = {
  __typename?: 'SupervisorVisit';
  /** Fecha y hora de check-in */
  checkInAt: Scalars['DateTime']['output'];
  /** Latitud GPS al momento del check-in */
  checkInLat: Scalars['Float']['output'];
  /** Longitud GPS al momento del check-in */
  checkInLng: Scalars['Float']['output'];
  /** Fecha y hora de check-out (null si visita activa) */
  checkOutAt?: Maybe<Scalars['DateTime']['output']>;
  complex?: Maybe<ResidentialComplex>;
  complexId: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['String']['output'];
  /** Estado de la visita: ACTIVE o CLOSED */
  status: SupervisorVisitStatus;
  supervisor?: Maybe<User>;
  supervisorId: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

/** Estado de la visita del supervisor al complejo residencial */
export type SupervisorVisitStatus =
  | 'ACTIVE'
  | 'CLOSED';

export type TriageMaintenanceTicketInput = {
  category?: InputMaybe<MaintenanceCategory>;
  notes?: InputMaybe<Scalars['String']['input']>;
  priority?: InputMaybe<MaintenancePriority>;
  /** Horas de SLA para este ticket. Si no llega, la política del complejo */
  slaHours?: InputMaybe<Scalars['Int']['input']>;
  ticketId: Scalars['String']['input'];
  visibility?: InputMaybe<MaintenanceVisibility>;
};

export type TriggerPanicAlertResult = {
  __typename?: 'TriggerPanicAlertResult';
  success: Scalars['Boolean']['output'];
};

/** Unidad habitable dentro de un edificio o complejo */
export type Unit = {
  __typename?: 'Unit';
  /** Área en metros cuadrados */
  area?: Maybe<Scalars['Float']['output']>;
  /** Número de baños */
  bathrooms?: Maybe<Scalars['Int']['output']>;
  /** Número de habitaciones */
  bedrooms?: Maybe<Scalars['Int']['output']>;
  /** Torre o edificio contenedor */
  building?: Maybe<Building>;
  /** ID de la torre/edificio (null si complejo sin torres) */
  buildingId?: Maybe<Scalars['String']['output']>;
  /** Coeficiente de copropiedad (fracción, suma=1) */
  coefficient?: Maybe<Scalars['Float']['output']>;
  /** Complejo al que pertenece */
  complex?: Maybe<ResidentialComplex>;
  /** ID del complejo al que pertenece */
  complexId: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  /** Descripción u observaciones adicionales */
  description?: Maybe<Scalars['String']['output']>;
  /** Piso en el que se ubica la unidad */
  floor: Scalars['Int']['output'];
  /** Si la unidad usa/paga ascensor */
  hasElevator?: Maybe<Scalars['Boolean']['output']>;
  /** Número de pisos de la casa (solo HOUSE) */
  houseFloors?: Maybe<Scalars['Int']['output']>;
  id: Scalars['String']['output'];
  /** Número o identificador de la unidad. Ej: "101", "B-202" */
  number: Scalars['String']['output'];
  /** Cupos de parqueadero asignados */
  parkingSpots: Scalars['Int']['output'];
  /** Estado de disponibilidad */
  status: UnitStatus;
  /** Cuartos útiles o bodegas asignadas */
  storageRooms: Scalars['Int']['output'];
  /** Tipo de unidad */
  type: UnitType;
  updatedAt: Scalars['DateTime']['output'];
};

export type UnitAccountStatementResponse = {
  __typename?: 'UnitAccountStatementResponse';
  building?: Maybe<Scalars['String']['output']>;
  currentBalance: Scalars['Float']['output'];
  hasMore: Scalars['Boolean']['output'];
  movements: Array<AccountMovement>;
  totalCredits: Scalars['Float']['output'];
  totalDebits: Scalars['Float']['output'];
  totalMovements: Scalars['Int']['output'];
  unitId: Scalars['String']['output'];
  unitNumber: Scalars['String']['output'];
  walletBalance: Scalars['Float']['output'];
};

export type UnitBalanceResponse = {
  __typename?: 'UnitBalanceResponse';
  overdueCount: Scalars['Int']['output'];
  pendingCount: Scalars['Int']['output'];
  totalDebt: Scalars['Float']['output'];
  totalPaid: Scalars['Float']['output'];
  unitId: Scalars['String']['output'];
  unitNumber: Scalars['String']['output'];
};

export type UnitFinancialStatusItem = {
  __typename?: 'UnitFinancialStatusItem';
  building?: Maybe<Scalars['String']['output']>;
  overdueCount: Scalars['Int']['output'];
  pendingCount: Scalars['Int']['output'];
  status: Scalars['String']['output'];
  totalDebt: Scalars['Float']['output'];
  unitId: Scalars['String']['output'];
  unitNumber: Scalars['String']['output'];
  walletBalance: Scalars['Float']['output'];
};

export type UnitFinancialStatusPaginated = {
  __typename?: 'UnitFinancialStatusPaginated';
  items: Array<UnitFinancialStatusItem>;
  pagination: PaginationReponse;
};

/** Estado de disponibilidad de la unidad */
export type UnitStatus =
  | 'AVAILABLE'
  | 'DISABLED'
  | 'MAINTENANCE'
  | 'OCCUPIED';

/** Tipo de unidad dentro del complejo */
export type UnitType =
  | 'APARTMENT'
  | 'COMMERCIAL'
  | 'HOUSE'
  | 'OFFICE'
  | 'PENTHOUSE'
  | 'STUDIO'
  | 'VEHICLE_UNIT'
  | 'WAREHOUSE';

export type UnitWalletResponse = {
  __typename?: 'UnitWalletResponse';
  building?: Maybe<Scalars['String']['output']>;
  currentBalance: Scalars['Float']['output'];
  entries: Array<WalletEntryObject>;
  totalCredits: Scalars['Float']['output'];
  totalDebits: Scalars['Float']['output'];
  unitId: Scalars['String']['output'];
  unitNumber: Scalars['String']['output'];
};

export type UnreadCountResponse = {
  __typename?: 'UnreadCountResponse';
  count: Scalars['Int']['output'];
};

export type UpdateAmenityInput = {
  advanceBookingDays?: InputMaybe<Scalars['Int']['input']>;
  blockBookingsOnDebt?: InputMaybe<Scalars['Boolean']['input']>;
  bookingMode?: InputMaybe<AmenityBookingMode>;
  /** Días antes del inicio en que aún se puede cancelar sin quedar con el cobro */
  cancellationDeadlineDays?: InputMaybe<Scalars['Int']['input']>;
  /** Horas que se suman al plazo de cancelación en días */
  cancellationDeadlineHours?: InputMaybe<Scalars['Int']['input']>;
  /** Aforo por reserva. 0 = sin control */
  capacity?: InputMaybe<Scalars['Int']['input']>;
  /** Reservas gratis al año por miembro del consejo. 0 = sin beneficio */
  councilFreeBookingsPerYear?: InputMaybe<Scalars['Int']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  durationUnit?: InputMaybe<AmenityDurationUnit>;
  feeAmount?: InputMaybe<Scalars['Float']['input']>;
  feeType?: InputMaybe<AmenityFeeType>;
  /** ID de la zona común a actualizar */
  id: Scalars['String']['input'];
  imageUrls?: InputMaybe<Array<Scalars['String']['input']>>;
  /** % de la tarifa que se retiene al cancelar fuera de plazo */
  lateCancellationFeePercent?: InputMaybe<Scalars['Int']['input']>;
  location?: InputMaybe<Scalars['String']['input']>;
  /** 0 = sin límite */
  maxActiveBookingsPerUnit?: InputMaybe<Scalars['Int']['input']>;
  /** 0 = sin límite */
  maxBookingsPerUnitPerMonth?: InputMaybe<Scalars['Int']['input']>;
  /** Solo RANGE: duración máxima en minutos. El rango válido depende de durationUnit */
  maxDurationMinutes?: InputMaybe<Scalars['Int']['input']>;
  /** Reservas que caben a la misma hora (ej. 4 asadores) */
  maxSimultaneousBookings?: InputMaybe<Scalars['Int']['input']>;
  /** Anticipación mínima en días. 0 = se puede reservar para hoy */
  minAdvanceDays?: InputMaybe<Scalars['Int']['input']>;
  /** Solo RANGE: duración mínima en minutos. El rango válido depende de durationUnit */
  minDurationMinutes?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  requiresApproval?: InputMaybe<Scalars['Boolean']['input']>;
  /** Reglamento de uso que ve el residente al reservar */
  rules?: InputMaybe<Scalars['String']['input']>;
  /** Solo SLOT: minutos de cada bloque. El rango válido depende de durationUnit */
  slotDurationMinutes?: InputMaybe<Scalars['Int']['input']>;
  status?: InputMaybe<AmenityStatus>;
  type?: InputMaybe<AmenityType>;
};

export type UpdateBuildingInput = {
  /** ID del complejo */
  complexId?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  /** Número de pisos */
  floors?: InputMaybe<Scalars['Int']['input']>;
  /** ID de la torre a actualizar */
  id: Scalars['String']['input'];
  /** Nombre de la torre. Ej: "Torre A", "Edificio Norte" */
  name?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateChargeCategoryInput = {
  color?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateComplexInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  city?: InputMaybe<Scalars['String']['input']>;
  country?: InputMaybe<Scalars['String']['input']>;
  countryCode?: InputMaybe<CountryCode>;
  coverUrl?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  /** Radio en metros para validar presencia GPS (por defecto 200 m) */
  gpsRadius?: InputMaybe<Scalars['Int']['input']>;
  /** ID del complejo a actualizar */
  id: Scalars['String']['input'];
  /** Latitud GPS del complejo para validación de presencia de supervisores */
  latitude?: InputMaybe<Scalars['Float']['input']>;
  /** ID (UUID) del nuevo representante legal. Enviar "" o null para limpiar. */
  legalRepresentativeId?: InputMaybe<Scalars['String']['input']>;
  logoUrl?: InputMaybe<Scalars['String']['input']>;
  /** Longitud GPS del complejo para validación de presencia de supervisores */
  longitude?: InputMaybe<Scalars['Float']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  nit?: InputMaybe<Scalars['String']['input']>;
  /** Contraseña de acceso al portal del complejo */
  password?: InputMaybe<Scalars['String']['input']>;
  phoneNumber?: InputMaybe<Scalars['String']['input']>;
  plan?: InputMaybe<ComplexPlan>;
  /** Horas entre recordatorios. 0 = sin recordatorios */
  pqrfReminderIntervalHours?: InputMaybe<Scalars['Int']['input']>;
  /** Días antes del vencimiento en que empiezan los recordatorios */
  pqrfReminderLeadDays?: InputMaybe<Scalars['Int']['input']>;
  /** Días para resolver un PQRF (calendario) */
  pqrfResolutionDays?: InputMaybe<Scalars['Int']['input']>;
  settings?: InputMaybe<Scalars['JSON']['input']>;
  state?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<ComplexType>;
  website?: InputMaybe<Scalars['String']['input']>;
  zipCode?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateFeeConfigInput = {
  amount?: InputMaybe<Scalars['Float']['input']>;
  billingMode?: InputMaybe<FeeConfigBillingMode>;
  chargeType?: InputMaybe<ChargeType>;
  description?: InputMaybe<Scalars['String']['input']>;
  dueDayOfMonth?: InputMaybe<Scalars['Int']['input']>;
  earlyPaymentAmount?: InputMaybe<Scalars['Float']['input']>;
  earlyPaymentDueDayOfMonth?: InputMaybe<Scalars['Int']['input']>;
  frequency?: InputMaybe<FeeFrequency>;
  id: Scalars['String']['input'];
  installments?: InputMaybe<Scalars['Int']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  isOptional?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  targetRules?: InputMaybe<FeeConfigTargetRulesInput>;
  triggerType?: InputMaybe<FeeConfigTriggerType>;
};

export type UpdateLegalDocumentInput = {
  audience?: InputMaybe<LegalAudience>;
  description?: InputMaybe<Scalars['String']['input']>;
  /** Nuevo .docx en base64. Si se envía, reemplaza el contenido HTML e incrementa la versión. */
  docxBase64?: InputMaybe<Scalars['String']['input']>;
  isDownloadable?: InputMaybe<Scalars['Boolean']['input']>;
  isPublished?: InputMaybe<Scalars['Boolean']['input']>;
  /** Nuevo PDF descargable en base64. Reemplaza el anterior. */
  pdfBase64?: InputMaybe<Scalars['String']['input']>;
  pdfFileName?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateListingInput = {
  categoryId?: InputMaybe<Scalars['String']['input']>;
  condition?: InputMaybe<MarketplaceItemCondition>;
  contactPreference?: InputMaybe<MarketplaceContactPreference>;
  description?: InputMaybe<Scalars['String']['input']>;
  imageUrls?: InputMaybe<Array<Scalars['String']['input']>>;
  listingId: Scalars['String']['input'];
  priceAmount?: InputMaybe<Scalars['Float']['input']>;
  priceType?: InputMaybe<MarketplacePriceType>;
  showPhone?: InputMaybe<Scalars['Boolean']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<MarketplaceListingType>;
};

export type UpdateMaintenanceLocationTagInput = {
  amenityId?: InputMaybe<Scalars['String']['input']>;
  buildingId?: InputMaybe<Scalars['String']['input']>;
  defaultCategory?: InputMaybe<MaintenanceCategory>;
  description?: InputMaybe<Scalars['String']['input']>;
  /** Negativo para sótanos */
  floor?: InputMaybe<Scalars['Int']['input']>;
  id: Scalars['String']['input'];
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  kind?: InputMaybe<MaintenanceTagKind>;
  lat?: InputMaybe<Scalars['Float']['input']>;
  lng?: InputMaybe<Scalars['Float']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateMaintenanceVendorInput = {
  contactName?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  /** NIT o cédula */
  legalId?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  specialties?: InputMaybe<Array<MaintenanceCategory>>;
};

export type UpdateMarketplaceSettingsInput = {
  allowPhoneContact?: InputMaybe<Scalars['Boolean']['input']>;
  allowWantedListings?: InputMaybe<Scalars['Boolean']['input']>;
  autoPauseAfterReports?: InputMaybe<Scalars['Int']['input']>;
  complexId: Scalars['String']['input'];
  listingDurationDays?: InputMaybe<Scalars['Int']['input']>;
  maxActiveListingsPerUnit?: InputMaybe<Scalars['Int']['input']>;
  maxImagesPerListing?: InputMaybe<Scalars['Int']['input']>;
  moderationMode?: InputMaybe<MarketplaceModerationMode>;
  termsText?: InputMaybe<Scalars['String']['input']>;
};

export type UpdatePermissionInput = {
  /** Obliges to have a previous permission to assign another (e.g., need "user:read" to get "user:edit"). */
  dependsOn?: InputMaybe<Array<PermissionDependencyInput>>;
  /** description of the permission */
  description?: InputMaybe<Scalars['String']['input']>;
  /** Recurso del sistema al que aplica el permiso */
  group?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['Int']['input'];
  /** Si es true, no podrá borrarse por API */
  isSystem?: InputMaybe<Scalars['Boolean']['input']>;
  /** Nombre legible para mostrar en la UI */
  label?: InputMaybe<Scalars['String']['input']>;
  /** level of the permission */
  level?: InputMaybe<PermissionLevel>;
  /** name of the permission */
  name?: InputMaybe<ValidPermissions>;
  /** Estado inicial del permiso */
  status?: InputMaybe<Scalars['Boolean']['input']>;
};

export type UpdatePermissionResponse = {
  __typename?: 'UpdatePermissionResponse';
  /** Creation timestamp */
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  /** indicates the permissions on which the saved permission depends */
  dependsOn?: Maybe<Array<PermissionDependencyResponse>>;
  /** description of the permission */
  description?: Maybe<Scalars['String']['output']>;
  /** group to which a permit belongs */
  group?: Maybe<Scalars['String']['output']>;
  /** id of the permission */
  id: Scalars['String']['output'];
  /** Select critical permissions that cannot be removed */
  isSystem?: Maybe<Scalars['Boolean']['output']>;
  /** front name */
  label?: Maybe<Scalars['String']['output']>;
  /** level of the permission */
  level?: Maybe<PermissionLevel>;
  /** name of the permission */
  name: ValidPermissions;
  /** indicates if permission is active */
  status?: Maybe<Scalars['Boolean']['output']>;
  /** Creation timestamp */
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type UpdatePetInput = {
  birthDate?: InputMaybe<Scalars['String']['input']>;
  breed?: InputMaybe<Scalars['String']['input']>;
  color?: InputMaybe<Scalars['String']['input']>;
  /** Señas particulares */
  distinguishingMarks?: InputMaybe<Scalars['String']['input']>;
  hasMicrochip?: InputMaybe<Scalars['Boolean']['input']>;
  insuranceCompany?: InputMaybe<Scalars['String']['input']>;
  insuranceExpiresAt?: InputMaybe<Scalars['String']['input']>;
  insurancePolicyNumber?: InputMaybe<Scalars['String']['input']>;
  isSpecialBreed?: InputMaybe<Scalars['Boolean']['input']>;
  microchipCode?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  petId: Scalars['String']['input'];
  rabiesVaccineAt?: InputMaybe<Scalars['String']['input']>;
  sex?: InputMaybe<PetSex>;
  size?: InputMaybe<PetSize>;
  species?: InputMaybe<PetSpecies>;
  sterilized?: InputMaybe<Scalars['Boolean']['input']>;
};

export type UpdatePucAccountInput = {
  complexId: Scalars['String']['input'];
  id: Scalars['String']['input'];
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  nature?: InputMaybe<AccountNature>;
};

export type UpdateRecurringChargeInput = {
  amount?: InputMaybe<Scalars['Float']['input']>;
  billingDay?: InputMaybe<Scalars['Int']['input']>;
  billingMode?: InputMaybe<FeeConfigBillingMode>;
  complexId: Scalars['String']['input'];
  concept?: InputMaybe<Scalars['String']['input']>;
  distribution?: InputMaybe<RecurringChargeDistribution>;
  earlyDiscountDay?: InputMaybe<Scalars['Int']['input']>;
  earlyDiscountPct?: InputMaybe<Scalars['Float']['input']>;
  id: Scalars['String']['input'];
  incomeAccountId?: InputMaybe<Scalars['String']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  targetRules?: InputMaybe<FeeConfigTargetRulesInput>;
  targetUnitIds?: InputMaybe<Array<Scalars['String']['input']>>;
  totalInstallments?: InputMaybe<Scalars['Int']['input']>;
  triggerType?: InputMaybe<RecurringChargeTrigger>;
  vehicleTypes?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type UpdateResidentInput = {
  emergencyContactLastName?: InputMaybe<Scalars['String']['input']>;
  emergencyContactName?: InputMaybe<Scalars['String']['input']>;
  emergencyContactPhone?: InputMaybe<Scalars['String']['input']>;
  endDate?: InputMaybe<Scalars['String']['input']>;
  /** ID del registro de residente a actualizar */
  id: Scalars['String']['input'];
  /** Miembro del consejo de administración */
  isCouncilMember?: InputMaybe<Scalars['Boolean']['input']>;
  isMainResident?: InputMaybe<Scalars['Boolean']['input']>;
  /** Apellido del usuario residente */
  lastName?: InputMaybe<Scalars['String']['input']>;
  /** Nombre del usuario residente */
  name?: InputMaybe<Scalars['String']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  /** Teléfono del usuario residente */
  phoneNumber?: InputMaybe<Scalars['String']['input']>;
  startDate?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<ResidentType>;
  /** ID de la unidad a la que se asignará */
  unitId: Scalars['String']['input'];
};

export type UpdateRoleInput = {
  /** description of the permisison */
  description?: InputMaybe<Scalars['String']['input']>;
  /** name of the permisison visiblen to end user */
  frontName?: InputMaybe<Scalars['String']['input']>;
  /** level of the permisison */
  hierarchyLevel?: InputMaybe<Scalars['Int']['input']>;
  /** icon of the permisison */
  icon?: InputMaybe<Scalars['String']['input']>;
  isSystem?: InputMaybe<Scalars['Boolean']['input']>;
  /** Stores dynamic rules (e.g., access schedules, usage limits). */
  metadata?: InputMaybe<Scalars['JSON']['input']>;
  /** name of the permisison */
  name?: InputMaybe<ValidRoles>;
  parentId?: InputMaybe<Scalars['String']['input']>;
  permissionIds?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type UpdateSpecialNumberInput = {
  category?: InputMaybe<SpecialNumberCategory>;
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  order?: InputMaybe<Scalars['Int']['input']>;
  phoneNumber?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateUnitInput = {
  /** Área en m² */
  area?: InputMaybe<Scalars['Float']['input']>;
  /** Número de baños */
  bathrooms?: InputMaybe<Scalars['Int']['input']>;
  /** Número de habitaciones */
  bedrooms?: InputMaybe<Scalars['Int']['input']>;
  /** Coeficiente de copropiedad (fracción, suma=1). Ej: 0.012345 */
  coefficient?: InputMaybe<Scalars['Float']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  /** Piso donde se ubica la unidad */
  floor?: InputMaybe<Scalars['Int']['input']>;
  /** Si la unidad usa/paga ascensor */
  hasElevator?: InputMaybe<Scalars['Boolean']['input']>;
  /** Número de pisos de la casa (solo casas) */
  houseFloors?: InputMaybe<Scalars['Int']['input']>;
  /** ID de la unidad a actualizar */
  id: Scalars['String']['input'];
  /** Número o código de la unidad. Ej: "101", "B-302" */
  number?: InputMaybe<Scalars['String']['input']>;
  /** Cupos de parqueadero */
  parkingSpots?: InputMaybe<Scalars['Int']['input']>;
  /** Cambiar estado de la unidad */
  status?: InputMaybe<UnitStatus>;
  /** Cuartos de bodega */
  storageRooms?: InputMaybe<Scalars['Int']['input']>;
  /** Tipo de unidad */
  type?: InputMaybe<UnitType>;
};

/** Datos para editar el tipo y número de documento de identidad de un usuario */
export type UpdateUserIdentityInput = {
  /** Número de documento de identidad */
  identity: Scalars['String']['input'];
  /** Tipo de documento de identidad */
  identityType: UserIdentityType;
  /** ID del usuario a editar */
  userId: Scalars['String']['input'];
};

export type UpdateUserInput = {
  lastName?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  phoneNumber?: InputMaybe<Scalars['String']['input']>;
  role?: InputMaybe<Scalars['String']['input']>;
  userId: Scalars['String']['input'];
};

export type UpdateVehicleInput = {
  /** Marca. Ej: Toyota, Renault */
  brand?: InputMaybe<Scalars['String']['input']>;
  /** Color del vehículo */
  color?: InputMaybe<Scalars['String']['input']>;
  fuelType?: InputMaybe<VehicleFuelType>;
  /** ID del vehículo a actualizar */
  id: Scalars['String']['input'];
  /** Modelo. Ej: Corolla, Logan */
  model?: InputMaybe<Scalars['String']['input']>;
  /** Notas adicionales */
  notes?: InputMaybe<Scalars['String']['input']>;
  /** Número de parqueadero asignado (opcional) */
  parkingSpot?: InputMaybe<Scalars['String']['input']>;
  /** URL de la foto del vehículo */
  photoUrl?: InputMaybe<Scalars['String']['input']>;
  /** Tipo de vehículo */
  type?: InputMaybe<VehicleType>;
  /** Año del modelo */
  year?: InputMaybe<Scalars['Int']['input']>;
};

/** Datos para crear/actualizar la configuración del parqueadero visitante */
export type UpdateVisitorParkingConfigInput = {
  /** UUID de la tarifa activa por defecto */
  activeRateId?: InputMaybe<Scalars['String']['input']>;
  /** ID del complejo residencial */
  complexId: Scalars['String']['input'];
  currency?: InputMaybe<Scalars['String']['input']>;
  gracePeriodMinutes?: InputMaybe<Scalars['Int']['input']>;
  maxCapacity?: InputMaybe<Scalars['Int']['input']>;
  /** Tarifas a crear o actualizar */
  rates?: InputMaybe<Array<VisitorParkingRateInput>>;
  receiptMessage?: InputMaybe<Scalars['String']['input']>;
  showLogoOnReceipt?: InputMaybe<Scalars['Boolean']['input']>;
};

export type UpdateVotingQuestionInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  options?: InputMaybe<Array<Scalars['String']['input']>>;
  questionId: Scalars['String']['input'];
  secrecy?: InputMaybe<VoteSecrecy>;
  text?: InputMaybe<Scalars['String']['input']>;
  weighting?: InputMaybe<VoteWeighting>;
};

export type UpsertCoefficientWeightingInput = {
  /** Base del score: 'AREA' | 'UNIT' */
  base?: InputMaybe<Scalars['String']['input']>;
  /** ID del complejo */
  complexId: Scalars['String']['input'];
  /** Puntos por ascensor */
  elevatorPoints?: InputMaybe<Scalars['Float']['input']>;
  /** Puntos por piso de la casa */
  houseFloorPoints?: InputMaybe<Scalars['Float']['input']>;
  /** Puntos por baño */
  perBathroom?: InputMaybe<Scalars['Float']['input']>;
  /** Puntos por alcoba */
  perBedroom?: InputMaybe<Scalars['Float']['input']>;
  /** Puntos por parqueadero */
  perParking?: InputMaybe<Scalars['Float']['input']>;
  /** Puntos por depósito */
  perStorage?: InputMaybe<Scalars['Float']['input']>;
  /** Multiplicador por tipo de unidad */
  typeMultipliers?: InputMaybe<Scalars['JSON']['input']>;
};

export type UpsertComplexFinanceConfigInput = {
  autoApplyMora?: InputMaybe<Scalars['Boolean']['input']>;
  autoGenerateCharges?: InputMaybe<Scalars['Boolean']['input']>;
  complexId: Scalars['String']['input'];
  earlyDiscountDay?: InputMaybe<Scalars['Int']['input']>;
  earlyDiscountPct?: InputMaybe<Scalars['Float']['input']>;
  moraGraceDays?: InputMaybe<Scalars['Int']['input']>;
  moraRate?: InputMaybe<Scalars['Float']['input']>;
};

export type UpsertMaintenanceSlaInput = {
  category: MaintenanceCategory;
  complexId: Scalars['String']['input'];
  priority: MaintenancePriority;
  /** Horas para dejarlo reparado */
  resolutionHours: Scalars['Int']['input'];
  /** Horas para asignar responsable */
  responseHours: Scalars['Int']['input'];
};

export type UpsertMarketplaceCategoryInput = {
  categoryId?: InputMaybe<Scalars['String']['input']>;
  complexId: Scalars['String']['input'];
  icon?: InputMaybe<Scalars['String']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  kind?: InputMaybe<MarketplaceCategoryKind>;
  name?: InputMaybe<Scalars['String']['input']>;
  sortOrder?: InputMaybe<Scalars['Int']['input']>;
};

export type UpsertScheduleExceptionInput = {
  amenityId: Scalars['String']['input'];
  /** Requerido si isClosed=false. Un cierre anterior a la apertura termina al día siguiente */
  closeTime?: InputMaybe<Scalars['String']['input']>;
  /** Fecha en formato YYYY-MM-DD */
  date: Scalars['String']['input'];
  /** true: la zona no abre ese día */
  isClosed?: Scalars['Boolean']['input'];
  /** Requerido si isClosed=false. Formato HH:mm */
  openTime?: InputMaybe<Scalars['String']['input']>;
  /** Motivo; el residente lo ve cuando el día queda cerrado */
  reason?: InputMaybe<Scalars['String']['input']>;
};

/** Entidad que representa un usuario del sistema */
export type User = {
  __typename?: 'User';
  /** Indicates whether the user agrees accept terms and conditions. */
  acceptTermsAdnConditions: Scalars['Boolean']['output'];
  /** Indicates whether the user agrees to receive marketing emails. */
  acceptsMarketing: Scalars['Boolean']['output'];
  /** Bloqueo temporal por intentos fallidos de clave de acceso */
  accessCodeLockedUntil?: Maybe<Scalars['DateTime']['output']>;
  /** Date until which the account is blocked due to failed attempts */
  accountLockedUntil?: Maybe<Scalars['DateTime']['output']>;
  /** Edad calculada del usuario basada en su fecha de nacimiento */
  age?: Maybe<Scalars['Float']['output']>;
  /** User biography */
  bio?: Maybe<Scalars['String']['output']>;
  /** ID del complejo residencial asociado */
  complexId?: Maybe<Scalars['String']['output']>;
  /** CountryCode */
  countryCode: Country;
  /** Profile picture of port URL */
  coverPicture?: Maybe<Scalars['String']['output']>;
  /** Visitor last created by this user */
  createVisitorParking?: Maybe<Array<VisitorParkingRate>>;
  /** User creation date */
  createdAt: Scalars['DateTime']['output'];
  /** Permissions created by this user */
  createdPermissions?: Maybe<Array<Permission>>;
  createdRoles?: Maybe<Array<Role>>;
  /** Date of birth */
  dateOfBirth?: Maybe<Scalars['DateTime']['output']>;
  /** Deletion date (soft delete) */
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  /** Reason for account deletion */
  deletionReason?: Maybe<Scalars['String']['output']>;
  /** Email address */
  email: Scalars['String']['output'];
  /** email verification status */
  emailVerified: Scalars['Boolean']['output'];
  /** Date until which the account is blocked due to failed attempts */
  failedLoginAttempts?: Maybe<Scalars['DateTime']['output']>;
  /** Nombre completo del usuario (nombre + apellido) */
  fullName: Scalars['String']['output'];
  /** User gender */
  gender?: Maybe<Gender>;
  /** Unique user identifier */
  id: Scalars['String']['output'];
  /** Identity document number */
  identity?: Maybe<Scalars['String']['output']>;
  /** Identity document type */
  identityType?: Maybe<UserIdentityType>;
  /** identity verification status */
  identityVerified: Scalars['Boolean']['output'];
  /** Indica si el usuario tiene tanto email como teléfono verificados */
  isFullyVerified: Scalars['Boolean']['output'];
  /** lastName of the user */
  lastName: Scalars['String']['output'];
  /** Date of last password change */
  lastPasswordChange?: Maybe<Scalars['DateTime']['output']>;
  /** Name of the user */
  name: Scalars['String']['output'];
  /** Token for push notifications */
  notificationToken?: Maybe<Scalars['String']['output']>;
  /** Password */
  password?: Maybe<Scalars['String']['output']>;
  /** Indica si el usuario tiene contraseña establecida */
  passwordSet: Scalars['Boolean']['output'];
  /** Phone Number (only Colombia) */
  phoneNumber: Scalars['String']['output'];
  /** Phone verification status */
  phoneVerified: Scalars['Boolean']['output'];
  /** Users preferred language */
  preferredLanguage: Scalars['String']['output'];
  /** Profile picture URL */
  profilePicture?: Maybe<Scalars['String']['output']>;
  /** User rating (1-5) */
  rating: Scalars['Float']['output'];
  /** Roles activos del usuario */
  roles?: Maybe<Array<ValidRoles>>;
  /** Current status of user account */
  status: UserStatus;
  /** Reason for account suspension */
  suspensionReason?: Maybe<Scalars['String']['output']>;
  /** Preferred time zone */
  timezone: Scalars['String']['output'];
  /** token version */
  tokenVersion?: Maybe<Scalars['String']['output']>;
  /** Visitor last updated by this user */
  updateVisitorParking?: Maybe<Array<VisitorParkingRate>>;
  /** Date of last user update */
  updatedAt: Scalars['DateTime']['output'];
  /** Permissions last updated by this user */
  updatedPermissions?: Maybe<Array<Permission>>;
  updatedRoles?: Maybe<Array<Role>>;
  /** Detalles completos de la relación usuario-rol */
  userRoles?: Maybe<Array<UserRole>>;
};

/** Tipo de documento de identidad del usuario */
export type UserIdentityType =
  | 'CC'
  | 'CE'
  | 'FOREIGN_ID'
  | 'NIT'
  | 'OTHER'
  | 'PASSPORT'
  | 'TI';

/** Información completa del perfil del usuario autenticado */
export type UserInfoCompleteResponse = {
  __typename?: 'UserInfoCompleteResponse';
  /** Acepta recibir marketing */
  acceptsMarketing: Scalars['Boolean']['output'];
  /** Edad calculada del usuario basada en su fecha de nacimiento */
  age?: Maybe<Scalars['Float']['output']>;
  /** Biografía del usuario */
  bio?: Maybe<Scalars['String']['output']>;
  /** Zona horaria preferida */
  complexId?: Maybe<Scalars['String']['output']>;
  countryCode: Country;
  /** URL de la foto de portada */
  coverPicture?: Maybe<Scalars['String']['output']>;
  /** Fecha de creación de la cuenta */
  createdAt: Scalars['DateTime']['output'];
  /** Fecha de nacimiento */
  dateOfBirth?: Maybe<Scalars['DateTime']['output']>;
  /** Correo electrónico */
  email: Scalars['String']['output'];
  /** Estado de verificación del email */
  emailVerified: Scalars['Boolean']['output'];
  /** Nombre completo del usuario (nombre + apellido) */
  fullName: Scalars['String']['output'];
  /** Género del usuario */
  gender?: Maybe<Gender>;
  /** Identificador único del usuario */
  id: Scalars['String']['output'];
  /** Número de documento de identidad */
  identity?: Maybe<Scalars['String']['output']>;
  /** Estado de verificación de identidad */
  identityVerified: Scalars['Boolean']['output'];
  /** Indica si el usuario tiene tanto email como teléfono verificados */
  isFullyVerified: Scalars['Boolean']['output'];
  /** Apellido del usuario */
  lastName: Scalars['String']['output'];
  /** Nombre del usuario */
  name: Scalars['String']['output'];
  /** Token para notificaciones push */
  notificationToken?: Maybe<Scalars['String']['output']>;
  /** Número de teléfono */
  phoneNumber: Scalars['String']['output'];
  /** Estado de verificación del teléfono */
  phoneVerified: Scalars['Boolean']['output'];
  /** Idioma preferido */
  preferredLanguage?: Maybe<Scalars['String']['output']>;
  /** URL de la foto de perfil */
  profilePicture?: Maybe<Scalars['String']['output']>;
  /** Identificador público del usuario */
  publicId: Scalars['String']['output'];
  /** Calificación del usuario (1-5) */
  rating: Scalars['Float']['output'];
  /** Estado actual de la cuenta */
  status: UserStatus;
  /** Zona horaria preferida */
  timezone?: Maybe<Scalars['String']['output']>;
  /** Fecha de última actualización */
  updatedAt: Scalars['DateTime']['output'];
  /** Zona horaria preferida */
  userRoles?: Maybe<Array<UserRole>>;
};

/** Entidad intermedia qeu guarda la relacion entre el usuario y los roles */
export type UserRole = {
  __typename?: 'UserRole';
  /** Indica la fecha de asignación del rol al usuario */
  assignedAt: Scalars['DateTime']['output'];
  /** Id del rol */
  id: Scalars['String']['output'];
  /** Indica si el rol está marcado como seleccionado o principal para el usuario */
  isPrimary?: Maybe<Scalars['Boolean']['output']>;
  /** Roles asignados al usuario */
  role: Role;
  /** Users who have this role */
  user?: Maybe<User>;
};

/** Estados posibles de la cuenta de usuario */
export type UserStatus =
  | 'ACTIVE'
  | 'BANNED'
  | 'DELETED'
  | 'INACTIVE'
  | 'PENDING_VERIFICATION'
  | 'SUSPENDED';

export type UsersFilterInput = {
  /** Filtrar por complejo residencial */
  complexId?: InputMaybe<Scalars['String']['input']>;
  /** Cantidad de resultados (máx. 100) */
  limit?: InputMaybe<Scalars['Int']['input']>;
  /** Desplazamiento para paginación */
  offset?: InputMaybe<Scalars['Int']['input']>;
  /** Filtrar por estado del usuario */
  status?: InputMaybe<UserStatus>;
};

export type UsersListResponse = {
  __typename?: 'UsersListResponse';
  items: Array<User>;
  limit: Scalars['Int']['output'];
  offset: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

export type ValidPermissions =
  | 'APPROVE_AMENITY_BOOKING'
  | 'APPROVE_PET'
  | 'APPROVE_RESIDENT'
  | 'APPROVE_VEHICLE'
  | 'APPROVE_VISIT'
  | 'ASSIGN_PERMISSIONS'
  | 'BLACKLIST_VISITOR'
  | 'BLOCK_RESIDENTS'
  | 'BLOCK_USER'
  | 'CHECK_IN_AMENITY_BOOKING'
  | 'CHECK_PLATE'
  | 'CLOSE_MAINTENANCE_TICKET'
  | 'CONFIGURE_ROTATION'
  | 'CREATE_AMENITY_BOOKING'
  | 'CREATE_NOTE'
  | 'CREATE_PACKAGE'
  | 'CREATE_PQRF'
  | 'CREATE_RESIDENCE'
  | 'CREATE_RESIDENTS'
  | 'CREATE_ROLE'
  | 'CREATE_SPECIAL_NUMBER'
  | 'CREATE_USER'
  | 'DELETE_NOTE'
  | 'DELETE_RESIDENCE'
  | 'DELETE_RESIDENTS'
  | 'DELETE_ROLE'
  | 'DELETE_SPECIAL_NUMBER'
  | 'DELETE_USER'
  | 'EDIT_PACKAGE'
  | 'EDIT_PET'
  | 'EDIT_RESIDENCE'
  | 'EDIT_RESIDENTS'
  | 'EDIT_ROLE'
  | 'EDIT_SETTINGS'
  | 'EDIT_SPECIAL_NUMBER'
  | 'EDIT_USER'
  | 'EDIT_VEHICLE'
  | 'EXECUTE_ROTATION'
  | 'EXPORT_PACKAGES'
  | 'EXPORT_REPORTS'
  | 'GENERATE_CHARGES'
  | 'LOG_CALL'
  | 'MANAGE_AMENITIES'
  | 'MANAGE_EXPENSES'
  | 'MANAGE_FEE_CONFIGS'
  | 'MANAGE_LISTING_REPORTS'
  | 'MANAGE_MAINTENANCE_LOCATIONS'
  | 'MANAGE_MAINTENANCE_SLA'
  | 'MANAGE_MAINTENANCE_TICKETS'
  | 'MANAGE_MAINTENANCE_VENDORS'
  | 'MANAGE_MARKETPLACE_SETTINGS'
  | 'MANAGE_PACKAGES'
  | 'MANAGE_PARKING_ROTATION'
  | 'MANAGE_PET_INCIDENTS'
  | 'MANAGE_PRODUCTS'
  | 'MANAGE_RESIDENCES'
  | 'MANAGE_RESIDENTS'
  | 'MANAGE_ROLES'
  | 'MANAGE_USERS'
  | 'MODERATE_LISTINGS'
  | 'PUBLISH_LISTING'
  | 'REGISTER_PAYMENT'
  | 'REGISTER_PET'
  | 'REGISTER_VEHICLE'
  | 'REGISTER_VISITOR_ENTRY'
  | 'REGISTER_VISITOR_EXIT'
  | 'REJECT_RESIDENT'
  | 'REMOVE_PET'
  | 'REMOVE_VEHICLE'
  | 'REPORT_MAINTENANCE_TICKET'
  | 'REPORT_PET_INCIDENT'
  | 'REVERSE_PAYMENT'
  | 'SCHEDULE_VISIT'
  | 'SEND_MESSAGE'
  | 'SEND_NOTIFICATIONS'
  | 'SUPERADMIN'
  | 'TOGGLE_RESIDENCE_STATUS'
  | 'VIEW_ACCOUNT_BALANCE'
  | 'VIEW_AMENITIES'
  | 'VIEW_AMENITY_BOOKINGS'
  | 'VIEW_CALL_LOGS'
  | 'VIEW_CHARGES'
  | 'VIEW_EXPENSES'
  | 'VIEW_FEE_CONFIGS'
  | 'VIEW_FINANCIAL_REPORTS'
  | 'VIEW_MAINTENANCE_TICKETS'
  | 'VIEW_MARKETPLACE'
  | 'VIEW_NOTES'
  | 'VIEW_NOTIFICATIONS'
  | 'VIEW_PACKAGES'
  | 'VIEW_PAYMENTS'
  | 'VIEW_PETS'
  | 'VIEW_PET_INCIDENTS'
  | 'VIEW_PQRF'
  | 'VIEW_PRODUCTS'
  | 'VIEW_RECIDENTS_LOCATION'
  | 'VIEW_REPORTS'
  | 'VIEW_RESIDENCES'
  | 'VIEW_RESIDENTS'
  | 'VIEW_ROLES'
  | 'VIEW_ROTATION'
  | 'VIEW_SENSITIVE_USER_DATA'
  | 'VIEW_SENT_MESSAGES'
  | 'VIEW_SETTINGS'
  | 'VIEW_SPECIAL_NUMBERS'
  | 'VIEW_USERS'
  | 'VIEW_VEHICLES'
  | 'VIEW_VISITORS'
  | 'VIEW_VISITS'
  | 'WAIVE_CHARGE';

/** Roles de la paltaforma */
export type ValidRoles =
  | 'ACCOUNTANT_ROL'
  | 'COMPILANCE_OFFICER_ROL'
  | 'COMPLEX_ROL'
  | 'COUNCIL_ROL'
  | 'RESIDENT_ROL'
  | 'SECURITY_ROL'
  | 'SUPERVISOR_ROL'
  | 'SUPER_ADMIN_ROL';

export type ValidatePetIncidentInput = {
  incidentId: Scalars['String']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  /** Mascota a la que se le atribuye el hecho */
  petId?: InputMaybe<Scalars['String']['input']>;
  /** Permite corregir la gravedad que puso quien reportó */
  severity?: InputMaybe<PetIncidentSeverity>;
  /** Unidad responsable. Se deduce de la mascota si se envía */
  unitId?: InputMaybe<Scalars['String']['input']>;
};

/** Vehículo de un residente registrado en el complejo */
export type Vehicle = {
  __typename?: 'Vehicle';
  /** Fecha de aprobación */
  approvedAt?: Maybe<Scalars['DateTime']['output']>;
  /** Usuario que aprobó/rechazó el vehículo */
  approvedByUser?: Maybe<User>;
  /** ID del usuario que aprobó o rechazó */
  approvedByUserId?: Maybe<Scalars['String']['output']>;
  /** Marca del vehículo. Ej: Toyota, Renault */
  brand?: Maybe<Scalars['String']['output']>;
  /** Color del vehículo */
  color?: Maybe<Scalars['String']['output']>;
  /** Complejo al que pertenece */
  complex?: Maybe<ResidentialComplex>;
  /** ID del complejo (desnormalizado para multi-tenant) */
  complexId: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  /** Tipo de combustible */
  fuelType?: Maybe<VehicleFuelType>;
  id: Scalars['String']['output'];
  /** Modelo. Ej: Corolla, Logan */
  model?: Maybe<Scalars['String']['output']>;
  /** Notas internas del administrador */
  notes?: Maybe<Scalars['String']['output']>;
  /** Número o código del parqueadero asignado */
  parkingSpot?: Maybe<Scalars['String']['output']>;
  /** URL de la foto del vehículo */
  photoUrl?: Maybe<Scalars['String']['output']>;
  /** Placa del vehículo (normalizada: sin espacios, mayúsculas) */
  plate: Scalars['String']['output'];
  /** Razón de rechazo o suspensión */
  rejectionReason?: Maybe<Scalars['String']['output']>;
  /** Residente propietario */
  resident?: Maybe<Resident>;
  /** ID del residente propietario del vehículo */
  residentId?: Maybe<Scalars['String']['output']>;
  /** Veces que ha salido por rotación en el gran ciclo actual (se reinicia al completar el ciclo) */
  rotationCycleCount: Scalars['Int']['output'];
  /** Última vez que fue suspendido por rotación (referencia de equidad) */
  rotationSuspendedAt?: Maybe<Scalars['DateTime']['output']>;
  /** Estado del vehículo en el complejo */
  status: VehicleStatus;
  /** Indica si la suspensión actual fue generada por rotación automática de parqueaderos */
  suspendedByRotation: Scalars['Boolean']['output'];
  /** Tipo de vehículo */
  type: VehicleType;
  /** Unidad a la que pertenece */
  unit?: Maybe<Unit>;
  /** ID de la unidad (desnormalizado de residente) */
  unitId: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  /** Año del modelo */
  year?: Maybe<Scalars['Int']['output']>;
};

/** Tipo de combustible del vehículo */
export type VehicleFuelType =
  | 'DIESEL'
  | 'ELECTRIC'
  | 'GAS'
  | 'GASOLINE'
  | 'HYBRID'
  | 'OTHER';

/** Estado del vehículo dentro del complejo */
export type VehicleStatus =
  /** Autorizado para circular y parquear */
  | 'ACTIVE'
  /** Esperando aprobación del administrador */
  | 'PENDING_APPROVAL'
  /** Solicitud rechazada */
  | 'REJECTED'
  /** Removido definitivamente del complejo */
  | 'REMOVED'
  /** Acceso suspendido temporalmente */
  | 'SUSPENDED';

/** Tipo de vehículo registrado */
export type VehicleType =
  /** Bicicleta (no ocupa parqueadero vehicular) */
  | 'BICYCLE'
  /** CAMIONETA o furgoneta */
  | 'CAMIONETA'
  /** Automóvil / carro */
  | 'CAR'
  /** Patineta eléctrica */
  | 'ELECTRIC_SCOOTER'
  /** Motocicleta */
  | 'MOTORCYCLE'
  /** Otro tipo de vehículo */
  | 'OTHER'
  /** Camioneta o camión */
  | 'TRUCK';

/** Verificación de OTP para completar el login del residente */
export type VerifyOtpInput = {
  /** Código OTP de 6 dígitos recibido por SMS */
  code: Scalars['String']['input'];
  /** Número de celular del residente */
  phoneNumber: Scalars['String']['input'];
};

/** Evento de visita: entrada, salida, estado y QR de acceso */
export type Visit = {
  __typename?: 'Visit';
  /** Momento en que el residente aprobó la visita */
  approvedByResidentAt?: Maybe<Scalars['DateTime']['output']>;
  complex?: Maybe<ResidentialComplex>;
  complexId: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  /** Razón del rechazo por parte del residente */
  denialReason?: Maybe<Scalars['String']['output']>;
  /** Momento en que el residente rechazó la visita */
  deniedByResidentAt?: Maybe<Scalars['DateTime']['output']>;
  /** Hora de ingreso real */
  entryTime?: Maybe<Scalars['DateTime']['output']>;
  /** Guardia que registró la salida */
  exitRegisteredByUser?: Maybe<User>;
  /** ID del guardia que registró la salida */
  exitRegisteredByUserId?: Maybe<Scalars['String']['output']>;
  /** Hora de salida real */
  exitTime?: Maybe<Scalars['DateTime']['output']>;
  /** Fecha/hora esperada de llegada (visitas programadas) */
  expectedArrivalAt?: Maybe<Scalars['DateTime']['output']>;
  /** Fecha/hora límite de llegada */
  expectedArrivalUntil?: Maybe<Scalars['DateTime']['output']>;
  /** Residente anfitrión */
  hostResident?: Maybe<Resident>;
  /** ID del residente que recibe la visita */
  hostResidentId: Scalars['String']['output'];
  id: Scalars['String']['output'];
  /** Datos adicionales del visitante (sexo, grupo sanguíneo, etc.) */
  metadata?: Maybe<Scalars['JSON']['output']>;
  /** Notas del guardia de seguridad */
  notes?: Maybe<Scalars['String']['output']>;
  /** Motivo de la visita */
  purpose?: Maybe<Scalars['String']['output']>;
  /** Fecha de expiración del QR */
  qrExpiresAt?: Maybe<Scalars['DateTime']['output']>;
  /** Token único del QR de acceso */
  qrToken?: Maybe<Scalars['String']['output']>;
  /** Indica si el QR ya fue utilizado */
  qrUsed: Scalars['Boolean']['output'];
  /** Guardia que registró la visita */
  registeredByUser?: Maybe<User>;
  /** ID del guardia que registró la visita */
  registeredByUserId?: Maybe<Scalars['String']['output']>;
  /** Estado actual de la visita */
  status: VisitStatus;
  /** Modalidad de la visita */
  type: VisitType;
  unit?: Maybe<Unit>;
  unitId: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  /** Placa del vehículo del visitante (si aplica) */
  vehiclePlate?: Maybe<Scalars['String']['output']>;
  visitor?: Maybe<Visitor>;
  visitorId: Scalars['String']['output'];
};

/** Estado actual de la visita */
export type VisitStatus =
  | 'APPROVED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'DENIED'
  | 'EXPIRED'
  | 'INSIDE'
  | 'NO_SHOW'
  | 'PENDING_APPROVAL';

/** Modalidad de la visita */
export type VisitType =
  /** Domicilio o entrega de paquete */
  | 'DELIVERY'
  /** Pre-autorizada — genera QR de acceso */
  | 'SCHEDULED'
  /** Proveedor de servicio: técnico, mantenimiento, etc. */
  | 'SERVICE_PROVIDER'
  /** Sin cita — requiere aprobación del residente en tiempo real */
  | 'WALK_IN';

/** Persona que realiza una o más visitas al complejo */
export type Visitor = {
  __typename?: 'Visitor';
  /** Razón del bloqueo */
  blacklistReason?: Maybe<Scalars['String']['output']>;
  /** Fecha en que fue bloqueado */
  blacklistedAt?: Maybe<Scalars['DateTime']['output']>;
  /** Supervisor que lo bloqueó */
  blacklistedByUser?: Maybe<User>;
  /** ID del usuario que lo bloqueó */
  blacklistedByUserId?: Maybe<Scalars['String']['output']>;
  complex?: Maybe<ResidentialComplex>;
  /** Complejo al que pertenece este registro */
  complexId: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  /** Nombre completo del visitante */
  fullName: Scalars['String']['output'];
  id: Scalars['String']['output'];
  /** Número de documento de identidad */
  identity: Scalars['String']['output'];
  /** Tipo de documento */
  identityType: VisitorIdentityType;
  /** Visitante en lista negra — no puede ingresar */
  isBlacklisted: Scalars['Boolean']['output'];
  /** Apellido del visitante */
  lastName: Scalars['String']['output'];
  metadata?: Maybe<Scalars['JSON']['output']>;
  /** Nombre del visitante */
  name: Scalars['String']['output'];
  /** Teléfono de contacto */
  phone?: Maybe<Scalars['String']['output']>;
  /** URL de la foto capturada en portería */
  photoUrl?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  /** Historial de visitas */
  visits?: Maybe<Array<Visit>>;
};

/** Tipo de documento de identidad del visitante */
export type VisitorIdentityType =
  | 'CC'
  | 'CE'
  | 'FOREIGN_ID'
  | 'OTHER'
  | 'PASSPORT'
  | 'TI';

/** Configuración del parqueadero para vehículos visitantes */
export type VisitorParkingConfig = {
  __typename?: 'VisitorParkingConfig';
  /** ID de la tarifa activa por defecto */
  activeRateId?: Maybe<Scalars['String']['output']>;
  /** Complejo residencial asociado a esta configuración */
  complex?: Maybe<ResidentialComplex>;
  /** ID del complejo residencial */
  complexId: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  /** Moneda principal del parqueadero (ej. COP, USD) */
  currency: Scalars['String']['output'];
  /** Minutos de gracia antes de empezar a cobrar */
  gracePeriodMinutes?: Maybe<Scalars['Int']['output']>;
  id: Scalars['String']['output'];
  /** Capacidad máxima de vehículos visitantes simultáneos */
  maxCapacity?: Maybe<Scalars['Int']['output']>;
  /** Tarifas configuradas para el parqueadero */
  rates: Array<VisitorParkingRate>;
  /** Mensaje que aparece en el recibo de parqueadero */
  receiptMessage?: Maybe<Scalars['String']['output']>;
  /** Mostrar logo del complejo en el recibo */
  showLogoOnReceipt: Scalars['Boolean']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

/** Tarifa de parqueadero para vehículos visitantes */
export type VisitorParkingRate = {
  __typename?: 'VisitorParkingRate';
  /** Monto de la tarifa */
  amount: Scalars['Float']['output'];
  /** ID del complejo (para filtrado multi-tenant) */
  complexId?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  createdByUser: User;
  /** Moneda de la tarifa (ej. COP, USD) */
  currency: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  /** Minutos de gracia sin cobro */
  gracePeriodMinutes?: Maybe<Scalars['Int']['output']>;
  id: Scalars['String']['output'];
  isActive: Scalars['Boolean']['output'];
  /** Tope máximo de cobro por día */
  maxDailyAmount?: Maybe<Scalars['Float']['output']>;
  /** Nombre descriptivo de la tarifa */
  name: Scalars['String']['output'];
  /** Tipo de tarifa aplicada */
  type: ParkingRateType;
  updatedAt: Scalars['DateTime']['output'];
  updatedByUser: User;
  /** Tipo de vehículo */
  vehicleType: VehicleType;
};

/** Datos para crear/actualizar una tarifa de parqueadero visitante */
export type VisitorParkingRateInput = {
  amount: Scalars['Float']['input'];
  currency: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  /** ID de la tarifa a actualizar (omitir para crear nueva) */
  id?: InputMaybe<Scalars['String']['input']>;
  isActive?: Scalars['Boolean']['input'];
  name: Scalars['String']['input'];
  /** Tipo de tarifa aplicada */
  type: ParkingRateType;
};

/** Registro de vehículo visitante en el parqueadero */
export type VisitorVehicle = {
  __typename?: 'VisitorVehicle';
  /** Marca del vehículo */
  brand?: Maybe<Scalars['String']['output']>;
  /** Motivo de cancelación */
  cancellationReason?: Maybe<Scalars['String']['output']>;
  /** Usuario que canceló el registro */
  cancelledByUserId?: Maybe<Scalars['String']['output']>;
  /** Color del vehículo */
  color?: Maybe<Scalars['String']['output']>;
  complex?: Maybe<ResidentialComplex>;
  /** ID del complejo */
  complexId: Scalars['String']['output'];
  /** Alias de entryDate */
  createdAt: Scalars['DateTime']['output'];
  /** Nombre del conductor */
  driverName?: Maybe<Scalars['String']['output']>;
  /** Duración en minutos (calculada en la salida) */
  duration?: Maybe<Scalars['Int']['output']>;
  /** Fecha/hora de entrada (asignada por el servidor) */
  entryDate: Scalars['DateTime']['output'];
  /** Fecha/hora de salida */
  exitDate?: Maybe<Scalars['DateTime']['output']>;
  /** Usuario que registró la salida */
  exitRegisteredByUser?: Maybe<User>;
  /** Usuario que registró la salida */
  exitRegisteredByUserId?: Maybe<Scalars['String']['output']>;
  /** Residente anfitrión */
  hostResident?: Maybe<Resident>;
  /** ID del residente anfitrión */
  hostResidentId: Scalars['String']['output'];
  id: Scalars['String']['output'];
  /** Número de factura generado por el sistema (PKG-YYYYMMDD-XXXX) */
  invoiceNumber: Scalars['String']['output'];
  /** Notas adicionales del registro */
  notes?: Maybe<Scalars['String']['output']>;
  /** Costo total generado al momento de la salida */
  parkingCost?: Maybe<Scalars['Float']['output']>;
  /** Método de pago (disponible tras el cierre) */
  paymentMethod?: Maybe<ParkingPaymentMethod>;
  /** Placa del vehículo (normalizada: mayúsculas, sin espacios) */
  plate: Scalars['String']['output'];
  /** Usuario que registró el ingreso */
  registeredByUser?: Maybe<User>;
  /** Usuario que registró el ingreso */
  registeredByUserId?: Maybe<Scalars['String']['output']>;
  /** Estado actual del registro */
  status: ParkingRecordStatus;
  updatedAt: Scalars['DateTime']['output'];
  /** Tipo de vehículo */
  vehicleType: VehicleType;
};

/** Voto nominal (se sabe quién votó qué) o secreto (solo totales) */
export type VoteSecrecy =
  | 'NOMINAL'
  | 'SECRET';

/** Peso del voto: coeficiente, una unidad un voto, o un consejero un voto */
export type VoteWeighting =
  | 'COEFFICIENT'
  | 'MEMBER'
  | 'UNIT';

/** Residentes (asambleas) o consejo (sus reuniones) */
export type VotingAudience =
  | 'COUNCIL'
  | 'RESIDENTS';

/** Voto nominal: quién votó qué */
export type VotingBallotView = {
  __typename?: 'VotingBallotView';
  optionText: Scalars['String']['output'];
  votedAt: Scalars['DateTime']['output'];
  /** Unidad ("Torre 2 · 301") o nombre del consejero */
  voterLabel: Scalars['String']['output'];
  /** Persona que registró el voto */
  voterName?: Maybe<Scalars['String']['output']>;
  weight: Scalars['Float']['output'];
};

/** Miembro del consejo y si vota en sus reuniones */
export type VotingCouncilMember = {
  __typename?: 'VotingCouncilMember';
  /** Tiene voto; si no, solo voz */
  hasVote: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  unitLabel?: Maybe<Scalars['String']['output']>;
  userId: Scalars['String']['output'];
};

/** Reunión en la que se vota: asamblea o consejo */
export type VotingMeeting = {
  __typename?: 'VotingMeeting';
  complexId: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  kind: VotingMeetingKind;
  questions?: Maybe<Array<VotingQuestion>>;
  scheduledAt: Scalars['DateTime']['output'];
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

/** Asamblea de copropietarios o reunión del consejo */
export type VotingMeetingKind =
  | 'ASAMBLEA'
  | 'CONSEJO';

/** Opción de respuesta de una pregunta */
export type VotingOption = {
  __typename?: 'VotingOption';
  id: Scalars['String']['output'];
  position: Scalars['Int']['output'];
  questionId: Scalars['String']['output'];
  text: Scalars['String']['output'];
};

/** Resultado de una opción */
export type VotingOptionResult = {
  __typename?: 'VotingOptionResult';
  optionId: Scalars['String']['output'];
  /** Fracción de los votos emitidos (0 a 1) */
  share: Scalars['Float']['output'];
  /** Fracción del total habilitado para votar (0 a 1) */
  shareOfEligible: Scalars['Float']['output'];
  text: Scalars['String']['output'];
  /** Cuántas unidades o consejeros la eligieron */
  votes: Scalars['Int']['output'];
  /** Suma de pesos: coeficientes, unidades o consejeros */
  weight: Scalars['Float']['output'];
};

/** Pregunta sometida a votación */
export type VotingQuestion = {
  __typename?: 'VotingQuestion';
  closedAt?: Maybe<Scalars['DateTime']['output']>;
  complexId: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  meeting?: Maybe<VotingMeeting>;
  meetingId: Scalars['String']['output'];
  /** Opción que eligió quien consulta (o su unidad, en asamblea) */
  myVoteOptionId?: Maybe<Scalars['String']['output']>;
  openedAt?: Maybe<Scalars['DateTime']['output']>;
  options?: Maybe<Array<VotingOption>>;
  position: Scalars['Int']['output'];
  /** Resultados. El residente los ve al cerrarse; la administración, siempre */
  results?: Maybe<VotingResults>;
  secrecy: VoteSecrecy;
  status: VotingQuestionStatus;
  text: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  /** Quien consulta todavía puede votar */
  viewerCanVote: Scalars['Boolean']['output'];
  /** Quien consulta es del consejo pero solo tiene voz */
  viewerHasVoiceOnly: Scalars['Boolean']['output'];
  weighting: VoteWeighting;
};

/** Borrador, abierta a votos o cerrada */
export type VotingQuestionStatus =
  | 'CLOSED'
  | 'DRAFT'
  | 'OPEN';

/** Resultados de una pregunta */
export type VotingResults = {
  __typename?: 'VotingResults';
  ballots?: Maybe<Array<VotingBallotView>>;
  /** Unidades o consejeros habilitados */
  eligibleCount: Scalars['Int']['output'];
  /** Peso total habilitado (suma de coeficientes, unidades o consejeros) */
  eligibleWeight: Scalars['Float']['output'];
  options: Array<VotingOptionResult>;
  participants?: Maybe<Array<Scalars['String']['output']>>;
  /** Peso que votó sobre el habilitado (0 a 1) */
  participation: Scalars['Float']['output'];
  votedCount: Scalars['Int']['output'];
  votedWeight: Scalars['Float']['output'];
  weighting: VoteWeighting;
};

/** Módulo e interruptores de votaciones del complejo */
export type VotingSettings = {
  __typename?: 'VotingSettings';
  /** Reuniones del consejo visibles para el consejo */
  councilEnabled: Scalars['Boolean']['output'];
  /** El SUPER_ADMIN le habilitó el módulo al complejo */
  moduleEnabled: Scalars['Boolean']['output'];
  /** Asambleas visibles para los residentes */
  residentsEnabled: Scalars['Boolean']['output'];
};

export type WalletEntryObject = {
  __typename?: 'WalletEntryObject';
  amount: Scalars['Float']['output'];
  chargeId?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['String']['output'];
  description: Scalars['String']['output'];
  id: Scalars['String']['output'];
  type: Scalars['String']['output'];
  unitId: Scalars['String']['output'];
};

export type WalletSummaryItem = {
  __typename?: 'WalletSummaryItem';
  building?: Maybe<Scalars['String']['output']>;
  currentBalance: Scalars['Float']['output'];
  totalCredits: Scalars['Float']['output'];
  totalDebits: Scalars['Float']['output'];
  unitId: Scalars['String']['output'];
  unitNumber: Scalars['String']['output'];
};

export type WalletSummaryPaginated = {
  __typename?: 'WalletSummaryPaginated';
  items: Array<WalletSummaryItem>;
  pagination: PaginationReponse;
};

/** Datos para que el residente inicie sesión enviando un mensaje de WhatsApp */
export type WhatsAppLoginChallengeResponse = {
  __typename?: 'WhatsAppLoginChallengeResponse';
  /** Identificador del intento. Requerido para consultar estado y canjear */
  challengeId: Scalars['ID']['output'];
  /** Vencimiento del intento */
  expiresAt: Scalars['DateTime']['output'];
  /** Texto exacto que debe enviarse, por si el link no abre */
  messageText: Scalars['String']['output'];
  /** Código que viaja en el mensaje. Público: solo identifica el intento */
  nonce: Scalars['String']['output'];
  /** Advertencia a mostrar al usuario antes de que envíe el mensaje */
  warning: Scalars['String']['output'];
  /** Link wa.me con el mensaje prellenado. Abrirlo en el mismo dispositivo */
  whatsappUrl: Scalars['String']['output'];
};

/** Estado de un intento de login por mensaje entrante de WhatsApp */
export type WhatsAppLoginStatus =
  | 'CONFIRMED'
  | 'CONSUMED'
  | 'EXPIRED'
  | 'PENDING';

/** Estado de un intento de login por WhatsApp entrante */
export type WhatsAppLoginStatusResponse = {
  __typename?: 'WhatsAppLoginStatusResponse';
  expiresAt: Scalars['DateTime']['output'];
  /** PENDING mientras no llega el mensaje; CONFIRMED habilita el canje */
  status: WhatsAppLoginStatus;
};

export type ApproveAccessRequestMutationVariables = Exact<{
  requestId: Scalars['String']['input'];
}>;


export type ApproveAccessRequestMutation = { __typename?: 'Mutation', approveAccessRequest: { __typename?: 'SupervisorAccessRequest', id: string, status: AccessRequestStatus, resolvedAt?: any | null } };

export type RejectAccessRequestMutationVariables = Exact<{
  input: RejectAccessRequestInput;
}>;


export type RejectAccessRequestMutation = { __typename?: 'Mutation', rejectAccessRequest: { __typename?: 'SupervisorAccessRequest', id: string, status: AccessRequestStatus, rejectionReason?: string | null, resolvedAt?: any | null } };

export type AmenitiesQueryVariables = Exact<{
  complexId: Scalars['String']['input'];
  pagination?: InputMaybe<PaginationInput>;
  filters?: InputMaybe<FilterAmenitiesInput>;
}>;


export type AmenitiesQuery = { __typename?: 'Query', amenities: { __typename?: 'PaginatedAmenitiesResponse', items: Array<{ __typename?: 'Amenity', id: string, name: string, description?: string | null, type: AmenityType, status: AmenityStatus, location?: string | null, rules?: string | null, imageUrls?: Array<string> | null, bookingMode: AmenityBookingMode, durationUnit: AmenityDurationUnit, slotDurationMinutes: number, minDurationMinutes: number, maxDurationMinutes: number, capacity: number, maxSimultaneousBookings: number, advanceBookingDays: number, minAdvanceDays: number, cancellationDeadlineDays: number, cancellationDeadlineHours: number, lateCancellationFeePercent: number, councilFreeBookingsPerYear: number, requiresApproval: boolean, feeType: AmenityFeeType, feeAmount: number, complexId: string, schedules?: Array<{ __typename?: 'AmenitySchedule', id: string, dayOfWeek: number, openTime: string, closeTime: string, isActive: boolean }> | null }>, pagination: { __typename?: 'PaginationReponse', currentPage: number, itemsPerPage: number, totalItems: number, totalPages: number, hasNextPage: boolean, hasPreviousPage: boolean } } };

export type AmenityAvailabilityQueryVariables = Exact<{
  input: AmenityAvailabilityInput;
}>;


export type AmenityAvailabilityQuery = { __typename?: 'Query', amenityAvailability: { __typename?: 'AmenityAvailabilityResponse', amenityId: string, days: Array<{ __typename?: 'AmenityAvailabilityDay', date: string, isOpen: boolean, closedReason?: string | null, openWindows: Array<{ __typename?: 'AmenityTimeWindow', startAt: any, endAt: any }>, slots: Array<{ __typename?: 'AmenitySlot', startAt: any, endAt: any, capacityTotal: number, capacityUsed: number, isAvailable: boolean }>, busy: Array<{ __typename?: 'AmenityBusyRange', startAt: any, endAt: any, bookingsCount: number }> }> } };

export type MyUnitAmenityBookingsQueryVariables = Exact<{
  complexId: Scalars['String']['input'];
  pagination?: InputMaybe<PaginationInput>;
  filters?: InputMaybe<FilterAmenityBookingsInput>;
}>;


export type MyUnitAmenityBookingsQuery = { __typename?: 'Query', myUnitAmenityBookings: { __typename?: 'PaginatedAmenityBookingsResponse', items: Array<{ __typename?: 'AmenityBooking', id: string, amenityId: string, complexId: string, unitId: string, startAt: any, endAt: any, attendees: number, purpose?: string | null, notes?: string | null, status: AmenityBookingStatus, rejectionReason?: string | null, cancellationReason?: string | null, accessCode?: string | null, checkInAt?: any | null, checkOutAt?: any | null, feeAmount: number, isCouncilFreeBooking: boolean, lateCancellationAmount: number, damageAmount: number, damageDescription?: string | null, createdAt: any, amenity?: { __typename?: 'Amenity', id: string, name: string, type: AmenityType, durationUnit: AmenityDurationUnit, cancellationDeadlineDays: number, cancellationDeadlineHours: number, lateCancellationFeePercent: number, councilFreeBookingsPerYear: number } | null }>, pagination: { __typename?: 'PaginationReponse', currentPage: number, itemsPerPage: number, totalItems: number, totalPages: number, hasNextPage: boolean, hasPreviousPage: boolean } } };

export type AmenityBookingQueryVariables = Exact<{
  bookingId: Scalars['String']['input'];
}>;


export type AmenityBookingQuery = { __typename?: 'Query', amenityBooking: { __typename?: 'AmenityBooking', id: string, amenityId: string, complexId: string, unitId: string, startAt: any, endAt: any, attendees: number, purpose?: string | null, notes?: string | null, status: AmenityBookingStatus, rejectionReason?: string | null, cancellationReason?: string | null, accessCode?: string | null, checkInAt?: any | null, checkOutAt?: any | null, feeAmount: number, isCouncilFreeBooking: boolean, lateCancellationAmount: number, damageAmount: number, damageDescription?: string | null, createdAt: any, amenity?: { __typename?: 'Amenity', id: string, name: string, type: AmenityType, durationUnit: AmenityDurationUnit, cancellationDeadlineDays: number, cancellationDeadlineHours: number, lateCancellationFeePercent: number, councilFreeBookingsPerYear: number } | null } };

export type MyAmenityCouncilQuotaQueryVariables = Exact<{
  amenityId: Scalars['String']['input'];
}>;


export type MyAmenityCouncilQuotaQuery = { __typename?: 'Query', myAmenityCouncilQuota: { __typename?: 'AmenityCouncilQuotaResponse', isCouncilMember: boolean, bookingsPerYear: number, used: number, remaining: number, year: number } };

export type CreateAmenityBookingMutationVariables = Exact<{
  input: CreateAmenityBookingInput;
}>;


export type CreateAmenityBookingMutation = { __typename?: 'Mutation', createAmenityBooking: { __typename?: 'AmenityBooking', id: string, amenityId: string, startAt: any, endAt: any, attendees: number, purpose?: string | null, status: AmenityBookingStatus, accessCode?: string | null, feeAmount: number, isCouncilFreeBooking: boolean, createdAt: any, amenity?: { __typename?: 'Amenity', id: string, name: string, type: AmenityType, durationUnit: AmenityDurationUnit, cancellationDeadlineDays: number, cancellationDeadlineHours: number, lateCancellationFeePercent: number, councilFreeBookingsPerYear: number } | null } };

export type CancelAmenityBookingMutationVariables = Exact<{
  input: CancelAmenityBookingInput;
}>;


export type CancelAmenityBookingMutation = { __typename?: 'Mutation', cancelAmenityBooking: { __typename?: 'AmenityBooking', id: string, status: AmenityBookingStatus, cancellationReason?: string | null, feeAmount: number } };

export type LoginResidentMutationVariables = Exact<{
  input: LoginResidentInput;
}>;


export type LoginResidentMutation = { __typename?: 'Mutation', loginResident: { __typename?: 'AuthResponse', accessToken: string, refreshToken: string, expiresIn: number, sessionId: string } };

export type ResendResidentSystemCodeMutationVariables = Exact<{
  identity: Scalars['String']['input'];
}>;


export type ResendResidentSystemCodeMutation = { __typename?: 'Mutation', resendResidentSystemCode: { __typename?: 'OtpRequestResponse', success: boolean, message: string } };

export type RefreshTokenMutationVariables = Exact<{
  refreshToken: Scalars['String']['input'];
}>;


export type RefreshTokenMutation = { __typename?: 'Mutation', refreshToken: { __typename?: 'AuthResponse', accessToken: string, refreshToken: string, expiresIn: number, sessionId: string } };

export type GetMyResidentProfileQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMyResidentProfileQuery = { __typename?: 'Query', myResidentProfile: { __typename?: 'Resident', id: string, type: ResidentType, status: ResidentStatus, isMainResident: boolean, isCouncilMember: boolean, startDate: string, user?: { __typename?: 'User', id: string, name: string, lastName: string, email: string, phoneNumber: string, identity?: string | null, rating: number } | null, unit?: { __typename?: 'Unit', id: string, number: string, floor: number, building?: { __typename?: 'Building', id: string, name: string, floors: number } | null } | null, complex?: { __typename?: 'ResidentialComplex', id: string, name: string } | null } };

export type SetAccessCodeMutationVariables = Exact<{
  input: SetAccessCodeInput;
}>;


export type SetAccessCodeMutation = { __typename?: 'Mutation', setResidentAccessCode: { __typename?: 'ResidentDevice', id: string, deviceId: string, label?: string | null, platform?: string | null, createdAt: any } };

export type LoginWithAccessCodeMutationVariables = Exact<{
  input: LoginAccessCodeInput;
}>;


export type LoginWithAccessCodeMutation = { __typename?: 'Mutation', loginWithAccessCode: { __typename?: 'AuthResponse', accessToken: string, refreshToken: string, expiresIn: number, sessionId: string } };

export type ResidentHasAccessCodeQueryVariables = Exact<{ [key: string]: never; }>;


export type ResidentHasAccessCodeQuery = { __typename?: 'Query', residentHasAccessCode: boolean };

export type MyDevicesQueryVariables = Exact<{ [key: string]: never; }>;


export type MyDevicesQuery = { __typename?: 'Query', myResidentDevices: Array<{ __typename?: 'ResidentDevice', id: string, deviceId: string, label?: string | null, platform?: string | null, lastUsedAt?: any | null, createdAt: any }> };

export type RevokeDeviceMutationVariables = Exact<{
  deviceId: Scalars['ID']['input'];
}>;


export type RevokeDeviceMutation = { __typename?: 'Mutation', revokeResidentDevice: boolean };

export type RevokeMyOtherDevicesMutationVariables = Exact<{ [key: string]: never; }>;


export type RevokeMyOtherDevicesMutation = { __typename?: 'Mutation', revokeMyOtherDevices: number };

export type WaLoginAvailableQueryVariables = Exact<{ [key: string]: never; }>;


export type WaLoginAvailableQuery = { __typename?: 'Query', whatsAppLoginAvailable: boolean };

export type RequestWaLoginMutationVariables = Exact<{
  identity: Scalars['String']['input'];
}>;


export type RequestWaLoginMutation = { __typename?: 'Mutation', requestWhatsAppLoginChallenge: { __typename?: 'WhatsAppLoginChallengeResponse', challengeId: string, nonce: string, whatsappUrl: string, messageText: string, expiresAt: any, warning: string } };

export type WaLoginStatusQueryVariables = Exact<{
  challengeId: Scalars['ID']['input'];
}>;


export type WaLoginStatusQuery = { __typename?: 'Query', whatsAppLoginChallengeStatus: { __typename?: 'WhatsAppLoginStatusResponse', status: WhatsAppLoginStatus, expiresAt: any } };

export type RedeemWaLoginMutationVariables = Exact<{
  challengeId: Scalars['ID']['input'];
  accessCode?: InputMaybe<Scalars['String']['input']>;
}>;


export type RedeemWaLoginMutation = { __typename?: 'Mutation', redeemWhatsAppLoginChallenge: { __typename?: 'AuthResponse', accessToken: string, refreshToken: string, expiresIn: number, sessionId: string } };

export type RequestApprovalMutationVariables = Exact<{
  identity: Scalars['String']['input'];
}>;


export type RequestApprovalMutation = { __typename?: 'Mutation', requestDeviceApproval: { __typename?: 'DeviceApprovalResponse', challengeId: string, approvalCode: string, expiresAt: any, instructions: string } };

export type ApprovalStatusQueryVariables = Exact<{
  challengeId: Scalars['ID']['input'];
}>;


export type ApprovalStatusQuery = { __typename?: 'Query', deviceApprovalStatus: { __typename?: 'DeviceApprovalStatusResponse', status: DeviceApprovalStatus, expiresAt: any } };

export type RedeemApprovalMutationVariables = Exact<{
  challengeId: Scalars['ID']['input'];
  accessCode?: InputMaybe<Scalars['String']['input']>;
}>;


export type RedeemApprovalMutation = { __typename?: 'Mutation', redeemDeviceApproval: { __typename?: 'AuthResponse', accessToken: string, refreshToken: string, expiresIn: number, sessionId: string } };

export type PendingApprovalsQueryVariables = Exact<{ [key: string]: never; }>;


export type PendingApprovalsQuery = { __typename?: 'Query', pendingDeviceApprovals: Array<{ __typename?: 'PendingDeviceApproval', approvalId: string, approvalCode: string, requestedFromLabel?: string | null, requestedFromIp?: string | null, expiresAt: any, createdAt: any }> };

export type ApproveMutationVariables = Exact<{
  approvalId: Scalars['ID']['input'];
}>;


export type ApproveMutation = { __typename?: 'Mutation', approveDeviceApproval: boolean };

export type DenyMutationVariables = Exact<{
  approvalId: Scalars['ID']['input'];
}>;


export type DenyMutation = { __typename?: 'Mutation', denyDeviceApproval: boolean };

export type GetUnitBalanceQueryVariables = Exact<{
  unitId: Scalars['String']['input'];
  complexId: Scalars['String']['input'];
}>;


export type GetUnitBalanceQuery = { __typename?: 'Query', unitBalance: { __typename?: 'UnitBalanceResponse', unitId: string, unitNumber: string, totalDebt: number, overdueCount: number, pendingCount: number, totalPaid: number } };

export type GetUnitAccountStatementQueryVariables = Exact<{
  unitId: Scalars['String']['input'];
  complexId: Scalars['String']['input'];
  period?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetUnitAccountStatementQuery = { __typename?: 'Query', unitAccountStatement: { __typename?: 'UnitAccountStatementResponse', unitId: string, unitNumber: string, building?: string | null, totalDebits: number, totalCredits: number, currentBalance: number, walletBalance: number, movements: Array<{ __typename?: 'AccountMovement', id: string, date: string, type: string, description: string, debit: number, credit: number, balance: number, reference?: string | null }> } };

export type GetPaymentsByChargeQueryVariables = Exact<{
  chargeId: Scalars['String']['input'];
}>;


export type GetPaymentsByChargeQuery = { __typename?: 'Query', paymentsByCharge: Array<{ __typename?: 'Payment', id: string, amount: number, method: PaymentMethod, reference?: string | null, receiptUrl?: string | null, paidAt: any, notes?: string | null, isReversed: boolean, reversalReason?: string | null, reversedAt?: any | null, createdAt: any }> };

export type GetUnitWalletQueryVariables = Exact<{
  unitId: Scalars['String']['input'];
  complexId: Scalars['String']['input'];
}>;


export type GetUnitWalletQuery = { __typename?: 'Query', unitWallet: { __typename?: 'UnitWalletResponse', unitId: string, unitNumber: string, building?: string | null, currentBalance: number, totalCredits: number, totalDebits: number, entries: Array<{ __typename?: 'WalletEntryObject', id: string, type: string, amount: number, description: string, chargeId?: string | null, createdAt: string }> } };

export type ListingFieldsFragment = { __typename?: 'MarketplaceListing', id: string, type: MarketplaceListingType, title: string, description: string, condition?: MarketplaceItemCondition | null, imageUrls: Array<string>, priceAmount?: number | null, priceType: MarketplacePriceType, currency: string, contactPreference: MarketplaceContactPreference, showPhone: boolean, status: MarketplaceListingStatus, rejectionReason?: string | null, publishedAt?: any | null, expiresAt?: any | null, viewsCount: number, contactsCount: number, favoritesCount: number, createdAt: any, categoryId: string, viewerHasFavorited: boolean, viewerHasContacted: boolean, viewerIsOwner: boolean, category?: { __typename?: 'MarketplaceCategory', id: string, name: string, icon?: string | null } | null, unit?: { __typename?: 'Unit', id: string, number: string, building?: { __typename?: 'Building', id: string, name: string } | null } | null, contact: { __typename?: 'ListingContactResponse', displayName: string, unitLabel?: string | null, preference: MarketplaceContactPreference, phone?: string | null, inAppOnly: boolean } };

export type MarketplaceListingsQueryVariables = Exact<{
  complexId: Scalars['String']['input'];
  pagination?: InputMaybe<PaginationInput>;
  filters?: InputMaybe<FilterListingsInput>;
}>;


export type MarketplaceListingsQuery = { __typename?: 'Query', marketplaceListings: { __typename?: 'PaginatedListingsResponse', items: Array<{ __typename?: 'MarketplaceListing', id: string, type: MarketplaceListingType, title: string, description: string, condition?: MarketplaceItemCondition | null, imageUrls: Array<string>, priceAmount?: number | null, priceType: MarketplacePriceType, currency: string, contactPreference: MarketplaceContactPreference, showPhone: boolean, status: MarketplaceListingStatus, rejectionReason?: string | null, publishedAt?: any | null, expiresAt?: any | null, viewsCount: number, contactsCount: number, favoritesCount: number, createdAt: any, categoryId: string, viewerHasFavorited: boolean, viewerHasContacted: boolean, viewerIsOwner: boolean, category?: { __typename?: 'MarketplaceCategory', id: string, name: string, icon?: string | null } | null, unit?: { __typename?: 'Unit', id: string, number: string, building?: { __typename?: 'Building', id: string, name: string } | null } | null, contact: { __typename?: 'ListingContactResponse', displayName: string, unitLabel?: string | null, preference: MarketplaceContactPreference, phone?: string | null, inAppOnly: boolean } }>, pagination: { __typename?: 'PaginationReponse', currentPage: number, totalPages: number, hasNextPage: boolean } } };

export type MarketplaceListingQueryVariables = Exact<{
  listingId: Scalars['String']['input'];
}>;


export type MarketplaceListingQuery = { __typename?: 'Query', marketplaceListing: { __typename?: 'MarketplaceListing', id: string, type: MarketplaceListingType, title: string, description: string, condition?: MarketplaceItemCondition | null, imageUrls: Array<string>, priceAmount?: number | null, priceType: MarketplacePriceType, currency: string, contactPreference: MarketplaceContactPreference, showPhone: boolean, status: MarketplaceListingStatus, rejectionReason?: string | null, publishedAt?: any | null, expiresAt?: any | null, viewsCount: number, contactsCount: number, favoritesCount: number, createdAt: any, categoryId: string, viewerHasFavorited: boolean, viewerHasContacted: boolean, viewerIsOwner: boolean, category?: { __typename?: 'MarketplaceCategory', id: string, name: string, icon?: string | null } | null, unit?: { __typename?: 'Unit', id: string, number: string, building?: { __typename?: 'Building', id: string, name: string } | null } | null, contact: { __typename?: 'ListingContactResponse', displayName: string, unitLabel?: string | null, preference: MarketplaceContactPreference, phone?: string | null, inAppOnly: boolean } } };

export type MarketplaceCategoriesAppQueryVariables = Exact<{
  complexId: Scalars['String']['input'];
}>;


export type MarketplaceCategoriesAppQuery = { __typename?: 'Query', marketplaceCategories: Array<{ __typename?: 'MarketplaceCategory', id: string, name: string, icon?: string | null }> };

export type MarketplaceSettingsAppQueryVariables = Exact<{
  complexId: Scalars['String']['input'];
}>;


export type MarketplaceSettingsAppQuery = { __typename?: 'Query', marketplaceSettings: { __typename?: 'MarketplaceSettings', complexId: string, moderationMode: MarketplaceModerationMode, listingDurationDays: number, maxActiveListingsPerUnit: number, maxImagesPerListing: number, allowPhoneContact: boolean, allowWantedListings: boolean, termsText?: string | null } };

export type RegisterListingInterestMutationVariables = Exact<{
  input: RegisterListingInterestInput;
}>;


export type RegisterListingInterestMutation = { __typename?: 'Mutation', registerListingInterest: { __typename?: 'MarketplaceListing', id: string, type: MarketplaceListingType, title: string, description: string, condition?: MarketplaceItemCondition | null, imageUrls: Array<string>, priceAmount?: number | null, priceType: MarketplacePriceType, currency: string, contactPreference: MarketplaceContactPreference, showPhone: boolean, status: MarketplaceListingStatus, rejectionReason?: string | null, publishedAt?: any | null, expiresAt?: any | null, viewsCount: number, contactsCount: number, favoritesCount: number, createdAt: any, categoryId: string, viewerHasFavorited: boolean, viewerHasContacted: boolean, viewerIsOwner: boolean, category?: { __typename?: 'MarketplaceCategory', id: string, name: string, icon?: string | null } | null, unit?: { __typename?: 'Unit', id: string, number: string, building?: { __typename?: 'Building', id: string, name: string } | null } | null, contact: { __typename?: 'ListingContactResponse', displayName: string, unitLabel?: string | null, preference: MarketplaceContactPreference, phone?: string | null, inAppOnly: boolean } } };

export type ToggleListingFavoriteMutationVariables = Exact<{
  listingId: Scalars['String']['input'];
}>;


export type ToggleListingFavoriteMutation = { __typename?: 'Mutation', toggleListingFavorite: boolean };

export type ReportListingMutationVariables = Exact<{
  input: ReportListingInput;
}>;


export type ReportListingMutation = { __typename?: 'Mutation', reportListing: { __typename?: 'MarketplaceListingReport', id: string, status: MarketplaceReportStatus } };

export type PauseListingAppMutationVariables = Exact<{
  listingId: Scalars['String']['input'];
}>;


export type PauseListingAppMutation = { __typename?: 'Mutation', pauseListing: { __typename?: 'MarketplaceListing', id: string, type: MarketplaceListingType, title: string, description: string, condition?: MarketplaceItemCondition | null, imageUrls: Array<string>, priceAmount?: number | null, priceType: MarketplacePriceType, currency: string, contactPreference: MarketplaceContactPreference, showPhone: boolean, status: MarketplaceListingStatus, rejectionReason?: string | null, publishedAt?: any | null, expiresAt?: any | null, viewsCount: number, contactsCount: number, favoritesCount: number, createdAt: any, categoryId: string, viewerHasFavorited: boolean, viewerHasContacted: boolean, viewerIsOwner: boolean, category?: { __typename?: 'MarketplaceCategory', id: string, name: string, icon?: string | null } | null, unit?: { __typename?: 'Unit', id: string, number: string, building?: { __typename?: 'Building', id: string, name: string } | null } | null, contact: { __typename?: 'ListingContactResponse', displayName: string, unitLabel?: string | null, preference: MarketplaceContactPreference, phone?: string | null, inAppOnly: boolean } } };

export type ResumeListingAppMutationVariables = Exact<{
  listingId: Scalars['String']['input'];
}>;


export type ResumeListingAppMutation = { __typename?: 'Mutation', resumeListing: { __typename?: 'MarketplaceListing', id: string, type: MarketplaceListingType, title: string, description: string, condition?: MarketplaceItemCondition | null, imageUrls: Array<string>, priceAmount?: number | null, priceType: MarketplacePriceType, currency: string, contactPreference: MarketplaceContactPreference, showPhone: boolean, status: MarketplaceListingStatus, rejectionReason?: string | null, publishedAt?: any | null, expiresAt?: any | null, viewsCount: number, contactsCount: number, favoritesCount: number, createdAt: any, categoryId: string, viewerHasFavorited: boolean, viewerHasContacted: boolean, viewerIsOwner: boolean, category?: { __typename?: 'MarketplaceCategory', id: string, name: string, icon?: string | null } | null, unit?: { __typename?: 'Unit', id: string, number: string, building?: { __typename?: 'Building', id: string, name: string } | null } | null, contact: { __typename?: 'ListingContactResponse', displayName: string, unitLabel?: string | null, preference: MarketplaceContactPreference, phone?: string | null, inAppOnly: boolean } } };

export type MarkListingAsSoldMutationVariables = Exact<{
  listingId: Scalars['String']['input'];
}>;


export type MarkListingAsSoldMutation = { __typename?: 'Mutation', markListingAsSold: { __typename?: 'MarketplaceListing', id: string, type: MarketplaceListingType, title: string, description: string, condition?: MarketplaceItemCondition | null, imageUrls: Array<string>, priceAmount?: number | null, priceType: MarketplacePriceType, currency: string, contactPreference: MarketplaceContactPreference, showPhone: boolean, status: MarketplaceListingStatus, rejectionReason?: string | null, publishedAt?: any | null, expiresAt?: any | null, viewsCount: number, contactsCount: number, favoritesCount: number, createdAt: any, categoryId: string, viewerHasFavorited: boolean, viewerHasContacted: boolean, viewerIsOwner: boolean, category?: { __typename?: 'MarketplaceCategory', id: string, name: string, icon?: string | null } | null, unit?: { __typename?: 'Unit', id: string, number: string, building?: { __typename?: 'Building', id: string, name: string } | null } | null, contact: { __typename?: 'ListingContactResponse', displayName: string, unitLabel?: string | null, preference: MarketplaceContactPreference, phone?: string | null, inAppOnly: boolean } } };

export type RenewListingMutationVariables = Exact<{
  listingId: Scalars['String']['input'];
}>;


export type RenewListingMutation = { __typename?: 'Mutation', renewListing: { __typename?: 'MarketplaceListing', id: string, type: MarketplaceListingType, title: string, description: string, condition?: MarketplaceItemCondition | null, imageUrls: Array<string>, priceAmount?: number | null, priceType: MarketplacePriceType, currency: string, contactPreference: MarketplaceContactPreference, showPhone: boolean, status: MarketplaceListingStatus, rejectionReason?: string | null, publishedAt?: any | null, expiresAt?: any | null, viewsCount: number, contactsCount: number, favoritesCount: number, createdAt: any, categoryId: string, viewerHasFavorited: boolean, viewerHasContacted: boolean, viewerIsOwner: boolean, category?: { __typename?: 'MarketplaceCategory', id: string, name: string, icon?: string | null } | null, unit?: { __typename?: 'Unit', id: string, number: string, building?: { __typename?: 'Building', id: string, name: string } | null } | null, contact: { __typename?: 'ListingContactResponse', displayName: string, unitLabel?: string | null, preference: MarketplaceContactPreference, phone?: string | null, inAppOnly: boolean } } };

export type RemoveListingAppMutationVariables = Exact<{
  listingId: Scalars['String']['input'];
  reason?: InputMaybe<Scalars['String']['input']>;
}>;


export type RemoveListingAppMutation = { __typename?: 'Mutation', removeListing: boolean };

export type SaveMobileTokenMutationVariables = Exact<{
  input: SaveMobileTokenInput;
}>;


export type SaveMobileTokenMutation = { __typename?: 'Mutation', saveMobileToken: { __typename?: 'PushSubscriptionResult', success: boolean } };

export type DeactivateMobileTokenMutationVariables = Exact<{
  deviceToken: Scalars['String']['input'];
}>;


export type DeactivateMobileTokenMutation = { __typename?: 'Mutation', deactivateMobileToken: { __typename?: 'PushSubscriptionResult', success: boolean } };

export type MarkNotificationAsReadMutationVariables = Exact<{
  notificationId: Scalars['String']['input'];
}>;


export type MarkNotificationAsReadMutation = { __typename?: 'Mutation', markNotificationAsRead: { __typename?: 'Notification', id: string, isRead: boolean, readAt?: any | null } };

export type MarkAllNotificationsAsReadMutationVariables = Exact<{
  complexId: Scalars['String']['input'];
}>;


export type MarkAllNotificationsAsReadMutation = { __typename?: 'Mutation', markAllNotificationsAsRead: number };

export type DeleteNotificationMutationVariables = Exact<{
  notificationId: Scalars['String']['input'];
}>;


export type DeleteNotificationMutation = { __typename?: 'Mutation', deleteNotification: boolean };

export type MyNotificationsQueryVariables = Exact<{
  complexId: Scalars['String']['input'];
  pagination?: InputMaybe<PaginationInput>;
  filters?: InputMaybe<FilterNotificationsInput>;
}>;


export type MyNotificationsQuery = { __typename?: 'Query', myNotifications: { __typename?: 'PaginatedNotificationsResponse', items: Array<{ __typename?: 'Notification', id: string, type: NotificationType, priority: NotificationPriority, title: string, body: string, isRead: boolean, isActionable: boolean, entityType?: string | null, entityId?: string | null, metadata?: any | null, createdAt: any }>, pagination: { __typename?: 'PaginationReponse', currentPage: number, itemsPerPage: number, totalItems: number, totalPages: number, hasNextPage: boolean, hasPreviousPage: boolean } } };

export type UnreadNotificationsCountQueryVariables = Exact<{
  complexId: Scalars['String']['input'];
}>;


export type UnreadNotificationsCountQuery = { __typename?: 'Query', unreadNotificationsCount: { __typename?: 'UnreadCountResponse', count: number } };

export type NotificationDetailQueryVariables = Exact<{
  notificationId: Scalars['String']['input'];
  complexId: Scalars['String']['input'];
}>;


export type NotificationDetailQuery = { __typename?: 'Query', notificationDetail: { __typename?: 'NotificationDetailResponse', id: string, type: NotificationType, priority: NotificationPriority, title: string, body: string, isRead: boolean, isActionable: boolean, actionType?: NotificationActionType | null, actionLabel?: string | null, actionResult?: NotificationActionResult | null, entityType?: string | null, entityId?: string | null, metadata?: any | null, createdByUser?: { __typename?: 'NotificationUserInfo', id: string, fullName: string, roles: Array<string>, profilePicture?: string | null } | null } };

export type MyUnitPackagesQueryVariables = Exact<{
  complexId: Scalars['String']['input'];
  pagination?: InputMaybe<PaginationInput>;
  filters?: InputMaybe<FilterPackagesInput>;
}>;


export type MyUnitPackagesQuery = { __typename?: 'Query', myUnitPackages: { __typename?: 'PaginatedPackagesResponse', items: Array<{ __typename?: 'Package', id: string, trackingCode?: string | null, senderName: string, description?: string | null, type: PackageType, status: PackageStatus, photoUrl?: string | null, receivedAt: any, notifiedAt?: any | null, deliveredAt?: any | null, returnedAt?: any | null, recipientName?: string | null, receivedByName?: string | null, notes?: string | null, returnReason?: string | null, unitId: string, complexId: string }>, pagination: { __typename?: 'PaginationReponse', currentPage: number, itemsPerPage: number, totalItems: number, totalPages: number, hasNextPage: boolean, hasPreviousPage: boolean } } };

export type PackageQueryVariables = Exact<{
  packageId: Scalars['String']['input'];
}>;


export type PackageQuery = { __typename?: 'Query', package: { __typename?: 'Package', id: string, trackingCode?: string | null, senderName: string, description?: string | null, type: PackageType, status: PackageStatus, photoUrl?: string | null, receivedAt: any, notifiedAt?: any | null, deliveredAt?: any | null, returnedAt?: any | null, recipientName?: string | null, receivedByName?: string | null, notes?: string | null, returnReason?: string | null, unitId: string, complexId: string } };

export type TriggerPanicAlertMutationVariables = Exact<{
  complexId: Scalars['String']['input'];
}>;


export type TriggerPanicAlertMutation = { __typename?: 'Mutation', triggerPanicAlert: { __typename?: 'TriggerPanicAlertResult', success: boolean } };

export type AcknowledgePanicAlertMutationVariables = Exact<{
  notificationId: Scalars['String']['input'];
}>;


export type AcknowledgePanicAlertMutation = { __typename?: 'Mutation', acknowledgePanicAlert: { __typename?: 'Notification', id: string, complexId: string } };

export type GetUnitQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type GetUnitQuery = { __typename?: 'Query', unit: { __typename?: 'Unit', id: string, number: string, floor: number, building?: { __typename?: 'Building', id: string, name: string } | null } };

export type ActivePanicAlertsQueryVariables = Exact<{
  complexId: Scalars['String']['input'];
}>;


export type ActivePanicAlertsQuery = { __typename?: 'Query', activePanicAlerts: Array<{ __typename?: 'Notification', id: string, complexId: string, createdByUserId?: string | null, metadata?: any | null, createdAt: any }> };

export type GetResidentByUserIdQueryVariables = Exact<{
  userId: Scalars['String']['input'];
}>;


export type GetResidentByUserIdQuery = { __typename?: 'Query', residentByUserId?: { __typename?: 'Resident', id: string, user?: { __typename?: 'User', id: string, name: string, lastName: string, phoneNumber: string } | null, unit?: { __typename?: 'Unit', id: string, number: string, floor: number, building?: { __typename?: 'Building', id: string, name: string } | null } | null } | null };

export type PqrfFieldsFragment = { __typename?: 'Pqrf', id: string, code: string, type: PqrfType, addressee: PqrfAddressee, status: PqrfStatus, subject: string, description: string, requestedByName?: string | null, resolvedAt?: any | null, dueAt: any, resolvedBySilence: boolean, unitId?: string | null, createdAt: any, unit?: { __typename?: 'Unit', id: string, number: string, building?: { __typename?: 'Building', id: string, name: string } | null } | null };

export type MyPqrfRequestsQueryVariables = Exact<{
  complexId: Scalars['String']['input'];
  pagination?: InputMaybe<PaginationInput>;
  filters?: InputMaybe<FilterPqrfInput>;
}>;


export type MyPqrfRequestsQuery = { __typename?: 'Query', myPqrfRequests: { __typename?: 'PaginatedPqrfResponse', items: Array<{ __typename?: 'Pqrf', id: string, code: string, type: PqrfType, addressee: PqrfAddressee, status: PqrfStatus, subject: string, description: string, requestedByName?: string | null, resolvedAt?: any | null, dueAt: any, resolvedBySilence: boolean, unitId?: string | null, createdAt: any, unit?: { __typename?: 'Unit', id: string, number: string, building?: { __typename?: 'Building', id: string, name: string } | null } | null }>, pagination: { __typename?: 'PaginationReponse', currentPage: number, totalPages: number, totalItems: number, hasNextPage: boolean } } };

export type PqrfRequestsQueryVariables = Exact<{
  complexId: Scalars['String']['input'];
  pagination?: InputMaybe<PaginationInput>;
  filters?: InputMaybe<FilterPqrfInput>;
}>;


export type PqrfRequestsQuery = { __typename?: 'Query', pqrfRequests: { __typename?: 'PaginatedPqrfResponse', items: Array<{ __typename?: 'Pqrf', id: string, code: string, type: PqrfType, addressee: PqrfAddressee, status: PqrfStatus, subject: string, description: string, requestedByName?: string | null, resolvedAt?: any | null, dueAt: any, resolvedBySilence: boolean, unitId?: string | null, createdAt: any, unit?: { __typename?: 'Unit', id: string, number: string, building?: { __typename?: 'Building', id: string, name: string } | null } | null }>, pagination: { __typename?: 'PaginationReponse', currentPage: number, totalPages: number, totalItems: number, hasNextPage: boolean } } };

export type PqrfRequestQueryVariables = Exact<{
  pqrfId: Scalars['String']['input'];
}>;


export type PqrfRequestQuery = { __typename?: 'Query', pqrfRequest: { __typename?: 'Pqrf', viewerCanResolve: boolean, viewerIsCouncilObserver: boolean, id: string, code: string, type: PqrfType, addressee: PqrfAddressee, status: PqrfStatus, subject: string, description: string, requestedByName?: string | null, resolvedAt?: any | null, dueAt: any, resolvedBySilence: boolean, unitId?: string | null, createdAt: any, acknowledgements?: Array<{ __typename?: 'PqrfAcknowledgement', id: string, userId: string, userName?: string | null, instance: PqrfAddressee, openedAt: any, resolvedAt?: any | null }> | null, unit?: { __typename?: 'Unit', id: string, number: string, building?: { __typename?: 'Building', id: string, name: string } | null } | null } };

export type OpenPqrfMutationVariables = Exact<{
  pqrfId: Scalars['String']['input'];
}>;


export type OpenPqrfMutation = { __typename?: 'Mutation', openPqrf: { __typename?: 'Pqrf', viewerCanResolve: boolean, viewerIsCouncilObserver: boolean, id: string, code: string, type: PqrfType, addressee: PqrfAddressee, status: PqrfStatus, subject: string, description: string, requestedByName?: string | null, resolvedAt?: any | null, dueAt: any, resolvedBySilence: boolean, unitId?: string | null, createdAt: any, acknowledgements?: Array<{ __typename?: 'PqrfAcknowledgement', id: string, userId: string, userName?: string | null, instance: PqrfAddressee, openedAt: any, resolvedAt?: any | null }> | null, unit?: { __typename?: 'Unit', id: string, number: string, building?: { __typename?: 'Building', id: string, name: string } | null } | null } };

export type ResolvePqrfMutationVariables = Exact<{
  pqrfId: Scalars['String']['input'];
}>;


export type ResolvePqrfMutation = { __typename?: 'Mutation', resolvePqrf: { __typename?: 'Pqrf', viewerCanResolve: boolean, viewerIsCouncilObserver: boolean, id: string, code: string, type: PqrfType, addressee: PqrfAddressee, status: PqrfStatus, subject: string, description: string, requestedByName?: string | null, resolvedAt?: any | null, dueAt: any, resolvedBySilence: boolean, unitId?: string | null, createdAt: any, acknowledgements?: Array<{ __typename?: 'PqrfAcknowledgement', id: string, userId: string, userName?: string | null, instance: PqrfAddressee, openedAt: any, resolvedAt?: any | null }> | null, unit?: { __typename?: 'Unit', id: string, number: string, building?: { __typename?: 'Building', id: string, name: string } | null } | null } };

export type CreatePqrfMutationVariables = Exact<{
  input: CreatePqrfInput;
}>;


export type CreatePqrfMutation = { __typename?: 'Mutation', createPqrf: { __typename?: 'Pqrf', id: string, code: string, type: PqrfType, addressee: PqrfAddressee, status: PqrfStatus, subject: string, description: string, requestedByName?: string | null, resolvedAt?: any | null, dueAt: any, resolvedBySilence: boolean, unitId?: string | null, createdAt: any, unit?: { __typename?: 'Unit', id: string, number: string, building?: { __typename?: 'Building', id: string, name: string } | null } | null } };

export type RequestSecurityCallMutationVariables = Exact<{
  complexId: Scalars['String']['input'];
}>;


export type RequestSecurityCallMutation = { __typename?: 'Mutation', requestSecurityCall: { __typename?: 'RequestSecurityCallResult', success: boolean, message?: string | null } };

export type VehicleQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type VehicleQuery = { __typename?: 'Query', vehicle: { __typename?: 'Vehicle', id: string, plate: string, type: VehicleType, brand?: string | null, model?: string | null, year?: number | null, color?: string | null, fuelType?: VehicleFuelType | null, photoUrl?: string | null, parkingSpot?: string | null, status: VehicleStatus, approvedAt?: any | null, rejectionReason?: string | null, notes?: string | null, residentId?: string | null, unitId: string, complexId: string, createdAt: any } };

export type ScheduleVisitMutationVariables = Exact<{
  input: ScheduleVisitInput;
}>;


export type ScheduleVisitMutation = { __typename?: 'Mutation', scheduleVisit: { __typename?: 'Visit', id: string, status: VisitStatus, type: VisitType, qrToken?: string | null, qrExpiresAt?: any | null, expectedArrivalAt?: any | null, expectedArrivalUntil?: any | null, createdAt: any, visitor?: { __typename?: 'Visitor', id: string, fullName: string, identity: string, identityType: VisitorIdentityType, phone?: string | null } | null } };

export type ApproveVisitMutationVariables = Exact<{
  visitId: Scalars['String']['input'];
}>;


export type ApproveVisitMutation = { __typename?: 'Mutation', approveVisitEntry: { __typename?: 'Visit', id: string, status: VisitStatus, approvedByResidentAt?: any | null } };

export type DenyVisitMutationVariables = Exact<{
  visitId: Scalars['String']['input'];
  reason: Scalars['String']['input'];
}>;


export type DenyVisitMutation = { __typename?: 'Mutation', denyVisitEntry: { __typename?: 'Visit', id: string, status: VisitStatus, denialReason?: string | null, deniedByResidentAt?: any | null } };

export type CancelVisitMutationVariables = Exact<{
  visitId: Scalars['String']['input'];
}>;


export type CancelVisitMutation = { __typename?: 'Mutation', cancelVisit: { __typename?: 'Visit', id: string, status: VisitStatus } };

export type BlacklistVisitorMutationVariables = Exact<{
  input: BlacklistVisitorInput;
}>;


export type BlacklistVisitorMutation = { __typename?: 'Mutation', blacklistVisitor: { __typename?: 'Visitor', id: string, name: string, lastName: string, identity: string, isBlacklisted: boolean, blacklistReason?: string | null, blacklistedAt?: any | null } };

export type RemoveVisitorFromBlacklistMutationVariables = Exact<{
  visitorId: Scalars['String']['input'];
}>;


export type RemoveVisitorFromBlacklistMutation = { __typename?: 'Mutation', removeVisitorFromBlacklist: { __typename?: 'Visitor', id: string, name: string, lastName: string, identity: string, isBlacklisted: boolean, blacklistReason?: string | null, blacklistedAt?: any | null } };

export type VisitQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type VisitQuery = { __typename?: 'Query', visit: { __typename?: 'Visit', id: string, type: VisitType, status: VisitStatus, purpose?: string | null, entryTime?: any | null, exitTime?: any | null, expectedArrivalAt?: any | null, expectedArrivalUntil?: any | null, vehiclePlate?: string | null, denialReason?: string | null, notes?: string | null, approvedByResidentAt?: any | null, deniedByResidentAt?: any | null, createdAt: any, visitor?: { __typename?: 'Visitor', id: string, name: string, lastName: string, identity: string, identityType: VisitorIdentityType, phone?: string | null, photoUrl?: string | null, isBlacklisted: boolean } | null } };

export type MisVisitasQueryVariables = Exact<{
  pagination?: InputMaybe<PaginationInput>;
  filters?: InputMaybe<FilterVisitsInput>;
}>;


export type MisVisitasQuery = { __typename?: 'Query', myVisits: { __typename?: 'PaginatedVisitsResponse', items: Array<{ __typename?: 'Visit', id: string, type: VisitType, status: VisitStatus, purpose?: string | null, expectedArrivalAt?: any | null, expectedArrivalUntil?: any | null, qrToken?: string | null, qrUsed: boolean, qrExpiresAt?: any | null, vehiclePlate?: string | null, entryTime?: any | null, exitTime?: any | null, createdAt: any, visitor?: { __typename?: 'Visitor', id: string, name: string, lastName: string, identity: string, identityType: VisitorIdentityType, phone?: string | null, photoUrl?: string | null, isBlacklisted: boolean, blacklistReason?: string | null, blacklistedAt?: any | null } | null, unit?: { __typename?: 'Unit', id: string, building?: { __typename?: 'Building', id: string, name: string } | null } | null }>, pagination: { __typename?: 'PaginationReponse', currentPage: number, itemsPerPage: number, totalItems: number, totalPages: number, hasNextPage: boolean, hasPreviousPage: boolean } } };

export type VotingResultsFieldsFragment = { __typename?: 'VotingResults', weighting: VoteWeighting, eligibleCount: number, eligibleWeight: number, votedCount: number, votedWeight: number, participation: number, options: Array<{ __typename?: 'VotingOptionResult', optionId: string, text: string, votes: number, weight: number, share: number, shareOfEligible: number }> };

export type VotingQuestionFieldsFragment = { __typename?: 'VotingQuestion', id: string, meetingId: string, position: number, text: string, description?: string | null, weighting: VoteWeighting, secrecy: VoteSecrecy, status: VotingQuestionStatus, openedAt?: any | null, closedAt?: any | null, myVoteOptionId?: string | null, viewerCanVote: boolean, viewerHasVoiceOnly: boolean, options?: Array<{ __typename?: 'VotingOption', id: string, position: number, text: string }> | null, results?: { __typename?: 'VotingResults', weighting: VoteWeighting, eligibleCount: number, eligibleWeight: number, votedCount: number, votedWeight: number, participation: number, options: Array<{ __typename?: 'VotingOptionResult', optionId: string, text: string, votes: number, weight: number, share: number, shareOfEligible: number }> } | null };

export type VotingEnabledQueryVariables = Exact<{
  complexId: Scalars['String']['input'];
}>;


export type VotingEnabledQuery = { __typename?: 'Query', votingEnabled: boolean };

export type MyVotingMeetingsQueryVariables = Exact<{
  complexId: Scalars['String']['input'];
}>;


export type MyVotingMeetingsQuery = { __typename?: 'Query', myVotingMeetings: Array<{ __typename?: 'VotingMeeting', id: string, kind: VotingMeetingKind, title: string, description?: string | null, scheduledAt: any, questions?: Array<{ __typename?: 'VotingQuestion', id: string, meetingId: string, position: number, text: string, description?: string | null, weighting: VoteWeighting, secrecy: VoteSecrecy, status: VotingQuestionStatus, openedAt?: any | null, closedAt?: any | null, myVoteOptionId?: string | null, viewerCanVote: boolean, viewerHasVoiceOnly: boolean, options?: Array<{ __typename?: 'VotingOption', id: string, position: number, text: string }> | null, results?: { __typename?: 'VotingResults', weighting: VoteWeighting, eligibleCount: number, eligibleWeight: number, votedCount: number, votedWeight: number, participation: number, options: Array<{ __typename?: 'VotingOptionResult', optionId: string, text: string, votes: number, weight: number, share: number, shareOfEligible: number }> } | null }> | null }> };

export type VotingQuestionQueryVariables = Exact<{
  questionId: Scalars['String']['input'];
}>;


export type VotingQuestionQuery = { __typename?: 'Query', votingQuestion: { __typename?: 'VotingQuestion', id: string, meetingId: string, position: number, text: string, description?: string | null, weighting: VoteWeighting, secrecy: VoteSecrecy, status: VotingQuestionStatus, openedAt?: any | null, closedAt?: any | null, myVoteOptionId?: string | null, viewerCanVote: boolean, viewerHasVoiceOnly: boolean, meeting?: { __typename?: 'VotingMeeting', id: string, kind: VotingMeetingKind, title: string, scheduledAt: any } | null, options?: Array<{ __typename?: 'VotingOption', id: string, position: number, text: string }> | null, results?: { __typename?: 'VotingResults', weighting: VoteWeighting, eligibleCount: number, eligibleWeight: number, votedCount: number, votedWeight: number, participation: number, options: Array<{ __typename?: 'VotingOptionResult', optionId: string, text: string, votes: number, weight: number, share: number, shareOfEligible: number }> } | null } };

export type CastVoteMutationVariables = Exact<{
  questionId: Scalars['String']['input'];
  optionId: Scalars['String']['input'];
}>;


export type CastVoteMutation = { __typename?: 'Mutation', castVote: { __typename?: 'VotingQuestion', id: string, meetingId: string, position: number, text: string, description?: string | null, weighting: VoteWeighting, secrecy: VoteSecrecy, status: VotingQuestionStatus, openedAt?: any | null, closedAt?: any | null, myVoteOptionId?: string | null, viewerCanVote: boolean, viewerHasVoiceOnly: boolean, meeting?: { __typename?: 'VotingMeeting', id: string, kind: VotingMeetingKind, title: string, scheduledAt: any } | null, options?: Array<{ __typename?: 'VotingOption', id: string, position: number, text: string }> | null, results?: { __typename?: 'VotingResults', weighting: VoteWeighting, eligibleCount: number, eligibleWeight: number, votedCount: number, votedWeight: number, participation: number, options: Array<{ __typename?: 'VotingOptionResult', optionId: string, text: string, votes: number, weight: number, share: number, shareOfEligible: number }> } | null } };

export const ListingFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ListingFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MarketplaceListing"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"condition"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrls"}},{"kind":"Field","name":{"kind":"Name","value":"priceAmount"}},{"kind":"Field","name":{"kind":"Name","value":"priceType"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"contactPreference"}},{"kind":"Field","name":{"kind":"Name","value":"showPhone"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"rejectionReason"}},{"kind":"Field","name":{"kind":"Name","value":"publishedAt"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"viewsCount"}},{"kind":"Field","name":{"kind":"Name","value":"contactsCount"}},{"kind":"Field","name":{"kind":"Name","value":"favoritesCount"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"categoryId"}},{"kind":"Field","name":{"kind":"Name","value":"category"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}}]}},{"kind":"Field","name":{"kind":"Name","value":"unit"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"number"}},{"kind":"Field","name":{"kind":"Name","value":"building"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"contact"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"unitLabel"}},{"kind":"Field","name":{"kind":"Name","value":"preference"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"inAppOnly"}}]}},{"kind":"Field","name":{"kind":"Name","value":"viewerHasFavorited"}},{"kind":"Field","name":{"kind":"Name","value":"viewerHasContacted"}},{"kind":"Field","name":{"kind":"Name","value":"viewerIsOwner"}}]}}]} as unknown as DocumentNode<ListingFieldsFragment, unknown>;
export const PqrfFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PqrfFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Pqrf"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"addressee"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"subject"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"requestedByName"}},{"kind":"Field","name":{"kind":"Name","value":"resolvedAt"}},{"kind":"Field","name":{"kind":"Name","value":"dueAt"}},{"kind":"Field","name":{"kind":"Name","value":"resolvedBySilence"}},{"kind":"Field","name":{"kind":"Name","value":"unitId"}},{"kind":"Field","name":{"kind":"Name","value":"unit"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"number"}},{"kind":"Field","name":{"kind":"Name","value":"building"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<PqrfFieldsFragment, unknown>;
export const VotingResultsFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"VotingResultsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"VotingResults"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"weighting"}},{"kind":"Field","name":{"kind":"Name","value":"eligibleCount"}},{"kind":"Field","name":{"kind":"Name","value":"eligibleWeight"}},{"kind":"Field","name":{"kind":"Name","value":"votedCount"}},{"kind":"Field","name":{"kind":"Name","value":"votedWeight"}},{"kind":"Field","name":{"kind":"Name","value":"participation"}},{"kind":"Field","name":{"kind":"Name","value":"options"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"optionId"}},{"kind":"Field","name":{"kind":"Name","value":"text"}},{"kind":"Field","name":{"kind":"Name","value":"votes"}},{"kind":"Field","name":{"kind":"Name","value":"weight"}},{"kind":"Field","name":{"kind":"Name","value":"share"}},{"kind":"Field","name":{"kind":"Name","value":"shareOfEligible"}}]}}]}}]} as unknown as DocumentNode<VotingResultsFieldsFragment, unknown>;
export const VotingQuestionFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"VotingQuestionFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"VotingQuestion"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"text"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"weighting"}},{"kind":"Field","name":{"kind":"Name","value":"secrecy"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"openedAt"}},{"kind":"Field","name":{"kind":"Name","value":"closedAt"}},{"kind":"Field","name":{"kind":"Name","value":"options"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"text"}}]}},{"kind":"Field","name":{"kind":"Name","value":"results"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"VotingResultsFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"myVoteOptionId"}},{"kind":"Field","name":{"kind":"Name","value":"viewerCanVote"}},{"kind":"Field","name":{"kind":"Name","value":"viewerHasVoiceOnly"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"VotingResultsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"VotingResults"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"weighting"}},{"kind":"Field","name":{"kind":"Name","value":"eligibleCount"}},{"kind":"Field","name":{"kind":"Name","value":"eligibleWeight"}},{"kind":"Field","name":{"kind":"Name","value":"votedCount"}},{"kind":"Field","name":{"kind":"Name","value":"votedWeight"}},{"kind":"Field","name":{"kind":"Name","value":"participation"}},{"kind":"Field","name":{"kind":"Name","value":"options"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"optionId"}},{"kind":"Field","name":{"kind":"Name","value":"text"}},{"kind":"Field","name":{"kind":"Name","value":"votes"}},{"kind":"Field","name":{"kind":"Name","value":"weight"}},{"kind":"Field","name":{"kind":"Name","value":"share"}},{"kind":"Field","name":{"kind":"Name","value":"shareOfEligible"}}]}}]}}]} as unknown as DocumentNode<VotingQuestionFieldsFragment, unknown>;
export const ApproveAccessRequestDocument = {"__meta__":{"hash":"e5e0b1dcb5ed24a79212819c5eebbee172b503a377a79f86a73bb49c3a60cd4d"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ApproveAccessRequest"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"requestId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"approveAccessRequest"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"requestId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"requestId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"resolvedAt"}}]}}]}}]} as unknown as DocumentNode<ApproveAccessRequestMutation, ApproveAccessRequestMutationVariables>;
export const RejectAccessRequestDocument = {"__meta__":{"hash":"98e6e0258d54c7b67545c94e4cf69e98b941ed24669d2f8163471d1ba71bb223"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RejectAccessRequest"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RejectAccessRequestInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rejectAccessRequest"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"rejectionReason"}},{"kind":"Field","name":{"kind":"Name","value":"resolvedAt"}}]}}]}}]} as unknown as DocumentNode<RejectAccessRequestMutation, RejectAccessRequestMutationVariables>;
export const AmenitiesDocument = {"__meta__":{"hash":"d6b5beeb6541b243578ed1a8d9dbe572377618ea1cd93885e34e4c0bdc1db6d7"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Amenities"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"complexId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filters"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"FilterAmenitiesInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"amenities"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"complexId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"complexId"}}},{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}}},{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filters"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"rules"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrls"}},{"kind":"Field","name":{"kind":"Name","value":"bookingMode"}},{"kind":"Field","name":{"kind":"Name","value":"durationUnit"}},{"kind":"Field","name":{"kind":"Name","value":"slotDurationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"minDurationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"maxDurationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"capacity"}},{"kind":"Field","name":{"kind":"Name","value":"maxSimultaneousBookings"}},{"kind":"Field","name":{"kind":"Name","value":"advanceBookingDays"}},{"kind":"Field","name":{"kind":"Name","value":"minAdvanceDays"}},{"kind":"Field","name":{"kind":"Name","value":"cancellationDeadlineDays"}},{"kind":"Field","name":{"kind":"Name","value":"cancellationDeadlineHours"}},{"kind":"Field","name":{"kind":"Name","value":"lateCancellationFeePercent"}},{"kind":"Field","name":{"kind":"Name","value":"councilFreeBookingsPerYear"}},{"kind":"Field","name":{"kind":"Name","value":"requiresApproval"}},{"kind":"Field","name":{"kind":"Name","value":"feeType"}},{"kind":"Field","name":{"kind":"Name","value":"feeAmount"}},{"kind":"Field","name":{"kind":"Name","value":"complexId"}},{"kind":"Field","name":{"kind":"Name","value":"schedules"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"dayOfWeek"}},{"kind":"Field","name":{"kind":"Name","value":"openTime"}},{"kind":"Field","name":{"kind":"Name","value":"closeTime"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pagination"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"itemsPerPage"}},{"kind":"Field","name":{"kind":"Name","value":"totalItems"}},{"kind":"Field","name":{"kind":"Name","value":"totalPages"}},{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasPreviousPage"}}]}}]}}]}}]} as unknown as DocumentNode<AmenitiesQuery, AmenitiesQueryVariables>;
export const AmenityAvailabilityDocument = {"__meta__":{"hash":"31ac254e129e00a4bec84f0814b2c0e3c3478c51727299cff30cdf0ef95b7ffb"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AmenityAvailability"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AmenityAvailabilityInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"amenityAvailability"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"amenityId"}},{"kind":"Field","name":{"kind":"Name","value":"days"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"isOpen"}},{"kind":"Field","name":{"kind":"Name","value":"closedReason"}},{"kind":"Field","name":{"kind":"Name","value":"openWindows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"startAt"}},{"kind":"Field","name":{"kind":"Name","value":"endAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"slots"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"startAt"}},{"kind":"Field","name":{"kind":"Name","value":"endAt"}},{"kind":"Field","name":{"kind":"Name","value":"capacityTotal"}},{"kind":"Field","name":{"kind":"Name","value":"capacityUsed"}},{"kind":"Field","name":{"kind":"Name","value":"isAvailable"}}]}},{"kind":"Field","name":{"kind":"Name","value":"busy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"startAt"}},{"kind":"Field","name":{"kind":"Name","value":"endAt"}},{"kind":"Field","name":{"kind":"Name","value":"bookingsCount"}}]}}]}}]}}]}}]} as unknown as DocumentNode<AmenityAvailabilityQuery, AmenityAvailabilityQueryVariables>;
export const MyUnitAmenityBookingsDocument = {"__meta__":{"hash":"89555d1db908087ea7084c87590eefb3e960f46512395cb1be029d41186c7e1b"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyUnitAmenityBookings"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"complexId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filters"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"FilterAmenityBookingsInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myUnitAmenityBookings"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"complexId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"complexId"}}},{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}}},{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filters"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amenityId"}},{"kind":"Field","name":{"kind":"Name","value":"complexId"}},{"kind":"Field","name":{"kind":"Name","value":"unitId"}},{"kind":"Field","name":{"kind":"Name","value":"startAt"}},{"kind":"Field","name":{"kind":"Name","value":"endAt"}},{"kind":"Field","name":{"kind":"Name","value":"attendees"}},{"kind":"Field","name":{"kind":"Name","value":"purpose"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"rejectionReason"}},{"kind":"Field","name":{"kind":"Name","value":"cancellationReason"}},{"kind":"Field","name":{"kind":"Name","value":"accessCode"}},{"kind":"Field","name":{"kind":"Name","value":"checkInAt"}},{"kind":"Field","name":{"kind":"Name","value":"checkOutAt"}},{"kind":"Field","name":{"kind":"Name","value":"feeAmount"}},{"kind":"Field","name":{"kind":"Name","value":"isCouncilFreeBooking"}},{"kind":"Field","name":{"kind":"Name","value":"lateCancellationAmount"}},{"kind":"Field","name":{"kind":"Name","value":"damageAmount"}},{"kind":"Field","name":{"kind":"Name","value":"damageDescription"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"amenity"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"durationUnit"}},{"kind":"Field","name":{"kind":"Name","value":"cancellationDeadlineDays"}},{"kind":"Field","name":{"kind":"Name","value":"cancellationDeadlineHours"}},{"kind":"Field","name":{"kind":"Name","value":"lateCancellationFeePercent"}},{"kind":"Field","name":{"kind":"Name","value":"councilFreeBookingsPerYear"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pagination"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"itemsPerPage"}},{"kind":"Field","name":{"kind":"Name","value":"totalItems"}},{"kind":"Field","name":{"kind":"Name","value":"totalPages"}},{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasPreviousPage"}}]}}]}}]}}]} as unknown as DocumentNode<MyUnitAmenityBookingsQuery, MyUnitAmenityBookingsQueryVariables>;
export const AmenityBookingDocument = {"__meta__":{"hash":"04537a30bc19eea11cf3af3f8bfd99c52e70cc6cd21d6b3318548e8c64d4df2e"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AmenityBooking"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"bookingId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"amenityBooking"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"bookingId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"bookingId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amenityId"}},{"kind":"Field","name":{"kind":"Name","value":"complexId"}},{"kind":"Field","name":{"kind":"Name","value":"unitId"}},{"kind":"Field","name":{"kind":"Name","value":"startAt"}},{"kind":"Field","name":{"kind":"Name","value":"endAt"}},{"kind":"Field","name":{"kind":"Name","value":"attendees"}},{"kind":"Field","name":{"kind":"Name","value":"purpose"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"rejectionReason"}},{"kind":"Field","name":{"kind":"Name","value":"cancellationReason"}},{"kind":"Field","name":{"kind":"Name","value":"accessCode"}},{"kind":"Field","name":{"kind":"Name","value":"checkInAt"}},{"kind":"Field","name":{"kind":"Name","value":"checkOutAt"}},{"kind":"Field","name":{"kind":"Name","value":"feeAmount"}},{"kind":"Field","name":{"kind":"Name","value":"isCouncilFreeBooking"}},{"kind":"Field","name":{"kind":"Name","value":"lateCancellationAmount"}},{"kind":"Field","name":{"kind":"Name","value":"damageAmount"}},{"kind":"Field","name":{"kind":"Name","value":"damageDescription"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"amenity"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"durationUnit"}},{"kind":"Field","name":{"kind":"Name","value":"cancellationDeadlineDays"}},{"kind":"Field","name":{"kind":"Name","value":"cancellationDeadlineHours"}},{"kind":"Field","name":{"kind":"Name","value":"lateCancellationFeePercent"}},{"kind":"Field","name":{"kind":"Name","value":"councilFreeBookingsPerYear"}}]}}]}}]}}]} as unknown as DocumentNode<AmenityBookingQuery, AmenityBookingQueryVariables>;
export const MyAmenityCouncilQuotaDocument = {"__meta__":{"hash":"8e4e26386cfc11533c3cc58907bc5245ec8ec6ff7872195fa1c9d78703bbf7ce"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyAmenityCouncilQuota"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"amenityId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myAmenityCouncilQuota"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"amenityId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"amenityId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"isCouncilMember"}},{"kind":"Field","name":{"kind":"Name","value":"bookingsPerYear"}},{"kind":"Field","name":{"kind":"Name","value":"used"}},{"kind":"Field","name":{"kind":"Name","value":"remaining"}},{"kind":"Field","name":{"kind":"Name","value":"year"}}]}}]}}]} as unknown as DocumentNode<MyAmenityCouncilQuotaQuery, MyAmenityCouncilQuotaQueryVariables>;
export const CreateAmenityBookingDocument = {"__meta__":{"hash":"9c0f0ab270ea2bd2d391d70af6f842657673e3fac47089a24af25ce7931c29ea"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateAmenityBooking"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateAmenityBookingInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createAmenityBooking"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amenityId"}},{"kind":"Field","name":{"kind":"Name","value":"startAt"}},{"kind":"Field","name":{"kind":"Name","value":"endAt"}},{"kind":"Field","name":{"kind":"Name","value":"attendees"}},{"kind":"Field","name":{"kind":"Name","value":"purpose"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"accessCode"}},{"kind":"Field","name":{"kind":"Name","value":"feeAmount"}},{"kind":"Field","name":{"kind":"Name","value":"isCouncilFreeBooking"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"amenity"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"durationUnit"}},{"kind":"Field","name":{"kind":"Name","value":"cancellationDeadlineDays"}},{"kind":"Field","name":{"kind":"Name","value":"cancellationDeadlineHours"}},{"kind":"Field","name":{"kind":"Name","value":"lateCancellationFeePercent"}},{"kind":"Field","name":{"kind":"Name","value":"councilFreeBookingsPerYear"}}]}}]}}]}}]} as unknown as DocumentNode<CreateAmenityBookingMutation, CreateAmenityBookingMutationVariables>;
export const CancelAmenityBookingDocument = {"__meta__":{"hash":"900a64e28deb4599c499271a6d8bd26b2eae1aa44edba2fe7194d1c0678ebf0d"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CancelAmenityBooking"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CancelAmenityBookingInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cancelAmenityBooking"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"cancellationReason"}},{"kind":"Field","name":{"kind":"Name","value":"feeAmount"}}]}}]}}]} as unknown as DocumentNode<CancelAmenityBookingMutation, CancelAmenityBookingMutationVariables>;
export const LoginResidentDocument = {"__meta__":{"hash":"b1e2df147e890a65b1d0b8bf2b946b107a451c9f05b4c593fc73fdc6d2fcea20"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"LoginResident"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"LoginResidentInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"loginResident"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accessToken"}},{"kind":"Field","name":{"kind":"Name","value":"refreshToken"}},{"kind":"Field","name":{"kind":"Name","value":"expiresIn"}},{"kind":"Field","name":{"kind":"Name","value":"sessionId"}}]}}]}}]} as unknown as DocumentNode<LoginResidentMutation, LoginResidentMutationVariables>;
export const ResendResidentSystemCodeDocument = {"__meta__":{"hash":"01a150c4906dcc1bab370c37a1300839cf93ce75e94944cdc94e6f111a882fac"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ResendResidentSystemCode"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"identity"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resendResidentSystemCode"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"identity"},"value":{"kind":"Variable","name":{"kind":"Name","value":"identity"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<ResendResidentSystemCodeMutation, ResendResidentSystemCodeMutationVariables>;
export const RefreshTokenDocument = {"__meta__":{"hash":"909a47dddea0f8ea32c2c9ba6702f714820f7e64ee99980a0508ab84ee13378c"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RefreshToken"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"refreshToken"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"refreshToken"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"refreshToken"},"value":{"kind":"Variable","name":{"kind":"Name","value":"refreshToken"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accessToken"}},{"kind":"Field","name":{"kind":"Name","value":"refreshToken"}},{"kind":"Field","name":{"kind":"Name","value":"expiresIn"}},{"kind":"Field","name":{"kind":"Name","value":"sessionId"}}]}}]}}]} as unknown as DocumentNode<RefreshTokenMutation, RefreshTokenMutationVariables>;
export const GetMyResidentProfileDocument = {"__meta__":{"hash":"78a0d63ca070a0a87a95a90b8c7ee850cdd85570021f950c67e3bc761aeb6b10"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMyResidentProfile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myResidentProfile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"isMainResident"}},{"kind":"Field","name":{"kind":"Name","value":"isCouncilMember"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phoneNumber"}},{"kind":"Field","name":{"kind":"Name","value":"identity"}},{"kind":"Field","name":{"kind":"Name","value":"rating"}}]}},{"kind":"Field","name":{"kind":"Name","value":"unit"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"number"}},{"kind":"Field","name":{"kind":"Name","value":"floor"}},{"kind":"Field","name":{"kind":"Name","value":"building"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"floors"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"complex"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<GetMyResidentProfileQuery, GetMyResidentProfileQueryVariables>;
export const SetAccessCodeDocument = {"__meta__":{"hash":"8def4618aff1531ab989f99a0c00efc3f66bf5d940bfa6be314320bfb1b319bc"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetAccessCode"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SetAccessCodeInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setResidentAccessCode"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"platform"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<SetAccessCodeMutation, SetAccessCodeMutationVariables>;
export const LoginWithAccessCodeDocument = {"__meta__":{"hash":"ebe62a2e72089b7661140e986baf764b7c1037655db68034e5a1b518678f66ee"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"LoginWithAccessCode"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"LoginAccessCodeInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"loginWithAccessCode"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accessToken"}},{"kind":"Field","name":{"kind":"Name","value":"refreshToken"}},{"kind":"Field","name":{"kind":"Name","value":"expiresIn"}},{"kind":"Field","name":{"kind":"Name","value":"sessionId"}}]}}]}}]} as unknown as DocumentNode<LoginWithAccessCodeMutation, LoginWithAccessCodeMutationVariables>;
export const ResidentHasAccessCodeDocument = {"__meta__":{"hash":"daff72effedb9a568174d81f8dcc1ca3de1c6aac085a62ceaaaecb561d9ca2bd"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ResidentHasAccessCode"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"residentHasAccessCode"}}]}}]} as unknown as DocumentNode<ResidentHasAccessCodeQuery, ResidentHasAccessCodeQueryVariables>;
export const MyDevicesDocument = {"__meta__":{"hash":"2b6312238043c65a6adc3dd215a0e8734418400cec68458a312e593213813b58"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myResidentDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"platform"}},{"kind":"Field","name":{"kind":"Name","value":"lastUsedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<MyDevicesQuery, MyDevicesQueryVariables>;
export const RevokeDeviceDocument = {"__meta__":{"hash":"83d9429c25dfb59510f9990fe093a0f984d5881c3864a98b4aa4ef4e7ec5ca1a"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RevokeDevice"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"revokeResidentDevice"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"deviceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}}}]}]}}]} as unknown as DocumentNode<RevokeDeviceMutation, RevokeDeviceMutationVariables>;
export const RevokeMyOtherDevicesDocument = {"__meta__":{"hash":"39c2c6e0602b15e8a0fc19f6b041972667bfe155ab4d20739c79b0b106631999"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RevokeMyOtherDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"revokeMyOtherDevices"}}]}}]} as unknown as DocumentNode<RevokeMyOtherDevicesMutation, RevokeMyOtherDevicesMutationVariables>;
export const WaLoginAvailableDocument = {"__meta__":{"hash":"3614f0354bf4ff036d44a3d1641a1b5e5efee298f388748797fa9e82e6a793a6"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"WaLoginAvailable"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"whatsAppLoginAvailable"}}]}}]} as unknown as DocumentNode<WaLoginAvailableQuery, WaLoginAvailableQueryVariables>;
export const RequestWaLoginDocument = {"__meta__":{"hash":"078316c4bc6e80d24b02314a33babf4317002d849aeaa1e8e618cd40da120002"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RequestWaLogin"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"identity"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requestWhatsAppLoginChallenge"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"identity"},"value":{"kind":"Variable","name":{"kind":"Name","value":"identity"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"challengeId"}},{"kind":"Field","name":{"kind":"Name","value":"nonce"}},{"kind":"Field","name":{"kind":"Name","value":"whatsappUrl"}},{"kind":"Field","name":{"kind":"Name","value":"messageText"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"warning"}}]}}]}}]} as unknown as DocumentNode<RequestWaLoginMutation, RequestWaLoginMutationVariables>;
export const WaLoginStatusDocument = {"__meta__":{"hash":"0890f25a5cf64c65d9f96257798a822080737a86e17a0d6f111a0b8d117f7ed4"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"WaLoginStatus"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"challengeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"whatsAppLoginChallengeStatus"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"challengeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"challengeId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}}]}}]}}]} as unknown as DocumentNode<WaLoginStatusQuery, WaLoginStatusQueryVariables>;
export const RedeemWaLoginDocument = {"__meta__":{"hash":"a48059f3f24a9d01fcb5af096d863137323e633a36e8591ec71ee7a1232ffe6d"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RedeemWaLogin"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"challengeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"accessCode"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"redeemWhatsAppLoginChallenge"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"challengeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"challengeId"}}},{"kind":"Argument","name":{"kind":"Name","value":"accessCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"accessCode"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accessToken"}},{"kind":"Field","name":{"kind":"Name","value":"refreshToken"}},{"kind":"Field","name":{"kind":"Name","value":"expiresIn"}},{"kind":"Field","name":{"kind":"Name","value":"sessionId"}}]}}]}}]} as unknown as DocumentNode<RedeemWaLoginMutation, RedeemWaLoginMutationVariables>;
export const RequestApprovalDocument = {"__meta__":{"hash":"f497b2c8b058acb266e141ef1e7116ca914b65530bf0e97d73d5be6f742cb2f2"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RequestApproval"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"identity"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requestDeviceApproval"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"identity"},"value":{"kind":"Variable","name":{"kind":"Name","value":"identity"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"challengeId"}},{"kind":"Field","name":{"kind":"Name","value":"approvalCode"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"instructions"}}]}}]}}]} as unknown as DocumentNode<RequestApprovalMutation, RequestApprovalMutationVariables>;
export const ApprovalStatusDocument = {"__meta__":{"hash":"ebb65c6633ae75cbdde2fc62cb7cd71ac393d8ad0447dd9df6c7ad3e3c484357"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ApprovalStatus"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"challengeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deviceApprovalStatus"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"challengeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"challengeId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}}]}}]}}]} as unknown as DocumentNode<ApprovalStatusQuery, ApprovalStatusQueryVariables>;
export const RedeemApprovalDocument = {"__meta__":{"hash":"a8709ac52195e8cb872eb49a58cf90200e2339cb086fd31bb689f841bd5c983d"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RedeemApproval"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"challengeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"accessCode"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"redeemDeviceApproval"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"challengeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"challengeId"}}},{"kind":"Argument","name":{"kind":"Name","value":"accessCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"accessCode"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accessToken"}},{"kind":"Field","name":{"kind":"Name","value":"refreshToken"}},{"kind":"Field","name":{"kind":"Name","value":"expiresIn"}},{"kind":"Field","name":{"kind":"Name","value":"sessionId"}}]}}]}}]} as unknown as DocumentNode<RedeemApprovalMutation, RedeemApprovalMutationVariables>;
export const PendingApprovalsDocument = {"__meta__":{"hash":"388458ba35a2f7509fe1c30f1e380754d101a1efa8a38e94da923f09652bda87"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PendingApprovals"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pendingDeviceApprovals"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"approvalId"}},{"kind":"Field","name":{"kind":"Name","value":"approvalCode"}},{"kind":"Field","name":{"kind":"Name","value":"requestedFromLabel"}},{"kind":"Field","name":{"kind":"Name","value":"requestedFromIp"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<PendingApprovalsQuery, PendingApprovalsQueryVariables>;
export const ApproveDocument = {"__meta__":{"hash":"514b15c91aebc6a052fc97a2ff4ea4b658a6942c1766cd3197ca82f22445be01"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Approve"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"approvalId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"approveDeviceApproval"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"approvalId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"approvalId"}}}]}]}}]} as unknown as DocumentNode<ApproveMutation, ApproveMutationVariables>;
export const DenyDocument = {"__meta__":{"hash":"493684588e4d2ae28aba19f05457d994392a043fad48d55cb64e97afb771d29b"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Deny"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"approvalId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"denyDeviceApproval"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"approvalId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"approvalId"}}}]}]}}]} as unknown as DocumentNode<DenyMutation, DenyMutationVariables>;
export const GetUnitBalanceDocument = {"__meta__":{"hash":"7d58b3d0f873b1068f7300124e66adfa67cfa1a47e7c9bc054f9283cb8189115"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetUnitBalance"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"unitId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"complexId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unitBalance"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"unitId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"unitId"}}},{"kind":"Argument","name":{"kind":"Name","value":"complexId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"complexId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unitId"}},{"kind":"Field","name":{"kind":"Name","value":"unitNumber"}},{"kind":"Field","name":{"kind":"Name","value":"totalDebt"}},{"kind":"Field","name":{"kind":"Name","value":"overdueCount"}},{"kind":"Field","name":{"kind":"Name","value":"pendingCount"}},{"kind":"Field","name":{"kind":"Name","value":"totalPaid"}}]}}]}}]} as unknown as DocumentNode<GetUnitBalanceQuery, GetUnitBalanceQueryVariables>;
export const GetUnitAccountStatementDocument = {"__meta__":{"hash":"c40f8bdbe4a7b5b7065c60e8e41b278286303c937e75d9d77a15ed717224962e"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetUnitAccountStatement"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"unitId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"complexId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"period"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unitAccountStatement"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"unitId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"unitId"}}},{"kind":"Argument","name":{"kind":"Name","value":"complexId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"complexId"}}},{"kind":"Argument","name":{"kind":"Name","value":"period"},"value":{"kind":"Variable","name":{"kind":"Name","value":"period"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unitId"}},{"kind":"Field","name":{"kind":"Name","value":"unitNumber"}},{"kind":"Field","name":{"kind":"Name","value":"building"}},{"kind":"Field","name":{"kind":"Name","value":"totalDebits"}},{"kind":"Field","name":{"kind":"Name","value":"totalCredits"}},{"kind":"Field","name":{"kind":"Name","value":"currentBalance"}},{"kind":"Field","name":{"kind":"Name","value":"walletBalance"}},{"kind":"Field","name":{"kind":"Name","value":"movements"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"debit"}},{"kind":"Field","name":{"kind":"Name","value":"credit"}},{"kind":"Field","name":{"kind":"Name","value":"balance"}},{"kind":"Field","name":{"kind":"Name","value":"reference"}}]}}]}}]}}]} as unknown as DocumentNode<GetUnitAccountStatementQuery, GetUnitAccountStatementQueryVariables>;
export const GetPaymentsByChargeDocument = {"__meta__":{"hash":"62c06367bdd4e33a9ee9e09ab28d408e4707c2c4a558929280fc240ea2436d39"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetPaymentsByCharge"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"chargeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"paymentsByCharge"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"chargeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"chargeId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"method"}},{"kind":"Field","name":{"kind":"Name","value":"reference"}},{"kind":"Field","name":{"kind":"Name","value":"receiptUrl"}},{"kind":"Field","name":{"kind":"Name","value":"paidAt"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"isReversed"}},{"kind":"Field","name":{"kind":"Name","value":"reversalReason"}},{"kind":"Field","name":{"kind":"Name","value":"reversedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<GetPaymentsByChargeQuery, GetPaymentsByChargeQueryVariables>;
export const GetUnitWalletDocument = {"__meta__":{"hash":"525599788b133c3c25df716da20f0adeb08224a307502519f430791b6d024203"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetUnitWallet"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"unitId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"complexId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unitWallet"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"unitId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"unitId"}}},{"kind":"Argument","name":{"kind":"Name","value":"complexId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"complexId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unitId"}},{"kind":"Field","name":{"kind":"Name","value":"unitNumber"}},{"kind":"Field","name":{"kind":"Name","value":"building"}},{"kind":"Field","name":{"kind":"Name","value":"currentBalance"}},{"kind":"Field","name":{"kind":"Name","value":"totalCredits"}},{"kind":"Field","name":{"kind":"Name","value":"totalDebits"}},{"kind":"Field","name":{"kind":"Name","value":"entries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"chargeId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]}}]} as unknown as DocumentNode<GetUnitWalletQuery, GetUnitWalletQueryVariables>;
export const MarketplaceListingsDocument = {"__meta__":{"hash":"15397a40be15b3e6bbea14ba5c4a063df0b98f5bee7952cfd01020315014f67d"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MarketplaceListings"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"complexId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filters"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"FilterListingsInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"marketplaceListings"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"complexId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"complexId"}}},{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}}},{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filters"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ListingFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pagination"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"totalPages"}},{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ListingFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MarketplaceListing"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"condition"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrls"}},{"kind":"Field","name":{"kind":"Name","value":"priceAmount"}},{"kind":"Field","name":{"kind":"Name","value":"priceType"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"contactPreference"}},{"kind":"Field","name":{"kind":"Name","value":"showPhone"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"rejectionReason"}},{"kind":"Field","name":{"kind":"Name","value":"publishedAt"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"viewsCount"}},{"kind":"Field","name":{"kind":"Name","value":"contactsCount"}},{"kind":"Field","name":{"kind":"Name","value":"favoritesCount"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"categoryId"}},{"kind":"Field","name":{"kind":"Name","value":"category"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}}]}},{"kind":"Field","name":{"kind":"Name","value":"unit"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"number"}},{"kind":"Field","name":{"kind":"Name","value":"building"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"contact"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"unitLabel"}},{"kind":"Field","name":{"kind":"Name","value":"preference"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"inAppOnly"}}]}},{"kind":"Field","name":{"kind":"Name","value":"viewerHasFavorited"}},{"kind":"Field","name":{"kind":"Name","value":"viewerHasContacted"}},{"kind":"Field","name":{"kind":"Name","value":"viewerIsOwner"}}]}}]} as unknown as DocumentNode<MarketplaceListingsQuery, MarketplaceListingsQueryVariables>;
export const MarketplaceListingDocument = {"__meta__":{"hash":"f17569443cd8ef36ba1ea4a0f20966a4a318171ba47163dd44c6decd0d433a71"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MarketplaceListing"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"listingId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"marketplaceListing"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"listingId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"listingId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ListingFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ListingFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MarketplaceListing"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"condition"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrls"}},{"kind":"Field","name":{"kind":"Name","value":"priceAmount"}},{"kind":"Field","name":{"kind":"Name","value":"priceType"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"contactPreference"}},{"kind":"Field","name":{"kind":"Name","value":"showPhone"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"rejectionReason"}},{"kind":"Field","name":{"kind":"Name","value":"publishedAt"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"viewsCount"}},{"kind":"Field","name":{"kind":"Name","value":"contactsCount"}},{"kind":"Field","name":{"kind":"Name","value":"favoritesCount"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"categoryId"}},{"kind":"Field","name":{"kind":"Name","value":"category"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}}]}},{"kind":"Field","name":{"kind":"Name","value":"unit"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"number"}},{"kind":"Field","name":{"kind":"Name","value":"building"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"contact"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"unitLabel"}},{"kind":"Field","name":{"kind":"Name","value":"preference"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"inAppOnly"}}]}},{"kind":"Field","name":{"kind":"Name","value":"viewerHasFavorited"}},{"kind":"Field","name":{"kind":"Name","value":"viewerHasContacted"}},{"kind":"Field","name":{"kind":"Name","value":"viewerIsOwner"}}]}}]} as unknown as DocumentNode<MarketplaceListingQuery, MarketplaceListingQueryVariables>;
export const MarketplaceCategoriesAppDocument = {"__meta__":{"hash":"cdef4529b84d3b563dd5e792000e4cebcdc7b226d3ae6dfce0317a1b41a3bd38"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MarketplaceCategoriesApp"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"complexId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"marketplaceCategories"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"complexId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"complexId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}}]}}]}}]} as unknown as DocumentNode<MarketplaceCategoriesAppQuery, MarketplaceCategoriesAppQueryVariables>;
export const MarketplaceSettingsAppDocument = {"__meta__":{"hash":"c6171a461f1f8abb318b6b4f77471267e00fe0c44ba9437e435c021443ab99d0"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MarketplaceSettingsApp"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"complexId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"marketplaceSettings"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"complexId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"complexId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"complexId"}},{"kind":"Field","name":{"kind":"Name","value":"moderationMode"}},{"kind":"Field","name":{"kind":"Name","value":"listingDurationDays"}},{"kind":"Field","name":{"kind":"Name","value":"maxActiveListingsPerUnit"}},{"kind":"Field","name":{"kind":"Name","value":"maxImagesPerListing"}},{"kind":"Field","name":{"kind":"Name","value":"allowPhoneContact"}},{"kind":"Field","name":{"kind":"Name","value":"allowWantedListings"}},{"kind":"Field","name":{"kind":"Name","value":"termsText"}}]}}]}}]} as unknown as DocumentNode<MarketplaceSettingsAppQuery, MarketplaceSettingsAppQueryVariables>;
export const RegisterListingInterestDocument = {"__meta__":{"hash":"881df4a116ea9bae894f9900662ca245885eeb9fb7208c8e5618532b200776db"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RegisterListingInterest"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RegisterListingInterestInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"registerListingInterest"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ListingFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ListingFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MarketplaceListing"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"condition"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrls"}},{"kind":"Field","name":{"kind":"Name","value":"priceAmount"}},{"kind":"Field","name":{"kind":"Name","value":"priceType"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"contactPreference"}},{"kind":"Field","name":{"kind":"Name","value":"showPhone"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"rejectionReason"}},{"kind":"Field","name":{"kind":"Name","value":"publishedAt"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"viewsCount"}},{"kind":"Field","name":{"kind":"Name","value":"contactsCount"}},{"kind":"Field","name":{"kind":"Name","value":"favoritesCount"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"categoryId"}},{"kind":"Field","name":{"kind":"Name","value":"category"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}}]}},{"kind":"Field","name":{"kind":"Name","value":"unit"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"number"}},{"kind":"Field","name":{"kind":"Name","value":"building"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"contact"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"unitLabel"}},{"kind":"Field","name":{"kind":"Name","value":"preference"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"inAppOnly"}}]}},{"kind":"Field","name":{"kind":"Name","value":"viewerHasFavorited"}},{"kind":"Field","name":{"kind":"Name","value":"viewerHasContacted"}},{"kind":"Field","name":{"kind":"Name","value":"viewerIsOwner"}}]}}]} as unknown as DocumentNode<RegisterListingInterestMutation, RegisterListingInterestMutationVariables>;
export const ToggleListingFavoriteDocument = {"__meta__":{"hash":"38a57251fb9d8ae9c56f2f7f010efdf457aa8f504777baf2594763224f94c6a3"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ToggleListingFavorite"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"listingId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"toggleListingFavorite"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"listingId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"listingId"}}}]}]}}]} as unknown as DocumentNode<ToggleListingFavoriteMutation, ToggleListingFavoriteMutationVariables>;
export const ReportListingDocument = {"__meta__":{"hash":"f83947efddd19578fbb69a34d055f003124cf64b2f23ef47b46444c703960815"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ReportListing"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ReportListingInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"reportListing"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<ReportListingMutation, ReportListingMutationVariables>;
export const PauseListingAppDocument = {"__meta__":{"hash":"a7cfe56098cceb778cda0c2307554c7048a9c0aff8281007be5ce7185a9e750d"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"PauseListingApp"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"listingId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pauseListing"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"listingId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"listingId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ListingFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ListingFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MarketplaceListing"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"condition"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrls"}},{"kind":"Field","name":{"kind":"Name","value":"priceAmount"}},{"kind":"Field","name":{"kind":"Name","value":"priceType"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"contactPreference"}},{"kind":"Field","name":{"kind":"Name","value":"showPhone"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"rejectionReason"}},{"kind":"Field","name":{"kind":"Name","value":"publishedAt"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"viewsCount"}},{"kind":"Field","name":{"kind":"Name","value":"contactsCount"}},{"kind":"Field","name":{"kind":"Name","value":"favoritesCount"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"categoryId"}},{"kind":"Field","name":{"kind":"Name","value":"category"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}}]}},{"kind":"Field","name":{"kind":"Name","value":"unit"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"number"}},{"kind":"Field","name":{"kind":"Name","value":"building"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"contact"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"unitLabel"}},{"kind":"Field","name":{"kind":"Name","value":"preference"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"inAppOnly"}}]}},{"kind":"Field","name":{"kind":"Name","value":"viewerHasFavorited"}},{"kind":"Field","name":{"kind":"Name","value":"viewerHasContacted"}},{"kind":"Field","name":{"kind":"Name","value":"viewerIsOwner"}}]}}]} as unknown as DocumentNode<PauseListingAppMutation, PauseListingAppMutationVariables>;
export const ResumeListingAppDocument = {"__meta__":{"hash":"028270e691950f0e0e74ef9e64025ac18dbfd01ae3fb16241fa2a020b307216b"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ResumeListingApp"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"listingId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resumeListing"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"listingId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"listingId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ListingFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ListingFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MarketplaceListing"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"condition"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrls"}},{"kind":"Field","name":{"kind":"Name","value":"priceAmount"}},{"kind":"Field","name":{"kind":"Name","value":"priceType"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"contactPreference"}},{"kind":"Field","name":{"kind":"Name","value":"showPhone"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"rejectionReason"}},{"kind":"Field","name":{"kind":"Name","value":"publishedAt"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"viewsCount"}},{"kind":"Field","name":{"kind":"Name","value":"contactsCount"}},{"kind":"Field","name":{"kind":"Name","value":"favoritesCount"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"categoryId"}},{"kind":"Field","name":{"kind":"Name","value":"category"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}}]}},{"kind":"Field","name":{"kind":"Name","value":"unit"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"number"}},{"kind":"Field","name":{"kind":"Name","value":"building"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"contact"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"unitLabel"}},{"kind":"Field","name":{"kind":"Name","value":"preference"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"inAppOnly"}}]}},{"kind":"Field","name":{"kind":"Name","value":"viewerHasFavorited"}},{"kind":"Field","name":{"kind":"Name","value":"viewerHasContacted"}},{"kind":"Field","name":{"kind":"Name","value":"viewerIsOwner"}}]}}]} as unknown as DocumentNode<ResumeListingAppMutation, ResumeListingAppMutationVariables>;
export const MarkListingAsSoldDocument = {"__meta__":{"hash":"d285170cb4be1b2d82b01a5488d1f0a2f2ab5c384a6a039feb7401e0c51b2e5c"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MarkListingAsSold"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"listingId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markListingAsSold"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"listingId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"listingId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ListingFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ListingFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MarketplaceListing"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"condition"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrls"}},{"kind":"Field","name":{"kind":"Name","value":"priceAmount"}},{"kind":"Field","name":{"kind":"Name","value":"priceType"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"contactPreference"}},{"kind":"Field","name":{"kind":"Name","value":"showPhone"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"rejectionReason"}},{"kind":"Field","name":{"kind":"Name","value":"publishedAt"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"viewsCount"}},{"kind":"Field","name":{"kind":"Name","value":"contactsCount"}},{"kind":"Field","name":{"kind":"Name","value":"favoritesCount"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"categoryId"}},{"kind":"Field","name":{"kind":"Name","value":"category"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}}]}},{"kind":"Field","name":{"kind":"Name","value":"unit"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"number"}},{"kind":"Field","name":{"kind":"Name","value":"building"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"contact"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"unitLabel"}},{"kind":"Field","name":{"kind":"Name","value":"preference"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"inAppOnly"}}]}},{"kind":"Field","name":{"kind":"Name","value":"viewerHasFavorited"}},{"kind":"Field","name":{"kind":"Name","value":"viewerHasContacted"}},{"kind":"Field","name":{"kind":"Name","value":"viewerIsOwner"}}]}}]} as unknown as DocumentNode<MarkListingAsSoldMutation, MarkListingAsSoldMutationVariables>;
export const RenewListingDocument = {"__meta__":{"hash":"44c99a549c921f611080cb60ed2dbc61499dacc94884bf85a59c24315a371e1b"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RenewListing"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"listingId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"renewListing"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"listingId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"listingId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ListingFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ListingFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MarketplaceListing"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"condition"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrls"}},{"kind":"Field","name":{"kind":"Name","value":"priceAmount"}},{"kind":"Field","name":{"kind":"Name","value":"priceType"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"contactPreference"}},{"kind":"Field","name":{"kind":"Name","value":"showPhone"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"rejectionReason"}},{"kind":"Field","name":{"kind":"Name","value":"publishedAt"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"viewsCount"}},{"kind":"Field","name":{"kind":"Name","value":"contactsCount"}},{"kind":"Field","name":{"kind":"Name","value":"favoritesCount"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"categoryId"}},{"kind":"Field","name":{"kind":"Name","value":"category"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}}]}},{"kind":"Field","name":{"kind":"Name","value":"unit"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"number"}},{"kind":"Field","name":{"kind":"Name","value":"building"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"contact"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"unitLabel"}},{"kind":"Field","name":{"kind":"Name","value":"preference"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"inAppOnly"}}]}},{"kind":"Field","name":{"kind":"Name","value":"viewerHasFavorited"}},{"kind":"Field","name":{"kind":"Name","value":"viewerHasContacted"}},{"kind":"Field","name":{"kind":"Name","value":"viewerIsOwner"}}]}}]} as unknown as DocumentNode<RenewListingMutation, RenewListingMutationVariables>;
export const RemoveListingAppDocument = {"__meta__":{"hash":"58dc52414f945223a5de15d81107ccc6f3531268e1042a6ca27321f96da8e08c"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveListingApp"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"listingId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"reason"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeListing"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"listingId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"listingId"}}},{"kind":"Argument","name":{"kind":"Name","value":"reason"},"value":{"kind":"Variable","name":{"kind":"Name","value":"reason"}}}]}]}}]} as unknown as DocumentNode<RemoveListingAppMutation, RemoveListingAppMutationVariables>;
export const SaveMobileTokenDocument = {"__meta__":{"hash":"7498a591e1665a241b9d7c569cbfcbf9e5bab7018e38e3e447966c151cefb8d8"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SaveMobileToken"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SaveMobileTokenInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"saveMobileToken"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}}]}}]}}]} as unknown as DocumentNode<SaveMobileTokenMutation, SaveMobileTokenMutationVariables>;
export const DeactivateMobileTokenDocument = {"__meta__":{"hash":"139284ea6b3a9dbfbf8bbcd24c3ba33bf74f640e8de47510c4abb8609cbcceb1"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeactivateMobileToken"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"deviceToken"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deactivateMobileToken"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"deviceToken"},"value":{"kind":"Variable","name":{"kind":"Name","value":"deviceToken"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}}]}}]}}]} as unknown as DocumentNode<DeactivateMobileTokenMutation, DeactivateMobileTokenMutationVariables>;
export const MarkNotificationAsReadDocument = {"__meta__":{"hash":"cd666286e0536c5eaffd96c3b7881cdbda935029cf45b46328a0a3d5ab0f4dbc"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MarkNotificationAsRead"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"notificationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markNotificationAsRead"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"notificationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"notificationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"isRead"}},{"kind":"Field","name":{"kind":"Name","value":"readAt"}}]}}]}}]} as unknown as DocumentNode<MarkNotificationAsReadMutation, MarkNotificationAsReadMutationVariables>;
export const MarkAllNotificationsAsReadDocument = {"__meta__":{"hash":"bec86f95710accdb11948927c8b13e5c3342f6a29f08449dfd3894c09a4787ad"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MarkAllNotificationsAsRead"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"complexId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markAllNotificationsAsRead"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"complexId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"complexId"}}}]}]}}]} as unknown as DocumentNode<MarkAllNotificationsAsReadMutation, MarkAllNotificationsAsReadMutationVariables>;
export const DeleteNotificationDocument = {"__meta__":{"hash":"dc530bd13990bba82b0dbeb62fc431a1010bd43afda57cb323fd4aecc76adee9"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteNotification"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"notificationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteNotification"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"notificationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"notificationId"}}}]}]}}]} as unknown as DocumentNode<DeleteNotificationMutation, DeleteNotificationMutationVariables>;
export const MyNotificationsDocument = {"__meta__":{"hash":"5944c94c29f6a27ddd322f32846dc77d08b4e8b17cb2f71bcf39f761f69de071"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyNotifications"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"complexId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filters"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"FilterNotificationsInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myNotifications"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"complexId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"complexId"}}},{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}}},{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filters"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"isRead"}},{"kind":"Field","name":{"kind":"Name","value":"isActionable"}},{"kind":"Field","name":{"kind":"Name","value":"entityType"}},{"kind":"Field","name":{"kind":"Name","value":"entityId"}},{"kind":"Field","name":{"kind":"Name","value":"metadata"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pagination"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"itemsPerPage"}},{"kind":"Field","name":{"kind":"Name","value":"totalItems"}},{"kind":"Field","name":{"kind":"Name","value":"totalPages"}},{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasPreviousPage"}}]}}]}}]}}]} as unknown as DocumentNode<MyNotificationsQuery, MyNotificationsQueryVariables>;
export const UnreadNotificationsCountDocument = {"__meta__":{"hash":"43bd6827739e9a6742cdcf625a625bc31e7b3b550c0cd47acc6d8a1aaa435331"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"UnreadNotificationsCount"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"complexId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unreadNotificationsCount"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"complexId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"complexId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}}]}}]}}]} as unknown as DocumentNode<UnreadNotificationsCountQuery, UnreadNotificationsCountQueryVariables>;
export const NotificationDetailDocument = {"__meta__":{"hash":"e7c7cdf6f876f76a5181f9bd4344c490d1f7826e7622eb5961561011f714d88a"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"NotificationDetail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"notificationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"complexId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"notificationDetail"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"notificationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"notificationId"}}},{"kind":"Argument","name":{"kind":"Name","value":"complexId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"complexId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"isRead"}},{"kind":"Field","name":{"kind":"Name","value":"isActionable"}},{"kind":"Field","name":{"kind":"Name","value":"actionType"}},{"kind":"Field","name":{"kind":"Name","value":"actionLabel"}},{"kind":"Field","name":{"kind":"Name","value":"actionResult"}},{"kind":"Field","name":{"kind":"Name","value":"entityType"}},{"kind":"Field","name":{"kind":"Name","value":"entityId"}},{"kind":"Field","name":{"kind":"Name","value":"metadata"}},{"kind":"Field","name":{"kind":"Name","value":"createdByUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}},{"kind":"Field","name":{"kind":"Name","value":"roles"}},{"kind":"Field","name":{"kind":"Name","value":"profilePicture"}}]}}]}}]}}]} as unknown as DocumentNode<NotificationDetailQuery, NotificationDetailQueryVariables>;
export const MyUnitPackagesDocument = {"__meta__":{"hash":"da543e7d54db3551e472a8fa51f26613ae85128f215a0da46e537c98162e28a7"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyUnitPackages"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"complexId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filters"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"FilterPackagesInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myUnitPackages"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"complexId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"complexId"}}},{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}}},{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filters"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"trackingCode"}},{"kind":"Field","name":{"kind":"Name","value":"senderName"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"photoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"receivedAt"}},{"kind":"Field","name":{"kind":"Name","value":"notifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"deliveredAt"}},{"kind":"Field","name":{"kind":"Name","value":"returnedAt"}},{"kind":"Field","name":{"kind":"Name","value":"recipientName"}},{"kind":"Field","name":{"kind":"Name","value":"receivedByName"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"returnReason"}},{"kind":"Field","name":{"kind":"Name","value":"unitId"}},{"kind":"Field","name":{"kind":"Name","value":"complexId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pagination"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"itemsPerPage"}},{"kind":"Field","name":{"kind":"Name","value":"totalItems"}},{"kind":"Field","name":{"kind":"Name","value":"totalPages"}},{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasPreviousPage"}}]}}]}}]}}]} as unknown as DocumentNode<MyUnitPackagesQuery, MyUnitPackagesQueryVariables>;
export const PackageDocument = {"__meta__":{"hash":"838826fc05d469f524ff742cbc34daf8c762760b9df0bb9c98f71dc76fc4b7f8"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Package"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"packageId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"package"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"packageId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"packageId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"trackingCode"}},{"kind":"Field","name":{"kind":"Name","value":"senderName"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"photoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"receivedAt"}},{"kind":"Field","name":{"kind":"Name","value":"notifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"deliveredAt"}},{"kind":"Field","name":{"kind":"Name","value":"returnedAt"}},{"kind":"Field","name":{"kind":"Name","value":"recipientName"}},{"kind":"Field","name":{"kind":"Name","value":"receivedByName"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"returnReason"}},{"kind":"Field","name":{"kind":"Name","value":"unitId"}},{"kind":"Field","name":{"kind":"Name","value":"complexId"}}]}}]}}]} as unknown as DocumentNode<PackageQuery, PackageQueryVariables>;
export const TriggerPanicAlertDocument = {"__meta__":{"hash":"d62f5e70c470f726911b1bf9012d54325c79fe8ce8fec06e4e3d9c250c58cac9"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TriggerPanicAlert"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"complexId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"triggerPanicAlert"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"complexId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"complexId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}}]}}]}}]} as unknown as DocumentNode<TriggerPanicAlertMutation, TriggerPanicAlertMutationVariables>;
export const AcknowledgePanicAlertDocument = {"__meta__":{"hash":"cba602bfc1326211d34d976fcf69d7ac014a0c3c63c4a98e656a38e212a9263a"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AcknowledgePanicAlert"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"notificationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"acknowledgePanicAlert"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"notificationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"notificationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"complexId"}}]}}]}}]} as unknown as DocumentNode<AcknowledgePanicAlertMutation, AcknowledgePanicAlertMutationVariables>;
export const GetUnitDocument = {"__meta__":{"hash":"16b00b7a72c1b756b34d25c6dd77322cd54a5d13e0a59c9a3911016f4dfce1f6"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetUnit"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unit"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"number"}},{"kind":"Field","name":{"kind":"Name","value":"floor"}},{"kind":"Field","name":{"kind":"Name","value":"building"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<GetUnitQuery, GetUnitQueryVariables>;
export const ActivePanicAlertsDocument = {"__meta__":{"hash":"d5439524aa3cd203c5008ee66775739c17c4a89e94247b7e17f03c690588e6b6"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ActivePanicAlerts"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"complexId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activePanicAlerts"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"complexId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"complexId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"complexId"}},{"kind":"Field","name":{"kind":"Name","value":"createdByUserId"}},{"kind":"Field","name":{"kind":"Name","value":"metadata"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<ActivePanicAlertsQuery, ActivePanicAlertsQueryVariables>;
export const GetResidentByUserIdDocument = {"__meta__":{"hash":"6229ed3af7541789355a58742f9931c425600cc33ae7ff30edf0c779008aca2d"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetResidentByUserId"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"residentByUserId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"phoneNumber"}}]}},{"kind":"Field","name":{"kind":"Name","value":"unit"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"number"}},{"kind":"Field","name":{"kind":"Name","value":"floor"}},{"kind":"Field","name":{"kind":"Name","value":"building"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetResidentByUserIdQuery, GetResidentByUserIdQueryVariables>;
export const MyPqrfRequestsDocument = {"__meta__":{"hash":"8a10fc5f693fbd063b883a72d3e46f54b0a132e75f61a96d6b55ac859db3d55c"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyPqrfRequests"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"complexId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filters"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"FilterPqrfInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myPqrfRequests"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"complexId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"complexId"}}},{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}}},{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filters"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PqrfFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pagination"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"totalPages"}},{"kind":"Field","name":{"kind":"Name","value":"totalItems"}},{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PqrfFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Pqrf"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"addressee"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"subject"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"requestedByName"}},{"kind":"Field","name":{"kind":"Name","value":"resolvedAt"}},{"kind":"Field","name":{"kind":"Name","value":"dueAt"}},{"kind":"Field","name":{"kind":"Name","value":"resolvedBySilence"}},{"kind":"Field","name":{"kind":"Name","value":"unitId"}},{"kind":"Field","name":{"kind":"Name","value":"unit"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"number"}},{"kind":"Field","name":{"kind":"Name","value":"building"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<MyPqrfRequestsQuery, MyPqrfRequestsQueryVariables>;
export const PqrfRequestsDocument = {"__meta__":{"hash":"b3970991d0e995883c015ac26fb3955cf6d735e532f9cc37d35e5812ca210954"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PqrfRequests"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"complexId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filters"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"FilterPqrfInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pqrfRequests"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"complexId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"complexId"}}},{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}}},{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filters"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PqrfFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pagination"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"totalPages"}},{"kind":"Field","name":{"kind":"Name","value":"totalItems"}},{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PqrfFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Pqrf"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"addressee"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"subject"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"requestedByName"}},{"kind":"Field","name":{"kind":"Name","value":"resolvedAt"}},{"kind":"Field","name":{"kind":"Name","value":"dueAt"}},{"kind":"Field","name":{"kind":"Name","value":"resolvedBySilence"}},{"kind":"Field","name":{"kind":"Name","value":"unitId"}},{"kind":"Field","name":{"kind":"Name","value":"unit"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"number"}},{"kind":"Field","name":{"kind":"Name","value":"building"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<PqrfRequestsQuery, PqrfRequestsQueryVariables>;
export const PqrfRequestDocument = {"__meta__":{"hash":"e48e7ec052fb54187aa7f6749aab6f7eb0ca6af4133db7e962973f9f7a816f60"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PqrfRequest"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pqrfId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pqrfRequest"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pqrfId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pqrfId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PqrfFields"}},{"kind":"Field","name":{"kind":"Name","value":"viewerCanResolve"}},{"kind":"Field","name":{"kind":"Name","value":"viewerIsCouncilObserver"}},{"kind":"Field","name":{"kind":"Name","value":"acknowledgements"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"userName"}},{"kind":"Field","name":{"kind":"Name","value":"instance"}},{"kind":"Field","name":{"kind":"Name","value":"openedAt"}},{"kind":"Field","name":{"kind":"Name","value":"resolvedAt"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PqrfFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Pqrf"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"addressee"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"subject"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"requestedByName"}},{"kind":"Field","name":{"kind":"Name","value":"resolvedAt"}},{"kind":"Field","name":{"kind":"Name","value":"dueAt"}},{"kind":"Field","name":{"kind":"Name","value":"resolvedBySilence"}},{"kind":"Field","name":{"kind":"Name","value":"unitId"}},{"kind":"Field","name":{"kind":"Name","value":"unit"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"number"}},{"kind":"Field","name":{"kind":"Name","value":"building"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<PqrfRequestQuery, PqrfRequestQueryVariables>;
export const OpenPqrfDocument = {"__meta__":{"hash":"6a914f6b5201826809e8fd25de69cda5b3c554b27685bace18862359abe21017"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"OpenPqrf"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pqrfId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"openPqrf"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pqrfId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pqrfId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PqrfFields"}},{"kind":"Field","name":{"kind":"Name","value":"viewerCanResolve"}},{"kind":"Field","name":{"kind":"Name","value":"viewerIsCouncilObserver"}},{"kind":"Field","name":{"kind":"Name","value":"acknowledgements"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"userName"}},{"kind":"Field","name":{"kind":"Name","value":"instance"}},{"kind":"Field","name":{"kind":"Name","value":"openedAt"}},{"kind":"Field","name":{"kind":"Name","value":"resolvedAt"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PqrfFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Pqrf"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"addressee"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"subject"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"requestedByName"}},{"kind":"Field","name":{"kind":"Name","value":"resolvedAt"}},{"kind":"Field","name":{"kind":"Name","value":"dueAt"}},{"kind":"Field","name":{"kind":"Name","value":"resolvedBySilence"}},{"kind":"Field","name":{"kind":"Name","value":"unitId"}},{"kind":"Field","name":{"kind":"Name","value":"unit"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"number"}},{"kind":"Field","name":{"kind":"Name","value":"building"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<OpenPqrfMutation, OpenPqrfMutationVariables>;
export const ResolvePqrfDocument = {"__meta__":{"hash":"d635b3a0915b0d5121b325f5a29376aaf8b0fd8c4b5d1ed6b9db95aacba7c061"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ResolvePqrf"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pqrfId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resolvePqrf"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pqrfId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pqrfId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PqrfFields"}},{"kind":"Field","name":{"kind":"Name","value":"viewerCanResolve"}},{"kind":"Field","name":{"kind":"Name","value":"viewerIsCouncilObserver"}},{"kind":"Field","name":{"kind":"Name","value":"acknowledgements"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"userName"}},{"kind":"Field","name":{"kind":"Name","value":"instance"}},{"kind":"Field","name":{"kind":"Name","value":"openedAt"}},{"kind":"Field","name":{"kind":"Name","value":"resolvedAt"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PqrfFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Pqrf"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"addressee"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"subject"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"requestedByName"}},{"kind":"Field","name":{"kind":"Name","value":"resolvedAt"}},{"kind":"Field","name":{"kind":"Name","value":"dueAt"}},{"kind":"Field","name":{"kind":"Name","value":"resolvedBySilence"}},{"kind":"Field","name":{"kind":"Name","value":"unitId"}},{"kind":"Field","name":{"kind":"Name","value":"unit"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"number"}},{"kind":"Field","name":{"kind":"Name","value":"building"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<ResolvePqrfMutation, ResolvePqrfMutationVariables>;
export const CreatePqrfDocument = {"__meta__":{"hash":"9fe596c9a2d31c26e1314c7a2d18df4271c2598c794d2f3cfb899f2f2f05091e"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreatePqrf"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreatePqrfInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createPqrf"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PqrfFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PqrfFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Pqrf"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"addressee"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"subject"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"requestedByName"}},{"kind":"Field","name":{"kind":"Name","value":"resolvedAt"}},{"kind":"Field","name":{"kind":"Name","value":"dueAt"}},{"kind":"Field","name":{"kind":"Name","value":"resolvedBySilence"}},{"kind":"Field","name":{"kind":"Name","value":"unitId"}},{"kind":"Field","name":{"kind":"Name","value":"unit"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"number"}},{"kind":"Field","name":{"kind":"Name","value":"building"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<CreatePqrfMutation, CreatePqrfMutationVariables>;
export const RequestSecurityCallDocument = {"__meta__":{"hash":"d740245eb639732628877d2bb278d6d6fc5d2e51ab73a74dd30187743464d6a3"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RequestSecurityCall"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"complexId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requestSecurityCall"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"complexId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"complexId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<RequestSecurityCallMutation, RequestSecurityCallMutationVariables>;
export const VehicleDocument = {"__meta__":{"hash":"efe2199458730aa97f8cff1b3fff348472d06b4668400c79ce975cafaf6aef2a"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Vehicle"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"vehicle"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"plate"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"brand"}},{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"year"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"fuelType"}},{"kind":"Field","name":{"kind":"Name","value":"photoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"parkingSpot"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"approvedAt"}},{"kind":"Field","name":{"kind":"Name","value":"rejectionReason"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"residentId"}},{"kind":"Field","name":{"kind":"Name","value":"unitId"}},{"kind":"Field","name":{"kind":"Name","value":"complexId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<VehicleQuery, VehicleQueryVariables>;
export const ScheduleVisitDocument = {"__meta__":{"hash":"7cd9fedef7abe6aecf9a60d70e926aa3cc36acd0f970d822539c34e368a292d3"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ScheduleVisit"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ScheduleVisitInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"scheduleVisit"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"qrToken"}},{"kind":"Field","name":{"kind":"Name","value":"qrExpiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"expectedArrivalAt"}},{"kind":"Field","name":{"kind":"Name","value":"expectedArrivalUntil"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"visitor"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}},{"kind":"Field","name":{"kind":"Name","value":"identity"}},{"kind":"Field","name":{"kind":"Name","value":"identityType"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}}]}}]}}]}}]} as unknown as DocumentNode<ScheduleVisitMutation, ScheduleVisitMutationVariables>;
export const ApproveVisitDocument = {"__meta__":{"hash":"22062d7ecd744b04270d230b7d454f20cfbcdca75eebabafb8b588263bd5269d"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ApproveVisit"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"visitId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"approveVisitEntry"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"visitId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"visitId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"approvedByResidentAt"}}]}}]}}]} as unknown as DocumentNode<ApproveVisitMutation, ApproveVisitMutationVariables>;
export const DenyVisitDocument = {"__meta__":{"hash":"e023bdafe7c8a29df18485372f4b3136f788e86295bc3c9690cd332aada026b7"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DenyVisit"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"visitId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"reason"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"denyVisitEntry"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"visitId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"visitId"}}},{"kind":"Argument","name":{"kind":"Name","value":"reason"},"value":{"kind":"Variable","name":{"kind":"Name","value":"reason"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"denialReason"}},{"kind":"Field","name":{"kind":"Name","value":"deniedByResidentAt"}}]}}]}}]} as unknown as DocumentNode<DenyVisitMutation, DenyVisitMutationVariables>;
export const CancelVisitDocument = {"__meta__":{"hash":"8a8d55924cc24cb5cb7f0f9ef66ede69bae1c5f2fe52141edd83dbcd1b3d506c"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CancelVisit"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"visitId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cancelVisit"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"visitId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"visitId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<CancelVisitMutation, CancelVisitMutationVariables>;
export const BlacklistVisitorDocument = {"__meta__":{"hash":"a112bd9a75918a58fe85c5237873e8b90067461da378769b5cb2b35ad0285f00"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"BlacklistVisitor"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"BlacklistVisitorInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"blacklistVisitor"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"identity"}},{"kind":"Field","name":{"kind":"Name","value":"isBlacklisted"}},{"kind":"Field","name":{"kind":"Name","value":"blacklistReason"}},{"kind":"Field","name":{"kind":"Name","value":"blacklistedAt"}}]}}]}}]} as unknown as DocumentNode<BlacklistVisitorMutation, BlacklistVisitorMutationVariables>;
export const RemoveVisitorFromBlacklistDocument = {"__meta__":{"hash":"7e78492e104ccc48653d08e2726aa54c7852c00f33155630437d1b53cd3e674b"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveVisitorFromBlacklist"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"visitorId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeVisitorFromBlacklist"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"visitorId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"visitorId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"identity"}},{"kind":"Field","name":{"kind":"Name","value":"isBlacklisted"}},{"kind":"Field","name":{"kind":"Name","value":"blacklistReason"}},{"kind":"Field","name":{"kind":"Name","value":"blacklistedAt"}}]}}]}}]} as unknown as DocumentNode<RemoveVisitorFromBlacklistMutation, RemoveVisitorFromBlacklistMutationVariables>;
export const VisitDocument = {"__meta__":{"hash":"f62dc70704ad4930b9ed10b72162354472a485bf78dc510056853b256120ce7c"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Visit"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"visit"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"purpose"}},{"kind":"Field","name":{"kind":"Name","value":"entryTime"}},{"kind":"Field","name":{"kind":"Name","value":"exitTime"}},{"kind":"Field","name":{"kind":"Name","value":"expectedArrivalAt"}},{"kind":"Field","name":{"kind":"Name","value":"expectedArrivalUntil"}},{"kind":"Field","name":{"kind":"Name","value":"vehiclePlate"}},{"kind":"Field","name":{"kind":"Name","value":"denialReason"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"approvedByResidentAt"}},{"kind":"Field","name":{"kind":"Name","value":"deniedByResidentAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"visitor"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"identity"}},{"kind":"Field","name":{"kind":"Name","value":"identityType"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"photoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"isBlacklisted"}}]}}]}}]}}]} as unknown as DocumentNode<VisitQuery, VisitQueryVariables>;
export const MisVisitasDocument = {"__meta__":{"hash":"e1f7a16d1649daa4c610f56fcabbf0332c73bfaa164d3553cdec45d1961f19b8"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MisVisitas"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filters"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"FilterVisitsInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myVisits"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}}},{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filters"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"purpose"}},{"kind":"Field","name":{"kind":"Name","value":"expectedArrivalAt"}},{"kind":"Field","name":{"kind":"Name","value":"expectedArrivalUntil"}},{"kind":"Field","name":{"kind":"Name","value":"qrToken"}},{"kind":"Field","name":{"kind":"Name","value":"qrUsed"}},{"kind":"Field","name":{"kind":"Name","value":"qrExpiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"vehiclePlate"}},{"kind":"Field","name":{"kind":"Name","value":"entryTime"}},{"kind":"Field","name":{"kind":"Name","value":"exitTime"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"visitor"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"identity"}},{"kind":"Field","name":{"kind":"Name","value":"identityType"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"photoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"isBlacklisted"}},{"kind":"Field","name":{"kind":"Name","value":"blacklistReason"}},{"kind":"Field","name":{"kind":"Name","value":"blacklistedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"unit"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"building"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pagination"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"itemsPerPage"}},{"kind":"Field","name":{"kind":"Name","value":"totalItems"}},{"kind":"Field","name":{"kind":"Name","value":"totalPages"}},{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasPreviousPage"}}]}}]}}]}}]} as unknown as DocumentNode<MisVisitasQuery, MisVisitasQueryVariables>;
export const VotingEnabledDocument = {"__meta__":{"hash":"606179a3470ed5ed12c8396d6f8f107a7816b2210804d81244f29753928a8c29"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"VotingEnabled"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"complexId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"votingEnabled"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"complexId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"complexId"}}}]}]}}]} as unknown as DocumentNode<VotingEnabledQuery, VotingEnabledQueryVariables>;
export const MyVotingMeetingsDocument = {"__meta__":{"hash":"1b6e222ffaecfcd867cc8a04f37b3fe34c7c68ea63d17527561bbd797567d0c6"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyVotingMeetings"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"complexId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myVotingMeetings"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"complexId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"complexId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledAt"}},{"kind":"Field","name":{"kind":"Name","value":"questions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"VotingQuestionFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"VotingResultsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"VotingResults"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"weighting"}},{"kind":"Field","name":{"kind":"Name","value":"eligibleCount"}},{"kind":"Field","name":{"kind":"Name","value":"eligibleWeight"}},{"kind":"Field","name":{"kind":"Name","value":"votedCount"}},{"kind":"Field","name":{"kind":"Name","value":"votedWeight"}},{"kind":"Field","name":{"kind":"Name","value":"participation"}},{"kind":"Field","name":{"kind":"Name","value":"options"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"optionId"}},{"kind":"Field","name":{"kind":"Name","value":"text"}},{"kind":"Field","name":{"kind":"Name","value":"votes"}},{"kind":"Field","name":{"kind":"Name","value":"weight"}},{"kind":"Field","name":{"kind":"Name","value":"share"}},{"kind":"Field","name":{"kind":"Name","value":"shareOfEligible"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"VotingQuestionFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"VotingQuestion"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"text"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"weighting"}},{"kind":"Field","name":{"kind":"Name","value":"secrecy"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"openedAt"}},{"kind":"Field","name":{"kind":"Name","value":"closedAt"}},{"kind":"Field","name":{"kind":"Name","value":"options"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"text"}}]}},{"kind":"Field","name":{"kind":"Name","value":"results"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"VotingResultsFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"myVoteOptionId"}},{"kind":"Field","name":{"kind":"Name","value":"viewerCanVote"}},{"kind":"Field","name":{"kind":"Name","value":"viewerHasVoiceOnly"}}]}}]} as unknown as DocumentNode<MyVotingMeetingsQuery, MyVotingMeetingsQueryVariables>;
export const VotingQuestionDocument = {"__meta__":{"hash":"58d5adafda4b42aa431fb77e9e348d1a20685859316dd88b5c23a830c7077bd8"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"VotingQuestion"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"questionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"votingQuestion"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"questionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"questionId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"VotingQuestionFields"}},{"kind":"Field","name":{"kind":"Name","value":"meeting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledAt"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"VotingResultsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"VotingResults"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"weighting"}},{"kind":"Field","name":{"kind":"Name","value":"eligibleCount"}},{"kind":"Field","name":{"kind":"Name","value":"eligibleWeight"}},{"kind":"Field","name":{"kind":"Name","value":"votedCount"}},{"kind":"Field","name":{"kind":"Name","value":"votedWeight"}},{"kind":"Field","name":{"kind":"Name","value":"participation"}},{"kind":"Field","name":{"kind":"Name","value":"options"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"optionId"}},{"kind":"Field","name":{"kind":"Name","value":"text"}},{"kind":"Field","name":{"kind":"Name","value":"votes"}},{"kind":"Field","name":{"kind":"Name","value":"weight"}},{"kind":"Field","name":{"kind":"Name","value":"share"}},{"kind":"Field","name":{"kind":"Name","value":"shareOfEligible"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"VotingQuestionFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"VotingQuestion"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"text"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"weighting"}},{"kind":"Field","name":{"kind":"Name","value":"secrecy"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"openedAt"}},{"kind":"Field","name":{"kind":"Name","value":"closedAt"}},{"kind":"Field","name":{"kind":"Name","value":"options"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"text"}}]}},{"kind":"Field","name":{"kind":"Name","value":"results"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"VotingResultsFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"myVoteOptionId"}},{"kind":"Field","name":{"kind":"Name","value":"viewerCanVote"}},{"kind":"Field","name":{"kind":"Name","value":"viewerHasVoiceOnly"}}]}}]} as unknown as DocumentNode<VotingQuestionQuery, VotingQuestionQueryVariables>;
export const CastVoteDocument = {"__meta__":{"hash":"81cd631eaf14c8dc631ae1efc40cc6cfbdb769e4e3481cba353651fd3dbcb843"},"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CastVote"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"questionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"optionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"castVote"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"questionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"questionId"}}},{"kind":"Argument","name":{"kind":"Name","value":"optionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"optionId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"VotingQuestionFields"}},{"kind":"Field","name":{"kind":"Name","value":"meeting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledAt"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"VotingResultsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"VotingResults"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"weighting"}},{"kind":"Field","name":{"kind":"Name","value":"eligibleCount"}},{"kind":"Field","name":{"kind":"Name","value":"eligibleWeight"}},{"kind":"Field","name":{"kind":"Name","value":"votedCount"}},{"kind":"Field","name":{"kind":"Name","value":"votedWeight"}},{"kind":"Field","name":{"kind":"Name","value":"participation"}},{"kind":"Field","name":{"kind":"Name","value":"options"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"optionId"}},{"kind":"Field","name":{"kind":"Name","value":"text"}},{"kind":"Field","name":{"kind":"Name","value":"votes"}},{"kind":"Field","name":{"kind":"Name","value":"weight"}},{"kind":"Field","name":{"kind":"Name","value":"share"}},{"kind":"Field","name":{"kind":"Name","value":"shareOfEligible"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"VotingQuestionFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"VotingQuestion"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"meetingId"}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"text"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"weighting"}},{"kind":"Field","name":{"kind":"Name","value":"secrecy"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"openedAt"}},{"kind":"Field","name":{"kind":"Name","value":"closedAt"}},{"kind":"Field","name":{"kind":"Name","value":"options"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"position"}},{"kind":"Field","name":{"kind":"Name","value":"text"}}]}},{"kind":"Field","name":{"kind":"Name","value":"results"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"VotingResultsFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"myVoteOptionId"}},{"kind":"Field","name":{"kind":"Name","value":"viewerCanVote"}},{"kind":"Field","name":{"kind":"Name","value":"viewerHasVoiceOnly"}}]}}]} as unknown as DocumentNode<CastVoteMutation, CastVoteMutationVariables>;