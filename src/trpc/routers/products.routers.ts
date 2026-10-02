import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { adminProcedure, createTRPCRouter, publicProcedure } from "../init";
// import { adminProcedure } from "../init"; // veja a nota sobre admin abaixo

const productInclude = {
  category: { select: { id: true, name: true, slug: true } },
} satisfies Prisma.ProductInclude;

type ProductWithCategory = Prisma.ProductGetPayload<{
  include: typeof productInclude;
}>;

// Decimal -> number para o client
const serialize = (p: ProductWithCategory) => ({
  ...p,
  price: p.price.toNumber(),
  rating: p.rating.toNumber(),
  reviewsCount: p.reviewsCount,
  reviewsCountLabel: formatCount(p.reviewsCount),
});

const productInput = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(500).nullish(),
  image: z.string().url().nullish(),
  images: z.array(z.string().url()).default([]),
  price: z.number().positive().multipleOf(0.01),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
  isPromotion: z.boolean().default(false),
  categoryId: z.string().cuid(),
});

const formatCount = (n: number) => {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
};

export const productRouter = createTRPCRouter({
  // ---------- PÚBLICO ----------

  list: publicProcedure
    .input(
      z
        .object({
          category: z.string().optional(), // slug da categoria
          search: z.string().trim().min(1).max(80).optional(),
          featured: z.boolean().optional(),
          minPrice: z.number().nonnegative().optional(),
          maxPrice: z.number().positive().optional(),
          limit: z.number().int().min(1).max(50).default(20),
          cursor: z.string().optional(),
        })
        .prefault({}),
    )
    .query(async ({ input }) => {
      const { category, search, featured, minPrice, maxPrice, limit, cursor } =
        input;

      const where: Prisma.ProductWhereInput = {
        active: true,
        category: { active: true, ...(category && { slug: category }) },
        ...(search && { name: { contains: search, mode: "insensitive" } }),
        ...(featured !== undefined && { featured }),
        ...((minPrice !== undefined || maxPrice !== undefined) && {
          price: { gte: minPrice, lte: maxPrice },
        }),
      };

      const products = await prisma.product.findMany({
        where,
        include: productInclude,
        orderBy: [{ name: "asc" }, { id: "asc" }],
        take: limit + 1, // +1 para saber se há próxima página
        ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      });

      let nextCursor: string | undefined;
      if (products.length > limit) {
        nextCursor = products.pop()!.id;
      }

      return { items: products.map(serialize), nextCursor };
    }),

  byId: publicProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ input }) => {
      const product = await prisma.product.findFirst({
        where: { id: input.id, active: true, category: { active: true } },
        include: productInclude,
      });

      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Produto não encontrado.",
        });
      }

      return serialize(product);
    }),

  featured: publicProcedure
    .input(
      z
        .object({ limit: z.number().int().min(1).max(20).default(8) })
        .prefault({}),
    )
    .query(async ({ input }) => {
      const products = await prisma.product.findMany({
        where: { active: true, featured: true, category: { active: true } },
        include: productInclude,
        orderBy: { updatedAt: "desc" },
        take: input.limit,
      });

      return products.map(serialize);
    }),

  related: publicProcedure
    .input(
      z.object({
        productId: z.string().cuid(),
        limit: z.number().int().min(1).max(12).default(4),
      }),
    )
    .query(async ({ input }) => {
      const current = await prisma.product.findUnique({
        where: { id: input.productId },
        select: { categoryId: true },
      });

      if (!current) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Produto não encontrado.",
        });
      }

      const products = await prisma.product.findMany({
        where: {
          active: true,
          categoryId: current.categoryId,
          id: { not: input.productId },
        },
        include: productInclude,
        orderBy: { featured: "desc" },
        take: input.limit,
      });

      return products.map(serialize);
    }),

  bestSellers: publicProcedure
    .input(
      z
        .object({ limit: z.number().int().min(1).max(20).default(8) })
        .prefault({}),
    )
    .query(async ({ input }) => {
      const grouped = await prisma.orderItem.groupBy({
        by: ["productId"],
        where: { order: { status: { not: "CANCELLED" } } },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: input.limit,
      });

      const products = await prisma.product.findMany({
        where: { id: { in: grouped.map((g) => g.productId) }, active: true },
        include: productInclude,
      });

      // reordena pelos ids do groupBy (findMany não garante a ordem)
      const order = new Map(grouped.map((g, i) => [g.productId, i]));
      return products
        .sort((a, b) => order.get(a.id)! - order.get(b.id)!)
        .map(serialize);
    }),

  // ---------- ADMIN (troque publicProcedure por adminProcedure) ----------

  adminList: adminProcedure
    .input(
      z
        .object({
          search: z.string().trim().max(80).optional(),
          categoryId: z.string().cuid().optional(),
          active: z.boolean().optional(),
          featured: z.boolean().optional(),
          isPromotion: z.boolean().optional(),
          page: z.number().int().min(1).default(1),
          limit: z.number().int().min(1).max(50).default(20),
        })
        .prefault({}),
    )
    .query(async ({ input }) => {
      const where: Prisma.ProductWhereInput = {
        ...(input.search && {
          OR: [
            { name: { contains: input.search, mode: "insensitive" } },
            { description: { contains: input.search, mode: "insensitive" } },
          ],
        }),
        ...(input.categoryId && { categoryId: input.categoryId }),
        ...(input.active !== undefined && { active: input.active }),
        ...(input.featured !== undefined && { featured: input.featured }),
        ...(input.isPromotion !== undefined && {
          isPromotion: input.isPromotion,
        }),
      };
      const skip = (input.page - 1) * input.limit;

      const [products, total, allCount, activeCount, featuredCount, promotionCount] =
        await Promise.all([
          prisma.product.findMany({
            where,
            include: {
              category: productInclude.category,
              _count: { select: { reviews: true, orderItems: true } },
            },
            orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
            skip,
            take: input.limit,
          }),
          prisma.product.count({ where }),
          prisma.product.count(),
          prisma.product.count({ where: { active: true } }),
          prisma.product.count({ where: { featured: true } }),
          prisma.product.count({ where: { isPromotion: true } }),
        ]);

      return {
        items: products.map((product) => ({
          ...serialize(product),
          orderItemsCount: product._count.orderItems,
        })),
        total,
        page: input.page,
        pageCount: Math.max(1, Math.ceil(total / input.limit)),
        stats: {
          all: allCount,
          active: activeCount,
          featured: featuredCount,
          promotions: promotionCount,
        },
      };
    }),

  create: adminProcedure.input(productInput).mutation(async ({ input }) => {
    const category = await prisma.category.findUnique({
      where: { id: input.categoryId },
      select: { id: true },
    });

    if (!category) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Categoria inválida.",
      });
    }

    const product = await prisma.product.create({
      data: input,
      include: productInclude,
    });

    return serialize(product);
  }),

  update: adminProcedure
    .input(z.object({ id: z.string().cuid(), data: productInput.partial() }))
    .mutation(async ({ input }) => {
      try {
        const product = await prisma.product.update({
          where: { id: input.id },
          data: input.data,
          include: productInclude,
        });

        return serialize(product);
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
          if (e.code === "P2025")
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Produto não encontrado.",
            });
          if (e.code === "P2003")
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Categoria inválida.",
            });
        }
        throw e;
      }
    }),

  setActive: adminProcedure
    .input(z.object({ id: z.string().cuid(), active: z.boolean() }))
    .mutation(async ({ input }) => {
      try {
        const product = await prisma.product.update({
          where: { id: input.id },
          data: { active: input.active },
          include: productInclude,
        });

        return serialize(product);
      } catch (e) {
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === "P2025"
        ) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Produto não encontrado.",
          });
        }
        throw e;
      }
    }),

  adminById: adminProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ input }) => {
      const product = await prisma.product.findUnique({
        where: { id: input.id },
        include: productInclude,
      });
      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Produto não encontrado.",
        });
      }
      return serialize(product);
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ input }) => {
      try {
        await prisma.product.delete({ where: { id: input.id } });

        return { success: true };
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
          if (e.code === "P2025")
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Produto não encontrado.",
            });
          // OrderItem -> Product não tem cascade
          if (e.code === "P2003")
            throw new TRPCError({
              code: "CONFLICT",
              message: "Produto já foi pedido. Desative-o em vez de excluir.",
            });
        }
        throw e;
      }
    }),
});
