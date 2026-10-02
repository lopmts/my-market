import { Suspense } from "react";
import type { Metadata } from "next";
import { CardPaymentRender } from "./card-payment-content";

export const metadata: Metadata = {
  title: "Pagamento com cartão | My Market",
  description: "Acompanhe o pagamento do seu pedido com cartão.",
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
