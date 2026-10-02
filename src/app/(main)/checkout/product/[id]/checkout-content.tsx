"use client";

import {
  CreditCard,
  Loader2,
  QrCode,
  ShieldCheck,
  ShoppingCart,
  Truck,
} from "lucide-react";
import { useParams } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useCheckout, type CheckoutPaymentMethod } from "@/hooks/useCheckout";

const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

export function CheckoutContent() {
  const { id } = useParams<{ id: string }>();
  const { order, isLoading, error, paymentMethod, setPaymentMethod, confirm } =
    useCheckout(id);

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-destructive">
          Não foi possível carregar o seu pedido: {error.message}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[1fr_360px]">
      {/* Forma de pagamento */}
      <Card>
        <CardHeader className="space-y-1">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <CreditCard className="size-5" />
            Forma de pagamento
          </h2>
          <p className="text-sm text-muted-foreground">
            Escolha como deseja pagar seu pedido.
          </p>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={paymentMethod}
            onValueChange={(value) =>
              setPaymentMethod(value as CheckoutPaymentMethod)
            }
            className="gap-4"
          >
            <label
              htmlFor="method-pix"
              className={`flex cursor-pointer items-start gap-4 rounded-lg border p-4 transition-colors ${
                paymentMethod === "PIX"
                  ? "border-orange-500 bg-orange-50 dark:bg-zinc-700/20"
                  : "border-border"
              }`}
            >
              <RadioGroupItem value="PIX" id="method-pix" className="mt-1" />
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <QrCode className="size-4 text-emerald-600" />
                  <span className="font-medium">PIX</span>
                  <Badge
                    variant="secondary"
                    className="bg-emerald-100 text-emerald-700"
                  >
                    Aprovação imediata
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Pague com QR Code ou copie e cole o código na próxima etapa.
                </p>
              </div>
            </label>

            <label
              htmlFor="method-card"
              className={`flex cursor-pointer items-start gap-4 rounded-lg border p-4 transition-colors ${
                paymentMethod === "CARD"
                  ? "border-orange-500 bg-orange-50 dark:bg-zinc-700/20"
                  : "border-border"
              }`}
            >
              <RadioGroupItem
                value="CARD"
                id="method-card"
                className="mt-1"
                disabled={true}
              />
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <CreditCard className="size-4 text-blue-600" />
                  <span className="font-medium">Cartão de crédito</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Você informa os dados do cartão na próxima etapa.
                </p>
              </div>
            </label>
          </RadioGroup>

          <Button
            className="mt-6 w-full bg-orange-500 hover:bg-orange-600"
            size="lg"
            disabled={isLoading || !order}
            onClick={confirm}
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Preparando seu pedido...
              </>
            ) : (
              "Finalizar pagamento →"
            )}
          </Button>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Seus dados estão protegidos e criptografados.
          </p>
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
          {isLoading || !order ? (
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
                  <p className="text-sm font-semibold text-orange-500">
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
              <span>{order ? formatBRL(Number(order.deliveryFee)) : "—"}</span>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <span className="font-semibold">Total</span>
            <span className="text-xl font-bold text-orange-500">
              {order ? formatBRL(Number(order.total)) : "—"}
            </span>
          </div>

          <div className="flex items-start gap-2 rounded-lg bg-orange-50 p-3 text-sm">
            <Truck className="mt-0.5 size-4 text-orange-500" />
            <div>
              <p className="font-medium text-orange-700">
                Entrega rápida e segura
              </p>
              <p className="text-muted-foreground">
                Seu pedido será entregue com todo o cuidado e dentro do prazo.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="size-4" />
            Pagamento seguro — seus dados estão protegidos
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
