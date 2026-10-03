import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import type { Payment } from "@/generated/prisma/client";
import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { paymentClient } from "@/lib/mercado-pago";
import {
  getMercadoPagoWebhookUrl,
  MercadoPagoWebhookUrlError,
} from "@/lib/mercado-pago-webhook-url";
import { calculateOrderTotals } from "@/lib/order-pricing";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  orderId: z.string().min(1),
});

const PIX_TTL_MINUTES = 30;

function pixResponse(payment: Payment) {
  return {
    paymentId: payment.id,
    status: payment.status,
    pix: {
      qrCode: payment.pixQrCode,
      qrCodeBase64: payment.pixQrCodeBase64,
    },
    expiresAt: payment.expiresAt,
  };
}

export async function POST(request: NextRequest) {
  try {
    // 1. Autenticação: sem sessão não cria pagamento
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
    }

    // 2. Validação do body
    const parsed = bodySchema.safeParse(await request.json().catch(() => null));

    if (!parsed.success) {
      return NextResponse.json(
        { message: "orderId é obrigatório" },
        { status: 400 },
      );
    }

    // 3. Autorização: o pedido precisa ser do usuário logado.
    // Se não for, responde 404 para não revelar que o pedido existe.
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

    // 4. Só cobra pedidos que ainda aguardam pagamento
    if (order.status !== "PENDING") {
      return NextResponse.json(
        { message: "Este pedido não está aguardando pagamento" },
        { status: 409 },
      );
    }

    if (order.total.lte(0)) {
      return NextResponse.json(
        { message: "Valor do pedido inválido" },
        { status: 422 },
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
      console.error("Totais do pedido divergentes antes do pagamento PIX", {
        orderId: order.id,
      });
      return NextResponse.json(
        { message: "Os valores do pedido precisam ser recalculados antes do pagamento" },
        { status: 409 },
      );
    }

    const existing = order.payment;

    if (existing?.status === "PAID") {
      return NextResponse.json(
        { message: "Este pedido já foi pago" },
        { status: 409 },
      );
    }

    if (existing?.status === "PENDING" && existing.method !== "PIX") {
      return NextResponse.json(
        { message: "Já existe um pagamento por cartão aguardando confirmação" },
        { status: 409 },
      );
    }

    if (existing?.status === "PENDING" && !existing.amount.equals(total)) {
      console.error("Valor do pagamento PIX diverge do pedido", {
        orderId: order.id,
        paymentId: existing.id,
      });
      return NextResponse.json(
        { message: "O pagamento existente não corresponde ao total do pedido" },
        { status: 409 },
      );
    }

    // 5. PIX ainda válido: devolve o mesmo QR Code em vez de cobrar de novo
    if (
      existing?.status === "PENDING" &&
      existing.pixQrCode &&
      existing.expiresAt &&
      existing.expiresAt > new Date()
    ) {
      return NextResponse.json(pixResponse(existing));
    }

    // 6. Idempotência de verdade: a chave é determinística (pedido + tentativa).
    // Requisições duplicadas ou concorrentes retornam o MESMO pagamento no Mercado Pago.
    // Se o PIX anterior expirou/falhou, a tentativa aumenta e gera uma nova cobrança.
    const attempt = Number(existing?.attempts ?? 0) + 1;
    const expiresAt = new Date(Date.now() + PIX_TTL_MINUTES * 60_000);
    const notificationUrl = getMercadoPagoWebhookUrl();

    const mpPayment = await paymentClient.create({
      body: {
        // O valor vem SEMPRE do banco, nunca do cliente
        transaction_amount: Number(total.toFixed(2)),
        description: `Pedido ${order.id}`,
        payment_method_id: "pix",
        external_reference: order.id,
        date_of_expiration: expiresAt.toISOString(),
        payer: { email: session.user.email },
        notification_url: notificationUrl,
      },
      requestOptions: {
        idempotencyKey: `pix-${order.id}-${attempt}`,
      },
    });

    const transactionData = mpPayment.point_of_interaction?.transaction_data;

    if (
      !mpPayment.id ||
      !transactionData?.qr_code ||
      !transactionData.qr_code_base64
    ) {
      console.error("Mercado Pago não retornou dados do PIX", {
        orderId: order.id,
        mpStatus: mpPayment.status,
      });
      return NextResponse.json(
        { message: "Erro ao gerar o PIX" },
        { status: 502 },
      );
    }

    const data = {
      method: "PIX" as const,
      status: "PENDING" as const,
      amount: total,
      providerPaymentId: String(mpPayment.id),
      pixQrCode: transactionData.qr_code,
      pixQrCodeBase64: transactionData.qr_code_base64,
      expiresAt,
      paidAt: null,
      attempts: attempt,
    };

    let saved: Payment;

    try {
      saved = existing
        ? await prisma.payment.update({ where: { id: existing.id }, data })
        : await prisma.payment.create({ data: { orderId: order.id, ...data } });
    } catch (error) {
      // Requisição concorrente já gravou o mesmo pagamento (mesma idempotencyKey)
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const current = await prisma.payment.findUnique({
          where: { orderId: order.id },
        });
        if (current) return NextResponse.json(pixResponse(current));
      }
      throw error;
    }

    return NextResponse.json(pixResponse(saved));
  } catch (error) {
    if (error instanceof MercadoPagoWebhookUrlError) {
      console.error("URL pública do webhook do Mercado Pago não configurada");
      return NextResponse.json({ message: error.message }, { status: 503 });
    }

    console.error("Erro ao criar pagamento PIX:", error);

    return NextResponse.json(
      { message: "Erro ao criar pagamento PIX" },
      { status: 500 },
    );
  }
}
