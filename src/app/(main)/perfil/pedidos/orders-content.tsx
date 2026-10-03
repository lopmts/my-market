"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Ban,
  CalendarDays,
  Check,
  CheckCircle2,
  Circle,
  Clock3,
  CreditCard,
  Headphones,
  LoaderCircle,
  MapPin,
  Package,
  ReceiptText,
  RotateCcw,
  ShoppingBag,
  Trash2,
  Wallet,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { inferRouterOutputs } from "@trpc/server";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { useCartStore } from "@/store/cart-store";
import { useTRPC } from "@/trpc/client";
import type { AppRouter } from "@/trpc/routers/_app";

type OrderRecord =
  inferRouterOutputs<AppRouter>["order"]["myList"]["data"][number];

const statusLabels: Record<string, string> = {
  PENDING: "Aguardando confirmação",
  CONFIRMED: "Confirmado",
  PREPARING: "Em preparo",
  READY: "Pronto para retirada",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
};

const statusStyles: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  CONFIRMED:
    "bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-300",
  PREPARING:
    "bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-300",
  READY: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
  DELIVERED:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300",
};

const orderSteps = [
  { status: "CONFIRMED", label: "Pedido confirmado" },
  { status: "PREPARING", label: "Em preparo" },
  { status: "READY", label: "Pronto para retirada/entrega" },
  { status: "DELIVERED", label: "Concluído" },
];

const formatPrice = (value: unknown) =>
  Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const formatDate = (value: Date | string) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));

const getOrderNumber = (id: string) => `#${id.slice(-8).toUpperCase()}`;

const getPaymentMethod = (method?: string | null) =>
  method === "CARD" ? "Cartão de crédito" : method === "PIX" ? "Pix" : "Não informado";

const getPaymentStatus = (status?: string | null) => {
  switch (status) {
    case "PAID":
      return "Pagamento aprovado";
    case "FAILED":
      return "Pagamento recusado";
    case "CANCELLED":
      return "Pagamento cancelado";
    case "REFUNDED":
      return "Pagamento estornado";
    default:
      return "Aguardando pagamento";
  }
};

const isInProgress = (status: string) =>
  ["PENDING", "CONFIRMED", "PREPARING", "READY"].includes(status);

