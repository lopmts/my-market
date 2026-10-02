"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { useTRPC } from "@/trpc/client";

interface CardResult {
  paymentId: string;
  status: string;
  mpStatus: string;
}

interface CardFormData {
  token: string;
  payment_method_id: string;
  issuer_id?: string;
  installments: number;
  payer: {
    email: string;
    identification?: { type: string; number: string };
  };
}

async function chargeCard(payload: {
  orderId: string;
  token: string;
  paymentMethodId: string;
  issuerId?: string;
  installments: number;
  payer: CardFormData["payer"];
}): Promise<CardResult> {
  const response = await fetch("/api/payments/mercado-pago/card", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const isJson = response.headers
    .get("content-type")
    ?.includes("application/json");

  if (!isJson) {
    throw new Error(
      `Resposta inesperada do servidor (status ${response.status}).`,
    );
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? "Erro ao processar o pagamento");
  }

  return data as CardResult;
}

export function useCardPayment(orderId: string) {
  const router = useRouter();
  const trpc = useTRPC();

  const [result, setResult] = useState<CardResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const orderQuery = useQuery(
    trpc.order.getById.queryOptions(
      { id: orderId },
      {
        enabled: !!orderId,
        // Evita refazer o fetch (e mostrar o skeleton de novo) só porque o
        // componente remontou ao voltar de navegação — o pedido não muda
        // sozinho nesse meio tempo.
        staleTime: 60_000,
      },
    ),
  );

  // Chamado pelo onSubmit do Payment Brick — formData já vem tokenizado,
  // nunca contém número de cartão/CVV em texto puro.
  const submit = useCallback(
    async (formData: CardFormData) => {
      setIsSubmitting(true);
      setError(null);

      try {
        const data = await chargeCard({
          orderId,
          token: formData.token,
          paymentMethodId: formData.payment_method_id,
          issuerId: formData.issuer_id,
          installments: formData.installments,
          payer: formData.payer,
        });

        setResult(data);

        if (data.mpStatus === "approved") {
          router.replace(`/pedido/${encodeURIComponent(orderId)}`);
        }

        return data;
      } catch (e) {
        setError((e as Error).message);
        throw e;
      } finally {
        setIsSubmitting(false);
      }
    },
    [orderId, router],
  );

  return {
    order: orderQuery.data,
    isLoadingOrder: orderQuery.isLoading,
    submit,
    isSubmitting,
    result,
    error,
  };
}
