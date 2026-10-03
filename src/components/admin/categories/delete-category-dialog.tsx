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
import { useAdminCategoryActions } from "@/hooks/use-admin-category-actions";
import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";

export function DeleteCategoryDialog({
  categoryId,
  categoryName,
  productCount,
}: {
  categoryId: string;
  categoryName: string;
  productCount: number;
}) {
  const [open, setOpen] = useState(false);
  const { deleteCategory } = useAdminCategoryActions();
  const isPending = deleteCategory.isPending;

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => !isPending && setOpen(nextOpen)}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={productCount > 0}
        title={
          productCount > 0
            ? "Mova os produtos ou desative a categoria"
            : "Excluir categoria"
        }
        aria-label={`Excluir categoria ${categoryName}`}
        onClick={() => setOpen(true)}
        className="text-red-600 hover:bg-red-50 hover:text-red-700 disabled:text-zinc-400 dark:text-red-400 dark:hover:bg-red-950/40"
      >
        <Trash2 className="size-4" />
      </Button>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
          <AlertDialogDescription>
            A categoria <strong>{categoryName}</strong> será excluída
            permanentemente. Esta ação não pode ser desfeita.
            {productCount > 0 &&
              ` Ela ainda possui ${productCount} produto(s), então não pode ser excluída.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => setOpen(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isPending || productCount > 0}
            onClick={() =>
              deleteCategory.mutate(
                { id: categoryId },
                { onSuccess: () => setOpen(false) },
              )
            }
          >
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Excluir categoria
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
