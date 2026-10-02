type FormatPriceOptions = {
  currency?: string; // "BRL", "USD"...
  locale?: string; // "pt-BR", "en-US"...
  showCents?: boolean; // exibir centavos
};

export function formatPrice(
  price: string | number | null | undefined,
  {
    currency = "BRL",
    locale = "pt-BR",
    showCents = true,
  }: FormatPriceOptions = {},
): string {
  if (price === null || price === undefined || price === "") return "—";

  const value = typeof price === "string" ? Number(price) : price;
  if (Number.isNaN(value)) return "—";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: showCents ? 2 : 0,
  }).format(value);
}
