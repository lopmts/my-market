"use client";

import { Payment } from "@mercadopago/sdk-react";
import { useCallback, useMemo } from "react";

interface MercadoPagoPaymentProps {
  amount: number;
  email: string;
  theme: "default" | "dark";
  entityType?: "individual" | "association";
  onSubmit: (formData: unknown) => Promise<void>;
}

export function MercadoPagoPayment({
  amount,
  email,
  theme,
  entityType,
  onSubmit,
}: MercadoPagoPaymentProps) {
  // 1. Memoriza o objeto de inicialização
  const initialization = useMemo(
    () => ({
      amount,
      payer: {
        email,
        entityType,
      },
    }),
    [amount, email, entityType],
  );

  // 2. Memoriza as customizações visuais e de métodos
  const customization = useMemo(
    () => ({
      visual: {
        style: {
          theme,
        },
      },
      paymentMethods: {
        maxInstallments: 12,
        minInstallments: 1,
        creditCard: "all" as const,
        prepaidCard: "all" as const,
      },
    }),
    [theme],
  );

  // 3. Memoriza o handler de submit
  const handleSubmit = useCallback(
    async ({ formData }: { formData: unknown }) => {
      await onSubmit(formData);
    },
    [onSubmit],
  );

  // 4. Memoriza os handlers de ready e error (evita recriação a cada render)
  const handleReady = useCallback(() => {
    console.log("Mercado Pago Payment Brick pronto");
  }, []);

  const handleError = useCallback((error: unknown) => {
    console.error("Mercado Pago Payment Brick:", error);
  }, []);

  return (
    <Payment
      initialization={initialization}
      customization={customization}
      onSubmit={handleSubmit}
      onReady={handleReady}
      onError={handleError}
    />
  );
}
