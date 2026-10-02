import type { Metadata } from "next";
import { CartContent } from "./cart-content";

export const metadata: Metadata = {
  title: "Meu carrinho | My Market",
  description:
    "Confira seus produtos, ajuste quantidades e finalize seu pedido no My Market.",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return <CartContent />;
}