function StatusBadge({ status }: { status: string }) {
  const label = statusLabels[status] ?? status;
  const isComplete = status === "DELIVERED";
  const isCancelled = status === "CANCELLED";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
        statusStyles[status] ?? "bg-muted text-muted-foreground"
      }`}
    >
      {isComplete ? (
        <CheckCircle2 className="size-3.5" />
      ) : isCancelled ? (
        <Circle className="size-3.5" />
      ) : (
        <Clock3 className="size-3.5" />
      )}
      {label}
    </span>
  );
}

function OrderProgress({ status }: { status: string }) {
  if (status === "CANCELLED") {
    return (
      <div className="rounded-xl bg-red-50 p-4 text-sm text-red-800 dark:bg-red-500/10 dark:text-red-300">
        Este pedido foi cancelado.
      </div>
    );
  }

  const currentStep = orderSteps.findIndex((step) => step.status === status);
  const activeIndex = status === "PENDING" ? -1 : currentStep;

  return (
    <ol className="space-y-3">
      {orderSteps.map((step, index) => {
        const completed = status === "DELIVERED" || index < activeIndex;
        const active = index === activeIndex;
        const Icon = completed ? Check : active ? Clock3 : Circle;

        return (
          <li key={step.status} className="flex items-center gap-3">
            <span
              className={`flex size-7 shrink-0 items-center justify-center rounded-full ${
                completed
                  ? "bg-emerald-500 text-white"
                  : active
                    ? "bg-orange-500 text-white"
                    : "border border-border text-muted-foreground"
              }`}
            >
              <Icon className="size-4" />
            </span>
            <span
              className={`text-sm ${
                active
                  ? "font-semibold text-foreground"
                  : completed
                    ? "text-muted-foreground"
                    : "text-muted-foreground"
              }`}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function OrderItemsPreview({ order }: { order: OrderRecord }) {
  const firstItems = order.items.slice(0, 2);

  return (
    <div className="mt-2 space-y-1 text-xs text-muted-foreground">
      {firstItems.map((item) => (
        <p key={item.id} className="truncate">
          {item.quantity}x{" "}
          <Link
            href={`/cardapio/${encodeURIComponent(item.product.id)}`}
            className="hover:text-orange-600 hover:underline"
          >
            {item.product.name}
          </Link>
        </p>
      ))}
      {order.items.length > firstItems.length && (
        <p>+ {order.items.length - firstItems.length} outro(s) produto(s)</p>
      )}
    </div>
  );
}

export function OrdersContent() {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{
    type: "cancel" | "delete";
    orderId: string;
  } | null>(null);

  const {
    data: orderPage,
    isLoading,
    isError,
    error,
  } = useQuery(
    trpc.order.myList.queryOptions({
      page: 1,
      limit: 50,
    }),
  );
  const orders = orderPage?.data ?? [];
  const activeOrders = orders.filter((order) => isInProgress(order.status));
  const historyOrders = orders.filter((order) => !isInProgress(order.status));
  const selectedOrder = useQuery({
    ...trpc.order.myById.queryOptions({ id: selectedOrderId ?? "" }),
    enabled: selectedOrderId !== null,
  });
  const paidTotal = orders
    .filter(
      (order) =>
        order.payment?.status === "PAID" || order.status === "DELIVERED",
    )
    .reduce((sum, order) => sum + Number(order.total), 0);
  const paymentMethods = [
    ...new Set(
      orders
        .map((order) => order.payment?.method)
        .filter((method) => method !== undefined),
    ),
  ];
  const mostRecentOrder = orders[0];
  const confirmationOrder = orders.find(
    (order) => order.id === confirmation?.orderId,
  );
  const invalidateOrders = () =>
    queryClient.invalidateQueries({ queryKey: trpc.order.pathKey() });
  const cancelOrder = useMutation(
    trpc.order.cancel.mutationOptions({
      onSuccess: async () => {
        await invalidateOrders();
        setConfirmation(null);
        toast.add({
          title: "Pedido cancelado",
          description: "O pedido foi movido para o histórico.",
          type: "success",
        });
      },
      onError: (mutationError) => {
        toast.add({
          title: "Não foi possível cancelar o pedido",
          description: mutationError.message,
          type: "error",
        });
      },
    }),
  );
  const deleteOrder = useMutation(
    trpc.order.deleteCancelled.mutationOptions({
      onSuccess: async () => {
        await invalidateOrders();
        setConfirmation(null);
        toast.add({
          title: "Pedido excluído",
          description: "O pedido cancelado foi removido do histórico.",
          type: "success",
        });
      },
      onError: (mutationError) => {
        toast.add({
          title: "Não foi possível excluir o pedido",
          description: mutationError.message,
          type: "error",
        });
      },
    }),
  );
  const reorder = useMutation(
    trpc.order.reorder.mutationOptions({
      onSuccess: (result) => {
        if (!result.items.length) {
          toast.add({
            title: "Produtos indisponíveis",
            description: "Nenhum produto deste pedido está disponível agora.",
            type: "warning",
          });
          return;
        }

        const cart = useCartStore.getState();
        const quantityLimited = result.items.some(
          (item) => item.quantity + (cart.getItem(item.id)?.quantity ?? 0) > 20,
        );
        for (const item of result.items) {
          cart.addItem(item, item.quantity);
        }

        const partiallyUnavailable = result.unavailableCount > 0;
        if (partiallyUnavailable || quantityLimited) {
          toast.add({
            title: "Pedido adicionado parcialmente",
            description: [
              partiallyUnavailable
                ? `${result.unavailableCount} produto(s) indisponível(is) não foram adicionados.`
                : null,
              quantityLimited
                ? "A quantidade de alguns produtos foi ajustada ao limite do carrinho."
                : null,
            ]
              .filter(Boolean)
              .join(" "),
            type: "warning",
          });
        } else {
          toast.add({
            title: "Itens adicionados ao carrinho",
            description: "Confira os preços atuais antes de finalizar.",
            type: "success",
          });
        }

        router.push("/carrinho");
      },
      onError: (mutationError) => {
        toast.add({
          title: "Não foi possível comprar este pedido novamente",
          description: mutationError.message,
          type: "error",
        });
      },
    }),
  );

  if (isLoading) {
    return (
      <main className="min-h-screen bg-stone-50 px-4 py-8 dark:bg-background">
        <div
          role="status"
          aria-label="Carregando pedidos"
          className="mx-auto max-w-7xl space-y-5"
        >
          <Skeleton className="h-12 w-64 max-w-full rounded-xl" />
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="space-y-4">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="space-y-4 rounded-2xl border bg-card p-5">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-36" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                  <div className="flex gap-3">
                    <Skeleton className="size-20 rounded-xl" />
                    <div className="flex-1 space-y-3">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </div>
                  <Skeleton className="h-9 w-full rounded-lg" />
                </div>
              ))}
            </div>
            <div className="space-y-4 rounded-2xl border bg-card p-5">
              <Skeleton className="h-6 w-36" />
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </div>
          <span className="sr-only">Carregando pedidos...</span>
        </div>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="min-h-screen bg-stone-50 px-4 py-12 dark:bg-background">
        <div className="mx-auto max-w-2xl rounded-2xl border bg-card p-8 text-center">
          <p className="font-semibold">Não foi possível carregar seus pedidos.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {error.message}
          </p>
          <Link
            href="/perfil"
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-orange-600"
          >
            <ArrowLeft className="size-4" /> Voltar ao perfil
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-6 dark:bg-background sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/perfil"
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Voltar ao perfil
        </Link>

        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400">
              <ShoppingBag className="size-6" />
            </span>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                Meus pedidos
              </h1>
              <p className="text-sm text-muted-foreground">
                Acompanhe seus pedidos e seu histórico de compras.
              </p>
            </div>
          </div>
          <Link
            href="/cardapio"
            className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
          >
            Fazer novo pedido <ArrowRight className="size-4" />
          </Link>
        </header>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-7">
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-bold">Pedidos em andamento</h2>
                <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700 dark:bg-orange-500/15 dark:text-orange-300">
                  {activeOrders.length}
                </span>
              </div>

              {activeOrders.length ? (
                <div className="space-y-4">
                  {activeOrders.map((order) => (
                    <article
                      key={order.id}
                      className="overflow-hidden rounded-2xl border bg-card shadow-sm"
                    >
                      <div className="grid gap-5 p-4 md:grid-cols-[minmax(0,1fr)_250px] md:p-5">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="font-bold">
                                {getOrderNumber(order.id)}
                              </p>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {formatDate(order.createdAt)}
                              </p>
                            </div>
                            <StatusBadge status={order.status} />
                          </div>

                          <div className="mt-4 flex gap-3">
                            <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                              {order.items[0]?.product.image ? (
                                <Image
                                  src={order.items[0].product.image}
                                  alt={order.items[0].product.name}
                                  fill
                                  sizes="80px"
                                  className="object-cover"
                                />
                              ) : (
                                <Package className="m-auto mt-6 size-8 text-muted-foreground" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <OrderItemsPreview order={order} />
                              <div className="mt-3 flex items-center justify-between border-t pt-2.5 text-sm">
                                <span className="text-muted-foreground">
                                  Total do pedido
                                </span>
                                <span className="font-bold">
                                  {formatPrice(order.total)}
                                </span>
                              </div>
                              <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                                <CreditCard className="size-3.5" />
                                {getPaymentMethod(order.payment?.method)}
                                {order.payment?.status && (
                                  <span>· {getPaymentStatus(order.payment.status)}</span>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="border-t pt-4 md:border-l md:border-t-0 md:pl-5 md:pt-0">
                          <OrderProgress status={order.status} />
                          <button
                            type="button"
                            onClick={() => setSelectedOrderId(order.id)}
                            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition hover:border-orange-500 hover:text-orange-600"
                          >
                            Ver detalhes <ArrowRight className="size-4" />
                          </button>
                          {order.status === "PENDING" && (
                            <Button
                              type="button"
                              variant="outline"
                              className="mt-2 w-full text-destructive hover:text-destructive"
                              onClick={() =>
                                setConfirmation({
                                  type: "cancel",
                                  orderId: order.id,
                                })
                              }
                            >
                              <Ban className="size-4" />
                              Cancelar pedido
                            </Button>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed bg-card px-6 py-10 text-center">
                  <Package className="mx-auto size-9 text-muted-foreground" />
                  <p className="mt-3 font-semibold">Nenhum pedido em andamento</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Seus novos pedidos aparecerão aqui para acompanhamento.
                  </p>
                </div>
              )}
            </section>

            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-bold">Pedidos anteriores</h2>
                <span className="text-sm text-muted-foreground">
                  {historyOrders.length} pedidos
                </span>
              </div>

              {historyOrders.length ? (
                <div className="space-y-3">
                  {historyOrders.map((order) => (
                    <article
                      key={order.id}
                      className="flex flex-wrap items-center gap-4 rounded-2xl border bg-card p-4 shadow-sm"
                    >
                      <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                        {order.items[0]?.product.image ? (
                          <Image
                            src={order.items[0].product.image}
                            alt={order.items[0].product.name}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        ) : (
                          <Package className="m-auto mt-5 size-7 text-muted-foreground" />
                        )}
                      </div>

                      <div className="min-w-[10rem] flex-1">
                        <p className="text-sm font-bold">
                          {getOrderNumber(order.id)}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatDate(order.createdAt)}
                        </p>
                        <OrderItemsPreview order={order} />
                      </div>

                      <div className="min-w-36 text-sm">
                        <p className="text-xs text-muted-foreground">Pagamento</p>
                        <p className="mt-1 font-medium">
                          {getPaymentMethod(order.payment?.method)}
                        </p>
                      </div>

                      <div className="flex min-w-28 flex-col gap-2">
                        <p className="font-bold">{formatPrice(order.total)}</p>
                        <StatusBadge status={order.status} />
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setSelectedOrderId(order.id)}
                        >
                          Ver detalhes <ArrowRight className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={reorder.isPending}
                          onClick={() => reorder.mutate({ id: order.id })}
                        >
                          {reorder.isPending ? (
                            <LoaderCircle className="size-4 animate-spin" />
                          ) : (
                            <RotateCcw className="size-4" />
                          )}
                          Comprar novamente
                        </Button>
                        {order.status === "CANCELLED" &&
                          order.payment?.status !== "PAID" && (
                            <Button
                              type="button"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() =>
                                setConfirmation({
                                  type: "delete",
                                  orderId: order.id,
                                })
                              }
                            >
                              <Trash2 className="size-4" />
                              Excluir
                            </Button>
                          )}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed bg-card px-6 py-10 text-center">
                  <ReceiptText className="mx-auto size-9 text-muted-foreground" />
                  <p className="mt-3 font-semibold">Seu histórico está vazio</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Depois de concluir um pedido, ele ficará disponível aqui.
                  </p>
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24">
            <section className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Clock3 className="size-5 text-orange-500" />
                <h2 className="font-bold">Resumo de pedidos</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border p-3">
                  <ShoppingBag className="size-4 text-orange-500" />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Total de pedidos
                  </p>
                  <p className="mt-0.5 text-lg font-bold">
                    {orderPage?.total ?? 0}
                  </p>
                </div>
                <div className="rounded-xl border p-3">
                  <Wallet className="size-4 text-emerald-600" />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Valor pago
                  </p>
                  <p className="mt-0.5 text-base font-bold">
                    {formatPrice(paidTotal)}
                  </p>
                </div>
                <div className="col-span-2 rounded-xl border p-3">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="size-4 text-amber-500" />
                    <p className="text-xs text-muted-foreground">
                      Pedido mais recente
                    </p>
                  </div>
                  {mostRecentOrder ? (
                    <>
                      <p className="mt-1 font-bold">
                        {getOrderNumber(mostRecentOrder.id)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(mostRecentOrder.createdAt)}
                      </p>
                    </>
                  ) : (
                    <p className="mt-1 text-sm font-medium">Ainda sem pedidos</p>
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-2xl border bg-card p-5 shadow-sm">
              <h2 className="mb-3 font-bold">Formas de pagamento usadas</h2>
              {paymentMethods.length ? (
                <ul className="space-y-2">
                  {paymentMethods.map((method) => (
                    <li
                      key={method}
                      className="flex items-center gap-3 rounded-xl border p-3"
                    >
                      {method === "PIX" ? (
                        <Wallet className="size-5 text-emerald-600" />
                      ) : (
                        <CreditCard className="size-5 text-sky-700" />
                      )}
                      <span className="text-sm font-medium">
                        {getPaymentMethod(method)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Seus métodos aparecerão aqui após o primeiro pedido.
                </p>
              )}
            </section>

            <section className="relative overflow-hidden rounded-2xl bg-zinc-950 p-5 text-white">
              <div className="pointer-events-none absolute -right-8 -bottom-8 size-32 rounded-full bg-orange-500/30 blur-2xl" />
              <Headphones className="size-7 text-orange-400" />
              <h2 className="mt-3 text-lg font-bold">Precisa de ajuda?</h2>
              <p className="mt-1 text-sm text-zinc-300">
                Confira as informações da loja e encontre formas de atendimento.
              </p>
              <Link
                href="/sobre"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-orange-50"
              >
                Falar com suporte <ArrowRight className="size-4" />
              </Link>
            </section>
          </aside>
        </div>
      </div>

      <AlertDialog
        open={confirmation !== null}
        onOpenChange={(open) => {
          if (!open && !cancelOrder.isPending && !deleteOrder.isPending) {
            setConfirmation(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmation?.type === "cancel"
                ? "Cancelar este pedido?"
                : "Excluir este pedido do histórico?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmation?.type === "cancel" ? (
                <>
                  O pedido{" "}
                  <strong>
                    {confirmationOrder
                      ? getOrderNumber(confirmationOrder.id)
                      : ""}
                  </strong>{" "}
                  será cancelado e o pagamento pendente também será marcado
                  como cancelado. Pedidos já pagos não podem ser cancelados
                  por esta tela.
                </>
              ) : (
                <>
                  O pedido cancelado{" "}
                  <strong>
                    {confirmationOrder
                      ? getOrderNumber(confirmationOrder.id)
                      : ""}
                  </strong>{" "}
                  será removido permanentemente do seu histórico. Essa ação
                  não pode ser desfeita.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={cancelOrder.isPending || deleteOrder.isPending}
              onClick={() => setConfirmation(null)}
            >
              Voltar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={
                !confirmation ||
                cancelOrder.isPending ||
                deleteOrder.isPending
              }
              onClick={() => {
                if (!confirmation) return;
                if (confirmation.type === "cancel") {
                  cancelOrder.mutate({ id: confirmation.orderId });
                } else {
                  deleteOrder.mutate({ id: confirmation.orderId });
                }
              }}
            >
              {(cancelOrder.isPending || deleteOrder.isPending) && (
                <LoaderCircle className="size-4 animate-spin" />
              )}
              {confirmation?.type === "cancel"
                ? "Confirmar cancelamento"
                : "Excluir pedido"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={selectedOrderId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedOrderId(null);
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedOrderId
                ? `Detalhes do pedido ${getOrderNumber(selectedOrderId)}`
                : "Detalhes do pedido"}
            </DialogTitle>
            <DialogDescription>
              Produtos, pagamento e informações de entrega deste pedido.
            </DialogDescription>
          </DialogHeader>

          {selectedOrder.isLoading ? (
            <div
              role="status"
              aria-label="Carregando detalhes do pedido"
              className="space-y-3 py-5"
            >
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="flex gap-3 rounded-xl border p-3">
                  <Skeleton className="size-14 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : selectedOrder.isError ? (
            <p className="py-6 text-sm text-destructive">
              Não foi possível carregar os detalhes: {selectedOrder.error.message}
            </p>
          ) : selectedOrder.data ? (
            <OrderDetails order={selectedOrder.data} />
          ) : null}
        </DialogContent>
      </Dialog>
    </main>
  );
}

function OrderDetails({ order }: { order: OrderRecord }) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/30 p-4">
        <div>
          <p className="font-bold">{getOrderNumber(order.id)}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatDate(order.createdAt)}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <section>
        <h3 className="mb-2 font-semibold">Itens do pedido</h3>
        <ul className="divide-y rounded-xl border">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 p-3">
              <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                {item.product.image ? (
                  <Image
                    src={item.product.image}
                    alt={item.product.name}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                ) : (
                  <Package className="m-auto mt-4 size-6 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/cardapio/${encodeURIComponent(item.product.id)}`}
                  className="block truncate text-sm font-semibold hover:text-orange-600 hover:underline"
                >
                  {item.product.name}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {item.quantity} × {formatPrice(item.unitPrice)}
                </p>
              </div>
              <p className="text-sm font-semibold">
                {formatPrice(item.subtotal)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-xl border p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <CreditCard className="size-4 text-orange-500" /> Pagamento
          </h3>
          <p className="mt-2 text-sm">{getPaymentMethod(order.payment?.method)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {getPaymentStatus(order.payment?.status)}
          </p>
          {order.payment?.providerPaymentId && (
            <p className="mt-1 text-xs text-muted-foreground">
              Código: {order.payment.providerPaymentId}
            </p>
          )}
          {order.payment?.paidAt && (
            <p className="mt-1 text-xs text-muted-foreground">
              Pago em {formatDate(order.payment.paidAt)}
            </p>
          )}
        </section>
        <section className="rounded-xl border p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <MapPin className="size-4 text-orange-500" /> Entrega
          </h3>
          <p className="mt-2 text-sm">
            {order.type === "PICKUP"
              ? "Retirada no estabelecimento"
              : order.type === "TABLE"
                ? "Consumo no local"
                : order.address || "Endereço não informado"}
          </p>
          {order.notes && (
            <p className="mt-2 text-xs text-muted-foreground">
              Observações: {order.notes}
            </p>
          )}
        </section>
      </div>

      <dl className="space-y-2 rounded-xl border p-4 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd>{formatPrice(order.subtotal)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Taxa de entrega</dt>
          <dd>{formatPrice(order.deliveryFee)}</dd>
        </div>
        <div className="flex justify-between gap-4 border-t pt-2 text-base font-bold">
          <dt>Total</dt>
          <dd>{formatPrice(order.total)}</dd>
        </div>
      </dl>
    </div>
  );
}
