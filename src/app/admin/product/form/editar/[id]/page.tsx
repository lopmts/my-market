"use client";

import { ProductFormPage } from "@/components/forms/product/product-form-page";
import { useParams } from "next/navigation";

export default function NewProductPage() {
  const { id } = useParams() as { id?: string };

  if (!id) {
    return (
      <div className="w-full max-w-7xl mx-auto p-4 h-full min-h-screen">
        <span>Produto não encontrado</span>
      </div>
    );
  }

  return <ProductFormPage productId={id} />;
}
