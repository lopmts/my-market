"use client";

import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import {
  Beef,
  CakeSlice,
  Check,
  CupSoda,
  Flame,
  Headphones,
  Heart,
  Pizza,
  Salad,
  ShieldCheck,
  ShoppingCart,
  Star,
  Truck,
  UtensilsCrossed,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useCartNotificationStore } from "@/lib/cart-notification-store";
import { useCartItem, useCartStore } from "@/store/cart-store";

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const categoryIcons: Record<string, React.ElementType> = {
  hamburgueres: Beef,
  pizzas: Pizza,
  "pizzas-doces": Pizza,
  porcoes: Salad,
  bebidas: CupSoda,
  sobremesas: CakeSlice,
};

type Product = {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  price: number;
  categoryId?: string;
  rating: number;
  reviewsCount: number;
  reviewsCountLabel: string;
};

/* ------------------------------ Carrinho ------------------------------ */

// mesma lógica do cardápio: trava se já está no carrinho e dispara a notificação
const AddToCartButton = ({ product }: { product: Product }) => {
  const itemInCart = useCartItem(product.id);
  const isInCart = !!itemInCart;
  const addItem = useCartStore((s) => s.addItem);
  const notify = useCartNotificationStore((s) => s.notify);

  const handleAddToCart = () => {
    if (isInCart) return;

    addItem({
      id: product.id,
      name: product.name,
      image: product.image,
      price: product.price,
      categoryId: product.categoryId,
    });

    const updated = useCartStore.getState().getItem(product.id);
    if (updated) {
      notify({
        productId: updated.id,
        productName: updated.name,
        productImage: updated.image,
        totalQuantity: updated.quantity,
        totalPrice: updated.price * updated.quantity,
      });
    }
  };

  return (
    <Button
      size="sm"
      className="bg-amber-500 hover:bg-amber-600 dark:text-white disabled:opacity-70 disabled:cursor-not-allowed"
      onClick={handleAddToCart}
      disabled={isInCart}
      aria-label={
        isInCart
          ? `${product.name} já está no carrinho`
          : `Adicionar ${product.name} ao carrinho`
      }
    >
      {isInCart ? (
        <>
          <Check size={16} />
          <span>No carrinho ({itemInCart.quantity})</span>
        </>
      ) : (
        <>
          <ShoppingCart size={16} />
          <span>Adicionar</span>
        </>
      )}
    </Button>
  );
};

/* ------------------------------ Card ------------------------------ */

const BestSellerCard = ({
  product,
  rank,
}: {
  product: Product;
  rank: number;
}) => (
  <div className="flex flex-col overflow-hidden rounded-xl border bg-card p-2.5 shadow-sm">
    <div className="relative aspect-4/3 w-full overflow-hidden rounded-lg bg-zinc-200 dark:bg-zinc-800">
      {product.image ? (
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 1024px) 50vw, 240px"
          className="object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-zinc-400">
          <UtensilsCrossed className="size-8" />
        </div>
      )}
      <span className="absolute left-0 top-2 rounded-r-md bg-orange-600 px-2 py-0.5 text-[11px] font-semibold text-white shadow">
        {rank}º Mais vendido
      </span>
    </div>

    <div className="mt-3 flex flex-1 flex-col">
      <h3 className="truncate text-sm font-semibold">{product.name}</h3>
      <p className="mt-1 line-clamp-2 min-h-8 text-xs text-muted-foreground">
        {product.description}
      </p>

      <div className="mt-2 flex items-center gap-1 text-xs">
        {product.reviewsCount > 0 ? (
          <>
            <Star className="size-3.5 fill-amber-400 text-amber-400" />
            <span className="font-semibold">{product.rating.toFixed(1)}</span>
            <span className="text-muted-foreground">
              ({product.reviewsCountLabel})
            </span>
          </>
        ) : (
          <span className="text-muted-foreground">Sem avaliações</span>
        )}
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3">
        <span className="text-base font-bold text-orange-600">
          {brl(product.price)}
        </span>
        <AddToCartButton product={product} />
      </div>
    </div>
  </div>
);

/* ------------------------------ Sidebar ------------------------------ */

