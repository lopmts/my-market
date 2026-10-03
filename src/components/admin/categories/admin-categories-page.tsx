"use client";

import { CategoryActions } from "@/components/admin/categories/category-actions";
import { CategoryFormDialog } from "@/components/admin/categories/category-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminCategoryActions } from "@/hooks/use-admin-category-actions";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import {
  FolderOpen,
  Image as ImageIcon,
  Plus,
  Search,
  Tags,
} from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";

export function AdminCategoriesPage() {
  const trpc = useTRPC();
  const categories = useQuery(trpc.category.adminList.queryOptions());
  const { reorderCategories } = useAdminCategoryActions();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);

  const filteredCategories = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");
    if (!normalizedSearch) return categories.data ?? [];
    return (categories.data ?? []).filter((category) =>
      [category.name, category.slug, category.description ?? ""]
        .join(" ")
        .toLocaleLowerCase("pt-BR")
        .includes(normalizedSearch),
    );
  }, [categories.data, search]);

  const moveCategory = (categoryId: string, direction: "up" | "down") => {
    const allCategories = categories.data;
    if (!allCategories || reorderCategories.isPending || search.trim()) return;

    const from = allCategories.findIndex(
      (category) => category.id === categoryId,
    );
    const to = from + (direction === "up" ? -1 : 1);
    if (from < 0 || to < 0 || to >= allCategories.length) return;

    const reordered = [...allCategories];
    [reordered[from], reordered[to]] = [reordered[to], reordered[from]];
    reorderCategories.mutate({ ids: reordered.map((category) => category.id) });
  };

  const activeCount = (categories.data ?? []).filter(
    (category) => category.active,
  ).length;
  const productCount = (categories.data ?? []).reduce(
    (sum, category) => sum + category._count.products,
    0,
  );

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            <Tags className="size-4" />
            Administração
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Categorias
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Crie e organize as categorias usadas no catálogo da loja.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setFormOpen(true)}
          className="gap-2"
        >
          <Plus className="size-4" />
          Nova categoria
        </Button>
      </header>
      {formOpen && (
        <CategoryFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
        />
      )}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          {
            title: "Categorias cadastradas",
            value: categories.data?.length,
            icon: Tags,
          },
          {
            title: "Categorias ativas",
            value: categories.data ? activeCount : undefined,
            icon: FolderOpen,
          },
          {
            title: "Produtos vinculados",
            value: categories.data ? productCount : undefined,
            icon: ImageIcon,
          },
        ].map(({ title, value, icon: Icon }) => (
          <div
            key={title}
            className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{title}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">
                {value ?? "—"}
              </p>
            </div>
            <span className="grid size-10 place-items-center rounded-xl bg-zinc-100 dark:bg-zinc-900">
              <Icon className="size-5 text-zinc-500" aria-hidden="true" />
            </span>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 p-4 dark:border-zinc-800">
          <div>
            <h2 className="font-semibold">Todas as categorias</h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Categorias com produtos não podem ser excluídas; desative-as para
              ocultá-las do catálogo.
            </p>
          </div>
          <label className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar categoria..."
              aria-label="Buscar categorias"
              className="pl-9"
            />
          </label>
        </div>

        {categories.isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="h-20 w-full" />
            ))}
          </div>
        ) : categories.error ? (
          <div className="p-8 text-center">
            <p className="font-medium">Não foi possível carregar categorias.</p>
            <p className="mt-1 text-sm text-zinc-500">
              {categories.error.message}
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={() => void categories.refetch()}
            >
              Tentar novamente
            </Button>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="mb-4 grid size-12 place-items-center rounded-full bg-zinc-100 dark:bg-zinc-900">
              <Tags className="size-6 text-zinc-500" />
            </span>
            <h2 className="font-semibold">
              {search ? "Nenhuma categoria encontrada" : "Ainda não há categorias"}
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {search
                ? "Tente alterar o termo da busca."
                : "Crie uma categoria para organizar os produtos da loja."}
            </p>
            {!search && (
              <Button
                type="button"
                className="mt-4"
                onClick={() => setFormOpen(true)}
              >
                Criar categoria
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[800px] text-sm">
                <thead className="bg-zinc-50 text-left text-xs text-zinc-500 dark:bg-zinc-900/60 dark:text-zinc-400">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Categoria
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Slug
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Produtos
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-3 text-right font-medium">
                      Gerenciar
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {filteredCategories.map((category) => {
                    const index =
                      categories.data?.findIndex(
                        (item) => item.id === category.id,
                      ) ?? -1;

                    return (
                      <tr
                        key={category.id}
                        className="transition-colors hover:bg-zinc-50/70 dark:hover:bg-zinc-900/40"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <CategoryImage
                              src={category.image}
                              name={category.name}
                            />
                            <div className="min-w-0">
                              <p className="font-medium">{category.name}</p>
                              <p className="max-w-md truncate text-xs text-zinc-500">
                                {category.description || "Sem descrição"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-zinc-500">
                          /{category.slug}
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          {category._count.products}
                        </td>
                        <td className="px-4 py-3">
                          <CategoryStatus active={category.active} />
                        </td>
                        <td className="px-4 py-3">
                          <CategoryActions
                            category={category}
                            canMoveUp={!search.trim() && index > 0}
                            canMoveDown={
                              !search.trim() &&
                              index >= 0 &&
                              index < (categories.data?.length ?? 0) - 1
                            }
                            onMove={(direction) =>
                              moveCategory(category.id, direction)
                            }
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-zinc-100 md:hidden dark:divide-zinc-800">
              {filteredCategories.map((category) => {
                const index =
                  categories.data?.findIndex((item) => item.id === category.id) ??
                  -1;

                return (
                  <li key={category.id} className="space-y-3 p-4">
                    <div className="flex items-center gap-3">
                      <CategoryImage
                        src={category.image}
                        name={category.name}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{category.name}</p>
                        <p className="truncate font-mono text-xs text-zinc-500">
                          /{category.slug}
                        </p>
                      </div>
                      <CategoryStatus active={category.active} />
                    </div>
                    <p className="line-clamp-2 text-xs text-zinc-500">
                      {category.description || "Sem descrição"}
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-zinc-500">
                        {category._count.products} produto(s)
                      </span>
                      <CategoryActions
                        category={category}
                        canMoveUp={!search.trim() && index > 0}
                        canMoveDown={
                          !search.trim() &&
                          index >= 0 &&
                          index < (categories.data?.length ?? 0) - 1
                        }
                        onMove={(direction) =>
                          moveCategory(category.id, direction)
                        }
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
        {!categories.isLoading && !categories.error && categories.data && (
          <footer className="border-t border-zinc-200 px-4 py-3 text-xs text-zinc-500 dark:border-zinc-800">
            Mostrando {filteredCategories.length} de {categories.data.length}{" "}
            categorias
          </footer>
        )}
      </section>
    </div>
  );
}

function CategoryImage({ src, name }: { src: string | null; name: string }) {
  return (
    <div className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900">
      {src ? (
        <Image
          src={src}
          alt={name}
          width={48}
          height={48}
          unoptimized
          className="size-full object-cover"
        />
      ) : (
        <Tags className="size-5 text-zinc-400 dark:text-zinc-600" />
      )}
    </div>
  );
}

function CategoryStatus({ active }: { active: boolean }) {
  return (
    <Badge
      variant={active ? "secondary" : "outline"}
      className={
        active
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300"
          : "text-zinc-500"
      }
    >
      {active ? "Ativa" : "Inativa"}
    </Badge>
  );
}
