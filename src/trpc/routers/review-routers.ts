import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../init";

// recalcula rating/reviewsCount do produto e grava no cache
async function recalcProductRating(
  tx: Prisma.TransactionClient,
  productId: string,
) {
  const agg = await tx.review.aggregate({
    where: { productId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  await tx.product.update({
    where: { id: productId },
    data: {
      rating: agg._avg.rating ?? 0,
      reviewsCount: agg._count.rating,
    },
  });
}

export const reviewRouter = createTRPCRouter({
  // ---------- PÚBLICO ----------

  list: publicProcedure
    .input(
      z.object({
        productId: z.string().cuid(),
        limit: z.number().int().min(1).max(50).default(10),
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      const { productId, limit, cursor } = input;

      const reviews = await prisma.review.findMany({
        where: { productId },
        include: { user: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: "desc" },
        take: limit + 1,
        ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      });

      let nextCursor: string | undefined;
      if (reviews.length > limit) {
        nextCursor = reviews.pop()!.id;
      }

      return { items: reviews, nextCursor };
    }),

  ratingBreakdown: publicProcedure
    .input(z.object({ productId: z.string().cuid() }))
    .query(async ({ input }) => {
      const grouped = await prisma.review.groupBy({
        by: ["rating"],
        where: { productId: input.productId },
        _count: { rating: true },
      });

      const total = grouped.reduce((acc, g) => acc + g._count.rating, 0);

      return {
        total,
        breakdown: [5, 4, 3, 2, 1].map((star) => {
          const count =
            grouped.find((g) => g.rating === star)?._count.rating ?? 0;
          return {
            star,
            count,
            percentage: total > 0 ? Math.round((count / total) * 100) : 0,
          };
        }),
      };
    }),

  // ---------- AUTENTICADO ----------

  create: protectedProcedure
    .input(
      z.object({
        productId: z.string().cuid(),
        rating: z.number().int().min(1).max(5),
        comment: z.string().max(500).nullish(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // opcional, mas recomendado: só quem comprou pode avaliar
      const hasPurchased = await prisma.orderItem.findFirst({
        where: {
          productId: input.productId,
          order: { userId: ctx.user.id, status: "DELIVERED" },
        },
        select: { id: true },
      });

      if (!hasPurchased) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você só pode avaliar produtos que já comprou.",
        });
      }

      try {
        const review = await prisma.$transaction(async (tx) => {
          const created = await tx.review.create({
            data: {
              productId: input.productId,
              userId: ctx.user.id,
              rating: input.rating,
              comment: input.comment,
            },
          });

          await recalcProductRating(tx, input.productId);

          return created;
        });

        return review;
      } catch (e) {
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === "P2002"
        ) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Você já avaliou este produto.",
          });
        }
        throw e;
      }
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        rating: z.number().int().min(1).max(5).optional(),
        comment: z.string().max(500).nullish(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const existing = await prisma.review.findUnique({
        where: { id: input.id },
        select: { userId: true, productId: true },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Avaliação não encontrada.",
        });
      }
      if (existing.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const review = await prisma.$transaction(async (tx) => {
        const updated = await tx.review.update({
          where: { id: input.id },
          data: { rating: input.rating, comment: input.comment },
        });

        if (input.rating !== undefined) {
          await recalcProductRating(tx, existing.productId);
        }

        return updated;
      });

      return review;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ input, ctx }) => {
      const existing = await prisma.review.findUnique({
        where: { id: input.id },
        select: { userId: true, productId: true },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Avaliação não encontrada.",
        });
      }
      if (existing.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await prisma.$transaction(async (tx) => {
        await tx.review.delete({ where: { id: input.id } });
        await recalcProductRating(tx, existing.productId);
      });

      return { success: true };
    }),
});
