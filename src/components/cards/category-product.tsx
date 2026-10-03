"use client";

import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { CategoryGridSkeleton } from "@/components/skeletons/catalog-skeletons";
import { ScrollReveal } from "@/components/scroll-reveal";

// Paleta de cores por categoria (fundo claro + texto/seta escuros o suficiente
// para manter contraste em cima da cor pastel). Se precisar de mais tons,
// basta acrescentar novas entradas no array.
const CATEGORY_COLORS = [
  {
    bg: "bg-amber-100",
    panel: "bg-amber-50/70",
    text: "text-amber-900",
    arrow: "text-amber-600",
  },
  {
    bg: "bg-rose-100",
    panel: "bg-rose-50/70",
    text: "text-rose-900",
    arrow: "text-rose-600",
  },
  {
    bg: "bg-orange-100",
    panel: "bg-orange-50/70",
    text: "text-orange-900",
    arrow: "text-orange-600",
  },
  {
    bg: "bg-emerald-100",
    panel: "bg-emerald-50/70",
    text: "text-emerald-900",
    arrow: "text-emerald-600",
  },
  {
    bg: "bg-sky-100",
    panel: "bg-sky-50/70",
    text: "text-sky-900",
    arrow: "text-sky-600",
  },
  {
    bg: "bg-violet-100",
    panel: "bg-violet-50/70",
    text: "text-violet-900",
    arrow: "text-violet-600",
  },
] as const;

// Hash simples e determinístico: a mesma slug sempre cai na mesma cor,
// independente da ordem em que as categorias vierem da API.
function getCategoryColor(slug: string) {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = slug.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % CATEGORY_COLORS.length;
  return CATEGORY_COLORS[index];
}

const CategoryProduct = () => {
  const trpc = useTRPC();

  const { data, isLoading, isError, error } = useQuery(
    trpc.category.list.queryOptions({
      take: 5,
      withCount: true,
    }),
  );

  if (isLoading) {
    return (
      <div className="mt-4 w-full">
        <div className="pb-2.5">
          <span className="text-base text-amber-500">ESCOLHA SUA CATEGORIA</span>
          <h2 className="font-semibold text-2xl">O que você vai pedir hoje?</h2>
        </div>
        <div className="mt-3.5">
          <CategoryGridSkeleton count={5} />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full p-2 mx-auto h-full mt-3 max-w-7xl">
        <p className="text-sm text-red-500">
          Não foi possível carregar as categorias.{" "}
          {error instanceof Error ? error.message : ""}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full mt-4">
      <div className="pb-2.5 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-base text-amber-500">
            ESCOLHA SUA CATEGORIA
          </span>
          <h2 className="font-semibold text-2xl">O que você vai pedir hoje?</h2>
        </div>
        <div>
          <Link
            href="/categorias"
            aria-label="categorias"
            className="flex items-center gap-1.5"
          >
            <span className="text-amber-500 text-base">
              Ver todas as Categorias
            </span>
            <ArrowRight size={20} className="text-amber-500" />
          </Link>
        </div>
      </div>

      <div className="mt-3.5">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {data?.map((c, index) => {
            const color = getCategoryColor(c.slug);

            return (
              <ScrollReveal key={c.id} delay={index * 45}>
                <Link
                  href={`/categorias/${encodeURIComponent(c.id)}`}
                  aria-label={c.name}
                  className={`group relative block h-44 md:h-52 overflow-hidden rounded-2xl ${color.bg} transition-transform duration-200 hover:-translate-y-1 hover:shadow-md`}
                >
                  {c.image ? (
                    <Image
                      src={c.image}
                      alt={c.name}
                      className="object-cover transition-transform duration-200 group-hover:scale-105"
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                    />
                  ) : (
                    <div
                      className={`flex h-full w-full items-center justify-center text-center text-lg font-semibold ${color.text}`}
                    >
                      {c.name}
                    </div>
                  )}

                  <div
                    className={`absolute inset-x-1 bottom-1 flex flex-col gap-0.5 rounded-xl border border-white/40 px-3 py-2.5 shadow-sm backdrop-blur-md ${color.panel}`}
                  >
                    <h3
                      className={`truncate text-sm font-semibold ${color.text}`}
                    >
                      {c.name}
                    </h3>
                    <div className="flex items-center justify-between text-xs">
                      <span className={color.text}>{c.productCount} opções</span>
                      <ArrowRight size={14} className={color.arrow} />
                    </div>
                  </div>
                </Link>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CategoryProduct;
