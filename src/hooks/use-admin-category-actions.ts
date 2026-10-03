"use client";

import { toast } from "@/components/ui/toast";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useAdminCategoryActions() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const refreshCategories = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: trpc.category.pathKey() }),
      queryClient.invalidateQueries({ queryKey: trpc.product.pathKey() }),
    ]);

  const createCategory = useMutation(
    trpc.category.create.mutationOptions({
      onSuccess: async () => {
        await refreshCategories();
        toast.add({ title: "Categoria criada", type: "success" });
      },
      onError: (error) =>
        toast.add({
          title: "Não foi possível criar a categoria",
          description: error.message,
          type: "error",
        }),
    }),
  );

  const updateCategory = useMutation(
    trpc.category.update.mutationOptions({
      onSuccess: async () => {
        await refreshCategories();
        toast.add({ title: "Categoria atualizada", type: "success" });
      },
      onError: (error) =>
        toast.add({
          title: "Não foi possível atualizar a categoria",
          description: error.message,
          type: "error",
        }),
    }),
  );

  const setCategoryActive = useMutation(
    trpc.category.setActive.mutationOptions({
      onSuccess: async (category) => {
        await refreshCategories();
        toast.add({
          title: category.active ? "Categoria ativada" : "Categoria desativada",
          type: "success",
        });
      },
      onError: (error) =>
        toast.add({
          title: "Não foi possível alterar o status",
          description: error.message,
          type: "error",
        }),
    }),
  );

  const deleteCategory = useMutation(
    trpc.category.delete.mutationOptions({
      onSuccess: async () => {
        await refreshCategories();
        toast.add({ title: "Categoria excluída", type: "success" });
      },
      onError: (error) =>
        toast.add({
          title: "Não foi possível excluir a categoria",
          description: error.message,
          type: "error",
        }),
    }),
  );

  const reorderCategories = useMutation(
    trpc.category.reorder.mutationOptions({
      onSuccess: refreshCategories,
      onError: (error) =>
        toast.add({
          title: "Não foi possível reordenar as categorias",
          description: error.message,
          type: "error",
        }),
    }),
  );

  return {
    createCategory,
    updateCategory,
    setCategoryActive,
    deleteCategory,
    reorderCategories,
  };
}
