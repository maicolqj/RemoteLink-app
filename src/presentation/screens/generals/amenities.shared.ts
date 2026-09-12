import type { StatusBadgeCfg } from '../../components/VisitStatusBadge';
import type { Amenity, AmenitySchedule } from '../../store/amenities.store';

/** Etiquetas, íconos y formateo compartidos por las pantallas de zonas comunes. */

export const AMENITY_TYPE_LABEL: Record<string, string> = {
  SALON_COMUNAL:   'Salón comunal',
  ZONA_BBQ:        'Zona BBQ',
  PISCINA:         'Piscina',
  GIMNASIO:        'Gimnasio',
  CANCHA:          'Cancha',
  COWORKING:       'Coworking',
  SAUNA:           'Sauna',
  TERRAZA:         'Terraza',
  PARQUE_INFANTIL: 'Parque infantil',
  TEATRINO:        'Teatrino',
  OTRO:            'Zona común',
};

export const AMENITY_ICON: Record<string, string> = {
  SALON_COMUNAL:   'celebration',
  ZONA_BBQ:        'outdoor-grill',
  PISCINA:         'pool',
  GIMNASIO:        'fitness-center',
  CANCHA:          'sports-soccer',
  COWORKING:       'laptop',
  SAUNA:           'hot-tub',
  TERRAZA:         'balcony',
  PARQUE_INFANTIL: 'toys',
  TEATRINO:        'theaters',
  OTRO:            'deck',
};

export const BOOKING_STATUS_CFG: Record<string, StatusBadgeCfg> = {
  PENDING:    { label: 'Por aprobar', color: '#F59E0B', bg: 'rgba(245,158,11,0.18)' },
  APPROVED:   { label: 'Aprobada',    color: '#10B981', bg: 'rgba(16,185,129,0.18)' },
  CHECKED_IN: { label: 'En uso',      color: '#3B82F6', bg: 'rgba(59,130,246,0.18)' },
  COMPLETED:  { label: 'Finalizada',  color: '#6B7280', bg: 'rgba(107,114,128,0.18)' },
  REJECTED:   { label: 'Rechazada',   color: '#EF4444', bg: 'rgba(239,68,68,0.18)' },
  CANCELLED:  { label: 'Cancelada',   color: '#6B7280', bg: 'rgba(107,114,128,0.18)' },
  NO_SHOW:    { label: 'No asististe', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  EXPIRED:    { label: 'Vencida',     color: '#6B7280', bg: 'rgba(107,114,128,0.18)' },
};

const DAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0,
  }).format(amount ?? 0);
}

/** "Gratis" o el precio, aclarando cuando se cobra por hora. */
export function priceLabel(amenity: Amenity): string {
  if (String(amenity.feeType) === 'FREE' || !amenity.feeAmount) return 'Gratis';
  const money = formatMoney(amenity.feeAmount);
  return String(amenity.feeType) === 'PER_HOUR' ? `${money}/h` : money;
}

/** "Lun, Mar, Sáb" con los días que la zona abre. Vacío si no tiene horario. */
export function openDaysLabel(schedules?: AmenitySchedule[] | null): string {
  const days = [...new Set((schedules ?? []).filter(s => s.isActive).map(s => s.dayOfWeek))].sort();
  return days.map(d => DAY_SHORT[d]).join(', ');
}

/** "HH:mm" de una fecha ISO, en hora local. */
export function timeOf(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** "sáb, 06 sep · 14:00" — el instante completo, con su día. */
export function momentLabel(iso: string): string {
  const date = new Date(iso).toLocaleDateString('es-CO', {
    weekday: 'short', day: '2-digit', month: 'short',
  });
  return `${date} · ${timeOf(iso)}`;
}

/** "YYYY-MM-DD" en hora local — el formato que espera el backend. */
export function localDateKey(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** "sáb, 12 sep" para las pastillas del selector de día. */
export function dayChipLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-CO', {
    weekday: 'short', day: '2-digit', month: 'short',
  });
}

