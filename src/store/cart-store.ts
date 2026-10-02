import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type CartProduct = {
  id: string;
  name: string;
  image: string | null;
  price: number | string; // aceita Decimal do Prisma serializado como string
  categoryId?: string;
};

export type CartItem = {
  id: string;
  name: string;
  image: string | null;
  price: number;
  categoryId?: string;
  quantity: number;
};

const MIN_QUANTITY = 1;
const MAX_QUANTITY_PER_ITEM = 20;

type CartState = {
  items: CartItem[];
  hasHydrated: boolean; // true só depois que o persist carregou o localStorage no client
  setHasHydrated: (value: boolean) => void;
  addItem: (product: CartProduct, quantity?: number) => void;
  removeItem: (productId: string) => void;
  increment: (productId: string) => void;
  decrement: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getItem: (productId: string) => CartItem | undefined;
  totalItems: () => number;
  subtotal: () => number;
};

function toNumber(value: number | string): number {
  const n = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(n) ? n : NaN;
}

function clampQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) return MIN_QUANTITY;
  const rounded = Math.round(quantity);
  return Math.min(Math.max(rounded, MIN_QUANTITY), MAX_QUANTITY_PER_ITEM);
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),

      addItem: (product, quantity = 1) => {
        if (!product?.id || !product.name) {
          console.warn("[cart] produto inválido, adição ignorada", product);
          return;
        }

        const price = toNumber(product.price);
        if (Number.isNaN(price) || price < 0) {
          console.warn(`[cart] preço inválido para o produto ${product.id}`);
          return;
        }

        const safeQuantity = clampQuantity(quantity);

        set((state) => {
          const existing = state.items.find((i) => i.id === product.id);

          if (existing) {
            const newQuantity = clampQuantity(existing.quantity + safeQuantity);
            return {
              items: state.items.map((i) =>
                i.id === product.id ? { ...i, quantity: newQuantity } : i,
              ),
            };
          }

          return {
            items: [
              ...state.items,
              {
                id: product.id,
                name: product.name,
                image: product.image,
                categoryId: product.categoryId,
                price,
                quantity: safeQuantity,
              },
            ],
          };
        });
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== productId),
        }));
      },

      increment: (productId) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.id === productId
              ? { ...i, quantity: clampQuantity(i.quantity + 1) }
              : i,
          ),
        }));
      },

      decrement: (productId) => {
        const item = get().items.find((i) => i.id === productId);
        if (!item) return;

        if (item.quantity <= MIN_QUANTITY) {
          get().removeItem(productId);
          return;
        }

        set((state) => ({
          items: state.items.map((i) =>
            i.id === productId
              ? { ...i, quantity: clampQuantity(i.quantity - 1) }
              : i,
          ),
        }));
      },

      setQuantity: (productId, quantity) => {
        if (!Number.isFinite(quantity) || quantity <= 0) {
          get().removeItem(productId);
          return;
        }

        const safeQuantity = clampQuantity(quantity);

        set((state) => ({
          items: state.items.map((i) =>
            i.id === productId ? { ...i, quantity: safeQuantity } : i,
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      getItem: (productId) => get().items.find((i) => i.id === productId),

      totalItems: () =>
        get().items.reduce((acc, item) => acc + item.quantity, 0),

      subtotal: () =>
        get().items.reduce((acc, item) => acc + item.price * item.quantity, 0),
    }),
    {
      name: "sabortop-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
      // dispara quando o persist termina de ler o localStorage no client
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

// Selectors prontos para evitar re-render desnecessário de toda a store
export const useCartItems = () => useCartStore((s) => s.items);
export const useCartHasHydrated = () => useCartStore((s) => s.hasHydrated);

// totalItems/subtotal só "contam de verdade" depois da hidratação;
// antes disso retornam 0 pra bater com o HTML renderizado no servidor
export const useCartTotalItems = () =>
  useCartStore((s) => (s.hasHydrated ? s.totalItems() : 0));
export const useCartSubtotal = () =>
  useCartStore((s) => (s.hasHydrated ? s.subtotal() : 0));
export const useCartItem = (productId: string) =>
  useCartStore((s) =>
    s.hasHydrated ? s.items.find((i) => i.id === productId) : undefined,
  );
