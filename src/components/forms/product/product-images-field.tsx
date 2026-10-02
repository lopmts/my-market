"use client";

import { ImageIcon, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { MAX_GALLERY_IMAGES, type ProductFormValues } from "@/lib/validators/product-form";

function Preview({ src, className }: { src?: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  return (
    <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted ${className}`}>
      {src && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="size-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <ImageIcon className="size-5 text-muted-foreground" />
      )}
    </div>
  );
}

function GalleryPreview({ index }: { index: number }) {
  const { control } = useFormContext<ProductFormValues>();
  const url = useWatch({ control, name: `images.${index}.url` });
  return <Preview src={url} className="size-10" />;
}

export function ProductImagesField() {
  const { control } = useFormContext<ProductFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: "images" });
  const mainImage = useWatch({ control, name: "image" });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Imagens</CardTitle>
        <CardDescription>Imagem principal e galeria da página do produto.</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Controller
            name="image"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="product-image">Imagem principal (URL)</FieldLabel>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  <Preview src={mainImage} className="aspect-video w-full sm:size-24 sm:w-24 sm:aspect-square" />
                  <div className="flex-1 space-y-2">
                    <Input {...field} id="product-image" placeholder="https://…" aria-invalid={fieldState.invalid} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </div>
                </div>
              </Field>
            )}
          />

          <Field>
            <FieldLabel>Galeria</FieldLabel>
            <FieldDescription>Até {MAX_GALLERY_IMAGES} imagens adicionais.</FieldDescription>

            <div className="space-y-3">
              {fields.map((item, index) => (
                <Controller
                  key={item.id}
                  name={`images.${index}.url`}
                  control={control}
                  render={({ field, fieldState }) => (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <GalleryPreview index={index} />
                        <Input {...field} placeholder="https://…" aria-label={`Imagem ${index + 1}`} aria-invalid={fieldState.invalid} />
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} aria-label={`Remover imagem ${index + 1}`}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </div>
                  )}
                />
              ))}
            </div>

            <Button type="button" variant="outline" className="w-full sm:w-fit" disabled={fields.length >= MAX_GALLERY_IMAGES} onClick={() => append({ url: "" })}>
              <Plus className="size-4" />
              Adicionar imagem
            </Button>
          </Field>
        </FieldGroup>
      </CardContent>
    </Card>
  );
}