/**
 * Cómo se describe una reserva ya hecha. En zonas por jornadas las horas no
 * aportan —el rango cae en fronteras de día— así que se muestran los días que
 * el residente realmente ocupa; el último es el anterior al fin exclusivo.
 */
export function bookingWhenLabel(
  startAt: string,
  endAt: string,
  durationUnit?: string | null,
): string {
  const start = new Date(startAt);
  const end = new Date(endAt);
  const dateFmt: Intl.DateTimeFormatOptions = { weekday: 'short', day: '2-digit', month: 'short' };

  if (String(durationUnit) === 'DAYS') {
    const lastDay = new Date(end.getTime() - 1);
    const from = start.toLocaleDateString('es-CO', dateFmt);
    const to = lastDay.toLocaleDateString('es-CO', dateFmt);
    return from === to ? from : `${from} — ${to}`;
  }

  const from = start.toLocaleDateString('es-CO', dateFmt);
  const to = end.toLocaleDateString('es-CO', dateFmt);

  // Una reserva por horas puede cruzar la medianoche —el salón que se toma el
  // sábado a las 2 p. m. y se entrega el domingo a esa hora—, y sin la fecha
  // del final "14:00 – 14:00" parece un error.
  return from === to
    ? `${from} · ${timeOf(startAt)} – ${timeOf(endAt)}`
    : `${from} ${timeOf(startAt)} – ${to} ${timeOf(endAt)}`;
}

/** Motivos por los que un día aparece cerrado, en palabras del residente. */
export const CLOSED_REASON_LABEL: Record<string, string> = {
  SIN_HORARIO:      'La zona no abre este día',
  BLOQUEADA:        'Bloqueada por la administración',
  ZONA_INACTIVA:    'La zona no está disponible',
  FUERA_DE_VENTANA: 'Todavía no se puede reservar para esta fecha',
};

/**
 * Explica por qué NINGÚN día del rango admite reserva.
 *
 * No basta con mirar el primer día: si el rango empieza dentro de la ventana de
 * anticipación, los primeros días dirán FUERA_DE_VENTANA aunque el problema de
 * fondo sea que la zona no tiene horario. Se elige el motivo que se repite en
 * más días, y la anticipación solo gana si es el único.
 */
export function summarizeClosedReason(
  days: { isOpen: boolean; closedReason?: string | null; slots: { isAvailable: boolean }[] }[],
): string {
  if (days.length === 0) return 'La zona no tiene cupos disponibles en los próximos días';

  const counts = new Map<string, number>();
  for (const d of days) {
    if (d.isOpen) continue;
    const reason = d.closedReason ?? 'DESCONOCIDO';
    counts.set(reason, (counts.get(reason) ?? 0) + 1);
  }

  // Días abiertos pero con todo el cupo tomado: no es un problema de horario.
  const openButFull = days.filter(d => d.isOpen && !d.slots.some(s => s.isAvailable)).length;
  if (counts.size === 0 && openButFull > 0) {
    return 'Todas las franjas de los próximos días ya están reservadas';
  }

  const ranked = [...counts.entries()]
    // La anticipación mínima afecta siempre a los primeros días, así que pesa
    // menos: si hay otro motivo, ese es el que explica de verdad.
    .sort((a, b) => (b[1] - a[1]) || (a[0] === 'FUERA_DE_VENTANA' ? 1 : -1));

  const [reason] = ranked[0] ?? [];
  if (!reason) return 'La zona no tiene cupos disponibles en los próximos días';

  const label = CLOSED_REASON_LABEL[reason] ?? 'La zona no tiene cupos disponibles';
  return openButFull > 0 ? `${label}. El resto de días ya está reservado` : label;
}


/**
 * Divide una ventana abierta en instantes elegibles cada `stepMinutes`.
 *
 * En modo RANGE el backend no entrega franjas: entrega la ventana y el residente
 * arma su rango. Ofrecer un selector continuo obligaría a un date-picker; una
 * rejilla de medias horas cubre el caso real y deja el rango dentro de la
 * ventana por construcción, sin que el cliente tenga que replicar reglas.
 */
