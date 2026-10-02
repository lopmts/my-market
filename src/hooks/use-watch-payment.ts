"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const INTERVAL_MS = 3000;
const TIMEOUT_MS = 10 * 60 * 1000; // PIX: 10 min

export function useWatchPayment(orderId: string) {
  const router = useRouter();

  useEffect(() => {
    let stopped = false;
    const startedAt = Date.now();

    const check = async () => {
      if (stopped) return;

      if (Date.now() - startedAt > TIMEOUT_MS) {
        stopped = true;
        router.push(`/pedido/${encodeURIComponent(orderId)}`);
        return;
      }

      try {
        const res = await fetch(`/api/orders/${orderId}/status`, {
          cache: "no-store",
        });
        if (res.ok) {
          const { type } = await res.json();
          if (type !== "pending") {
            stopped = true;
            router.push(`/pedido/${encodeURIComponent(orderId)}`);
            return;
          }
        }
      } catch {
        // falha de rede: tenta de novo no próximo ciclo
      }

      setTimeout(check, INTERVAL_MS);
    };

    const timer = setTimeout(check, INTERVAL_MS);

    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [orderId, router]);
}
