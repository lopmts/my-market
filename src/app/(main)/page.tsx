import type { Metadata } from "next";
import { HomeContent } from "./home-content";

export const metadata: Metadata = {
  title: "My Market | Delivery de comida",
  description:
    "Peça seus pratos favoritos no My Market. Confira o cardápio, ofertas e produtos mais vendidos.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "My Market | Delivery de comida",
    description:
      "Confira o cardápio e peça seus pratos favoritos no My Market.",
    url: "/",
    type: "website",
  },
};

export default function HomePage() {
  return <HomeContent />;
}
