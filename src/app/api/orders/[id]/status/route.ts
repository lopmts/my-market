import { NextRequest, NextResponse } from "next/server";

import { paymentTypeFromStatus } from "@/lib/payment-type";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const payment = await prisma.payment.findFirst({
    where: { orderId: id },
    orderBy: { createdAt: "desc" },
    select: { status: true },
  });

  if (!payment) {
    return NextResponse.json({ message: "Não encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    status: payment.status,
    type: paymentTypeFromStatus(payment.status),
  });
}
