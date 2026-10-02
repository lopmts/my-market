"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { paymentTypeFromOrderStatus } from "@/lib/payment-type";
import { useTRPC } from "@/trpc/client";

interface PixData {
  paymentId: string;
  status: "PENDING" | "PAID" | "FAILED" | "CANCELLED" | "REFUNDED";
  pix: {
    qrCode: string | null;
    qrCodeBase64: string | null;
  };
  expiresAt: string;
}

async function createPixPayment(orderId: string): Promise<PixData> {
  const response = await fetch("/api/payments/mercado-pago/pix", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? "Erro ao gerar o PIX");
  }

  return data as PixData;
}

export function usePixPayment(orderId: string) {
  const router = useRouter();
  const trpc = useTRPC();

  const orderQuery = useQuery(
    trpc.order.getById.queryOptions(
      { id: orderId },
      {
        enabled: !!orderId,
        // Enquanto o pedido está pendente, confere periodicamente se o
        // webhook do Mercado Pago já confirmou o pagamento
        refetchInterval: (query) =>
          query.state.data?.status === "PENDING" ? 4000 : false,
      },
    ),
  );

  const {
    mutate: generatePix,
    data: pix,
    isPending: isGenerating,
    error,
  } = useMutation({
    mutationFn: () => createPixPayment(orderId),
  });

  // Redireciona para a rota atual de confirmação quando o webhook resolve o pedido.
  const orderStatus = orderQuery.data?.status;

  useEffect(() => {
    const type = paymentTypeFromOrderStatus(orderStatus);
    if (!type) return;

    router.replace(`/pedido/${encodeURIComponent(orderId)}`);
  }, [orderStatus, orderId, router]);

  // Gera o PIX assim que a página é acessada
  useEffect(() => {
    if (!orderId) return;
    generatePix();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  // Relógio: o state guarda só o "agora", atualizado no callback do interval
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Derivado durante o render: sem effect e sem setState extra
  const secondsLeft = pix?.expiresAt
    ? Math.max(0, Math.floor((new Date(pix.expiresAt).getTime() - now) / 1000))
    : null;

  const isExpired = secondsLeft === 0;

  const qrCode = pix?.pix.qrCode;

  const copyCode = useCallback(async () => {
    if (!qrCode) return;
    await navigator.clipboard.writeText(qrCode);
  }, [qrCode]);

  const regenerate = useCallback(() => generatePix(), [generatePix]);

  return {
    order: orderQuery.data,
    isLoadingOrder: orderQuery.isLoading,
    pix,
    isGenerating,
    error,
    secondsLeft,
    isExpired,
    copyCode,
    regenerate,
  };
}
