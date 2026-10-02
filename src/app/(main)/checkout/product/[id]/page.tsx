import type { Metadata } from "next";
import { CheckoutContent } from "./checkout-content";

export const metadata: Metadata = {
  title: "Finalizar pedido | My Market",
  description: "Escolha a forma de pagamento para finalizar seu pedido.",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return <CheckoutContent />;
}
