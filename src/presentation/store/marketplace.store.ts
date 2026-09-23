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
 * Si el conjunto tiene el módulo encendido NO se decide aquí: eso sale de
 * `enabledModules` de la sesión, que es lo que recorta los accesos del inicio y
 * llega por socket cuando el SUPER_ADMIN lo mueve. Este store solo carga lo que
 * la vitrina necesita para funcionar —ajustes y categorías—; tener dos fuentes
 * para la misma pregunta es tener dos respuestas distintas.
 */
interface MarketplaceState {
  listings: Listing[];
  categories: ListingCategory[];
  /** Oficios del directorio de servicios; van aparte de las de clasificados. */
  serviceCategories: ListingCategory[];
  settings: MarketplaceSettings | null;
  isLoading: boolean;
  page: number;
  hasNextPage: boolean;

  /** Ajustes + categorías de los dos tableros. */
  init: (complexId: string) => Promise<void>;
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
  serviceCategories: [],
  settings: null,
  isLoading: false,
  page: 1,
  hasNextPage: false,

  init: async complexId => {
    try {
      const [settings, categories, serviceCategories] = await Promise.all([
        fetchSettings(complexId),
        fetchCategories(complexId, 'CLASSIFIED'),
        fetchCategories(complexId, 'SERVICE'),
      ]);
      set({ settings, categories, serviceCategories });
    } catch {
      // Sin ajustes la pantalla sigue en pie con los valores por defecto: no
      // vale la pena tumbarle la vitrina al residente por no saber cuántas
      // fotos admite el conjunto.
      set({ settings: null, categories: [], serviceCategories: [] });
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
      serviceCategories: [],
      settings: null,
      page: 1,
      hasNextPage: false,
    }),
}));
