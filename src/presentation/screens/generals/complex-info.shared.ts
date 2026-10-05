import type {
  ComplexContactCategory,
  ComplexDocumentCategory,
  ComplexScheduleCategory,
  ComplexScheduleSlot,
} from '../../../domain/responses/ComplexInfoResponseModel';

/** Secciones de documentos, en el orden en que se muestran. */
export const DOCUMENT_CATEGORY: Record<ComplexDocumentCategory, { label: string; icon: string }> = {
  COEXISTENCE_MANUAL: { label: 'Manual de convivencia', icon: 'menu-book' },
  BYLAWS: { label: 'Reglamento de propiedad horizontal', icon: 'gavel' },
  COMMON_AREA_RULES: { label: 'Normas de zonas comunes', icon: 'pool' },
  CIRCULARS: { label: 'Circulares y comunicados', icon: 'campaign' },
  ASSEMBLY_MINUTES: { label: 'Actas de asamblea y consejo', icon: 'groups' },
  FINANCIAL_REPORTS: { label: 'Estados financieros y presupuesto', icon: 'account-balance' },
  INSURANCE: { label: 'Pólizas y certificados', icon: 'verified-user' },
  FORMS: { label: 'Formatos y solicitudes', icon: 'assignment' },
  OTHER: { label: 'Otros documentos', icon: 'description' },
};

export const CONTACT_CATEGORY: Record<ComplexContactCategory, { label: string; icon: string }> = {
  ADMINISTRATION: { label: 'Administración', icon: 'business-center' },
  SECURITY: { label: 'Portería y seguridad', icon: 'security' },
  COUNCIL: { label: 'Consejo de administración', icon: 'groups' },
  MAINTENANCE: { label: 'Mantenimiento', icon: 'build' },
  EMERGENCY: { label: 'Emergencias', icon: 'local-hospital' },
  SERVICE: { label: 'Servicios', icon: 'handyman' },
  OTHER: { label: 'Otros', icon: 'contact-phone' },
};

/** "15 mar 2026". Una fecha sola (YYYY-MM-DD) se lee en local para no correr un día. */
export function formatDocDate(value?: string | null): string {
  if (!value) return '';
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`) : new Date(value);
  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
}

const RECENT_DAYS = 14;

/** Publicado o actualizado hace poco: se marca como "Nuevo". */
export function isRecent(value?: string | null): boolean {
  if (!value) return false;
  return Date.now() - new Date(value).getTime() < RECENT_DAYS * 24 * 60 * 60 * 1000;
}

export function formatFileSize(bytes?: number | null): string {
  if (!bytes) return '';
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`;
}

// ─── Horarios ────────────────────────────────────────────────────────────────

export const SCHEDULE_CATEGORY: Record<ComplexScheduleCategory, { label: string; icon: string }> = {
  ADMINISTRATION: { label: 'Administración', icon: 'business-center' },
  SECURITY: { label: 'Portería y seguridad', icon: 'security' },
  WASTE: { label: 'Basuras', icon: 'delete-outline' },
  RECYCLING: { label: 'Reciclaje', icon: 'recycling' },
  COMMON_AREA: { label: 'Zonas comunes', icon: 'pool' },
  SERVICE: { label: 'Servicios', icon: 'handyman' },
  OTHER: { label: 'Otro', icon: 'schedule' },
};

/** Lunes primero. 0 = domingo. */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

export const DAY_LABELS: Record<number, string> = {
  0: 'Domingo', 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado',
};

const DAY_MINUTES = 24 * 60;
const WEEK_MINUTES = 7 * DAY_MINUTES;
/** Bogotá es UTC-5 todo el año. Se calcula aparte de la zona del celular. */
const BOGOTA_OFFSET_MS = 5 * 60 * 60 * 1000;

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

export const isAllDay = (s: ComplexScheduleSlot) => s.openTime === '00:00' && s.closeTime === '23:59';

/** "8:00 a. m.", "12:00 m.", "5:30 p. m." */
export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  if (h === 12 && m === 0) return '12:00 m.';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${h < 12 ? 'a. m.' : 'p. m.'}`;
}

export function formatSlot(s: ComplexScheduleSlot): string {
  return isAllDay(s) ? 'Todo el día' : `${formatTime(s.openTime)} – ${formatTime(s.closeTime)}`;
}

/** Día de la semana (0 = domingo) en Bogotá. */
export function bogotaWeekday(now: Date = new Date()): number {
  return new Date(now.getTime() - BOGOTA_OFFSET_MS).getUTCDay();
}

/** Minutos de la semana que ocupa una franja; la que cruza la medianoche sigue al día siguiente. */
function ranges(slot: ComplexScheduleSlot): [number, number][] {
  const start = slot.dayOfWeek * DAY_MINUTES + toMinutes(slot.openTime);
  let end = slot.dayOfWeek * DAY_MINUTES + toMinutes(slot.closeTime);
  // 23:59 se lee como fin del día, para que "todo el día" no deje un minuto cerrado.
  if (slot.closeTime === '23:59') end += 1;
  if (end <= start) end += DAY_MINUTES;
  return end <= WEEK_MINUTES ? [[start, end]] : [[start, WEEK_MINUTES], [0, end - WEEK_MINUTES]];
}

export interface ScheduleStatus {
  open: boolean;
  /** "Cierra a las 5:00 p. m.", "Abre mañana a las 8:00 a. m."; null si no hay franjas. */
  detail: string | null;
}

const describeMoment = (minuteOfWeek: number, today: number) => {
  const m = ((minuteOfWeek % WEEK_MINUTES) + WEEK_MINUTES) % WEEK_MINUTES;
  const day = Math.floor(m / DAY_MINUTES);
  const mins = m % DAY_MINUTES;
  const time = formatTime(`${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`);
  if (day === today) return `hoy a las ${time}`;
  if (day === (today + 1) % 7) return `mañana a las ${time}`;
  return `el ${DAY_LABELS[day].toLowerCase()} a las ${time}`;
};

/** Si está abierto ahora (hora de Bogotá) y cuándo cambia. */
export function scheduleStatus(slots: ComplexScheduleSlot[], now: Date = new Date()): ScheduleStatus {
  if (slots.length === 0) return { open: false, detail: null };
  const local = new Date(now.getTime() - BOGOTA_OFFSET_MS);
  const today = local.getUTCDay();
  const nowMin = today * DAY_MINUTES + local.getUTCHours() * 60 + local.getUTCMinutes();

  // Franjas contiguas (domingo 22:00–24:00 + lunes 00:00–06:00) se unen para
  // anunciar el cierre real y no la medianoche.
  const all = slots.flatMap(ranges).sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const r of all) {
    const last = merged[merged.length - 1];
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
    else merged.push([...r]);
  }
  if (merged.length > 1 && merged[0][0] === 0 && merged[merged.length - 1][1] === WEEK_MINUTES) {
    const first = merged.shift()!;
    merged[merged.length - 1][1] = WEEK_MINUTES + first[1];
  }
  if (merged.length === 1 && merged[0][1] - merged[0][0] >= WEEK_MINUTES) {
    return { open: true, detail: 'Abierto las 24 horas' };
  }

  for (const [start, end] of merged) {
    for (const shift of [0, WEEK_MINUTES]) {
      if (nowMin + shift >= start && nowMin + shift < end) {
        return { open: true, detail: `Cierra ${describeMoment(end, today)}` };
      }
    }
  }
  const next = merged
    .map(([start]) => (start > nowMin ? start : start + WEEK_MINUTES))
    .sort((a, b) => a - b)[0];
  return { open: false, detail: `Abre ${describeMoment(next, today)}` };
}