export function windowSteps(
  startAtIso: string,
  endAtIso: string,
  stepMinutes = 30,
): string[] {
  const start = new Date(startAtIso).getTime();
  const end = new Date(endAtIso).getTime();
  const step = stepMinutes * 60 * 1000;
  const out: string[] = [];
  for (let t = start; t <= end; t += step) out.push(new Date(t).toISOString());
  return out;
}

/** "12:00" o "05:00 (+1)" cuando el instante cae al día siguiente del inicio. */
export function stepLabel(iso: string, windowStartIso: string): string {
  const d = new Date(iso);
  const start = new Date(windowStartIso);
  const nextDay = d.getDate() !== start.getDate();
  return `${timeOf(iso)}${nextDay ? ' (+1)' : ''}`;
}


/**
 * Une las ventanas que se tocan: el cierre de una es la apertura de la
 * siguiente. Una zona abierta las 24 horas entrega una ventana por cada día,
 * y sin unirlas una reserva no podría pasar de la medianoche aunque la zona
 * nunca cierre.
 */
export function mergeWindows(
  windows: { startAt: string; endAt: string }[],
): { startAt: string; endAt: string }[] {
  const sorted = [...windows].sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
  );
  const out: { startAt: string; endAt: string }[] = [];

  for (const w of sorted) {
    const last = out[out.length - 1];
    if (last && new Date(w.startAt).getTime() <= new Date(last.endAt).getTime()) {
      if (new Date(w.endAt).getTime() > new Date(last.endAt).getTime()) last.endAt = w.endAt;
    } else {
      out.push({ startAt: w.startAt, endAt: w.endAt });
    }
  }

  return out;
}


/**
 * Resta de las ventanas abiertas los tramos que ya no tienen cupo. Lo que queda
 * es lo que el residente todavía puede pedir, y sirve para saber si un día está
 * lleno antes de que lo toque.
 */
export function freeSegments(
  windows: { startAt: string; endAt: string }[],
  taken: { startAt: string; endAt: string }[],
): { startAt: string; endAt: string }[] {
  const ms = (iso: string) => new Date(iso).getTime();
  let result = windows.map(w => ({ startAt: w.startAt, endAt: w.endAt }));

  for (const cut of taken) {
    const next: { startAt: string; endAt: string }[] = [];

    for (const w of result) {
      // Sin cruce: la ventana sobrevive intacta.
      if (ms(cut.endAt) <= ms(w.startAt) || ms(cut.startAt) >= ms(w.endAt)) {
        next.push(w);
        continue;
      }
      if (ms(cut.startAt) > ms(w.startAt)) next.push({ startAt: w.startAt, endAt: cut.startAt });
      if (ms(cut.endAt)   < ms(w.endAt))   next.push({ startAt: cut.endAt,  endAt: w.endAt });
    }

    result = next;
  }

  return result;
}

/**
 * La política de cancelación en una frase, tal como la lee el residente antes
 * de reservar. Sin plazo o sin tarifa que retener, no hay nada que advertir.
 */
export function cancellationPolicyLabel(amenity: {
  cancellationDeadlineDays: number;
  cancellationDeadlineHours: number;
  lateCancellationFeePercent: number;
  feeType?: string | null;
}): string | null {
  const hours = amenity.cancellationDeadlineDays * 24 + amenity.cancellationDeadlineHours;
  const noFee = String(amenity.feeType) === 'FREE' || amenity.lateCancellationFeePercent === 0;

  if (hours === 0) return noFee ? null : 'Puedes cancelar en cualquier momento sin costo.';

  const when = hours % 24 === 0
    ? `${hours / 24} ${hours === 24 ? 'día' : 'días'}`
    : `${hours} horas`;

  return noFee
    ? `Cancelación gratuita hasta ${when} antes del inicio.`
    : `Cancelación gratuita hasta ${when} antes; después se retiene el ${amenity.lateCancellationFeePercent}% de la tarifa.`;
}

/** Minutos entre dos instantes ISO. */
export function minutesBetween(fromIso: string, toIso: string): number {
  return (new Date(toIso).getTime() - new Date(fromIso).getTime()) / 60000;
}
