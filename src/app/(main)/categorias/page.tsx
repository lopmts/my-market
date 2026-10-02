import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, UtensilsCrossed } from "lucide-react";

export const metadata: Metadata = {
  title: "Categorias | My Market",
  description:
    "Explore as categorias do My Market e encontre seus pratos favoritos.",
  alternates: { canonical: "/categorias" },
  openGraph: {
    title: "Categorias | My Market",
    description:
      "Explore as categorias do My Market e encontre seus pratos favoritos.",
    url: "/categorias",
    type: "website",
  },
};

const categoryColors = [
  "bg-orange-500",
  "bg-red-500",
  "bg-amber-500",
  "bg-emerald-600",
  "bg-sky-500",
  "bg-violet-500",
  "bg-pink-500",
  "bg-teal-600",
];

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    where: { active: true },
    orderBy: [{ position: "asc" }, { name: "asc" }],
    include: {
      products: {
        where: { active: true },
        select: { image: true },
        orderBy: { name: "asc" },
        take: 1,
      },
      _count: { select: { products: { where: { active: true } } } },
    },
  });

  const heroImage = "/cardapio-banner.jpg";

  return (
    <main className="min-h-screen bg-stone-50 pb-12 dark:bg-background">
      <section className="relative isolate h-52 overflow-hidden sm:h-64 lg:h-72">
        <Image
          src={heroImage}
          alt="Pratos do cardápio do My Market"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/10" />
        <div className="relative mx-auto flex h-full max-w-7xl items-center px-5 sm:px-8">
          <div className="max-w-xl text-white">
            <span className="inline-flex rounded-full bg-orange-500 px-3 py-1 text-xs font-bold uppercase tracking-wider">
              Nosso cardápio
            </span>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
              Categorias
            </h1>
            <p className="mt-2 max-w-md text-sm text-white/85 sm:text-base">
              Explore nossas categorias e encontre seus pratos favoritos.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-orange-600">
              Feito para você
            </p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
              Todas as categorias
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {categories.length} categorias para explorar
          </p>
        </div>

        {categories.length ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {categories.map((category, index) => {
              const image = category.image ?? category.products[0]?.image;

              return (
                <Link
                  key={category.id}
                  href={`/categorias/${encodeURIComponent(category.id)}`}
                  className="group overflow-hidden rounded-2xl border bg-card shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                >
                  <div className="relative h-40 overflow-hidden bg-muted sm:h-44">
                    {image ? (
                      <Image
                        src={image}
                        alt={category.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-orange-100 to-amber-50 dark:from-orange-950 dark:to-zinc-900">
                        <UtensilsCrossed className="size-12 text-orange-500/70" />
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent" />
                    <span
                      className={`absolute bottom-0 left-5 flex size-12 translate-y-1/2 items-center justify-center rounded-full border-4 border-card text-white shadow-md ${categoryColors[index % categoryColors.length]}`}
                    >
                      <UtensilsCrossed className="size-5" />
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 px-5 pb-4 pt-5">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-bold">
                        {category.name}
                      </h3>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {category._count.products}{" "}
                        {category._count.products === 1 ? "opção" : "opções"}
                      </p>
                    </div>
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full border text-orange-600 transition group-hover:border-orange-500 group-hover:bg-orange-500 group-hover:text-white">
                      <ArrowRight className="size-4" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed bg-card px-6 py-16 text-center">
            <UtensilsCrossed className="mx-auto size-10 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">
              Nenhuma categoria disponível
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Volte em breve para conferir as novidades do cardápio.
            </p>
          </div>
        )}

        <div className="mt-8 overflow-hidden rounded-2xl bg-gradient-to-r from-orange-600 to-red-500 px-6 py-6 text-white sm:px-8">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-bold">Já sabe o que vai pedir?</h2>
              <p className="mt-1 text-sm text-white/85">
                Veja todo o cardápio e encontre seu próximo prato favorito.
              </p>
            </div>
            <Link
              href="/cardapio"
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-orange-700 transition hover:bg-orange-50"
            >
              Ver cardápio <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
