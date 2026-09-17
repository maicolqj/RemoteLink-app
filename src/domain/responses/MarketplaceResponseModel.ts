export type ListingType =
  | 'PRODUCT'
  | 'SERVICE'
  | 'RENTAL'
  | 'GIVEAWAY'
  | 'WANTED';

export type ListingStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'PUBLISHED'
  | 'REJECTED'
  | 'PAUSED'
  | 'SOLD'
  | 'EXPIRED'
  | 'REMOVED';

export type PriceType =
  | 'FIXED'
  | 'NEGOTIABLE'
  | 'FREE'
  | 'EXCHANGE'
  | 'ON_REQUEST';

export type ItemCondition = 'NEW' | 'LIKE_NEW' | 'USED' | 'FOR_PARTS';

export type ContactPreference = 'IN_APP' | 'PHONE' | 'WHATSAPP';

export type ModerationMode = 'AUTO' | 'PREVIA';

export type ReportReason =
  | 'PROHIBITED_ITEM'
  | 'SCAM'
  | 'OFFENSIVE'
  | 'WRONG_CATEGORY'
  | 'DUPLICATE'
  | 'ALREADY_SOLD'
  | 'OTHER';

export interface ListingCategory {
  id: string;
  name: string;
  icon?: string | null;
}

/**
 * Cómo contactar a quien publicó, ya resuelto por el servidor.
 *
 * `phone` llega nulo cuando su dueño no lo destapó o cuando el conjunto apagó
 * el canal. Si viene nulo no existe para la app: no hay nada que recomponer.
 */
export interface ListingContact {
  displayName: string;
  unitLabel?: string | null;
  preference: ContactPreference;
  phone?: string | null;
  inAppOnly: boolean;
}

export interface Listing {
  id: string;
  type: ListingType;
  title: string;
  description: string;
  condition?: ItemCondition | null;
  imageUrls: string[];
  priceAmount?: number | null;
  priceType: PriceType;
  currency: string;
  contactPreference: ContactPreference;
  showPhone: boolean;
  status: ListingStatus;
  rejectionReason?: string | null;
  publishedAt?: string | null;
  expiresAt?: string | null;
  viewsCount: number;
  contactsCount: number;
  favoritesCount: number;
  createdAt: string;
  categoryId: string;
  category?: ListingCategory | null;
  unit?: {
    id: string;
    number: string;
    building?: { id: string; name: string } | null;
  } | null;
  contact?: ListingContact | null;
  /** Los tres los calcula el servidor para QUIEN consulta. */
  viewerHasFavorited: boolean;
  viewerHasContacted: boolean;
  viewerIsOwner: boolean;
}

export interface ListingPage {
  items: Listing[];
  pagination: {
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
  };
}

export interface MarketplaceSettings {
  complexId: string;
  moderationMode: ModerationMode;
  listingDurationDays: number;
  maxActiveListingsPerUnit: number;
  maxImagesPerListing: number;
  allowPhoneContact: boolean;
  allowWantedListings: boolean;
  termsText?: string | null;
}

export interface ListingFilters {
  search?: string;
  type?: ListingType;
  categoryId?: string;
  onlyMine?: boolean;
  onlyFavorites?: boolean;
}
