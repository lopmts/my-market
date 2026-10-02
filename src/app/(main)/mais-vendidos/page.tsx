import type { Metadata } from "next";
import { BestSellersContent } from "./best-sellers-content";

export const metadata: Metadata = {
  title: "Mais vendidos | My Market",
  description:
    "Descubra os produtos mais pedidos no My Market e escolha seus favoritos.",
  alternates: { canonical: "/mais-vendidos" },
  openGraph: {
    title: "Mais vendidos | My Market",
    description: "Veja os produtos mais pedidos no My Market.",
    url: "/mais-vendidos",
    type: "website",
  },
};

export default function BestSellersPage() {
  return <BestSellersContent />;
}
