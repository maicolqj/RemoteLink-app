export type PetSpecies = 'DOG' | 'CAT' | 'OTHER';
export type PetSex = 'MALE' | 'FEMALE' | 'UNKNOWN';
export type PetSize = 'SMALL' | 'MEDIUM' | 'LARGE';
export type PetStatus =
  | 'PENDING_APPROVAL' | 'ACTIVE' | 'REJECTED'
  | 'SUSPENDED' | 'REMOVED' | 'DECEASED';

export type PetIncidentType =
  | 'WASTE_NOT_PICKED_UP' | 'UNAUTHORIZED_AREA' | 'NO_LEASH_OR_MUZZLE'
  | 'NOISE' | 'AGGRESSION' | 'UNATTENDED' | 'ANIMAL_ABUSE' | 'OTHER';

export type PetIncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH';

/**
 * UNDER_DEFENSE es el único estado en el que el residente puede responder: la
 * administración ya validó el reporte, se lo notificó a la unidad y está
 * corriendo el plazo de descargos.
 */
export type PetIncidentStatus =
  | 'REPORTED' | 'UNDER_DEFENSE' | 'DISMISSED' | 'WARNED' | 'FINED';

interface UnitRef {
  id: string;
  number: string;
  building?: { id: string; name: string } | null;
}

/** Ficha de una mascota de la unidad. */
export interface Pet {
  id: string;
  name: string;
  species: PetSpecies | string;
  breed?: string | null;
  color?: string | null;
  distinguishingMarks?: string | null;
  sex?: PetSex | string | null;
  size?: PetSize | string | null;
  birthDate?: string | null;
  photoUrl?: string | null;
  hasMicrochip: boolean;
  microchipCode?: string | null;
  /** Raza de manejo especial (Ley 2054/2020): exige póliza vigente para aprobarse. */
  isSpecialBreed: boolean;
  insuranceCompany?: string | null;
  insurancePolicyNumber?: string | null;
  insuranceExpiresAt?: string | null;
  vaccinationCardUrl?: string | null;
  rabiesVaccineAt?: string | null;
  sterilized?: boolean | null;
  status: PetStatus | string;
  approvedAt?: string | null;
  /** Por qué la rechazaron o suspendieron. Es lo que el residente debe corregir. */
  rejectionReason?: string | null;
  unitId: string;
  unit?: UnitRef | null;
  createdAt: string;
}

/** Intervención en el expediente: la observación de quien revisa o el descargo de la unidad. */
export interface PetIncidentStatement {
  id: string;
  text: string;
  imageUrls?: string[] | null;
  authorName?: string | null;
  authorRole?: string | null;
  createdAt: string;
}

/**
 * Reporte de convivencia.
 *
 * Al residente le llegan dos cosas distintas por esta misma vía: los reportes
 * que él radicó y los que se abrieron contra su unidad —estos últimos solo
 * cuando la administración ya los validó—. Quién reportó nunca viene: el
 * servidor lo oculta para que el módulo no se convierta en un pleito de vecinos.
 */
export interface PetIncident {
  id: string;
  code: string;
  type: PetIncidentType | string;
  severity: PetIncidentSeverity | string;
  description: string;
  photoUrls: string[];
  occurredAt: string;
  location?: string | null;
  status: PetIncidentStatus | string;
  /** Hasta cuándo puede la unidad presentar descargos. */
  statementDueAt?: string | null;
  /** La motivación de la administración cuando el caso ya está resuelto. */
  resolutionNotes?: string | null;
  resolvedAt?: string | null;
  fineAmount?: number | null;
  /** Llega solo si quien consulta radicó el reporte. Null cuando es contra su unidad. */
  reportedByName?: string | null;
  petId?: string | null;
  pet?: {
    id: string;
    name: string;
    species: PetSpecies | string;
    breed?: string | null;
    photoUrl?: string | null;
  } | null;
  unitId?: string | null;
  unit?: UnitRef | null;
  statements?: PetIncidentStatement[] | null;
  createdAt: string;
}

export interface PetIncidentPage {
  items: PetIncident[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
  };
}
