"use client";

import { Controller, useFormContext } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import type { ProductFormValues } from "@/lib/validators/product-form";

export function ProductStatusCard() {
  const { control } = useFormContext<ProductFormValues>();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Visibilidade</CardTitle>
        <CardDescription>Controle como o produto aparece na loja.</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Controller
            name="active"
            control={control}
            render={({ field }) => (
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldLabel htmlFor="product-active">Ativo</FieldLabel>
                  <FieldDescription>Produtos inativos ficam ocultos no cardápio.</FieldDescription>
                </FieldContent>
                <Switch id="product-active" checked={field.value} onCheckedChange={field.onChange} />
              </Field>
            )}
          />
          <Controller
            name="featured"
            control={control}
            render={({ field }) => (
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldLabel htmlFor="product-featured">Destaque</FieldLabel>
                  <FieldDescription>Mostra o produto nas seções em destaque.</FieldDescription>
                </FieldContent>
                <Switch id="product-featured" checked={field.value} onCheckedChange={field.onChange} />
              </Field>
            )}
          />
          <Controller
            name="isPromotion"
            control={control}
            render={({ field }) => (
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldLabel htmlFor="product-promotion">
                    Em promoção
                  </FieldLabel>
                  <FieldDescription>
                    Identifica o produto como uma oferta no catálogo.
                  </FieldDescription>
                </FieldContent>
                <Switch
                  id="product-promotion"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </Field>
            )}
          />
        </FieldGroup>
      </CardContent>
    </Card>
  );
}
