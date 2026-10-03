"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  ChefHat,
  CreditCard,
  ImageOff,
  LoaderCircle,
  LockKeyhole,
  Minus,
  Plus,
  QrCode,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  useCartHasHydrated,
  useCartItems,
  useCartStore,
  useCartSubtotal,
  useCartTotalItems,
} from "@/store/cart-store";
import { useTRPC } from "@/trpc/client";
import { formatPrice } from "@/utils/price-format";

type PaymentMethod = "PIX" | "CARD";

function CartSkeleton() {
  return (
    <main className="min-h-screen bg-stone-50 px-4 py-8 dark:bg-background">
      <div className="mx-auto max-w-7xl animate-pulse space-y-6">
        <div className="h-12 w-64 rounded-xl bg-muted" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="h-96 rounded-2xl bg-muted" />
          <div className="h-96 rounded-2xl bg-muted" />
        </div>
      </div>
    </main>
  );
}

export function CartContent() {
  const trpc = useTRPC();
  const router = useRouter();
  const hydrated = useCartHasHydrated();
  const items = useCartItems();
  const subtotal = useCartSubtotal();
  const totalItems = useCartTotalItems();
  const increment = useCartStore((state) => state.increment);
  const decrement = useCartStore((state) => state.decrement);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("PIX");

  const quote = useQuery({
    ...trpc.order.quote.queryOptions({
      items: items.map(({ id, quantity }) => ({
        productId: id,
        quantity,
      })),
    }),
    enabled: hydrated && items.length > 0,
  });
  const categories = useQuery(
    trpc.category.list.queryOptions({ withCount: true, take: 4 }),
  );
  const createOrder = useMutation(
    trpc.order.create.mutationOptions({
      onSuccess: (order) => {
        clearCart();
        router.push(
          `/payment/pix?orderId=${encodeURIComponent(order.id)}`,
        );
      },
    }),
  );

  if (!hydrated) return <CartSkeleton />;

  const hasItems = items.length > 0;
  const quotedItems = new Map(
    (quote.data?.items ?? []).map((item) => [item.productId, item]),
  );
  const displayedSubtotal = quote.data?.subtotal ?? subtotal;
  const fee = quote.data?.deliveryFee ?? 0;
  const total = quote.data?.total ?? subtotal + fee;

  const handleCheckout = () => {
    if (!hasItems || !quote.data || createOrder.isPending)
      return;

    createOrder.mutate({
      items: items.map(({ id, quantity }) => ({
        productId: id,
        quantity,
      })),
    });
  };

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-6 dark:bg-background sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400">
              <ShoppingCart className="size-6" />
            </span>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                Meu carrinho
              </h1>
              <p className="text-sm text-muted-foreground">
                Confira seus itens antes de finalizar o pedido.
              </p>
            </div>
          </div>

          {hasItems && (
            <Button
              type="button"
              variant="outline"
              onClick={clearCart}
              className="gap-2 text-destructive hover:bg-destructive/5 hover:text-destructive"
            >
              <Trash2 className="size-4" />
              Limpar carrinho
            </Button>
          )}
        </header>

        {!hasItems ? (
          <EmptyCart categories={categories.data ?? []} />
        ) : (
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-5">
              <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                <ul className="divide-y">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="flex flex-wrap items-center gap-4 p-4 sm:p-5"
                    >
                      <Link
                        href={`/cardapio/${encodeURIComponent(item.id)}`}
                        className="group relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted sm:size-24"
                      >
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes="96px"
                            className="object-cover transition group-hover:scale-105"
                          />
                        ) : (
                          <span className="flex h-full items-center justify-center">
                            <ImageOff className="size-7 text-muted-foreground" />
                          </span>
                        )}
                      </Link>

                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/cardapio/${encodeURIComponent(item.id)}`}
                          className="font-semibold transition hover:text-orange-600"
                        >
                          {item.name}
                        </Link>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {formatPrice(
                            quotedItems.get(item.id)?.unitPrice ?? item.price,
                          )}{" "}
                          cada
                        </p>
                        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <UtensilsCrossed className="size-3.5" />
                          Produto do cardápio
                        </p>
                      </div>

                      <p className="order-2 w-full text-base font-bold sm:order-none sm:w-auto sm:min-w-24 sm:text-right">
                        {formatPrice(
                          quotedItems.get(item.id)?.subtotal ??
                            item.price * item.quantity,
                        )}
                      </p>

                      <div className="flex items-center rounded-full border bg-background">
                        <button
                          type="button"
                          onClick={() => decrement(item.id)}
                          className="flex size-9 items-center justify-center rounded-l-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
                          aria-label={
                            item.quantity === 1
                              ? `Remover ${item.name} do carrinho`
                              : `Diminuir quantidade de ${item.name}`
                          }
                        >
                          <Minus className="size-4" />
                        </button>
                        <span
                          className="min-w-8 text-center text-sm font-semibold"
                          aria-label={`Quantidade ${item.quantity}`}
                        >
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => increment(item.id)}
                          disabled={item.quantity >= 20}
                          className="flex size-9 items-center justify-center rounded-r-full text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label={`Aumentar quantidade de ${item.name}`}
                        >
                          <Plus className="size-4" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="flex size-9 shrink-0 items-center justify-center rounded-full text-red-500 transition hover:bg-red-50 dark:hover:bg-red-500/10"
                        aria-label={`Remover ${item.name} do carrinho`}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-sky-50/70 p-4 dark:bg-sky-950/20 sm:px-5">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300">
                      <ShoppingBag className="size-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">
                        Seu pedido está quase pronto!
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Escolha o pagamento e finalize com segurança.
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/cardapio"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-700 hover:underline dark:text-sky-300"
                  >
                    Continuar comprando <ArrowRight className="size-4" />
                  </Link>
                </div>
              </section>

              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 font-bold">
                    <ChefHat className="size-5 text-orange-500" />
                    Continue comprando
                  </h2>
                  <Link
                    href="/categorias"
                    className="text-sm font-medium text-orange-600 hover:underline"
                  >
                    Ver categorias
                  </Link>
                </div>

                {categories.isLoading ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[0, 1, 2, 3].map((item) => (
                      <div
                        key={item}
                        className="h-36 animate-pulse rounded-2xl bg-muted"
                      />
                    ))}
                  </div>
                ) : categories.isError ? (
                  <p className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
                    Não foi possível carregar as categorias.{" "}
                    {categories.error.message}
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {categories.data?.map((category) => (
                      <Link
                        key={category.id}
                        href={`/categorias/${encodeURIComponent(category.id)}`}
                        className="group overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <div className="relative h-24 bg-muted sm:h-28">
                          {category.image ? (
                            <Image
                              src={category.image}
                              alt={category.name}
                              fill
                              sizes="(max-width: 640px) 50vw, 25vw"
                              className="object-cover transition group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center bg-gradient-to-br from-orange-100 to-amber-50 text-orange-500 dark:from-orange-950 dark:to-zinc-900">
                              <UtensilsCrossed className="size-8" />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-2 p-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">
                              {category.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {category.productCount ?? 0} opções
                            </p>
                          </div>
                          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white">
                            <ArrowRight className="size-3.5" />
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <aside className="space-y-4 lg:sticky lg:top-24">
              <section className="rounded-2xl border bg-card p-5 shadow-sm">
                <h2 className="flex items-center gap-2 border-b pb-4 text-lg font-bold">
                  <ShoppingBag className="size-5 text-orange-500" />
                  Resumo do pedido
                  <span className="ml-auto text-xs font-medium text-muted-foreground">
                    {totalItems} {totalItems === 1 ? "item" : "itens"}
                  </span>
                </h2>

                <ul className="max-h-60 divide-y overflow-y-auto">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center gap-3 py-3"
                    >
                      <div className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-muted">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes="44px"
                            className="object-cover"
                          />
                        ) : (
                          <ImageOff className="m-auto mt-3 size-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold">
                          {item.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} ×{" "}
                          {formatPrice(
                            quotedItems.get(item.id)?.unitPrice ?? item.price,
                          )}
                        </p>
                      </div>
                      <span className="text-xs font-semibold">
                        {formatPrice(
                          quotedItems.get(item.id)?.subtotal ??
                            item.price * item.quantity,
                        )}
                      </span>
                    </li>
                  ))}
                </ul>

                <dl className="space-y-2 border-t pt-4 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <dt>Subtotal</dt>
                    <dd className="font-medium text-foreground">
                      {formatPrice(displayedSubtotal)}
                    </dd>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <dt>Taxa de entrega</dt>
                    <dd className="font-medium text-foreground">
                      {quote.isLoading
                        ? "Calculando..."
                        : quote.isError
                          ? "Indisponível"
                          : formatPrice(fee)}
                    </dd>
                  </div>
                  <div className="flex justify-between border-t pt-3 text-base font-extrabold">
                    <dt>Total</dt>
                    <dd>{formatPrice(total)}</dd>
                  </div>
                </dl>

                {quote.isError && (
                  <p role="alert" className="mt-3 text-xs text-destructive">
                    Não foi possível calcular os valores atuais do pedido:{" "}
                    {quote.error.message}
                  </p>
                )}

                {createOrder.isError && (
                  <div
                    role="alert"
                    className="mt-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
                  >
                    <p>Não foi possível criar seu pedido.</p>
                    <p className="mt-1 text-xs">{createOrder.error.message}</p>
                    {createOrder.error.data?.code === "UNAUTHORIZED" && (
                      <Link
                        href="/login"
                        className="mt-2 inline-flex font-semibold underline underline-offset-2"
                      >
                        Entre na sua conta e tente novamente
                      </Link>
                    )}
                  </div>
                )}

                <fieldset
                  role="radiogroup"
                  aria-labelledby="payment-method-heading"
                  className="mt-5 space-y-2"
                >
                  <legend id="payment-method-heading" className="mb-2 text-sm font-bold">
                    Forma de pagamento
                  </legend>
                  <PaymentOption
                    value="PIX"
                    selected={paymentMethod === "PIX"}
                    onSelect={setPaymentMethod}
                    title="Pix"
                    subtitle="Pagamento instantâneo"
                    icon={<QrCode className="size-5 text-emerald-600" />}
                  />
                  <PaymentOption
                    value="CARD"
                    selected={paymentMethod === "CARD"}
                    onSelect={setPaymentMethod}
                    title="Cartão de crédito"
                    subtitle="Temporariamente indisponível"
                    icon={<CreditCard className="size-5 text-sky-700" />}
                    disabled
                  />
                </fieldset>

                <Button
                  type="button"
                  onClick={handleCheckout}
                  disabled={
                    !hasItems ||
                    quote.isLoading ||
                    quote.isError ||
                    !quote.data ||
                    createOrder.isPending
                  }
                  className="mt-4 h-11 w-full gap-2 bg-orange-600 text-white hover:bg-orange-700"
                >
                  {createOrder.isPending ? (
                    <>
                      <LoaderCircle className="size-4 animate-spin" />
                      Criando pedido...
                    </>
                  ) : (
                    <>
                      <LockKeyhole className="size-4" />
                      Finalizar pedido <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
                <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                  <LockKeyhole className="size-3.5 text-emerald-600" />
                  Seus dados estão protegidos.
                </p>
              </section>

              <section className="relative overflow-hidden rounded-2xl bg-zinc-950 p-5 text-white">
                <div className="pointer-events-none absolute -right-8 -bottom-8 size-32 rounded-full bg-orange-500/30 blur-2xl" />
                <ChefHat className="size-7 text-orange-400" />
                <h2 className="mt-2 font-bold">
                  Pedido rápido e sem complicação!
                </h2>
                <p className="mt-1 text-xs text-zinc-300">
                  Seus itens ficam salvos no carrinho enquanto você navega.
                </p>
                <Link
                  href="/cardapio"
                  className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-orange-300 hover:text-white"
                >
                  Explorar cardápio <ArrowRight className="size-4" />
                </Link>
              </section>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}

function PaymentOption({
  value,
  selected,
  onSelect,
  title,
  subtitle,
  icon,
  disabled = false,
}: {
  value: PaymentMethod;
  selected: boolean;
  onSelect: (method: PaymentMethod) => void;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-disabled={disabled}
      disabled={disabled}
      onClick={() => onSelect(value)}
      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 disabled:cursor-not-allowed disabled:opacity-55 ${
        selected
          ? "border-orange-500 bg-orange-50/70 dark:bg-orange-500/10"
          : !disabled &&
            "hover:border-orange-300 dark:hover:border-orange-500/50"
      }`}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-background">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-xs text-muted-foreground">{subtitle}</span>
      </span>
      {selected && (
        <span className="rounded-full bg-orange-500 px-2 py-1 text-[10px] font-bold text-white">
          Selecionado
        </span>
      )}
    </button>
  );
}

function EmptyCart({
  categories,
}: {
  categories: Array<{
    id: string;
    name: string;
    image: string | null;
    productCount?: number;
  }>;
}) {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl border bg-card px-6 py-12 text-center shadow-sm sm:py-16">
        <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400">
          <ShoppingCart className="size-8" />
        </span>
        <h2 className="mt-5 text-xl font-bold">Seu carrinho está vazio</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Explore nosso cardápio e adicione seus pratos favoritos para começar
          seu pedido.
        </p>
        <Link
          href="/cardapio"
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700"
        >
          Explorar cardápio <ArrowRight className="size-4" />
        </Link>
      </section>

      {categories.length > 0 && (
        <section>
          <h2 className="mb-3 font-bold">Explore nossas categorias</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/categorias/${encodeURIComponent(category.id)}`}
                className="group overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="relative h-24 bg-muted">
                  {category.image ? (
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      sizes="25vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-orange-100 to-amber-50 text-orange-500 dark:from-orange-950 dark:to-zinc-900">
                      <UtensilsCrossed className="size-8" />
                    </div>
                  )}
                </div>
                <p className="p-3 text-sm font-semibold">{category.name}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
