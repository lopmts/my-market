"use client";

import { DeleteProductDialog } from "@/components/admin/products/delete-product-dialog";
import { Button } from "@/components/ui/button";
import { useSetProductActive } from "@/hooks/use-admin-product-actions";
import { Eye, EyeOff, Loader2, Pencil } from "lucide-react";
import Link from "next/link";

export function ProductActions({
  product,
  onDeleted,
}: {
  product: { id: string; name: string; active: boolean };
  onDeleted?: () => void;
}) {
  const setActive = useSetProductActive();

  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={product.active ? "Desativar produto" : "Ativar produto"}
        title={product.active ? "Desativar produto" : "Ativar produto"}
        disabled={setActive.isPending}
        onClick={() =>
          setActive.mutate({ id: product.id, active: !product.active })
        }
      >
        {setActive.isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          product.active ? (
            <Eye className="size-4" aria-hidden="true" />
          ) : (
            <EyeOff className="size-4" aria-hidden="true" />
          )
        )}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`Visualizar ${product.name}`}
        title="Visualizar no cardápio"
        nativeButton={false}
        render={<Link href={`/cardapio/${product.id}`} />}
      >
        <Eye className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`Editar ${product.name}`}
        title="Editar produto"
        nativeButton={false}
        render={<Link href={`/admin/product/form/editar/${product.id}`} />}
      >
        <Pencil className="size-4" />
      </Button>
      <DeleteProductDialog
        productId={product.id}
        productName={product.name}
        onDeleted={onDeleted}
      />
    </div>
  );
}
