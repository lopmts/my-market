"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useTRPC } from "@/trpc/client";

interface UseCheckoutOptions {
  quantity?: number;
}

export function useCheckout(productId: string, options?: UseCheckoutOptions) {
  const router = useRouter();
  const trpc = useTRPC();
  const quantity = options?.quantity ?? 1;

  const {
    mutate: getOrCreateOrder,
    data: order,
    isPending: isLoading,
    error,
  } = useMutation(trpc.order.getOrCreateForProduct.mutationOptions());

  // Ao acessar a página de checkout: cria o pedido do produto,
  // ou recupera o pedido pendente já existente para ele.
  useEffect(() => {
    if (!productId) return;
    getOrCreateOrder({ productId, quantity });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  function confirm() {
    if (!order) return;
    router.push(`/payment/pix?orderId=${encodeURIComponent(order.id)}`);
  }

  return {
    order,
    isLoading,
    error,
    confirm,
  };
}
