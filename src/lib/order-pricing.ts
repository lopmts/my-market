import { Prisma } from "@/generated/prisma/client";

type OrderPricingItem = {
  quantity: number;
  unitPrice: Prisma.Decimal;
  subtotal: Prisma.Decimal;
};

export function calculateOrderTotals(
  items: OrderPricingItem[],
  deliveryFee: Prisma.Decimal,
) {
  const linesAreConsistent = items.every((item) =>
    item.subtotal.equals(item.unitPrice.mul(item.quantity)),
  );
  const subtotal = items.reduce(
    (sum, item) => sum.plus(item.unitPrice.mul(item.quantity)),
    new Prisma.Decimal(0),
  );

  return {
    subtotal,
    total: subtotal.plus(deliveryFee),
    linesAreConsistent,
  };
}
