"use client";

import { AlertTriangle, ArrowLeft, QrCode } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export function CardPaymentRender() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") ?? "";

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl items-center px-4 py-12">
      <section
        role="alert"
        className="w-full rounded-2xl border border-amber-300 bg-amber-50 p-6 text-center dark:border-amber-900 dark:bg-amber-950/30"
      >
        <AlertTriangle className="mx-auto size-10 text-amber-600 dark:text-amber-400" />
        <h1 className="mt-4 text-xl font-bold">Pagamento com cartão indisponível</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          No momento, só aceitamos pagamentos via Pix. Seu pedido continua
          disponível para pagamento seguro com QR Code.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          {orderId ? (
            <Button
              nativeButton={false}
              render={
                <Link
                  href={`/payment/pix?orderId=${encodeURIComponent(orderId)}`}
                />
              }
            >
              <QrCode className="size-4" />
              Pagar com Pix
            </Button>
          ) : (
            <Button nativeButton={false} render={<Link href="/carrinho" />}>
              <ArrowLeft className="size-4" />
              Voltar ao carrinho
            </Button>
          )}
          <Button variant="outline" nativeButton={false} render={<Link href="/" />}>
            Ir para o início
          </Button>
        </div>
      </section>
    </main>
  );
}
