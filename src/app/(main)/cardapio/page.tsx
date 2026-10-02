import type { Metadata } from "next";
import { MenuContent } from "./menu-content";

export const metadata: Metadata = {
  title: "Cardápio | My Market",
  description:
    "Explore o cardápio do My Market: encontre seus pratos favoritos e faça seu pedido online.",
  alternates: { canonical: "/cardapio" },
  openGraph: {
    title: "Cardápio | My Market",
    description:
      "Explore o cardápio do My Market e peça seus pratos favoritos online.",
    url: "/cardapio",
    type: "website",
  },
};

export default function MenuPage() {
  return <MenuContent />;
}
