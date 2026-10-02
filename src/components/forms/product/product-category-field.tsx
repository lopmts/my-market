"use client";

import { useQuery } from "@tanstack/react-query";
import { Controller, useFormContext } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useTRPC } from "@/trpc/client";
import type { ProductFormValues } from "@/lib/validators/product-form";

export function ProductCategoryField() {
  const trpc = useTRPC();
  const { control } = useFormContext<ProductFormValues>();
  const { data: categories, isLoading } = useQuery(trpc.category.adminList.queryOptions());

  return (
    <Card>
      <CardHeader>
        <CardTitle>Categoria</CardTitle>
        <CardDescription>Onde o produto aparece no cardápio.</CardDescription>
      </CardHeader>
      <CardContent>
        <Controller
          name="categoryId"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="product-category">Categoria</FieldLabel>
              {isLoading ? (
                <Skeleton className="h-9 w-full" />
              ) : (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="product-category" className="w-full" aria-invalid={fieldState.invalid} onBlur={field.onBlur}>
                    <SelectValue placeholder="Selecione uma categoria">
                      {(value) =>
                        categories?.find((category) => category.id === value)
                          ?.name ?? "Selecione uma categoria"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                        {!c.active && " (inativa)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {!isLoading && categories?.length === 0 && <FieldDescription>Nenhuma categoria cadastrada. Crie uma antes de cadastrar produtos.</FieldDescription>}
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </CardContent>
    </Card>
  );
}
