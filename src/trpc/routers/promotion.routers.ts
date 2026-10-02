import { DiscountType, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { activePromotionWhere, applyDiscount } from "@/lib/promotion";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { adminProcedure, createTRPCRouter, publicProcedure } from "../init";

const productSelect = {
  id: true,
  name: true,
  description: true,
  image: true,
  price: true,
  rating: true,
  reviewsCount: true,
  category: { select: { id: true, name: true, slug: true } },
} satisfies Prisma.ProductSelect;

type PromotionWithProduct = Prisma.PromotionGetPayload<{
  include: { product: { select: typeof productSelect } };
}>;

const getStatus = (p: {
  active: boolean;
  startsAt: Date;
  endsAt: Date | null;
}) => {
  const now = new Date();
  if (!p.active) return "inactive" as const;
  if (p.startsAt > now) return "scheduled" as const;
  if (p.endsAt && p.endsAt <= now) return "expired" as const;
  return "active" as const;
};

const serialize = (p: PromotionWithProduct) => {
  const { promoPrice, discountPercent } = applyDiscount(
    p.product.price,
    p.discountType,
    p.discountValue,
  );

  return {
    id: p.id,
    name: p.name,
    status: getStatus(p),
    discountType: p.discountType,
    discountValue: p.discountValue.toNumber(),
    startsAt: p.startsAt,
    endsAt: p.endsAt,
    active: p.active,
    originalPrice: p.product.price.toNumber(),
    promoPrice: promoPrice.toNumber(),
    discountPercent,
    product: {
      ...p.product,
      price: p.product.price.toNumber(),
      rating: p.product.rating.toNumber(),
      isPromotion: getStatus(p) === "active",
    },
  };
};

const include = { product: { select: productSelect } } as const;

/** Valida o valor do desconto contra o preço do produto. */
function assertDiscount(
  type: DiscountType,
  value: number,
  productPrice: Prisma.Decimal,
) {
  if (type === DiscountType.PERCENTAGE && (value < 1 || value > 99)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "O desconto deve ficar entre 1% e 99%.",
    });
  }
  if (
    type === DiscountType.FIXED_PRICE &&
    (value <= 0 || productPrice.lte(value))
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "O preço promocional deve ser maior que zero e menor que o preço atual.",
    });
  }
}

/** Impede duas promoções ativas com períodos sobrepostos no mesmo produto. */
async function assertNoOverlap(
  tx: Prisma.TransactionClient,
  args: {
    productId: string;
    startsAt: Date;
    endsAt: Date | null;
    ignoreId?: string;
  },
) {
  const conflict = await tx.promotion.findFirst({
    where: {
      productId: args.productId,
      active: true,
      ...(args.ignoreId && { id: { not: args.ignoreId } }),
      // existente começa antes do fim da nova...
      ...(args.endsAt && { startsAt: { lt: args.endsAt } }),
      // ...e termina depois do início da nova
      OR: [{ endsAt: null }, { endsAt: { gt: args.startsAt } }],
    },
    select: { id: true },
  });

  if (conflict) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "Já existe uma promoção ativa para este produto nesse período.",
    });
  }
}

const baseInput = z.object({
  productId: z.string().cuid(),
  name: z.string().trim().min(1).max(80).optional(),
  discountType: z.nativeEnum(DiscountType),
  discountValue: z.number().positive().max(99999),
  startsAt: z.coerce.date().default(() => new Date()),
  endsAt: z.coerce.date().nullable().default(null),
  active: z.boolean().default(true),
});

const dateRefine = (v: { startsAt: Date; endsAt: Date | null }) =>
  !v.endsAt || v.endsAt > v.startsAt;
const dateRefineMsg = {
  message: "A data de término deve ser posterior à de início.",
  path: ["endsAt"],
};

const serializable = {
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
};

