import apolloClient, { API_BASE_URL } from '../../data/lib/apollo/client';
import SecureStorageService from './SecureStorageService';
import {
  GET_LISTINGS,
  GET_LISTING,
  GET_MARKETPLACE_CATEGORIES,
  GET_MARKETPLACE_SETTINGS,
  REGISTER_LISTING_INTEREST,
  TOGGLE_LISTING_FAVORITE,
  REPORT_LISTING,
  PAUSE_LISTING,
  RESUME_LISTING,
  MARK_LISTING_AS_SOLD,
  RENEW_LISTING,
  REMOVE_LISTING,
} from '../../domain/graphql/marketplace.queries';
import { getApiErrorMessage } from '../utils/apiError';
import type { PhotoUpload } from '../../domain/interfaces/PhotoUpload';
import type {
  Listing,
  ListingCategory,
  ListingFilters,
  ListingPage,
  MarketplaceSettings,
  ReportReason,
} from '../../domain/responses/MarketplaceResponseModel';

/**
 * Todo va con `network-only`: la vitrina cambia por lo que publican los demás
 * vecinos, y un aviso propio recién creado tiene que aparecer de inmediato.
 */
const PAGE_SIZE = 20;

export async function fetchListings(
  complexId: string,
  page = 1,
  filters?: ListingFilters,
): Promise<ListingPage> {
  const { data } = await apolloClient.query<{
    marketplaceListings: ListingPage;
  }>({
    query: GET_LISTINGS,
    variables: { complexId, pagination: { page, limit: PAGE_SIZE }, filters },
    fetchPolicy: 'network-only',
  });

  return (
    data?.marketplaceListings ?? {
      items: [],
      pagination: { currentPage: 1, totalPages: 1, hasNextPage: false },
    }
  );
}

export async function fetchListing(listingId: string): Promise<Listing> {
  const { data } = await apolloClient.query<{
    marketplaceListing: Listing;
  }>({
    query: GET_LISTING,
    variables: { listingId },
    fetchPolicy: 'network-only',
  });
  return data!.marketplaceListing;
}

export async function fetchCategories(
  complexId: string,
): Promise<ListingCategory[]> {
  const { data } = await apolloClient.query<{
    marketplaceCategories: ListingCategory[];
  }>({
    query: GET_MARKETPLACE_CATEGORIES,
    variables: { complexId },
    fetchPolicy: 'network-only',
  });
  return data?.marketplaceCategories ?? [];
}

/**
 * Los ajustes del conjunto. Con el módulo apagado el servidor responde con
 * error, y eso es justamente lo que le dice a la app que no debe mostrar la
 * vitrina: no hay una consulta aparte para preguntarlo.
 */
export async function fetchSettings(
  complexId: string,
): Promise<MarketplaceSettings> {
  const { data } = await apolloClient.query<{
    marketplaceSettings: MarketplaceSettings;
  }>({
    query: GET_MARKETPLACE_SETTINGS,
    variables: { complexId },
    fetchPolicy: 'network-only',
  });
  return data!.marketplaceSettings;
}

// ─── Interacciones sobre el aviso de otro ────────────────────────────────────

export async function registerInterest(
  listingId: string,
  message?: string,
): Promise<Listing> {
  const { data, error } = await apolloClient.mutate<{
    registerListingInterest: Listing;
  }>({
    mutation: REGISTER_LISTING_INTEREST,
    variables: { input: { listingId, message } },
  });
  if (error) {
    throw new Error(getApiErrorMessage(error, 'No se pudo enviar tu interés'));
  }
  return data!.registerListingInterest;
}

/** Devuelve true si quedó guardada como favorita. */
export async function toggleFavorite(listingId: string): Promise<boolean> {
  const { data, error } = await apolloClient.mutate<{
    toggleListingFavorite: boolean;
  }>({
    mutation: TOGGLE_LISTING_FAVORITE,
    variables: { listingId },
  });
  if (error) {
    throw new Error(getApiErrorMessage(error, 'No se pudo guardar'));
  }
  return data!.toggleListingFavorite;
}

