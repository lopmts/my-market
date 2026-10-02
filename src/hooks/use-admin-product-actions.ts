"use client";

import { toast } from "@/components/ui/toast";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useDeleteProduct(onDeleted?: () => void) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.product.delete.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.product.pathKey(),
        });
        toast.add({ title: "Produto excluído", type: "success" });
        onDeleted?.();
      },
      onError: (error) => {
        toast.add({
          title: "Não foi possível excluir o produto",
          description: error.message,
          type: "error",
        });
      },
    }),
  );
}

export function useSetProductActive() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.product.setActive.mutationOptions({
      onSuccess: async (product) => {
        await queryClient.invalidateQueries({
          queryKey: trpc.product.pathKey(),
        });
        toast.add({
          title: product.active ? "Produto ativado" : "Produto desativado",
          type: "success",
        });
      },
      onError: (error) => {
        toast.add({
          title: "Não foi possível atualizar o produto",
          description: error.message,
          type: "error",
        });
      },
    }),
  );
}