export const promotionRouter = createTRPCRouter({
  // ---------- PÚBLICO ----------

  /** Promoções vigentes (página "Promoções" / carrossel). */
  list: publicProcedure
    .input(
      z
        .object({
          categorySlug: z.string().optional(),
          limit: z.number().int().min(1).max(50).default(12),
          cursor: z.string().optional(),
        })
        .default({ limit: 12 }),
    )
    .query(async ({ input }) => {
      const items = await prisma.promotion.findMany({
        where: {
          ...activePromotionWhere(),
          product: {
            active: true,
            ...(input.categorySlug && {
              category: { slug: input.categorySlug },
            }),
          },
        },
        include,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: input.limit + 1,
        ...(input.cursor && { cursor: { id: input.cursor }, skip: 1 }),
      });

      const hasMore = items.length > input.limit;
      const page = hasMore ? items.slice(0, -1) : items;

      return {
        items: page.map(serialize),
        nextCursor: hasMore ? page[page.length - 1].id : null,
      };
    }),

  /** Promoção vigente de um produto (página de detalhes). */
  byProductId: publicProcedure
    .input(z.object({ productId: z.string().cuid() }))
    .query(async ({ input }) => {
      const promo = await prisma.promotion.findFirst({
        where: {
          productId: input.productId,
          ...activePromotionWhere(),
          product: { active: true },
        },
        include,
        orderBy: { createdAt: "desc" },
      });

      return promo ? serialize(promo) : null;
    }),

  // ---------- ADMIN ----------

  adminList: adminProcedure
    .input(
      z
        .object({
          productId: z.string().cuid().optional(),
          status: z
            .enum(["all", "active", "scheduled", "expired"])
            .default("all"),
        })
        .default({ status: "all" }),
    )
    .query(async ({ input }) => {
      const now = new Date();
      const byStatus: Record<string, Prisma.PromotionWhereInput> = {
        all: {},
        active: activePromotionWhere(now),
        scheduled: { active: true, startsAt: { gt: now } },
        expired: { endsAt: { lte: now } },
      };

      const items = await prisma.promotion.findMany({
        where: {
          ...(input.productId && { productId: input.productId }),
          ...byStatus[input.status],
        },
        include,
        orderBy: { createdAt: "desc" },
      });

      return items.map(serialize);
    }),

  create: adminProcedure
    .input(baseInput.refine(dateRefine, dateRefineMsg))
    .mutation(({ input }) =>
      prisma.$transaction(async (tx) => {
        const product = await tx.product.findUnique({
          where: { id: input.productId },
          select: { price: true },
        });
        if (!product) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Produto não encontrado.",
          });
        }

        assertDiscount(input.discountType, input.discountValue, product.price);

        if (input.active) {
          await assertNoOverlap(tx, {
            productId: input.productId,
            startsAt: input.startsAt,
            endsAt: input.endsAt,
          });
        }

        const created = await tx.promotion.create({
          data: input,
          include,
        });
        return serialize(created);
      }, serializable),
    ),

  update: adminProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        data: baseInput
          .omit({ productId: true })
          .partial()
          .refine(
            (v) => !v.startsAt || !v.endsAt || v.endsAt > v.startsAt,
            dateRefineMsg,
          ),
      }),
    )
    .mutation(({ input }) =>
      prisma.$transaction(async (tx) => {
        const current = await tx.promotion.findUnique({
          where: { id: input.id },
          include,
        });
        if (!current) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Promoção não encontrada.",
          });
        }

        const next = {
          discountType: input.data.discountType ?? current.discountType,
          discountValue:
            input.data.discountValue ?? current.discountValue.toNumber(),
          startsAt: input.data.startsAt ?? current.startsAt,
          endsAt:
            input.data.endsAt === undefined
              ? current.endsAt
              : input.data.endsAt,
          active: input.data.active ?? current.active,
        };

        if (next.endsAt && next.endsAt <= next.startsAt) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "A data de término deve ser posterior à de início.",
          });
        }

        assertDiscount(
          next.discountType,
          next.discountValue,
          current.product.price,
        );

        if (next.active) {
          await assertNoOverlap(tx, {
            productId: current.productId,
            startsAt: next.startsAt,
            endsAt: next.endsAt,
            ignoreId: current.id,
          });
        }

        const updated = await tx.promotion.update({
          where: { id: input.id },
          data: { ...input.data },
          include,
        });
        return serialize(updated);
      }, serializable),
    ),

  delete: adminProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ input }) => {
      try {
        await prisma.promotion.delete({ where: { id: input.id } });
        return { success: true };
      } catch (e) {
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === "P2025"
        ) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Promoção não encontrada.",
          });
        }
        throw e;
      }
    }),
});
