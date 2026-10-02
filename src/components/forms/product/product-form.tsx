"use client";

import { useProductForm } from "@/hooks/use-product-form";
import type { ProductFormSource } from "@/lib/validators/product-form";
import { FormProvider } from "react-hook-form";
import { ProductBasicFields } from "./product-basic-fields";
import { ProductCategoryField } from "./product-category-field";
import { ProductFormActions } from "./product-form-actions";
import { ProductImagesField } from "./product-images-field";
import { ProductStatusCard } from "./product-status-card";

export function ProductForm({ product }: { product?: ProductFormSource }) {
  const { form, isEditing, isPending, onSubmit, cancel } = useProductForm({
    product,
  });

  return (
    <FormProvider {...form}>
      <form
        onSubmit={onSubmit}
        noValidate
        className="flex flex-col gap-6 h-full"
      >
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <div className="grid min-w-0 gap-6">
            <ProductBasicFields />
            <ProductImagesField />
          </div>
          <div className="grid gap-6">
            <ProductCategoryField />
            <ProductStatusCard />
          </div>
        </div>

        <ProductFormActions
          isEditing={isEditing}
          isPending={isPending}
          onCancel={cancel}
        />
      </form>
    </FormProvider>
  );
}
