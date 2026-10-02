import { DiscountType, Prisma } from "@/generated/prisma/client";

type Db = Prisma.TransactionClient;

/** Promoção vigente agora: ativa, já iniciada e não expirada. */
export const activePromotionWhere = (
  now = new Date(),
): Prisma.PromotionWhereInput => ({
  active: true,
  startsAt: { lte: now },
  OR: [{ endsAt: null }, { endsAt: { gt: now } }],
});

export function applyDiscount(
  price: Prisma.Decimal,
  type: DiscountType,
  value: Prisma.Decimal,
) {
  const raw =
    type === DiscountType.PERCENTAGE
      ? price.mul(new Prisma.Decimal(100).minus(value)).div(100)
      : value;

  // nunca cobra mais que o preço cheio
  const promoPrice = Prisma.Decimal.min(price, raw).toDecimalPlaces(2);
  const discountPercent = price.isZero()
    ? 0
    : price.minus(promoPrice).div(price).mul(100).round().toNumber();

  return { promoPrice, discountPercent };
}

/**
 * Use no orderRouter ao criar/atualizar itens do pedido:
 * o preço vem SEMPRE do servidor, nunca do cliente.
 */
export async function getEffectivePrices(db: Db, productIds: string[]) {
  const products = await db.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      price: true,
      promotions: {
        where: activePromotionWhere(),
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  return new Map(
    products.map((p) => {
      const promo = p.promotions[0];
      const unitPrice = promo
        ? applyDiscount(p.price, promo.discountType, promo.discountValue)
            .promoPrice
        : p.price;

      return [
        p.id,
        {
          originalPrice: p.price,
          unitPrice,
          promotionId: promo?.id ?? null,
        },
      ] as const;
    }),
  );
}
