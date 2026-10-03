import { siteUrl } from "@/lib/site-url";

export class MercadoPagoWebhookUrlError extends Error {
  constructor() {
    super(
      "Configure APP_URL com a URL pública HTTPS do site. Para desenvolvimento local, use um túnel HTTPS apontando para o servidor local.",
    );
    this.name = "MercadoPagoWebhookUrlError";
  }
}

export function getMercadoPagoWebhookUrl() {
  let baseUrl: URL;
  const appUrl = process.env.APP_URL?.trim();

  try {
    baseUrl = appUrl
      ? new URL(
          /^https?:\/\//i.test(appUrl) ? appUrl : `https://${appUrl}`,
        )
      : siteUrl;
  } catch {
    throw new MercadoPagoWebhookUrlError();
  }

  const hostname = baseUrl.hostname.replace(/^\[|\]$/g, "");
  const isLocalhost =
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname === "::1" ||
    hostname.startsWith("127.");
  const isReservedDomain = /\.(local|test|invalid|example)$/i.test(hostname);

  if (
    baseUrl.protocol !== "https:" ||
    !hostname ||
    baseUrl.username ||
    baseUrl.password ||
    isLocalhost ||
    isReservedDomain
  ) {
    throw new MercadoPagoWebhookUrlError();
  }

  return new URL("/api/webhooks/mercado-pago", baseUrl).toString();
}
