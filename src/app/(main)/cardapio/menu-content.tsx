"use client";

import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Beef,
  CakeSlice,
  Check,
  CupSoda,
  Minus,
  Pizza,
  Plus,
  Salad,
  ShoppingCart,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useCartNotificationStore } from "@/lib/cart-notification-store";
import {
  useCartHasHydrated,
  useCartItem,
  useCartItems,
  useCartStore,
  useCartSubtotal,
} from "@/store/cart-store";
import { useState } from "react"; // useMemo não é mais necessário, pode remover

const DELIVERY_FEE = 5;

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// ícone por slug da categoria (ajuste conforme seus slugs)
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
};

/* ------------------------------ Imagem ------------------------------ */

const ProductImage = ({
  src,
  alt,
  className = "",
}: {
  src: string | null;
  alt: string;
  className?: string;
}) => (
  <div
    className={`relative shrink-0 overflow-hidden rounded-lg bg-zinc-200 dark:bg-zinc-800 ${className}`}
  >
    {src ? (
      <Image src={src} alt={alt} fill sizes="160px" className="object-cover" />
    ) : (
      <div className="flex h-full w-full items-center justify-center text-zinc-400">
        <UtensilsCrossed className="size-6" />
      </div>
    )}
  </div>
);

/* ------------------------------ Cards ------------------------------ */

const ProductCard = ({ product }: { product: Product }) => {
  const itemInCart = useCartItem(product.id);
  const isInCart = !!itemInCart;
  const addItem = useCartStore((s) => s.addItem);
  const notify = useCartNotificationStore((s) => s.notify);

  const handleAddToCart = () => {
    if (isInCart) return; // trava dupla, além do disabled no botão

    addItem(product);

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
    <div className="flex gap-3 rounded-xl border bg-card p-2.5 shadow-sm">
      <ProductImage
        src={product.image}
        alt={product.name}
        className="size-28 sm:size-32"
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="truncate text-sm font-semibold">{product.name}</h3>
        <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">
          {product.description}
        </p>
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <span className="text-base font-bold text-orange-600">
            {brl(product.price)}
          </span>
          <Button
            className="bg-amber-500 dark:text-white disabled:opacity-70 disabled:cursor-not-allowed"
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
                <Check size={20} />
                <span>No carrinho ({itemInCart.quantity})</span>
              </>
            ) : (
              <>
                <ShoppingCart size={20} />
                <span>Adicionar</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

const CompactCard = ({ product }: { product: Product }) => {
  const itemInCart = useCartItem(product.id);
  const isInCart = !!itemInCart;
  const addItem = useCartStore((s) => s.addItem);
  const notify = useCartNotificationStore((s) => s.notify);

  const handleAddToCart = () => {
    if (isInCart) return; // trava dupla, além do disabled no botão

    addItem(product);

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
    <div className="flex min-w-56 items-center gap-3 rounded-xl border bg-card p-2.5 shadow-sm">
      <ProductImage
        src={product.image}
        alt={product.name}
        className="size-12"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{product.name}</p>
        <p className="text-xs font-bold text-orange-600">
          {brl(product.price)}
        </p>
      </div>
      <Button
        className="bg-amber-500 dark:text-white disabled:opacity-70 disabled:cursor-not-allowed"
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
            <Check size={20} />
            <span>No carrinho ({itemInCart.quantity})</span>
          </>
        ) : (
          <>
            <ShoppingCart size={20} />
            <span>Adicionar</span>
          </>
        )}
      </Button>
    </div>
  );
};

