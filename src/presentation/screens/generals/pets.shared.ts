import type {
  Pet, PetIncident, PetIncidentSeverity, PetIncidentType, PetSpecies,
} from '../../../domain/responses/PetResponseModel';

/**
 * Las pastillas de estado se pintan con `StatusChip`, así que los tonos se
 * expresan en SU vocabulario y no en uno propio: una tabla de traducción entre
 * dos juegos de nombres es una fuente de errores sin ninguna ganancia.
 */
export type ChipVariant = 'success' | 'error' | 'warning' | 'info' | 'neutral';

/** Cómo se llama cada especie en pantalla. */
export const PET_SPECIES_LABEL: Record<string, string> = {
  DOG:   'Perro',
  CAT:   'Gato',
  OTHER: 'Otra',
};

export const PET_SPECIES: PetSpecies[] = ['DOG', 'CAT', 'OTHER'];

export const PET_SEX_LABEL: Record<string, string> = {
  MALE:    'Macho',
  FEMALE:  'Hembra',
  UNKNOWN: 'Sin determinar',
};

export const PET_SIZE_LABEL: Record<string, string> = {
  SMALL:  'Pequeño',
  MEDIUM: 'Mediano',
  LARGE:  'Grande',
};

export const PET_STATUS_LABEL: Record<string, string> = {
  PENDING_APPROVAL: 'Por validar',
  ACTIVE:           'Activa',
  REJECTED:         'Rechazada',
  SUSPENDED:        'Suspendida',
  REMOVED:          'Retirada',
  DECEASED:         'Fallecida',
};

export const PET_STATUS_VARIANT: Record<string, ChipVariant> = {
  PENDING_APPROVAL: 'warning',
  ACTIVE:           'success',
  REJECTED:         'error',
  SUSPENDED:        'warning',
  REMOVED:          'neutral',
  DECEASED:         'neutral',
};

/**
 * Motivos de reporte, con la explicación que necesita quien va a radicar. La
 * lista es cerrada porque las estadísticas por motivo son lo que le permite a
 * la administración poner una estación de bolsas en vez de seguir multando.
 */
export const PET_INCIDENT_TYPES: { value: PetIncidentType; label: string; hint: string }[] = [
  {
    value: 'WASTE_NOT_PICKED_UP',
    label: 'Deposiciones no recogidas',
    hint: 'No recogió los excrementos en zonas comunes.',
  },
  {
    value: 'UNAUTHORIZED_AREA',
    label: 'Zona no autorizada',
    hint: 'La mascota estaba donde el reglamento no lo permite.',
  },
  {
    value: 'NO_LEASH_OR_MUZZLE',
    label: 'Sin correa o bozal',
    hint: 'Circulaba suelta, o sin bozal siendo de manejo especial.',
  },
  {
    value: 'NOISE',
    label: 'Ruido o ladridos',
    hint: 'Ladridos persistentes que afectan la convivencia.',
  },
  {
    value: 'AGGRESSION',
    label: 'Agresión o mordedura',
    hint: 'Atacó a una persona o a otro animal. Avisa también a portería.',
  },
  {
    value: 'UNATTENDED',
    label: 'Mascota suelta',
    hint: 'Estaba sola, sin nadie que respondiera por ella.',
  },
  {
    value: 'ANIMAL_ABUSE',
    label: 'Maltrato o abandono',
    hint: 'La mascota está en riesgo. Es el motivo más grave de la lista.',
  },
  {
    value: 'OTHER',
    label: 'Otro',
    hint: 'Algo que no encaja en los anteriores.',
  },
];

export const PET_INCIDENT_TYPE_LABEL: Record<string, string> = PET_INCIDENT_TYPES
  .reduce((acc, item) => ({ ...acc, [item.value]: item.label }), {});

export const PET_SEVERITY_LABEL: Record<string, string> = {
  LOW:    'Leve',
  MEDIUM: 'Media',
  HIGH:   'Grave',
};

export const PET_SEVERITIES: PetIncidentSeverity[] = ['LOW', 'MEDIUM', 'HIGH'];

