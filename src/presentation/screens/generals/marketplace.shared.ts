import type {
  ItemCondition,
  Listing,
  ListingStatus,
  ListingType,
  PriceType,
  ReportReason,
} from '../../../domain/responses/MarketplaceResponseModel';

export const LISTING_TYPE_LABEL: Record<string, string> = {
  PRODUCT: 'Venta',
  SERVICE: 'Servicio',
  RENTAL: 'Arriendo',
  GIVEAWAY: 'Se regala',
  WANTED: 'Busco',
};

/** El orden en que se ofrecen al publicar: lo más frecuente primero. */
export const LISTING_TYPES: ListingType[] = [
  'PRODUCT',
  'SERVICE',
  'RENTAL',
  'GIVEAWAY',
  'WANTED',
];

export const PRICE_TYPE_LABEL: Record<string, string> = {
  FIXED: 'Precio fijo',
  NEGOTIABLE: 'Negociable',
  FREE: 'Gratis',
  EXCHANGE: 'Permuta',
  ON_REQUEST: 'A convenir',
};

export const PRICE_TYPES: PriceType[] = [
  'FIXED',
  'NEGOTIABLE',
  'FREE',
  'EXCHANGE',
  'ON_REQUEST',
];

/** Los que exigen monto. El servidor rechaza un precio fijo sin número. */
export const PRICE_TYPES_WITH_AMOUNT: PriceType[] = ['FIXED', 'NEGOTIABLE'];

export const CONDITION_LABEL: Record<string, string> = {
  NEW: 'Nuevo',
  LIKE_NEW: 'Como nuevo',
  USED: 'Usado',
  FOR_PARTS: 'Para repuestos',
};

export const CONDITIONS: ItemCondition[] = [
  'NEW',
  'LIKE_NEW',
  'USED',
  'FOR_PARTS',
];

export const LISTING_STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Borrador',
  PENDING_REVIEW: 'En revisión',
  PUBLISHED: 'Publicado',
  REJECTED: 'No aprobado',
  PAUSED: 'Oculto',
  SOLD: 'Cerrado',
  EXPIRED: 'Vencido',
  REMOVED: 'Retirado',
};

/** Tono de la pastilla. Se resuelve contra el tema en cada pantalla. */
export const LISTING_STATUS_TONE: Record<
  string,
  'info' | 'warning' | 'success' | 'danger' | 'muted'
> = {
  DRAFT: 'muted',
  PENDING_REVIEW: 'warning',
  PUBLISHED: 'success',
  REJECTED: 'danger',
  PAUSED: 'warning',
  SOLD: 'info',
  EXPIRED: 'muted',
  REMOVED: 'muted',
};

export const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'PROHIBITED_ITEM', label: 'Está prohibido en el conjunto' },
  { value: 'SCAM', label: 'Parece una estafa' },
  { value: 'OFFENSIVE', label: 'Contenido ofensivo' },
  { value: 'ALREADY_SOLD', label: 'Ya se vendió' },
  { value: 'DUPLICATE', label: 'Está repetido' },
  { value: 'WRONG_CATEGORY', label: 'Categoría equivocada' },
  { value: 'OTHER', label: 'Otro motivo' },
];

/**
 * El precio en una línea.
 *
 * "Sin precio" y "gratis" no son lo mismo: `ON_REQUEST` invita a preguntar,
 * `FREE` dice que no se cobra nada. Confundirlos es la primera queja que llega.
 */
export function listingPrice(listing: Listing): string {
  switch (listing.priceType) {
    case 'FREE':
      return 'Gratis';
    case 'EXCHANGE':
      return 'Permuta';
    case 'ON_REQUEST':
      return 'A convenir';
    default:
      break;
  }

  if (listing.priceAmount === null || listing.priceAmount === undefined) {
    return 'A convenir';
  }

  const amount = `$${listing.priceAmount.toLocaleString('es-CO')}`;
  return listing.priceType === 'NEGOTIABLE' ? `${amount} · negociable` : amount;
}

export const listingUnitLabel = (listing: Listing): string | null => {
  const unit = listing.unit;
  if (!unit) return null;
  return [unit.building?.name, unit.number].filter(Boolean).join(' · ');
};

/** Días que le quedan de vigencia. Negativo si ya venció. */
export const daysUntilExpiry = (listing: Listing): number | null => {
  if (!listing.expiresAt) return null;
  return Math.ceil(
    (new Date(listing.expiresAt).getTime() - Date.now()) / 86_400_000,
  );
};

export const expiryLabel = (listing: Listing): string | null => {
  const days = daysUntilExpiry(listing);
  if (days === null) return null;
  if (days < 0) return 'Venció';
  if (days === 0) return 'Vence hoy';
  if (days === 1) return 'Vence mañana';
  if (days <= 7) return `Vence en ${days} días`;
  return null;
};

export const listingWhen = (iso: string): string =>
  new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

/**
 * Qué se le explica al residente antes de publicar, según la política del
 * conjunto: con revisión previa su aviso no sale hasta que lo aprueben, y
 * decírselo después es lo que genera el "¿por qué no aparece?".
 */
export const moderationHint = (mode?: string): string =>
  mode === 'AUTO'
    ? 'Tu aviso saldrá publicado de inmediato.'
    : 'La administración revisa el aviso antes de publicarlo. Te avisamos cuando quede visible.';

export const canEditStatus = (status: ListingStatus): boolean =>
  status === 'DRAFT' ||
  status === 'PENDING_REVIEW' ||
  status === 'REJECTED' ||
  status === 'PUBLISHED' ||
  status === 'PAUSED';

/**
 * Qué pasa al guardar una corrección.
 *
 * Con moderación previa un aviso ya publicado vuelve a la cola y desaparece de
 * la vitrina hasta que lo aprueben: decírselo antes de guardar es lo que evita
 * el "¿por qué se borró mi aviso?".
 */
export const editModerationHint = (
  mode?: string,
  status?: ListingStatus,
): string => {
  if (mode === 'AUTO') return 'Los cambios quedan visibles de inmediato.';
  if (status === 'PUBLISHED') {
    return 'Al guardar, la administración revisa el aviso otra vez y deja de verse en la vitrina hasta que lo apruebe.';
  }
  return 'La administración revisa el aviso antes de publicarlo. Te avisamos cuando quede visible.';
};
