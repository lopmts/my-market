import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      message:
        "Pagamentos com cartão estão temporariamente indisponíveis. Selecione Pix para concluir o pedido.",
    },
    { status: 503 },
  );
}
