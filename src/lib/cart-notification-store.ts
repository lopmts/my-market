import { create } from "zustand";

export type CartNotification = {
  productId: string;
  productName: string;
  productImage: string | null;
  totalQuantity: number; // quantidade total DESSE produto no carrinho
  totalPrice: number; // price * quantity desse produto
};

type CartNotificationState = {
  notification: CartNotification | null;
  notify: (notification: CartNotification) => void;
  clear: () => void;
};

export const useCartNotificationStore = create<CartNotificationState>(
  (set) => ({
    notification: null,
    notify: (notification) => set({ notification }),
    clear: () => set({ notification: null }),
  }),
);
