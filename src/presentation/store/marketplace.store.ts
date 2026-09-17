import { create } from 'zustand';

import {
  fetchCategories,
  fetchListings,
  fetchSettings,
  toggleFavorite as toggleFavoriteRequest,
} from '../../infraestructure/services/marketplace.service';
import type {
  Listing,
  ListingCategory,
  ListingFilters,
  MarketplaceSettings,
} from '../../domain/responses/MarketplaceResponseModel';

/**
 * La vitrina de clasificados del conjunto.
 *
 * Aquí NO hay carrito ni inventario, y no es un olvido: la copropiedad presta
 * el tablero pero no participa del negocio. Se publica, alguien pregunta y el
 * trato se cierra afuera; un carrito la volvería intermediaria de una
 * transacción por la que no responde. Este store reemplaza al de la tienda de
 * demostración, que traía productos de mentira y un total a pagar.
 *
 * `enabled` es null mientras no se sepa. Se resuelve pidiendo los ajustes: con
 * el módulo apagado el servidor responde con error, y eso basta para esconder
 * la entrada sin inventar una consulta aparte.
 */
interface MarketplaceState {
  listings: Listing[];
  categories: ListingCategory[];
  settings: MarketplaceSettings | null;
  enabled: boolean | null;
  isLoading: boolean;
  page: number;
  hasNextPage: boolean;

  /** Ajustes + categorías. Devuelve si el módulo quedó habilitado. */
  init: (complexId: string) => Promise<boolean>;
  load: (complexId: string, filters?: ListingFilters) => Promise<void>;
  loadMore: (complexId: string, filters?: ListingFilters) => Promise<void>;
  toggleFavorite: (listingId: string) => Promise<boolean>;
  /** Reemplaza un aviso en la lista tras una acción sobre él. */
  patchListing: (listing: Listing) => void;
  removeFromList: (listingId: string) => void;
  clear: () => void;
}

export const useMarketplaceStore = create<MarketplaceState>((set, get) => ({
  listings: [],
  categories: [],
  settings: null,
  enabled: null,
  isLoading: false,
  page: 1,
  hasNextPage: false,

  init: async complexId => {
    try {
      const [settings, categories] = await Promise.all([
        fetchSettings(complexId),
        fetchCategories(complexId),
      ]);
      set({ settings, categories, enabled: true });
      return true;
    } catch {
      // Módulo apagado, o sin permiso: en los dos casos la vitrina no se
      // muestra. No es un error que valga la pena ponerle al residente en
      // pantalla — simplemente no tiene esa función.
      set({ enabled: false, settings: null, categories: [] });
      return false;
    }
  },

  load: async (complexId, filters) => {
    set({ isLoading: true });
    try {
      const page = await fetchListings(complexId, 1, filters);
      set({
        listings: page.items,
        page: page.pagination.currentPage,
        hasNextPage: page.pagination.hasNextPage,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  loadMore: async (complexId, filters) => {
    const { hasNextPage, isLoading, page, listings } = get();
    if (!hasNextPage || isLoading) return;

    set({ isLoading: true });
    try {
      const next = await fetchListings(complexId, page + 1, filters);
      set({
        // Se filtra por id porque entre una página y otra alguien pudo publicar
        // algo nuevo: sin esto, el que se corrió de página saldría dos veces.
        listings: [
          ...listings,
          ...next.items.filter(item => !listings.some(l => l.id === item.id)),
        ],
        page: next.pagination.currentPage,
        hasNextPage: next.pagination.hasNextPage,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  toggleFavorite: async listingId => {
    const saved = await toggleFavoriteRequest(listingId);

    set(state => ({
      listings: state.listings.map(listing =>
        listing.id === listingId
          ? {
              ...listing,
              viewerHasFavorited: saved,
              favoritesCount: Math.max(
                0,
                listing.favoritesCount + (saved ? 1 : -1),
              ),
            }
          : listing,
      ),
    }));

    return saved;
  },

  patchListing: listing => {
    set(state => ({
      listings: state.listings.map(item =>
        item.id === listing.id ? listing : item,
      ),
    }));
  },

  removeFromList: listingId => {
    set(state => ({
      listings: state.listings.filter(item => item.id !== listingId),
    }));
  },

  clear: () =>
    set({
      listings: [],
      categories: [],
      settings: null,
      enabled: null,
      page: 1,
      hasNextPage: false,
    }),
}));
