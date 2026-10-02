"use client";

import { ProductActions } from "@/components/admin/products/product-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Package,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Tag,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const PAGE_SIZE = 12;
const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

type ProductFilters = {
  search: string;
  categoryId: string;
  status: "all" | "active" | "inactive";
  featured: "all" | "yes" | "no";
  promotion: "all" | "yes" | "no";
};

const initialFilters: ProductFilters = {
  search: "",
  categoryId: "",
  status: "all",
  featured: "all",
  promotion: "all",
};

function ProductImage({ src, name }: { src: string | null; name: string }) {
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
        <ImageIcon
          aria-hidden="true"
          className="size-5 text-zinc-400 dark:text-zinc-600"
        />
      )}
    </div>
  );
}

function ProductStatus({ active }: { active: boolean }) {
  return (
    <Badge
      variant={active ? "secondary" : "outline"}
      className={
        active
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300"
          : "text-zinc-500"
      }
    >
      {active ? "Ativo" : "Inativo"}
    </Badge>
  );
}

export function AdminProductsPage() {
  const trpc = useTRPC();
  const [draftSearch, setDraftSearch] = useState("");
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);

  const categories = useQuery(trpc.category.adminList.queryOptions());
  const products = useQuery(
    trpc.product.adminList.queryOptions({
      search: filters.search || undefined,
      categoryId: filters.categoryId || undefined,
      active:
        filters.status === "all" ? undefined : filters.status === "active",
      featured:
        filters.featured === "all" ? undefined : filters.featured === "yes",
      isPromotion:
        filters.promotion === "all" ? undefined : filters.promotion === "yes",
      page,
      limit: PAGE_SIZE,
    }),
  );

  const applySearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setFilters((current) => ({ ...current, search: draftSearch.trim() }));
  };

  const resetFilters = () => {
    setDraftSearch("");
    setFilters(initialFilters);
    setPage(1);
  };

  const changeFilter = <K extends keyof ProductFilters>(
    key: K,
    value: ProductFilters[K],
  ) => {
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const refreshPageAfterDelete = () => {
    if (products.data?.items.length === 1 && page > 1) {
      setPage((current) => current - 1);
    }
  };

  const hasActiveFilters =
    filters.search !== "" ||
    filters.categoryId !== "" ||
    filters.status !== "all" ||
    filters.featured !== "all" ||
    filters.promotion !== "all";
  const productData = products.data;
  const categoriesData = categories.data ?? [];

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            <Package className="size-4" />
            Administração
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Produtos
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Gerencie o catálogo, disponibilidade e destaques da sua loja.
          </p>
        </div>
        <Button
          nativeButton={false}
          render={<Link href="/admin/product/form" />}
          className="gap-2"
        >
          <Plus className="size-4" />
          Novo produto
        </Button>
      </header>

      <section
        aria-label="Resumo do catálogo"
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        {[
          {
            label: "Todos os produtos",
            count: productData?.stats.all,
            active:
              filters.status === "all" &&
              filters.featured === "all" &&
              filters.promotion === "all",
            onClick: () => {
              changeFilter("status", "all");
              changeFilter("featured", "all");
              changeFilter("promotion", "all");
            },
            icon: Package,
          },
          {
            label: "Ativos",
            count: productData?.stats.active,
            active: filters.status === "active",
            onClick: () => changeFilter("status", "active"),
            icon: Sparkles,
          },
          {
            label: "Em destaque",
            count: productData?.stats.featured,
            active: filters.featured === "yes",
            onClick: () =>
              changeFilter(
                "featured",
                filters.featured === "yes" ? "all" : "yes",
              ),
            icon: Sparkles,
          },
          {
            label: "Em promoção",
            count: productData?.stats.promotions,
            active: filters.promotion === "yes",
            onClick: () =>
              changeFilter(
                "promotion",
                filters.promotion === "yes" ? "all" : "yes",
              ),
            icon: Tag,
          },
        ].map(({ label, count, active, onClick, icon: Icon }) => (
          <button
            key={label}
            type="button"
            onClick={onClick}
            className={`rounded-xl border p-4 text-left transition-colors ${
              active
                ? "border-zinc-900 bg-zinc-100 dark:border-zinc-100 dark:bg-zinc-800"
                : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
            }`}
          >
            <span className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 sm:text-sm">
                {label}
              </span>
              <Icon className="size-4 text-zinc-400" aria-hidden="true" />
            </span>
            <span className="mt-2 block text-2xl font-bold tabular-nums">
              {count ?? "—"}
            </span>
          </button>
        ))}
      </section>

      <section aria-label="Filtrar por categoria">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Categorias</h2>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {categoriesData.length} no catálogo
          </span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          <button
            type="button"
            onClick={() => changeFilter("categoryId", "")}
            className={`min-w-24 rounded-xl border px-4 py-3 text-left transition-colors ${
              !filters.categoryId
                ? "border-zinc-900 bg-zinc-100 dark:border-zinc-100 dark:bg-zinc-800"
                : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
            }`}
          >
            <Package className="mb-2 size-4 text-zinc-500" />
            <span className="block text-sm font-medium">Todas</span>
            <span className="text-xs text-zinc-500">
              {productData?.stats.all ?? "—"}
            </span>
          </button>
          {categoriesData.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => changeFilter("categoryId", category.id)}
              className={`min-w-28 rounded-xl border px-4 py-3 text-left transition-colors ${
                filters.categoryId === category.id
                  ? "border-zinc-900 bg-zinc-100 dark:border-zinc-100 dark:bg-zinc-800"
                  : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
              }`}
            >
              <Tag className="mb-2 size-4 text-zinc-500" />
              <span className="block max-w-36 truncate text-sm font-medium">
                {category.name}
              </span>
              <span className="text-xs text-zinc-500">
                {category._count.products}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <form
          onSubmit={applySearch}
          className="grid gap-3 border-b border-zinc-200 p-4 dark:border-zinc-800 sm:grid-cols-2 lg:grid-cols-[minmax(220px,1.5fr)_repeat(4,minmax(130px,1fr))_auto]"
        >
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
              Buscar
            </span>
            <span className="relative block">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
              <Input
                value={draftSearch}
                onChange={(event) => setDraftSearch(event.target.value)}
                placeholder="Nome ou descrição..."
                className="pl-9"
              />
            </span>
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
              Categoria
            </span>
            <select
              value={filters.categoryId}
              onChange={(event) =>
                changeFilter("categoryId", event.target.value)
              }
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm dark:bg-input/30"
            >
              <option value="">Todas as categorias</option>
              {categoriesData.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <FilterSelect
            label="Status"
            value={filters.status}
            onChange={(value) =>
              changeFilter("status", value as ProductFilters["status"])
            }
            options={[
              ["all", "Todos"],
              ["active", "Ativos"],
              ["inactive", "Inativos"],
            ]}
          />
          <FilterSelect
            label="Destaque"
            value={filters.featured}
            onChange={(value) =>
              changeFilter("featured", value as ProductFilters["featured"])
            }
            options={[
              ["all", "Todos"],
              ["yes", "Em destaque"],
              ["no", "Sem destaque"],
            ]}
          />
          <FilterSelect
            label="Promoção"
            value={filters.promotion}
            onChange={(value) =>
              changeFilter("promotion", value as ProductFilters["promotion"])
            }
            options={[
              ["all", "Todos"],
              ["yes", "Em promoção"],
              ["no", "Sem promoção"],
            ]}
          />
          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-1">
            <Button type="submit" className="flex-1 gap-2">
              <SlidersHorizontal className="size-4" />
              Buscar
            </Button>
            {hasActiveFilters && (
              <Button
                type="button"
                variant="outline"
                aria-label="Limpar filtros"
                title="Limpar filtros"
                onClick={resetFilters}
              >
                <X className="size-4" />
              </Button>
            )}
          </div>
        </form>

        {products.isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="h-16 w-full" />
            ))}
          </div>
        ) : products.error ? (
          <div className="p-8 text-center">
            <p className="font-medium">Não foi possível carregar produtos.</p>
            <p className="mt-1 text-sm text-zinc-500">
              {products.error.message}
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => void products.refetch()}
            >
              Tentar novamente
            </Button>
          </div>
        ) : !productData?.items.length ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="mb-4 grid size-12 place-items-center rounded-full bg-zinc-100 dark:bg-zinc-900">
              <Package className="size-6 text-zinc-500" />
            </span>
            <h2 className="font-semibold">Nenhum produto encontrado</h2>
            <p className="mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
              Ajuste os filtros ou cadastre um novo produto para começar.
            </p>
            {hasActiveFilters ? (
              <Button
                type="button"
                variant="outline"
                className="mt-4"
                onClick={resetFilters}
              >
                Limpar filtros
              </Button>
            ) : (
              <Button
                nativeButton={false}
                render={<Link href="/admin/product/form" />}
                className="mt-4 gap-2"
              >
                <Plus className="size-4" />
                Novo produto
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="bg-zinc-50 text-left text-xs text-zinc-500 dark:bg-zinc-900/60 dark:text-zinc-400">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Produto
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Categoria
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Preço
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Avaliação
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Destaque
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Promoção
                    </th>
                    <th scope="col" className="px-4 py-3 text-right font-medium">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {productData.items.map((product) => (
                    <tr
                      key={product.id}
                      className="transition-colors hover:bg-zinc-50/70 dark:hover:bg-zinc-900/40"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <ProductImage src={product.image} name={product.name} />
                          <div className="min-w-0">
                            <p className="max-w-64 truncate font-medium">
                              {product.name}
                            </p>
                            <p className="text-xs text-zinc-500">
                              {product.orderItemsCount} pedido(s)
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                        {product.category.name}
                      </td>
                      <td className="px-4 py-3 font-medium tabular-nums">
                        {currency.format(product.price)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1">
                          <span className="text-amber-500">★</span>
                          {product.rating.toFixed(1)}
                        </span>
                        <span className="ml-1 text-xs text-zinc-500">
                          ({product.reviewsCount})
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <ProductStatus active={product.active} />
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                        {product.featured ? "Sim" : "Não"}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                        {product.isPromotion ? "Sim" : "Não"}
                      </td>
                      <td className="px-4 py-3">
                        <ProductActions
                          product={product}
                          onDeleted={refreshPageAfterDelete}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-zinc-100 md:hidden dark:divide-zinc-800">
              {productData.items.map((product) => (
                <li key={product.id} className="space-y-3 p-4">
                  <div className="flex items-center gap-3">
                    <ProductImage src={product.image} name={product.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {product.name}
                      </p>
                      <p className="truncate text-xs text-zinc-500">
                        {product.category.name}
                      </p>
                    </div>
                    <ProductActions
                      product={product}
                      onDeleted={refreshPageAfterDelete}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-600 dark:text-zinc-300">
                    <span className="font-semibold">
                      {currency.format(product.price)}
                    </span>
                    <span>
                      <span className="text-amber-500">★</span>{" "}
                      {product.rating.toFixed(1)} ({product.reviewsCount})
                    </span>
                    <ProductStatus active={product.active} />
                    {product.featured && <Badge variant="outline">Destaque</Badge>}
                    {product.isPromotion && (
                      <Badge variant="outline">Promoção</Badge>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 px-4 py-3 text-xs text-zinc-500 dark:border-zinc-800">
              <span>
                Mostrando {Math.min((page - 1) * PAGE_SIZE + 1, productData.total)}-
                {Math.min(page * PAGE_SIZE, productData.total)} de{" "}
                {productData.total} produtos
              </span>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label="Página anterior"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  <ChevronLeft />
                </Button>
                <span className="min-w-16 text-center">
                  Página {productData.page} de {productData.pageCount}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label="Próxima página"
                  disabled={page >= productData.pageCount}
                  onClick={() =>
                    setPage((current) =>
                      Math.min(productData.pageCount, current + 1),
                    )
                  }
                >
                  <ChevronRight />
                </Button>
              </div>
            </footer>
          </>
        )}
      </section>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm dark:bg-input/30"
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}