export const PET_SEVERITY_VARIANT: Record<string, ChipVariant> = {
  LOW:    'neutral',
  MEDIUM: 'warning',
  HIGH:   'error',
};

export const PET_INCIDENT_STATUS_LABEL: Record<string, string> = {
  REPORTED:      'Por revisar',
  UNDER_DEFENSE: 'Puedes responder',
  DISMISSED:     'Desestimado',
  WARNED:        'Llamado de atención',
  FINED:         'Multado',
};

export const PET_INCIDENT_STATUS_VARIANT: Record<string, ChipVariant> = {
  REPORTED:      'info',
  UNDER_DEFENSE: 'warning',
  DISMISSED:     'neutral',
  WARNED:        'warning',
  FINED:         'error',
};

/**
 * Lo que el residente tiene que entender cuando le abren un reporte: no es una
 * multa todavía, y responder a tiempo es justamente lo que puede evitarla.
 */
export const PET_DEFENSE_NOTE =
  'La administración recibió un reporte relacionado con una mascota de tu unidad. Antes de '
  + 'decidir si hay sanción tienes derecho a dar tu versión: eso son los descargos. Si el plazo '
  + 'vence sin que respondas, la administración resuelve con lo que tiene.';

/** Quién reportó nunca se muestra, y el residente merece saber por qué. */
export const PET_REPORTER_PRIVACY_NOTE =
  'Por privacidad no se muestra quién hizo el reporte. La administración sí lo sabe y queda '
  + 'registrado, para que nadie pueda reportar en falso sin responder por ello.';

/** "Te quedan 3 días para responder" / "Plazo vencido" — el plazo como lo lee el residente. */
export function petDefenseLabel(statementDueAt?: string | null): string | null {
  if (!statementDueAt) return null;

  const hoursLeft = (new Date(statementDueAt).getTime() - Date.now()) / 3_600_000;

  if (hoursLeft <= 0) return 'Se venció el plazo para responder';
  if (hoursLeft < 48) return `Te quedan ${Math.round(hoursLeft)} h para responder`;
  return `Te quedan ${Math.round(hoursLeft / 24)} días para responder`;
}

/** ¿Sigue abierto el plazo de descargos? Decide si se muestra el campo. */
export function canStillRespond(incident: PetIncident): boolean {
  if (String(incident.status) !== 'UNDER_DEFENSE') return false;
  if (!incident.statementDueAt) return true;
  return new Date(incident.statementDueAt).getTime() > Date.now();
}

/** Póliza vencida de una raza de manejo especial: bloquea la aprobación de la ficha. */
export function hasExpiredInsurance(pet: Pet): boolean {
  if (!pet.isSpecialBreed || !pet.insuranceExpiresAt) return false;
  return new Date(pet.insuranceExpiresAt).getTime() < Date.now();
}

/** Próximo refuerzo antirrábico: lo guardado es la fecha de la última dosis. */
export function nextRabiesDose(pet: Pet): Date | null {
  if (!pet.rabiesVaccineAt) return null;
  const next = new Date(pet.rabiesVaccineAt);
  next.setFullYear(next.getFullYear() + 1);
  return next;
}

/** "Torre 2 · Apto 301" — en un conjunto con varias torres el número solo no dice nada. */
export function petUnitLabel(unit?: Pet['unit']): string | null {
  if (!unit?.number) return null;

  const building = unit.building?.name?.trim();
  if (!building) return `Unidad ${unit.number}`;

  const tower = /^\d+[a-z]?$/i.test(building) ? `Torre ${building}` : building;
  return `${tower} · Apto ${unit.number}`;
}

/** "12 sep, 03:40 p. m." */
export function petWhen(iso: string): string {
  return new Date(iso).toLocaleString('es-CO', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

/** "12 sep 2026" — para vencimientos, donde la hora no aporta. */
export function petDay(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

/** El valor de una multa, como lo ve el residente en su estado de cuenta. */
export function petMoney(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0,
  }).format(amount);
}
