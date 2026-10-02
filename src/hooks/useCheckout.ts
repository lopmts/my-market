"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useTRPC } from "@/trpc/client";

export type CheckoutPaymentMethod = "PIX" | "CARD";

interface UseCheckoutOptions {
  quantity?: number;
}

export function useCheckout(productId: string, options?: UseCheckoutOptions) {
  const router = useRouter();
  const trpc = useTRPC();
  const quantity = options?.quantity ?? 1;

  const [paymentMethod, setPaymentMethod] =
    useState<CheckoutPaymentMethod>("PIX");

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
    const path = paymentMethod === "PIX" ? "/payment/pix" : "/payment/card";
    router.push(`${path}?orderId=${order.id}`);
  }

  return {
    order,
    isLoading,
    error,
    paymentMethod,
    setPaymentMethod,
    confirm,
  };
}
