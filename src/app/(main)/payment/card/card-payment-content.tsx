"use client";

import {
  ArrowLeft,
  CreditCard,
  Lock,
  ShieldCheck,
  ShoppingCart,
  Truck,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter, useSearchParams } from "next/navigation";

import { MercadoPagoPayment } from "@/components/MercadoPagoPayment";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useCardPayment } from "@/hooks/useCardPayment";
import { authClient } from "@/lib/auth-client";

const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
export function CardPaymentRender() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") ?? "";
  const router = useRouter();

  const { data: session } = authClient.useSession();
  const { order, isLoadingOrder, submit, error } = useCardPayment(orderId);
  const { resolvedTheme } = useTheme();

  if (!orderId) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-destructive">
        Pedido não informado.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Button
        onClick={() => router.back()}
        variant={"link"}
        className="mb-4 inline-flex items-center gap-1"
      >
        <ArrowLeft className="size-4" />
        Voltar
      </Button>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Pagamento com cartão */}
        <Card>
          <CardHeader className="space-y-1">
            <h1 className="flex items-center gap-2 text-lg font-semibold">
              <CreditCard className="size-5 text-blue-600 dark:text-blue-400" />
              Pagamento com cartão
            </h1>
            <p className="text-sm text-muted-foreground">
              Pague com seu cartão de crédito ou débito de forma segura.
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              <ShieldCheck className="size-4 shrink-0" />
              Seus dados são criptografados diretamente pelo Mercado Pago — eles
              nunca passam pelo nosso servidor.
            </div>

            {error && (
              <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </p>
            )}

            {isLoadingOrder || !order || !session?.user.email ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <MercadoPagoPayment
                amount={Number(order.total)}
                email={session.user.email}
                theme={resolvedTheme === "dark" ? "dark" : "default"}
                onSubmit={async (formData) => {
                  await submit(formData as Parameters<typeof submit>[0]);
                }}
              />
            )}

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Lock className="size-3.5" />
              Seus dados estão protegidos e criptografados.
            </div>
          </CardContent>
        </Card>

        {/* Resumo do pedido */}
        <Card className="h-fit">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <h2 className="text-lg font-semibold">Resumo do pedido</h2>
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <ShoppingCart className="size-4" />
              {order?.items.length ?? 0}{" "}
              {order?.items.length === 1 ? "item" : "itens"}
            </span>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingOrder || !order ? (
              <div className="space-y-3">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : (
              order.items.map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                  {item.product.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="size-14 rounded-md object-cover"
                    />
                  ) : (
                    <div className="size-14 rounded-md bg-muted" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.product.name}</p>
                    <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                      {formatBRL(Number(item.unitPrice))}
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    x{item.quantity}
                  </span>
                </div>
              ))
            )}

            <Separator />

            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{order ? formatBRL(Number(order.subtotal)) : "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taxa de entrega</span>
                <span>
                  {order ? formatBRL(Number(order.deliveryFee)) : "—"}
                </span>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <span className="font-semibold">Total</span>
              <span className="text-xl font-bold text-orange-600 dark:text-orange-400">
                {order ? formatBRL(Number(order.total)) : "—"}
              </span>
            </div>

            <div className="flex items-start gap-2 rounded-lg bg-orange-50 p-3 text-sm dark:bg-orange-950/30">
              <Truck className="mt-0.5 size-4 text-orange-600 dark:text-orange-400" />
              <div>
                <p className="font-medium text-orange-700 dark:text-orange-300">
                  Entrega rápida e segura
                </p>
                <p className="text-muted-foreground">
                  Seu pedido será entregue com todo o cuidado e dentro do prazo.
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
              Após o pagamento, você será redirecionado para a página de
              confirmação.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
