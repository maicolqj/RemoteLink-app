import { create } from 'zustand';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  category: string;
  stock: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

interface MarketplaceState {
  products: Product[];
  cart: CartItem[];
  cartTotal: number;
  isLoading: boolean;
  setProducts: (products: Product[]) => void;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setLoading: (isLoading: boolean) => void;
}

const computeTotal = (cart: CartItem[]) =>
  cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

export const useMarketplaceStore = create<MarketplaceState>(set => ({
  products: [],
  cart: [],
  cartTotal: 0,
  isLoading: false,

  setProducts: products => set({ products }),
  setLoading: isLoading => set({ isLoading }),

  addToCart: product => {
    set(state => {
      const existing = state.cart.find(i => i.product.id === product.id);
      const cart = existing
        ? state.cart.map(i =>
            i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
          )
        : [...state.cart, { product, quantity: 1 }];
      return { cart, cartTotal: computeTotal(cart) };
    });
  },

  removeFromCart: productId => {
    set(state => {
      const cart = state.cart.filter(i => i.product.id !== productId);
      return { cart, cartTotal: computeTotal(cart) };
    });
  },

  updateQuantity: (productId, quantity) => {
    set(state => {
      const cart =
        quantity <= 0
          ? state.cart.filter(i => i.product.id !== productId)
          : state.cart.map(i =>
              i.product.id === productId ? { ...i, quantity } : i,
            );
      return { cart, cartTotal: computeTotal(cart) };
    });
  },

  clearCart: () => set({ cart: [], cartTotal: 0 }),
}));
