/**
 * Mantenimiento de zonas comunes, visto desde la app.
 *
 * Los tipos son los del backend recortados a lo que el residente puede ver: no
 * están el costo, el proveedor asignado ni las notas internas de la bitácora,
 * porque el servidor no se los manda.
 */

export type MaintenanceCategory =
  | 'ILUMINACION'
  | 'ELECTRICO'
  | 'PLOMERIA'
  | 'ESTRUCTURA'
  | 'ASCENSORES'
  | 'PUERTAS_Y_ACCESOS'
  | 'SEGURIDAD'
  | 'ASEO'
  | 'JARDINERIA'
  | 'PISCINA'
  | 'GAS'
  | 'OTRO';

export type MaintenancePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/**
 * `RESOLVED` no es `CLOSED`: reparado lo declara quien arregló, cerrado lo
 * confirma quien reportó al calificar. Entre los dos está la única ventana en
 * la que el residente puede decir que el trabajo quedó mal.
 */
export type MaintenanceTicketStatus =
  | 'NEW'
  | 'TRIAGED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'ON_HOLD'
  | 'RESOLVED'
  | 'CLOSED'
  | 'REJECTED'
  | 'DUPLICATE';

export type MaintenanceLocationType = 'GPS' | 'TAG' | 'TREE' | 'AMENITY';

export type MaintenanceVisibility = 'PUBLIC' | 'PRIVATE';

export type MaintenanceEventType =
  | 'CREATED'
  | 'TRIAGED'
  | 'ASSIGNED'
  | 'STATUS_CHANGED'
  | 'PROGRESS'
  | 'COMMENT'
  | 'RESOLVED'
  | 'REOPENED'
  | 'CLOSED'
  | 'RATED'
  | 'ENDORSED'
  | 'SLA_BREACHED';

interface NamedRef {
  id: string;
  name: string;
}

/** Un renglón de la bitácora. Las notas internas nunca llegan hasta aquí. */
export interface MaintenanceEvent {
  id: string;
  type: MaintenanceEventType;
  message?: string | null;
  fromStatus?: MaintenanceTicketStatus | null;
  toStatus?: MaintenanceTicketStatus | null;
  imageUrls?: string[] | null;
  authorName?: string | null;
  authorRole?: string | null;
  createdAt: string;
}

export interface MaintenanceTicket {
  id: string;
  code: string;
  title: string;
  description: string;
  category: MaintenanceCategory;
  priority: MaintenancePriority;
  status: MaintenanceTicketStatus;
  visibility: MaintenanceVisibility;
  photoUrls?: string[] | null;
  videoUrl?: string | null;
  occurredAt: string;
  locationType: MaintenanceLocationType;
  locationText?: string | null;
  floor?: number | null;
  lat?: number | null;
  lng?: number | null;
  buildingId?: string | null;
  building?: NamedRef | null;
  amenityId?: string | null;
  amenity?: NamedRef | null;
  locationTagId?: string | null;
  locationTag?: { id: string; code: string; name: string } | null;
  /** Cuántos vecinos dijeron "a mí también me pasa". */
  endorsementCount: number;
  /** Cuándo se comprometió el técnico a ir. Es lo que el residente quiere saber. */
  scheduledFor?: string | null;
  slaDueAt?: string | null;
  slaBreachedAt?: string | null;
  resolutionNotes?: string | null;
  closurePhotoUrls?: string[] | null;
  resolvedAt?: string | null;
  rating?: number | null;
  ratingComment?: string | null;
  reopenCount: number;
  reportedByUserId?: string | null;
  reportedByName?: string | null;
  createdAt: string;
  vendor?: NamedRef | null;
  assignedUser?: { id: string; name?: string | null; lastName?: string | null } | null;
  events?: MaintenanceEvent[] | null;
}

export interface MaintenanceTicketPage {
  items: MaintenanceTicket[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
  };
}

/** Punto del conjunto con QR o NFC pegado encima. */
export interface MaintenanceLocationTag {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  floor?: number | null;
  defaultCategory?: MaintenanceCategory | null;
  buildingId?: string | null;
  amenityId?: string | null;
}

/** Lo que llena el selector de ubicación del formulario. */
export interface MaintenanceReportOptions {
  residentReportingEnabled: boolean;
  gpsAccuracyMeters: number;
  /** El conjunto usa stickers QR: se ofrece escanear. */
  qrEnabled?: boolean;
  /** El conjunto usa chips NFC: se ofrece leerlos (si el celular tiene NFC). */
  nfcEnabled?: boolean;
  buildings: { id: string; name: string; floors: number }[];
  amenities: NamedRef[];
  tags: MaintenanceLocationTag[];
}
