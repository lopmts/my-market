import { notFound } from "next/navigation";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { siteUrl } from "@/lib/site-url";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Star, UtensilsCrossed } from "lucide-react";

type CategoryPageProps = {
  params: Promise<{ id: string }>;
};

const getCategory = cache(async (id: string) => {
  return prisma.category.findFirst({
    where: { id, active: true },
    include: {
      products: {
        where: { active: true },
        orderBy: [{ featured: "desc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          description: true,
          image: true,
          price: true,
          rating: true,
          reviewsCount: true,
          updatedAt: true,
        },
      },
    },
  });
});

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { id } = await params;
  const category = await getCategory(id);

  if (!category) {
    return {
      title: "Categoria não encontrada | My Market",
      robots: { index: false, follow: false },
    };
  }

  const title = `${category.name} | My Market`;
  const description =
    category.description?.trim().slice(0, 160) ||
    `Confira os produtos da categoria ${category.name} no My Market e faça seu pedido online.`;
  const url = new URL(
    `/categorias/${encodeURIComponent(category.id)}`,
    siteUrl,
  ).toString();
  const image = category.image ?? category.products[0]?.image ?? undefined;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      ...(image && { images: [{ url: image, alt: category.name }] }),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      ...(image && { images: [image] }),
    },
  };
}

const formatPrice = (price: number) =>
  price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { id } = await params;
  const category = await getCategory(id);

  if (!category) notFound();

  const heroImage = category.image ?? category.products[0]?.image;

  return (
    <main className="min-h-screen bg-stone-50 pb-12 dark:bg-background">
      <section className="relative isolate h-52 overflow-hidden sm:h-64 lg:h-72">
        {heroImage ? (
          <Image
            src={heroImage}
            alt={category.name}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-orange-700 to-red-950" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/10" />
        <div className="relative mx-auto flex h-full max-w-7xl items-center px-5 sm:px-8">
          <div className="max-w-2xl text-white">
            <Link
              href="/categorias"
              className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-white/80 transition hover:text-white"
            >
              <ArrowLeft className="size-4" />
              Todas as categorias
            </Link>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              {category.name}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-white/85 sm:text-base">
              {category.description ||
                `Explore os produtos da categoria ${category.name} e escolha seus favoritos.`}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-widest text-orange-600">
            Escolha o seu favorito
          </p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
            Produtos de {category.name}
          </h2>
        </div>

        {category.products.length ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {category.products.map((product) => (
              <Link
                key={product.id}
                href={`/cardapio/${encodeURIComponent(product.id)}`}
                className="group overflow-hidden rounded-2xl border bg-card shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
              >
                <div className="relative h-48 overflow-hidden bg-muted">
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-orange-50 dark:bg-orange-950/30">
                      <UtensilsCrossed className="size-12 text-orange-500/70" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-bold">{product.name}</h3>
                      <p className="mt-1 line-clamp-2 min-h-10 text-sm text-muted-foreground">
                        {product.description || "Uma escolha deliciosa para você."}
                      </p>
                    </div>
                    <ArrowRight className="mt-1 size-4 shrink-0 text-orange-600 transition group-hover:translate-x-1" />
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t pt-3">
                    <span className="font-bold text-orange-600">
                      {formatPrice(product.price.toNumber())}
                    </span>
                    {product.reviewsCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                        <Star className="size-4 fill-amber-400 text-amber-400" />
                        {product.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed bg-card px-6 py-16 text-center">
            <UtensilsCrossed className="mx-auto size-10 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">
              Nenhum produto disponível
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Ainda não há produtos ativos nesta categoria.
            </p>
            <Link
              href="/categorias"
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-orange-600 hover:text-orange-700"
            >
              Explorar outras categorias <ArrowRight className="size-4" />
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
