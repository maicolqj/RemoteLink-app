import type {
  MaintenanceCategory,
  MaintenanceTicket,
  MaintenanceTicketStatus,
} from '../../../domain/responses/MaintenanceResponseModel';

/** Mismo vocabulario que `StatusChip`: traducir dos juegos de nombres solo agrega errores. */
export type ChipVariant = 'success' | 'error' | 'warning' | 'info' | 'neutral';

/**
 * Los oficios, con el ícono y la explicación que necesita quien va a reportar.
 *
 * La lista es cerrada porque de la categoría salen el plazo comprometido y el
 * proveedor al que se le asigna: "otro" sirve para no bloquear a nadie, pero
 * cada reporte que cae ahí es un reporte que la administración tiene que
 * clasificar a mano.
 */
export const MAINTENANCE_CATEGORIES: {
  value: MaintenanceCategory;
  label: string;
  icon: string;
  hint: string;
}[] = [
  {
    value: 'ILUMINACION',
    label: 'Iluminación',
    icon: 'lightbulb',
    hint: 'Lámparas fundidas, pasillos o parqueaderos a oscuras.',
  },
  {
    value: 'ELECTRICO',
    label: 'Eléctrico',
    icon: 'electrical-services',
    hint: 'Tomas, tableros, cables sueltos. Si hay riesgo, avisa a portería.',
  },
  {
    value: 'PLOMERIA',
    label: 'Plomería',
    icon: 'plumbing',
    hint: 'Filtraciones, fugas, baños de zonas comunes, presión de agua.',
  },
  {
    value: 'ASCENSORES',
    label: 'Ascensores',
    icon: 'elevator',
    hint: 'Fuera de servicio, ruidos, puertas que no cierran.',
  },
  {
    value: 'ESTRUCTURA',
    label: 'Estructura',
    icon: 'foundation',
    hint: 'Grietas, humedad en muros, techos, pisos levantados.',
  },
  {
    value: 'PUERTAS_Y_ACCESOS',
    label: 'Puertas y accesos',
    icon: 'door-front',
    hint: 'Portones, citófonos, talanqueras, cerraduras.',
  },
  {
    value: 'SEGURIDAD',
    label: 'Seguridad',
    icon: 'security',
    hint: 'Cámaras, alarmas, luces de emergencia, extintores.',
  },
  {
    value: 'ASEO',
    label: 'Aseo',
    icon: 'cleaning-services',
    hint: 'Basuras acumuladas, shut, zonas sin aseo.',
  },
  {
    value: 'JARDINERIA',
    label: 'Jardinería',
    icon: 'grass',
    hint: 'Zonas verdes, poda, riego.',
  },
  {
    value: 'PISCINA',
    label: 'Piscina',
    icon: 'pool',
    hint: 'Agua turbia, bombas, filtros, químicos.',
  },
  {
    value: 'GAS',
    label: 'Gas',
    icon: 'local-fire-department',
    hint: 'Olor a gas o fugas. Sal del sitio y avisa también a portería.',
  },
  {
    value: 'OTRO',
    label: 'Otro',
    icon: 'build',
    hint: 'Lo que no encaje arriba. Descríbelo con el mayor detalle.',
  },
];

export const MAINTENANCE_CATEGORY_LABEL: Record<string, string> =
  Object.fromEntries(MAINTENANCE_CATEGORIES.map(item => [item.value, item.label]));

export const MAINTENANCE_CATEGORY_ICON: Record<string, string> =
  Object.fromEntries(MAINTENANCE_CATEGORIES.map(item => [item.value, item.icon]));

/**
 * El estado se cuenta en lo que le pasa al residente, no en el nombre interno:
 * "Técnico asignado" dice algo; "ASSIGNED", nada.
 */
export const MAINTENANCE_STATUS_LABEL: Record<string, string> = {
  NEW: 'Reporte recibido',
  TRIAGED: 'En revisión',
  ASSIGNED: 'Técnico asignado',
  IN_PROGRESS: 'En reparación',
  ON_HOLD: 'Reparación detenida',
  RESOLVED: 'Reparado',
  CLOSED: 'Cerrado',
  REJECTED: 'No procede',
  DUPLICATE: 'Ya estaba reportado',
};

export const MAINTENANCE_STATUS_VARIANT: Record<string, ChipVariant> = {
  NEW: 'info',
  TRIAGED: 'info',
  ASSIGNED: 'warning',
  IN_PROGRESS: 'warning',
  ON_HOLD: 'warning',
  RESOLVED: 'success',
  CLOSED: 'neutral',
  REJECTED: 'error',
  DUPLICATE: 'neutral',
};

export const MAINTENANCE_PRIORITY_LABEL: Record<string, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
};

/** Estados en los que el ticket sigue siendo trabajo pendiente de alguien. */
export const OPEN_STATUSES: MaintenanceTicketStatus[] = [
  'NEW',
  'TRIAGED',
  'ASSIGNED',
  'IN_PROGRESS',
  'ON_HOLD',
];

export const isOpenTicket = (ticket: MaintenanceTicket): boolean =>
  OPEN_STATUSES.includes(ticket.status);

/**
 * Dónde queda el daño, en una línea.
 *
 * El orden va de lo más preciso a lo más vago: el punto señalizado es exacto,
 * la referencia escrita es lo que alcanzó a contar quien reportó.
 */
export function locationLabel(ticket: MaintenanceTicket): string {
  if (ticket.locationTag?.name) return ticket.locationTag.name;
  if (ticket.amenity?.name) return ticket.amenity.name;

  const parts: string[] = [];
  if (ticket.building?.name) parts.push(ticket.building.name);
  if (ticket.floor != null) {
    parts.push(ticket.floor < 0 ? `Sótano ${Math.abs(ticket.floor)}` : `Piso ${ticket.floor}`);
  }
  if (ticket.locationText) parts.push(ticket.locationText);

  return parts.length ? parts.join(' · ') : 'Zona común';
}

/**
 * ¿Se le pasó el plazo?
 *
 * Solo cuenta mientras el ticket siga abierto: un ticket reparado tarde ya no
 * es una alarma, es historia, y pintarlo en rojo para siempre solo asusta.
 */
export function isOverdue(ticket: MaintenanceTicket): boolean {
  if (!isOpenTicket(ticket)) return false;
  if (!ticket.slaDueAt) return false;
  return new Date(ticket.slaDueAt).getTime() < Date.now();
}

/** "hace 3 días", para que el residente vea cuánto lleva esperando. */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3_600_000);

  if (hours < 1) return 'hace minutos';
  if (hours < 24) return `hace ${hours} h`;

  const days = Math.floor(hours / 24);
  if (days === 1) return 'ayer';
  if (days < 30) return `hace ${days} días`;

  const months = Math.floor(days / 30);
  return months === 1 ? 'hace un mes' : `hace ${months} meses`;
}

export function formatDateTime(iso?: string | null): string {
  if (!iso) return '';
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Bogota',
  }).format(new Date(iso));
}
