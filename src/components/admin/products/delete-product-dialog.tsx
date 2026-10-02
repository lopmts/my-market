"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useDeleteProduct } from "@/hooks/use-admin-product-actions";
import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";

export function DeleteProductDialog({
  productId,
  productName,
  onDeleted,
}: {
  productId: string;
  productName: string;
  onDeleted?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const deleteProduct = useDeleteProduct(onDeleted);

  const confirmDelete = () => {
    deleteProduct.mutate(
      { id: productId },
      { onSuccess: () => setOpen(false) },
    );
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!deleteProduct.isPending) setOpen(nextOpen);
      }}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`Excluir ${productName}`}
        title="Excluir produto"
        className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="size-4" />
      </Button>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
          <AlertDialogDescription>
            O produto <strong>{productName}</strong> será excluído
            permanentemente. Essa ação não pode ser desfeita. Produtos que já
            aparecem em pedidos não podem ser excluídos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={deleteProduct.isPending}
            onClick={() => setOpen(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={deleteProduct.isPending}
            onClick={confirmDelete}
          >
            {deleteProduct.isPending && (
              <Loader2 className="size-4 animate-spin" />
            )}
            Excluir produto
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
