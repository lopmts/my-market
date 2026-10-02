import crypto from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { Prisma } from "@/generated/prisma/client";
import { paymentClient } from "@/lib/mercado-pago";
import { prisma } from "@/lib/prisma";

// Valida a assinatura HMAC enviada pelo Mercado Pago (header x-signature).
// Sem isso, qualquer pessoa consegue chamar este endpoint.
function isValidSignature(request: NextRequest, dataId: string) {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  const signature = request.headers.get("x-signature");
  const requestId = request.headers.get("x-request-id");

  if (!secret || !signature || !requestId) return false;

  const parts = Object.fromEntries(
    signature.split(",").map((part) => {
      const [key, ...value] = part.trim().split("=");
      return [key, value.join("=")];
    }),
  );

  const { ts, v1 } = parts;
  if (!ts || !v1) return false;

  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");

  const a = Buffer.from(expected);
  const b = Buffer.from(v1);

  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  try {
    const dataId = request.nextUrl.searchParams.get("data.id");

    // 1. Assinatura primeiro, antes de qualquer consulta ou escrita
    if (!dataId || !isValidSignature(request, dataId)) {
      return NextResponse.json(
        { message: "Assinatura inválida" },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => null);

    if (body?.type !== "payment") {
      return NextResponse.json({ received: true });
    }

    // 2. Nunca confie no body: o status real vem da API do Mercado Pago
    const mpPayment = await paymentClient.get({ id: dataId });
    const providerPaymentId = String(mpPayment.id);

    const payment = await prisma.payment.findUnique({
      where: { providerPaymentId },
      include: { order: { select: { id: true, total: true, status: true } } },
    });

    if (!payment) {
      // O webhook pode chegar antes de gravarmos o pagamento no banco.
      // Um status não-2xx faz o Mercado Pago tentar de novo mais tarde.
      console.warn("Webhook para pagamento desconhecido:", providerPaymentId);
      return NextResponse.json(
        { message: "Pagamento não encontrado" },
        { status: 404 },
      );
    }

    // 3. O pagamento precisa corresponder ao pedido
    if (mpPayment.external_reference !== payment.orderId) {
      console.error("external_reference divergente", {
        paymentId: payment.id,
        orderId: payment.orderId,
      });
      return NextResponse.json({ received: true });
    }

    switch (mpPayment.status) {
      case "approved": {
        // 4. Valor, moeda e total do pedido precisam bater antes de confirmar
        const paidAmount = new Prisma.Decimal(
          mpPayment.transaction_amount ?? 0,
        );

        const valid =
          (mpPayment.currency_id ?? "BRL") === "BRL" &&
          paidAmount.equals(payment.amount) &&
          payment.amount.equals(payment.order.total);

        if (!valid) {
          console.error("Valor pago diverge do pedido. Revisar manualmente.", {
            paymentId: payment.id,
            orderId: payment.orderId,
          });
          return NextResponse.json({ received: true });
        }

        await prisma.$transaction(async (tx) => {
          // Atualização condicional: se já estiver PAID, count = 0 e nada é refeito
          const updated = await tx.payment.updateMany({
            where: {
              id: payment.id,
              status: { in: ["PENDING", "FAILED", "CANCELLED"] },
            },
            data: {
              status: "PAID",
              paidAt: mpPayment.date_approved
                ? new Date(mpPayment.date_approved)
                : new Date(),
            },
          });

          if (updated.count === 0) return;

          // Só confirma pedidos pendentes (não ressuscita pedido cancelado)
          const order = await tx.order.updateMany({
            where: { id: payment.orderId, status: "PENDING" },
            data: { status: "CONFIRMED" },
          });

          if (order.count === 0) {
            console.error(
              "Pagamento aprovado para pedido que não está PENDING",
              {
                paymentId: payment.id,
                orderId: payment.orderId,
                orderStatus: payment.order.status,
              },
            );
          }
        });

        break;
      }

      case "cancelled":
      case "rejected": {
        // Nunca rebaixa um pagamento que já foi pago
        await prisma.payment.updateMany({
          where: { id: payment.id, status: "PENDING" },
          data: {
            status: mpPayment.status === "rejected" ? "FAILED" : "CANCELLED",
          },
        });

        break;
      }

      case "refunded":
      case "charged_back": {
        await prisma.payment.updateMany({
          where: { id: payment.id, status: "PAID" },
          data: { status: "REFUNDED" },
        });

        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    // 500 faz o Mercado Pago reenviar a notificação
    console.error("Mercado Pago Webhook:", error);

    return NextResponse.json(
      { message: "Erro processando webhook" },
      { status: 500 },
    );
  }
}
