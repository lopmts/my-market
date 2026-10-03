"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAdminCategoryActions } from "@/hooks/use-admin-category-actions";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/trpc/routers/_app";
import { Loader2 } from "lucide-react";
import { useState } from "react";

type Category = inferRouterOutputs<AppRouter>["category"]["adminList"][number];

type CategoryValues = {
  name: string;
  slug: string;
  description: string;
  image: string;
  active: boolean;
};

const emptyValues: CategoryValues = {
  name: "",
  slug: "",
  description: "",
  image: "",
  active: true,
};

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function CategoryFormDialog({
  category,
  onOpenChange,
  open,
}: {
  category?: Category;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const actions = useAdminCategoryActions();
  const [values, setValues] = useState<CategoryValues>(() =>
    category
      ? {
          name: category.name,
          slug: category.slug,
          description: category.description ?? "",
          image: category.image ?? "",
          active: category.active,
        }
      : emptyValues,
  );
  const [slugEdited, setSlugEdited] = useState(!!category);
  const [validationError, setValidationError] = useState("");
  const isPending =
    actions.createCategory.isPending || actions.updateCategory.isPending;

  const updateName = (name: string) => {
    setValues((current) => ({
      ...current,
      name,
      slug: slugEdited ? current.slug : slugify(name),
    }));
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = values.name.trim();
    const slug = values.slug.trim();

    if (name.length < 2 || name.length > 60) {
      setValidationError("O nome deve ter entre 2 e 60 caracteres.");
      return;
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 60) {
      setValidationError(
        "Use um slug em minúsculas, com palavras separadas por hífen.",
      );
      return;
    }
    if (values.description.length > 300) {
      setValidationError("A descrição deve ter no máximo 300 caracteres.");
      return;
    }
    if (values.image && !URL.canParse(values.image)) {
      setValidationError("Informe uma URL válida para a imagem.");
      return;
    }

    setValidationError("");
    const data = {
      name,
      slug,
      description: values.description.trim() || null,
      image: values.image.trim() || null,
      active: values.active,
    };

    const onSuccess = () => onOpenChange(false);
    if (category) {
      actions.updateCategory.mutate(
        { id: category.id, data },
        { onSuccess },
      );
    } else {
      actions.createCategory.mutate(data, { onSuccess });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !isPending && onOpenChange(nextOpen)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {category ? "Editar categoria" : "Criar categoria"}
          </DialogTitle>
          <DialogDescription>
            Organize os produtos da loja em categorias fáceis de encontrar.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Nome</span>
            <Input
              required
              minLength={2}
              maxLength={60}
              autoFocus
              value={values.name}
              onChange={(event) => updateName(event.target.value)}
              placeholder="Ex.: Bebidas"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Slug da URL</span>
            <Input
              required
              maxLength={60}
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              value={values.slug}
              onChange={(event) => {
                setSlugEdited(true);
                setValues((current) => ({
                  ...current,
                  slug: event.target.value,
                }));
              }}
              placeholder="ex-bebidas"
            />
            <span className="block text-xs text-muted-foreground">
              Usado nas URLs públicas. É sugerido automaticamente pelo nome.
            </span>
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Descrição</span>
            <Textarea
              maxLength={300}
              rows={3}
              value={values.description}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="Descreva os produtos desta categoria..."
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium">URL da imagem (opcional)</span>
            <Input
              type="url"
              value={values.image}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  image: event.target.value,
                }))
              }
              placeholder="https://exemplo.com/imagem.jpg"
            />
          </label>

          <label className="flex items-center justify-between gap-4 rounded-lg border p-3">
            <span>
              <span className="block text-sm font-medium">Categoria ativa</span>
              <span className="block text-xs text-muted-foreground">
                Categorias inativas não aparecem no catálogo público.
              </span>
            </span>
            <Switch
              checked={values.active}
              onCheckedChange={(active) =>
                setValues((current) => ({ ...current, active }))
              }
              aria-label="Categoria ativa"
            />
          </label>

          {validationError && (
            <p role="alert" className="text-sm text-destructive">
              {validationError}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {category ? "Salvar alterações" : "Criar categoria"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
