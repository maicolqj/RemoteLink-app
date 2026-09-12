import type { Pqrf, PqrfAddressee, PqrfStatus, PqrfType } from '../../../domain/responses/PqrfResponseModel';

/** Cómo se llama cada tipo de radicado en pantalla. */
export const PQRF_TYPE_LABEL: Record<string, string> = {
  PETICION:     'Petición',
  QUEJA:        'Queja',
  RECLAMO:      'Reclamo',
  SUGERENCIA:   'Sugerencia',
  FELICITACION: 'Felicitación',
};

/** El orden en que se ofrecen: lo más frecuente primero. */
export const PQRF_TYPES: PqrfType[] = [
  'PETICION', 'QUEJA', 'RECLAMO', 'SUGERENCIA', 'FELICITACION',
];

/**
 * A quién se dirige, con la explicación que el residente necesita para elegir
 * bien: la diferencia entre administración y consejo no es obvia, y elegir mal
 * es que su queja la lea justamente aquel de quien se queja.
 */
export const PQRF_ADDRESSEES: { value: PqrfAddressee; label: string; hint: string }[] = [
  {
    value: 'ADMINISTRACION',
    label: 'Administración',
    hint: 'Lo del día a día: portería, aseo, zonas comunes, cuentas.',
  },
  {
    value: 'CONSEJO',
    label: 'Consejo de administración',
    hint: 'Lo que no quieres que lea la administración, incluida una queja sobre ella.',
  },
  {
    value: 'AMBOS',
    label: 'Ambos',
    hint: 'Lo verán las dos instancias y cada una responde por separado.',
  },
];

export const PQRF_ADDRESSEE_LABEL: Record<string, string> = {
  ADMINISTRACION: 'Administración',
  CONSEJO:        'Consejo',
  AMBOS:          'Administración y consejo',
};

export const PQRF_STATUS_LABEL: Record<string, string> = {
  RADICADO:   'Radicado',
  EN_TRAMITE: 'En trámite',
  RESUELTO:   'Resuelto',
};

/** Color de la pastilla de estado. Se resuelve contra el tema en la pantalla. */
export const PQRF_STATUS_TONE: Record<string, 'info' | 'warning' | 'success' | 'muted'> = {
  RADICADO:   'info',
  EN_TRAMITE: 'warning',
  RESUELTO:   'success',
};

/**
 * Lo que el residente necesita leer cuando su radicado queda resuelto: la
 * respuesta formal no vive en la app, viaja por correo desde la administración.
 */
export const PQRF_RESOLVED_NOTE =
  'Este radicado fue marcado como resuelto. La respuesta debió llegar al correo que tienes '
  + 'registrado en la administración; si no la ves, revisa el correo no deseado o acércate a la oficina.';

/**
 * Cuando se venció el plazo sin que nadie respondiera. La ley resuelve a favor
 * de quien radicó, y el residente tiene que saber que eso NO es una respuesta.
 */
export const PQRF_SILENCE_NOTE =
  'Se venció el plazo que tenía el complejo para responder, así que este radicado quedó resuelto '
  + 'a tu favor por silencio administrativo positivo. Nadie te respondió: si el asunto sigue sin '
  + 'resolverse, puedes radicarlo de nuevo o llevarlo a la asamblea.';

/** "Quedan 3 días de plazo" / "Plazo vencido" — el plazo como lo lee el residente. */
export function pqrfDueLabel(dueAt: string): string {
  const hoursLeft = (new Date(dueAt).getTime() - Date.now()) / 3_600_000;

  if (hoursLeft <= 0) return 'Plazo vencido';
  if (hoursLeft < 48) return `Quedan ${Math.round(hoursLeft)} h de plazo`;
  return `Quedan ${Math.round(hoursLeft / 24)} días de plazo`;
}

/**
 * "Torre 2 · Apto 301" — de dónde viene el radicado. En un conjunto con varias
 * torres el número solo no dice nada: todas tienen un 301. A la torre que se
 * llama solo "2" se le antepone la palabra; a "Torre Norte", no.
 */
export function pqrfUnitLabel(unit?: Pqrf['unit']): string | null {
  if (!unit?.number) return null;

  const building = unit.building?.name?.trim();
  if (!building) return `Unidad ${unit.number}`;

  const tower = /^\d+[a-z]?$/i.test(building) ? `Torre ${building}` : building;
  return `${tower} · Apto ${unit.number}`;
}

/** "12 sep, 03:40 p. m." — cuándo quedó radicado. */
export function pqrfWhen(iso: string): string {
  return new Date(iso).toLocaleString('es-CO', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

export type { PqrfStatus };
