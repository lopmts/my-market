"use client";

import { useCartNotificationStore } from "@/lib/cart-notification-store";
import { formatPrice } from "@/utils/price-format";
import { Check, ImageOff } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef } from "react";

const AUTO_DISMISS_MS = 2500;

export function CartToast() {
  const notification = useCartNotificationStore((s) => s.notification);
  const clear = useCartNotificationStore((s) => s.clear);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!notification) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => clear(), AUTO_DISMISS_MS);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // notification.productId garante reset do timer se clicar em "Adicionar"
    // de novo antes do popup anterior sumir
  }, [notification?.productId, notification?.totalQuantity, clear]);

  if (!notification) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg border bg-background p-3 shadow-lg animate-in slide-in-from-bottom-4 fade-in"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500/10">
        <Check size={20} className="text-green-500" />
      </div>

      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-zinc-800/50">
        {notification.productImage ? (
          <Image
            src={notification.productImage}
            alt={notification.productName}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageOff size={16} />
          </div>
        )}
      </div>

      <div className="flex flex-col pr-1">
        <span className="text-sm font-medium line-clamp-1">
          {notification.productName} adicionado
        </span>
        <span className="text-xs text-zinc-400">
          {notification.totalQuantity}x no carrinho ·{" "}
          {formatPrice(notification.totalPrice)}
        </span>
      </div>
    </div>
  );
}

export default CartToast;
