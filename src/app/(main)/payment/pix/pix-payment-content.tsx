"use client";

import {
  ArrowLeft,
  Check,
  Copy,
  Loader2,
  QrCode,
  ShieldCheck,
  ShoppingCart,
  Timer,
  Truck,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { usePixPayment } from "@/hooks/usePixpayment";

const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

function formatCountdown(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function PixPaymentContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") ?? "";
  const [copied, setCopied] = useState(false);

  const {
    order,
    isLoadingOrder,
    pix,
    isGenerating,
    error,
    secondsLeft,
    isExpired,
    copyCode,
    regenerate,
  } = usePixPayment(orderId);
  const router = useRouter();

  if (!orderId) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-destructive">
        Pedido não informado.
      </div>
    );
  }

  async function handleCopy() {
    await copyCode();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Button
        onClick={() => router.back()}
        variant={"link"}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Voltar
      </Button>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Pagamento via PIX */}
        <Card>
          <CardHeader className="space-y-1">
            <h1 className="flex items-center gap-2 text-lg font-semibold">
              <QrCode className="size-5 text-emerald-600" />
              Pagamento via PIX
            </h1>
            <p className="text-sm text-muted-foreground">
              Escaneie o QR Code abaixo ou copie o código para pagar com o
              aplicativo do seu banco.
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {error ? (
              <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                <p>{(error as Error).message}</p>
                <Button size="sm" variant="outline" onClick={regenerate}>
                  Tentar novamente
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
                <div className="flex size-[200px] items-center justify-center rounded-lg border bg-white p-3">
                  {isGenerating || !pix?.pix.qrCodeBase64 ? (
                    <Skeleton className="size-full" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`data:image/png;base64,${pix.pix.qrCodeBase64}`}
                      alt="QR Code do PIX"
                      className="size-full object-contain"
                    />
                  )}
                </div>

                <div
                  className={`flex flex-col justify-center gap-2 rounded-lg p-4 text-sm ${
                    isExpired
                      ? "bg-destructive/10 text-destructive"
                      : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  <div className="flex items-center gap-2 font-medium">
                    <Timer className="size-4" />
                    {isExpired
                      ? "O código expirou"
                      : secondsLeft !== null
                        ? `O código expira em ${formatCountdown(secondsLeft)}`
                        : "Gerando código..."}
                  </div>

                  {isExpired ? (
                    <Button
                      size="sm"
                      className="w-fit bg-orange-500 hover:bg-orange-600"
                      onClick={regenerate}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        "Gerar novo código"
                      )}
                    </Button>
                  ) : (
                    <p className="text-muted-foreground">
                      Após o vencimento, gere um novo código clicando em
                      &quot;Gerar novo código&quot;.
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm font-medium">Ou copie o código PIX</p>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={pix?.pix.qrCode ?? ""}
                  placeholder="Gerando código..."
                  className="font-mono text-xs"
                />
                <Button
                  variant="outline"
                  onClick={handleCopy}
                  disabled={!pix?.pix.qrCode}
                >
                  {copied ? (
                    <Check className="size-4" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                  {copied ? "Copiado" : "Copiar"}
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <p className="text-sm font-medium">Como pagar</p>
              {[
                "Abra o app do seu banco ou instituição financeira.",
                "Aponte a câmera para o QR Code ou cole o código PIX.",
                "Confirme o pagamento e pronto!",
              ].map((step, i) => (
                <div key={step} className="flex items-start gap-3 text-sm">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold text-white">
                    {i + 1}
                  </span>
                  <p className="text-muted-foreground">{step}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
              <ShieldCheck className="size-4" />
              Pagamento seguro. Seus dados estão protegidos e criptografados.
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
                <span>
                  {order ? formatBRL(Number(order.deliveryFee)) : "—"}
                </span>
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

            <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
              Após o pagamento, você será redirecionado para a página de
              confirmação.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
