"use client";

import { initMercadoPago } from "@mercadopago/sdk-react";
import { useEffect } from "react";

// Monte <MercadoPagoProvider /> uma vez no layout raiz (não renderiza nada).
export function MercadoPagoProvider() {
  useEffect(() => {
    initMercadoPago(process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY!, {
      locale: "pt-BR",
    });
  }, []);

  return null;
}
