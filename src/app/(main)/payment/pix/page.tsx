import { Suspense } from "react";
import type { Metadata } from "next";
import { PixPaymentContent } from "./pix-payment-content";

export const metadata: Metadata = {
  title: "Pagamento via Pix | My Market",
  description: "Acompanhe a confirmação do pagamento do seu pedido via Pix.",
  robots: { index: false, follow: false },
};

export default function PixPaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          Carregando...
        </div>
      }
    >
      <PixPaymentContent />
    </Suspense>
  );
}
