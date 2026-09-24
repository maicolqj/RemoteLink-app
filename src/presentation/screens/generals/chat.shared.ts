const DAY_MS = 86_400_000;

const startOfDay = (date: Date): number =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

/**
 * La hora de un chat como la muestra cualquier app de mensajes: la hora si es
 * de hoy, "ayer", el día de la semana si fue esta semana, y la fecha si es
 * más viejo.
 */
export function chatTime(iso: string): string {
  const date = new Date(iso);
  const days = Math.round((startOfDay(new Date()) - startOfDay(date)) / DAY_MS);

  if (days <= 0) {
    return date.toLocaleTimeString('es-CO', {
      hour: 'numeric',
      minute: '2-digit',
    });
  }
  if (days === 1) return 'ayer';
  if (days < 7) {
    return date.toLocaleDateString('es-CO', { weekday: 'long' });
  }
  return date.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
}

/** La hora dentro de la burbuja. */
export function bubbleTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-CO', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** El separador de día entre mensajes: "Hoy", "Ayer" o la fecha. */
export function dayLabel(iso: string): string {
  const date = new Date(iso);
  const days = Math.round((startOfDay(new Date()) - startOfDay(date)) / DAY_MS);

  if (days <= 0) return 'Hoy';
  if (days === 1) return 'Ayer';
  return date.toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export const sameDay = (a: string, b: string): boolean =>
  startOfDay(new Date(a)) === startOfDay(new Date(b));
