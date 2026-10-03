"use client";

import BestSellers from "@/components/cards/best-sellers-product";
import CategoryProduct from "@/components/cards/category-product";
import HeroBanner from "@/components/cards/herobanner";
import InfoHighlights from "@/components/cards/info-highlights";
import PromoBanners from "@/components/cards/promobanners";
import { AlertTriangle } from "lucide-react";

export function HomeContent() {
  return (
    <div className="w-full h-full">
      <div className="flex flex-col">
        <div
          role="status"
          className="flex items-center justify-center gap-2 bg-amber-100 px-4 py-2.5 text-center text-sm font-medium text-amber-950 dark:bg-amber-950 dark:text-amber-100"
        >
          <AlertTriangle className="size-4 shrink-0" />
          <p>
            Aviso: pagamentos com cartão de crédito estão temporariamente
            indisponíveis. Para pagar seu pedido, escolha Pix.
          </p>
        </div>
        <HeroBanner />
        <div className="p-4 max-w-7xl mx-auto w-full">
          <InfoHighlights />
          <CategoryProduct />
          <PromoBanners />
          <BestSellers />
        </div>
      </div>
    </div>
  );
}
