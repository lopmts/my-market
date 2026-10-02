import { MercadoPagoConfig, Payment } from "mercadopago";

// Um único client compartilhado entre a criação do PIX e o webhook
export const mercadoPago = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
  options: { timeout: 8000 },
});

export const paymentClient = new Payment(mercadoPago);
