"use client";

import { CategoryFormDialog } from "@/components/admin/categories/category-form-dialog";
import { DeleteCategoryDialog } from "@/components/admin/categories/delete-category-dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAdminCategoryActions } from "@/hooks/use-admin-category-actions";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/trpc/routers/_app";
import { ArrowDown, ArrowUp, Loader2, Pencil } from "lucide-react";
import { useState } from "react";

type Category = inferRouterOutputs<AppRouter>["category"]["adminList"][number];

export function CategoryActions({
  category,
  canMoveUp,
  canMoveDown,
  onMove,
}: {
  category: Category;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMove: (direction: "up" | "down") => void;
}) {
  const [editing, setEditing] = useState(false);
  const { setCategoryActive, reorderCategories } = useAdminCategoryActions();

  return (
    <>
      <div className="flex items-center justify-end gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Mover ${category.name} para cima`}
          title="Mover para cima"
          disabled={!canMoveUp || reorderCategories.isPending}
          onClick={() => onMove("up")}
        >
          <ArrowUp className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Mover ${category.name} para baixo`}
          title="Mover para baixo"
          disabled={!canMoveDown || reorderCategories.isPending}
          onClick={() => onMove("down")}
        >
          <ArrowDown className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Editar categoria ${category.name}`}
          title="Editar categoria"
          onClick={() => setEditing(true)}
        >
          <Pencil className="size-4" />
        </Button>
        <span className="flex items-center px-2" title="Ativar ou desativar">
          {setCategoryActive.isPending ? (
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          ) : (
            <Switch
              checked={category.active}
              disabled={setCategoryActive.isPending}
              aria-label={
                category.active
                  ? `Desativar categoria ${category.name}`
                  : `Ativar categoria ${category.name}`
              }
              onCheckedChange={(active) =>
                setCategoryActive.mutate({ id: category.id, active })
              }
            />
          )}
        </span>
        <DeleteCategoryDialog
          categoryId={category.id}
          categoryName={category.name}
          productCount={category._count.products}
        />
      </div>

      {editing && (
        <CategoryFormDialog
          category={category}
          open={editing}
          onOpenChange={setEditing}
        />
      )}
    </>
  );
}