const CategoriesCard = () => {
  const trpc = useTRPC();
  const { data: categories = [] } = useQuery(
    trpc.category.list.queryOptions({ withCount: true, take: 20 }),
  );

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <UtensilsCrossed className="size-4 text-orange-600" />
        <h2 className="font-bold">Categorias</h2>
      </div>
      <ul className="space-y-1">
        {categories.map((c, i) => {
          const Icon = categoryIcons[c.slug] ?? UtensilsCrossed;
          return (
            <li key={c.id}>
              <Link
                href={`/cardapio?categoria=${c.slug}`}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  i === 0
                    ? "bg-orange-50 text-orange-600 dark:bg-orange-950/40"
                    : "hover:bg-muted"
                }`}
              >
                <Icon className="size-4" />
                <span className="flex-1">{c.name}</span>
                {"productCount" in c && (
                  <span className="text-xs">{c.productCount}</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

const ComboCard = () => (
  <div className="relative overflow-hidden rounded-xl bg-zinc-900 p-5 text-white">
    <Image
      src="/cardapio-banner.jpg"
      alt="Combo especial"
      fill
      sizes="320px"
      className="object-cover opacity-40"
    />
    <div className="absolute inset-0 bg-linear-to-r from-black/90 via-black/70 to-transparent" />
    <div className="relative">
      <h3 className="text-lg font-bold">Combo Especial</h3>
      <p className="text-xs text-zinc-300">X-Bacon + Batata + Refri</p>
      <p className="mt-2 text-2xl font-extrabold text-orange-500">R$ 49,90</p>
      <Link
        href="/promocoes"
        className="mt-3 inline-flex items-center gap-1 rounded-md border border-orange-500 px-3 py-1.5 text-xs font-medium text-orange-400 transition hover:bg-orange-600 hover:text-white"
      >
        Ver combo →
      </Link>
    </div>
  </div>
);

const perks = [
  {
    icon: Truck,
    title: "Entrega rápida e segura",
    text: "Seu pedido chega quentinho!",
  },
  {
    icon: ShieldCheck,
    title: "Pagamento seguro",
    text: "Diversas formas de pagamento.",
  },
  {
    icon: Headphones,
    title: "Suporte 24h",
    text: "Estamos sempre disponíveis.",
  },
];

const PerksCard = () => (
  <div className="space-y-4 rounded-xl border bg-card p-4 shadow-sm">
    {perks.map(({ icon: Icon, title, text }) => (
      <div key={title} className="flex items-center gap-3">
        <Icon className="size-6 shrink-0 text-zinc-700 dark:text-zinc-300" />
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground">{text}</p>
        </div>
      </div>
    ))}
  </div>
);

/* ------------------------------ Página ------------------------------ */

const highlights = [
  { icon: Star, label: "Qualidade garantida" },
  { icon: Truck, label: "Entrega rápida" },
  { icon: Heart, label: "Sabor incomparável" },
];

export const BestSellersContent = () => {
  const trpc = useTRPC();
  const { data: products = [], isLoading } = useQuery(
    trpc.product.bestSellers.queryOptions({ limit: 8 }),
  );

  return (
    <div className="min-h-screen w-full">
      {/* Banner */}
      <div className="relative h-56 w-full overflow-hidden md:h-80">
        <Image
          src="/cardapio-banner.jpg"
          alt="Mais vendidos"
          fill
          priority
          quality={90}
          className="object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-r from-black/90 via-black/60 to-transparent" />
        <div className="relative mx-auto h-full w-full max-w-7xl px-4">
          <div className="flex h-full max-w-xl flex-col justify-center gap-2 text-white">
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase text-orange-500 md:text-sm">
              <Flame className="size-4" />
              Os queridinhos da nossa casa
            </span>
            <h1 className="text-4xl font-extrabold md:text-6xl">
              Mais <span className="text-orange-500">Vendidos</span>
            </h1>
            <p className="text-sm text-zinc-200 md:text-base">
              Os produtos que todos amam! Confira os itens mais pedidos e
              aproveite o melhor do nosso cardápio.
            </p>
            <div className="mt-2 hidden flex-wrap gap-x-6 gap-y-2 sm:flex">
              {highlights.map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="flex items-center gap-2 text-xs text-zinc-200"
                >
                  <Icon className="size-4 text-orange-500" />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl p-4">
        <div className="mt-2 grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* Coluna principal */}
          <div className="min-w-0">
            <div className="mb-5 flex items-center gap-3">
              <Flame className="size-8 text-orange-600" />
              <div>
                <h2 className="text-2xl font-bold">Mais Vendidos</h2>
                <p className="text-sm text-muted-foreground">
                  Os pratos que fazem mais sucesso por aqui!
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-72 animate-pulse rounded-xl bg-muted"
                  />
                ))}
              </div>
            ) : products.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">
                Ainda não há produtos mais vendidos.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((p, i) => (
                  <BestSellerCard key={p.id} product={p} rank={i + 1} />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
            <CategoriesCard />
            <ComboCard />
            <PerksCard />
          </aside>
        </div>
      </div>
    </div>
  );
};
