export type PqrfType = 'PETICION' | 'QUEJA' | 'RECLAMO' | 'SUGERENCIA' | 'FELICITACION';
export type PqrfAddressee = 'ADMINISTRACION' | 'CONSEJO' | 'AMBOS';
export type PqrfStatus = 'RADICADO' | 'EN_TRAMITE' | 'RESUELTO';

/** Paso de un destinatario sobre el radicado. */
export interface PqrfAcknowledgement {
  id: string;
  userId: string;
  userName?: string | null;
  instance: PqrfAddressee | string;
  openedAt: string;
  resolvedAt?: string | null;
}

/** Radicado de un residente hacia la administración, el consejo o ambos. */
export interface Pqrf {
  id: string;
  code: string;
  type: PqrfType | string;
  /** A quién se dirigió: define también quién puede leerlo. */
  addressee: PqrfAddressee | string;
  status: PqrfStatus | string;
  subject: string;
  description: string;
  requestedByName?: string | null;
  unitId?: string | null;
  unit?: {
    id: string;
    number: string;
    building?: { id: string; name: string } | null;
  } | null;
  /** Quien consulta puede marcarlo como resuelto. Solo viene en la ficha. */
  viewerCanResolve?: boolean;
  /** Es del consejo pero la administración designó a otros para responder. */
  viewerIsCouncilObserver?: boolean;
  /** Quién lo abrió y quién ya lo dio por resuelto. Solo viene en la ficha. */
  acknowledgements?: PqrfAcknowledgement[] | null;
  /** Cuándo quedó resuelto por todos los destinatarios. */
  resolvedAt?: string | null;
  /** Hasta cuándo tiene el complejo para resolverlo. */
  dueAt: string;
  /** Se resolvió solo al vencerse el plazo, a favor de quien radicó. */
  resolvedBySilence: boolean;
  createdAt: string;
}

export interface PqrfPage {
  items: Pqrf[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
  };
}
