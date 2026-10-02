import type { Metadata } from "next";
import { OrdersContent } from "./orders-content";

export const metadata: Metadata = {
  title: "Meus pedidos | My Market",
  description: "Acompanhe seus pedidos e consulte seu histórico de compras.",
  robots: { index: false, follow: false },
};

export default function OrdersPage() {
  return <OrdersContent />;
}
