"use client";

import { Controller, useFormContext } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ProductFormValues } from "@/lib/validators/product-form";

export function ProductBasicFields() {
  const { control, watch } = useFormContext<ProductFormValues>();
  const descriptionLength = watch("description")?.length ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações básicas</CardTitle>
        <CardDescription>Nome, descrição e preço exibidos no cardápio.</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Controller
            name="name"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="product-name">Nome</FieldLabel>
                <Input {...field} id="product-name" placeholder="Pizza Margherita" autoComplete="off" aria-invalid={fieldState.invalid} />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="description"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="product-description">Descrição</FieldLabel>
                <Textarea {...field} id="product-description" rows={4} className="resize-none" placeholder="Ingredientes, tamanho, observações…" aria-invalid={fieldState.invalid} />
                <FieldDescription>{descriptionLength}/500</FieldDescription>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="price"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="sm:max-w-xs">
                <FieldLabel htmlFor="product-price">Preço</FieldLabel>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                  <Input {...field} id="product-price" inputMode="decimal" placeholder="0,00" className="pl-10" aria-invalid={fieldState.invalid} />
                </div>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </FieldGroup>
      </CardContent>
    </Card>
  );
}