export async function reportListing(
  listingId: string,
  reason: ReportReason,
  comment?: string,
): Promise<void> {
  const { error } = await apolloClient.mutate({
    mutation: REPORT_LISTING,
    variables: { input: { listingId, reason, comment } },
  });
  if (error) {
    throw new Error(getApiErrorMessage(error, 'No se pudo enviar el reporte'));
  }
}

// ─── Sobre los avisos propios ────────────────────────────────────────────────

const mutateListing = async (
  mutation: typeof PAUSE_LISTING,
  key: string,
  listingId: string,
  fallback: string,
): Promise<Listing> => {
  const { data, error } = await apolloClient.mutate<Record<string, Listing>>({
    mutation,
    variables: { listingId },
  });
  if (error) throw new Error(getApiErrorMessage(error, fallback));
  return data![key];
};

export const pauseListing = (listingId: string) =>
  mutateListing(PAUSE_LISTING, 'pauseListing', listingId, 'No se pudo ocultar');

export const resumeListing = (listingId: string) =>
  mutateListing(
    RESUME_LISTING,
    'resumeListing',
    listingId,
    'No se pudo publicar de nuevo',
  );

export const markListingAsSold = (listingId: string) =>
  mutateListing(
    MARK_LISTING_AS_SOLD,
    'markListingAsSold',
    listingId,
    'No se pudo cerrar el aviso',
  );

export const renewListing = (listingId: string) =>
  mutateListing(RENEW_LISTING, 'renewListing', listingId, 'No se pudo renovar');

export async function removeListing(
  listingId: string,
  reason?: string,
): Promise<boolean> {
  const { data, error } = await apolloClient.mutate<{
    removeListing: boolean;
  }>({
    mutation: REMOVE_LISTING,
    variables: { listingId, reason },
  });
  if (error) throw new Error(getApiErrorMessage(error, 'No se pudo retirar'));
  return data!.removeListing;
}

// ─── Publicar (REST, porque lleva fotos) ─────────────────────────────────────

export interface CreateListingInput {
  complexId: string;
  type: string;
  categoryId: string;
  title: string;
  description: string;
  priceType: string;
  priceAmount?: number;
  condition?: string;
  contactPreference?: string;
  showPhone?: boolean;
  acceptTerms: boolean;
}

/**
 * Publica el aviso con sus fotos.
 *
 * Va por REST y no por GraphQL porque las fotos viajan como archivo, y en este
 * proyecto GraphQL no recibe multipart. El backend sube a R2 y borra lo subido
 * si el aviso no queda guardado, así que aquí no hay nada que limpiar.
 *
 * Los booleanos se mandan como texto —en multipart todo es texto— y el servidor
 * los interpreta: `"false"` es una cadena no vacía y, sin esa conversión, sería
 * verdadera.
 */
export async function createListing(
  input: CreateListingInput,
  photos: PhotoUpload[],
): Promise<Listing> {
  const form = new FormData();

  Object.entries(input).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    form.append(key, String(value));
  });

  photos.forEach(photo => {
    form.append('images', {
      uri: photo.uri,
      type: photo.type,
      name: photo.name,
    } as unknown as Blob);
  });

  const tokens = await SecureStorageService.getTokens();

  const response = await fetch(`${API_BASE_URL}/api/v1/marketplace/listings`, {
    method: 'POST',
    headers: tokens?.accessToken
      ? { Authorization: `Bearer ${tokens.accessToken}` }
      : {},
    body: form,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as {
      message?: string | string[];
    };
    const message = Array.isArray(payload.message)
      ? payload.message.join('\n')
      : payload.message;
    throw new Error(message ?? 'No se pudo publicar el aviso');
  }

  return (await response.json()) as Listing;
}