const OrderSummary = () => {
  const hydrated = useCartHasHydrated();
  const storeItems = useCartItems();
  const storeSubtotal = useCartSubtotal();
  const increment = useCartStore((s) => s.increment);
  const decrement = useCartStore((s) => s.decrement);
  const removeItem = useCartStore((s) => s.removeItem);

  // antes da hidratação renderiza vazio, igual ao HTML do servidor
  const items = hydrated ? storeItems : [];
  const subtotal = storeSubtotal;
  const fee = items.length ? DELIVERY_FEE : 0;
  const total = subtotal + fee;

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Meu pedido</h2>
        <Link
          href="/carrinho"
          className="flex items-center gap-1 text-xs font-medium text-orange-600 hover:underline"
        >
          Ver carrinho <ArrowRight className="size-3" />
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Seu pedido está vazio. Adicione itens do cardápio.
        </p>
      ) : (
        <ul className="mt-4 divide-y">
          {items.map((item) => (
            <li key={item.id} className="flex gap-3 py-3 first:pt-0">
              <ProductImage
                src={item.image}
                alt={item.name}
                className="size-14"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {brl(item.price)}
                </p>
                <div className="mt-1.5 inline-flex items-center rounded-md border text-xs">
                  <button
                    onClick={() => decrement(item.id)}
                    className="px-1.5 py-1 hover:bg-muted"
                    aria-label="Diminuir"
                  >
                    <Minus className="size-3" />
                  </button>
                  <span className="w-6 text-center font-medium">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => increment(item.id)}
                    className="px-1.5 py-1 hover:bg-muted"
                    aria-label="Aumentar"
                  >
                    <Plus className="size-3" />
                  </button>
                </div>
              </div>
              <button
                onClick={() => removeItem(item.id)}
                className="self-center text-muted-foreground hover:text-red-500"
                aria-label="Remover"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 space-y-1.5 border-t pt-4 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span className="font-medium text-foreground">{brl(subtotal)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Taxa de entrega</span>
          <span className="font-medium text-foreground">{brl(fee)}</span>
        </div>
        <div className="flex items-center justify-between pt-2">
          <span className="text-base font-bold">Total</span>
          <span className="text-2xl font-extrabold text-orange-600">
            {brl(total)}
          </span>
        </div>
      </div>

      <Link
        href="/checkout"
        aria-disabled={items.length === 0}
        className={`mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-orange-600 py-3 text-sm font-semibold text-white transition hover:bg-orange-700 ${
          items.length === 0 ? "pointer-events-none opacity-50" : ""
        }`}
      >
        <ShoppingCart className="size-4" />
        Finalizar pedido
      </Link>
    </div>
  );
};

/* ------------------------------ Banners ------------------------------ */

const PromoBanner = ({
  badge,
  title,
  subtitle,
  cta,
  href,
  image,
}: {
  badge: string;
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  image?: string | null;
}) => (
  <div className="relative h-36 overflow-hidden rounded-xl bg-zinc-900 text-white">
    {image && (
      <Image
        src={image}
        alt={title}
        fill
        sizes="320px"
        className="object-cover opacity-70"
      />
    )}
    <div className="absolute inset-0 bg-linear-to-r from-black/90 via-black/60 to-transparent" />
    <div className="relative flex h-full flex-col items-start justify-center gap-1 p-4">
      <span className="rounded-full bg-orange-600/90 px-2.5 py-0.5 text-[10px] font-semibold uppercase">
        {badge}
      </span>
      <h3 className="text-base font-bold">{title}</h3>
      <p className="text-xs text-zinc-300">{subtitle}</p>
      <Link
        href={href}
        className="mt-1 flex items-center gap-1 rounded-md border border-orange-500 px-3 py-1 text-xs font-medium text-orange-400 transition hover:bg-orange-600 hover:text-white"
      >
        {cta} <ArrowRight className="size-3" />
      </Link>
    </div>
  </div>
);

/* ------------------------------ Página ------------------------------ */

export const MenuContent = () => {
  const trpc = useTRPC();
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  const { data: categories = [] } = useQuery(
    trpc.category.list.queryOptions({ withCount: false, take: 20 }),
  );

  // primeira categoria como padrão
  const currentSlug = activeSlug ?? categories[0]?.slug ?? null;
  const currentCategory = categories.find((c) => c.slug === currentSlug);

  const { data: productsData, isLoading } = useQuery({
    ...trpc.product.list.queryOptions({
      category: currentSlug ?? undefined,
      limit: 50,
    }),
    enabled: !!currentSlug,
  });

  const { data: bestSellers } = useQuery(
    trpc.product.bestSellers.queryOptions({ limit: 1 }),
  );

  const items = productsData?.items ?? [];
  const mainItems = items.slice(0, 6);
  const otherItems = items.slice(6);

  return (
    <div className="min-h-screen w-full">
      {/* Banner */}
      <div className="relative h-48 w-full overflow-hidden md:h-80">
        <Image
          src="/cardapio-banner.jpg"
          alt="Cardápio"
          fill
          priority
          quality={90}
          className="object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-r from-black/90 via-black/60 to-transparent" />
        <div className="relative mx-auto h-full w-full max-w-7xl px-4">
          <div className="flex h-full max-w-xl flex-col justify-center gap-1 text-white">
            <h2 className="text-sm font-semibold text-orange-500 md:text-base">
              NOSSO CARDÁPIO
            </h2>
            <h1 className="text-2xl font-bold md:text-4xl">
              Sabor em cada escolha!
            </h1>
            <span className="text-sm text-zinc-300 md:text-base">
              Confira nossos deliciosos hambúrgueres, pizzas, batatas, bebidas e
              muito mais. Tudo feito com ingredientes de qualidade e muito
              sabor!
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl p-4">
        {/* Abas de categorias */}
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-none">
          {categories.map((c) => {
            const Icon = categoryIcons[c.slug] ?? UtensilsCrossed;
            const active = c.slug === currentSlug;
            return (
              <button
                key={c.id}
                onClick={() => setActiveSlug(c.slug)}
                className={`flex min-w-32 shrink-0 items-center justify-center gap-2 rounded-xl border px-5 py-3.5 text-sm font-medium transition ${
                  active
                    ? "border-orange-600 bg-orange-600 text-white shadow-md"
                    : "bg-card hover:border-orange-400"
                }`}
              >
                <Icon className="size-5" />
                {c.name}
              </button>
            );
          })}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* Coluna principal */}
          <div className="min-w-0">
            <div className="mb-5">
              <h2 className="text-2xl font-bold">
                {currentCategory?.name ?? "Cardápio"}
              </h2>
              <div className="mt-1 h-1 w-10 rounded-full bg-orange-600" />
              {currentCategory?.description && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {currentCategory.description}
                </p>
              )}
            </div>

            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-36 animate-pulse rounded-xl bg-muted"
                  />
                ))}
              </div>
            ) : items.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">
                Nenhum produto disponível nesta categoria.
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {mainItems.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}

            {otherItems.length > 0 && (
              <section className="mt-8">
                <div className="mb-3 flex items-center gap-4">
                  <h3 className="shrink-0 text-lg font-bold">
                    Outros itens da categoria
                  </h3>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                  {otherItems.map((p) => (
                    <CompactCard key={p.id} product={p} />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
            <OrderSummary />

            {bestSellers?.[0] && (
              <PromoBanner
                badge="Mais pedidos"
                title={bestSellers[0].name}
                subtitle="Crocante e deliciosa!"
                cta="Peça agora"
                href={`/produto/${bestSellers[0].id}`}
                image={bestSellers[0].image}
              />
            )}

            <PromoBanner
              badge="Combo especial"
              title="Burger + Batata + Refri"
              subtitle="O combo perfeito para você!"
              cta="Ver combos"
              href="/promocoes"
              image="/cardapio-banner.jpg"
            />
          </aside>
        </div>
      </div>
    </div>
  );
};
