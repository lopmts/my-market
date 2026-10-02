"use client";

import { toast } from "@/components/ui/toast";
import {
  emptyProductValues,
  formValuesToPayload,
  productFormSchema,
  productToFormValues,
  type ProductFormSource,
  type ProductFormValues,
} from "@/lib/validators/product-form";
import { useTRPC } from "@/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

const LIST_PATH = "/admin/produtos";

export function useProductForm({
  product,
}: { product?: ProductFormSource } = {}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const isEditing = !!product;

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: product ? productToFormValues(product) : emptyProductValues,
    mode: "onTouched",
  });

  const afterSave = (message: string) => {
    queryClient.invalidateQueries({ queryKey: trpc.product.pathKey() });
    toast.add({
      title: message,
      type: "success",
    });
    router.push(LIST_PATH);
  };

  const createProduct = useMutation(
    trpc.product.create.mutationOptions({
      onSuccess: () => afterSave("Produto criado"),
      onError: (e) =>
        toast.add({
          title: "Erro ao criar produto",
          description: e.message,
          type: "error",
        }),
    }),
  );

  const updateProduct = useMutation(
    trpc.product.update.mutationOptions({
      onSuccess: () => afterSave("Alterações salvas"),
      onError: (e) =>
        toast.add({
          title: "Erro ao atualizar produto",
          description: e.message,
          type: "error",
        }),
    }),
  );

  const onSubmit = form.handleSubmit((values) => {
    const data = formValuesToPayload(values);
    if (product) updateProduct.mutate({ id: product.id, data });
    else createProduct.mutate(data);
  });

  return {
    form,
    isEditing,
    isPending: createProduct.isPending || updateProduct.isPending,
    onSubmit,
    cancel: () => router.push(LIST_PATH),
  };
}
