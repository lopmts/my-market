import { Suspense } from "react";
import type { Metadata } from "next";
import { CardPaymentRender } from "./card-payment-content";

export const metadata: Metadata = {
  title: "Cartão temporariamente indisponível | My Market",
  description:
    "O pagamento com cartão está temporariamente indisponível. Pague seu pedido via Pix.",
  robots: { index: false, follow: false },
};

export default function CardPaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          Carregando...
        </div>
      }
    >
      <CardPaymentRender />
    </Suspense>
  );
}
