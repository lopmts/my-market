"use client";

import BestSellers from "@/components/cards/best-sellers-product";
import CategoryProduct from "@/components/cards/category-product";
import HeroBanner from "@/components/cards/herobanner";
import InfoHighlights from "@/components/cards/info-highlights";
import PromoBanners from "@/components/cards/promobanners";

export function HomeContent() {
  return (
    <div className="w-full h-full">
      <div className="flex flex-col">
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
