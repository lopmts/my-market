"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { ProductForm } from "./product-form";

// sem productId = criar | com productId = editar
export function ProductFormPage({ productId }: { productId?: string }) {
  const trpc = useTRPC();
  const {
    data: product,
    isLoading,
    error,
  } = useQuery({
    ...trpc.product.adminById.queryOptions({ id: productId ?? "" }),
    enabled: !!productId,
  });

  const isEditing = !!productId;

  return (
    <div className="w-full h-full">
      {/* <Link
        href="/admin/produtos"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Produtos
      </Link> */}

      <h1 className="mb-6 text-2xl font-semibold tracking-tight">
        {isEditing ? "Editar produto" : "Novo produto"}
      </h1>

      {isEditing && isLoading && (
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <Skeleton className="h-96" />
          <Skeleton className="h-64" />
        </div>
      )}

      {isEditing && error && (
        <p className="text-sm text-destructive">{error.message}</p>
      )}

      {(!isEditing || product) && (
        <ProductForm key={product?.id ?? "new"} product={product} />
      )}
    </div>
  );
}
