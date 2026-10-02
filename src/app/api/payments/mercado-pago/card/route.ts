import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import type { Payment } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { paymentClient } from "@/lib/mercado-pago";
import { calculateOrderTotals } from "@/lib/order-pricing";
import { prisma } from "@/lib/prisma";

// O número do cartão, validade e CVV NUNCA passam por este endpoint: eles
// são tokenizados no navegador pelo SDK do Mercado Pago (Payment Brick).
// Aqui só chega o token opaco + metadados do pagamento.
const bodySchema = z.object({
  orderId: z.string().min(1),
  token: z.string().min(1),
  paymentMethodId: z.string().min(1),
  issuerId: z.string().optional(),
  installments: z.number().int().min(1).max(24),
  payer: z.object({
    email: z.string().email(),
    identification: z
      .object({ type: z.string(), number: z.string() })
      .optional(),
  }),
});

function cardResponse(payment: Payment, mpStatus: string) {
  return {
    paymentId: payment.id,
    status: payment.status,
    mpStatus, // "approved" | "in_process" | "rejected" | ...
  };
}

export async function POST(request: NextRequest) {
  try {
    // 1. Autenticação
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
    }

    // 2. Validação do body
    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Dados de pagamento inválidos" },
        { status: 400 },
      );
    }

    // 3. Autorização: pedido precisa ser do usuário logado
    const order = await prisma.order.findFirst({
      where: { id: parsed.data.orderId, userId: session.user.id },
      include: {
        payment: true,
        items: { select: { quantity: true, unitPrice: true, subtotal: true } },
      },
    });

    if (!order) {
      return NextResponse.json(
        { message: "Pedido não encontrado" },
        { status: 404 },
      );
    }

    if (order.status !== "PENDING") {
      return NextResponse.json(
        { message: "Este pedido não está aguardando pagamento" },
        { status: 409 },
      );
    }

    if (order.payment?.status === "PAID") {
      return NextResponse.json(
        { message: "Este pedido já foi pago" },
        { status: 409 },
      );
    }

    const { subtotal, total, linesAreConsistent } = calculateOrderTotals(
      order.items,
      order.deliveryFee,
    );

    if (
      !linesAreConsistent ||
      !subtotal.equals(order.subtotal) ||
      !total.equals(order.total)
    ) {
      console.error("Totais do pedido divergentes antes do pagamento com cartão", {
        orderId: order.id,
      });
      return NextResponse.json(
        { message: "Os valores do pedido precisam ser recalculados antes do pagamento" },
        { status: 409 },
      );
    }

    const existingPayment = order.payment;
    if (
      existingPayment?.status === "PENDING" &&
      (existingPayment.method === "CARD" ||
        !existingPayment.expiresAt ||
        existingPayment.expiresAt > new Date())
    ) {
      return NextResponse.json(
        { message: "Já existe um pagamento aguardando confirmação para este pedido" },
        { status: 409 },
      );
    }
    if (
      existingPayment?.status === "PENDING" &&
      !existingPayment.amount.equals(total)
    ) {
      console.error("Valor do pagamento existente diverge do pedido", {
        orderId: order.id,
        paymentId: existingPayment.id,
      });
      return NextResponse.json(
        { message: "O pagamento existente não corresponde ao total do pedido" },
        { status: 409 },
      );
    }

    // 4. Idempotência: tentativa incremental por pedido
    const attempt = Number(order.payment?.attempts ?? 0) + 1;

    const mpPayment = await paymentClient.create({
      body: {
        // O valor vem SEMPRE do banco, nunca do cliente
        transaction_amount: Number(total.toFixed(2)),
        token: parsed.data.token,
        description: `Pedido ${order.id}`,
        installments: parsed.data.installments,
        payment_method_id: parsed.data.paymentMethodId,
        issuer_id: parsed.data.issuerId
          ? Number(parsed.data.issuerId)
          : undefined,
        external_reference: order.id,
        payer: parsed.data.payer,
        notification_url: `${process.env.APP_URL}/api/webhooks/mercado-pago`,
      },
      requestOptions: {
        idempotencyKey: `card-${order.id}-${attempt}`,
      },
    });

    const status =
      mpPayment.status === "approved"
        ? ("PAID" as const)
        : mpPayment.status === "in_process" || mpPayment.status === "pending"
          ? ("PENDING" as const)
          : ("FAILED" as const);

    const data = {
      method: "CARD" as const,
      status,
      amount: total,
      providerPaymentId: mpPayment.id ? String(mpPayment.id) : null,
      paidAt: status === "PAID" ? new Date() : null,
      attempts: attempt,
    };

    const saved = order.payment
      ? await prisma.payment.update({ where: { id: order.payment.id }, data })
      : await prisma.payment.create({ data: { orderId: order.id, ...data } });

    // Cartão costuma responder na hora — não precisa esperar o webhook para
    // confirmar (o webhook continua existindo como reforço/reconciliação)
    if (status === "PAID") {
      await prisma.order.updateMany({
        where: { id: order.id, status: "PENDING" },
        data: { status: "CONFIRMED" },
      });
    }

    return NextResponse.json(
      cardResponse(saved, mpPayment.status ?? "unknown"),
    );
  } catch (error) {
    console.error("Erro ao criar pagamento com cartão:", error);
    return NextResponse.json(
      { message: "Erro ao processar o pagamento" },
      { status: 500 },
    );
  }
}
