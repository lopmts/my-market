import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { OrderStatus, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "../init";

const DELIVERY_FEE = new Prisma.Decimal(process.env.DELIVERY_FEE ?? 0);

// Fluxo de status permitido para um pedido
const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

const orderStatusSchema = z.enum(
  Object.values(OrderStatus) as [OrderStatus, ...OrderStatus[]],
);

const orderListInput = z
  .object({
    status: orderStatusSchema.optional(),
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(50).default(20),
  })
  .default({ page: 1, limit: 20 });

const orderItemsInput = z
  .array(
    z.object({
      productId: z.string().min(1),
      quantity: z.number().int().min(1).max(50),
    }),
  )
  .min(1)
  .max(50);

const orderInclude = {
  items: {
    include: { product: { select: { id: true, name: true, image: true } } },
  },
  payment: true,
  customer: true,
} satisfies Prisma.OrderInclude;

function normalizeOrderItems(
  items: Array<{ productId: string; quantity: number }>,
) {
  const quantities = new Map<string, number>();

  for (const item of items) {
    const quantity = (quantities.get(item.productId) ?? 0) + item.quantity;
    if (quantity > 50) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "A quantidade máxima por produto é 50",
      });
    }
    quantities.set(item.productId, quantity);
  }

  return [...quantities].map(([productId, quantity]) => ({
    productId,
    quantity,
  }));
}

async function getPricedOrderItems(
  requestedItems: Array<{ productId: string; quantity: number }>,
) {
  const products = await prisma.product.findMany({
    where: {
      id: { in: requestedItems.map(({ productId }) => productId) },
      active: true,
      category: { active: true },
    },
    select: { id: true, price: true },
  });
  const productsById = new Map(products.map((product) => [product.id, product]));

  if (productsById.size !== requestedItems.length) {
    throw new TRPCError({
      code: "UNPROCESSABLE_CONTENT",
      message: "Um ou mais produtos não existem ou estão indisponíveis",
    });
  }

  return requestedItems.map(({ productId, quantity }) => {
    const product = productsById.get(productId)!;
    return {
      productId,
      quantity,
      unitPrice: product.price,
      subtotal: product.price.mul(quantity),
    };
  });
}

function sumOrderItems(
  items: Array<{ subtotal: Prisma.Decimal }>,
): Prisma.Decimal {
  return items.reduce(
    (sum, item) => sum.plus(item.subtotal),
    new Prisma.Decimal(0),
  );
}

async function createOrderForUser(
  userId: string,
  rawItems: Array<{ productId: string; quantity: number }>,
  options?: {
    address?: string;
    notes?: string;
    customer?: { name: string; phone: string; email?: string };
  },
) {
  const requestedItems = normalizeOrderItems(rawItems);
  const items = await getPricedOrderItems(requestedItems);
  const subtotal = sumOrderItems(items);

  return prisma.order.create({
    data: {
      user: { connect: { id: userId } },
      address: options?.address,
      notes: options?.notes,
      customer: options?.customer
        ? { create: options.customer }
        : undefined,
      subtotal,
      deliveryFee: DELIVERY_FEE,
      total: subtotal.plus(DELIVERY_FEE),
      items: {
        create: items.map(({ productId, quantity, unitPrice, subtotal }) => ({
          productId,
          quantity,
          unitPrice,
          subtotal,
        })),
      },
    },
    include: orderInclude,
  });
}

// Admin pode ver qualquer pedido; usuário comum só os próprios
const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const user = await prisma.user.findUnique({
    where: { id: ctx.user.id },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }

  return next();
});

async function isAdmin(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return user?.role === "ADMIN";
}

async function getAccessibleOrder(orderId: string, userId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: orderInclude,
  });

  if (!order) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Pedido não encontrado",
    });
  }

  if (order.userId !== userId && !(await isAdmin(userId))) {
    // Não revela a existência do pedido para outros usuários
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Pedido não encontrado",
    });
  }

  return order;
}

export const orderRouter = createTRPCRouter({
  quote: publicProcedure
    .input(z.object({ items: orderItemsInput }))
    .query(async ({ input }) => {
      const requestedItems = normalizeOrderItems(input.items);
      const items = await getPricedOrderItems(requestedItems);
      const subtotal = sumOrderItems(items);
      const total = subtotal.plus(DELIVERY_FEE);

      return {
        items: items.map(({ productId, quantity, unitPrice, subtotal }) => ({
          productId,
          quantity,
          unitPrice: unitPrice.toNumber(),
          subtotal: subtotal.toNumber(),
        })),
        subtotal: subtotal.toNumber(),
        deliveryFee: DELIVERY_FEE.toNumber(),
        total: total.toNumber(),
      };
    }),

  // Checkout "comprar agora": cria um pedido pendente para um único produto,
  // ou reaproveita um pedido pendente já existente do mesmo usuário para o mesmo produto.
  getOrCreateForProduct: protectedProcedure
    .input(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1).max(50).default(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [currentItem] = await getPricedOrderItems([
        { productId: input.productId, quantity: input.quantity },
      ]);

      // Só reaproveita um pedido pendente com o mesmo produto e a mesma quantidade.
      const existingOrder = await prisma.order.findFirst({
        where: {
          userId: ctx.user.id,
          status: "PENDING",
          items: {
            some: {
              productId: input.productId,
              quantity: input.quantity,
            },
            every: { productId: input.productId },
          },
        },
        include: orderInclude,
      });

      if (
        existingOrder?.items.length === 1 &&
        existingOrder.items[0].quantity === input.quantity &&
        existingOrder.items[0].unitPrice.equals(currentItem.unitPrice)
      ) {
        return existingOrder;
      }

      return createOrderForUser(ctx.user.id, [
        { productId: input.productId, quantity: input.quantity },
      ]);
    }),

  // Cria um pedido. Os preços vêm sempre do banco, nunca do cliente.
  create: protectedProcedure
    .input(
      z.object({
        items: orderItemsInput,
        address: z.string().trim().min(5).optional(),
        notes: z.string().trim().max(500).optional(),
        customer: z
          .object({
            name: z.string().trim().min(2),
            phone: z.string().trim().min(8),
            email: z.string().email().optional(),
          })
          .optional(),
      }),
    )
    .mutation(({ ctx, input }) =>
      createOrderForUser(ctx.user.id, input.items, {
        address: input.address,
        notes: input.notes,
        customer: input.customer,
      }),
    ),

  // Lista os pedidos do usuário logado (admin vê todos)
  list: protectedProcedure
    .input(orderListInput)
    .query(async ({ ctx, input }) => {
      const admin = await isAdmin(ctx.user.id);

      const where: Prisma.OrderWhereInput = {
        ...(admin ? {} : { userId: ctx.user.id }),
        ...(input.status ? { status: input.status } : {}),
      };

      const [data, total] = await Promise.all([
        prisma.order.findMany({
          where,
          include: orderInclude,
          orderBy: { createdAt: "desc" },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
        }),
        prisma.order.count({ where }),
      ]);

      return {
        data,
        total,
        page: input.page,
        totalPages: Math.ceil(total / input.limit),
      };
    }),

  myList: protectedProcedure
    .input(orderListInput)
    .query(async ({ ctx, input }) => {
      const where: Prisma.OrderWhereInput = {
        userId: ctx.user.id,
        ...(input.status ? { status: input.status } : {}),
      };

      const [data, total] = await Promise.all([
        prisma.order.findMany({
          where,
          include: orderInclude,
          orderBy: { createdAt: "desc" },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
        }),
        prisma.order.count({ where }),
      ]);

      return {
        data,
        total,
        page: input.page,
        totalPages: Math.ceil(total / input.limit),
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(({ ctx, input }) => getAccessibleOrder(input.id, ctx.user.id)),

  myById: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const order = await prisma.order.findFirst({
        where: { id: input.id, userId: ctx.user.id },
        include: orderInclude,
      });

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pedido não encontrado",
        });
      }

      return order;
    }),

  reorder: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const order = await prisma.order.findFirst({
        where: { id: input.id, userId: ctx.user.id },
        select: {
          items: { select: { productId: true, quantity: true } },
        },
      });

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pedido não encontrado",
        });
      }

      const products = await prisma.product.findMany({
        where: {
          id: { in: order.items.map((item) => item.productId) },
          active: true,
          category: { active: true },
        },
        select: {
          id: true,
          name: true,
          image: true,
          price: true,
          categoryId: true,
        },
      });
      const productsById = new Map(products.map((product) => [product.id, product]));
      const items = order.items.flatMap((item) => {
        const product = productsById.get(item.productId);
        if (!product) return [];

        return [{
          ...product,
          price: product.price.toNumber(),
          quantity: item.quantity,
        }];
      });

      return {
        items,
        unavailableCount: order.items.length - items.length,
      };
    }),

  // Cliente cancela apenas pedidos ainda pendentes
  cancel: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return prisma.$transaction(async (tx) => {
        const order = await tx.order.findFirst({
          where: { id: input.id, userId: ctx.user.id },
          select: { status: true, payment: { select: { status: true } } },
        });

        if (!order) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Pedido não encontrado",
          });
        }

        if (order.status !== "PENDING" || order.payment?.status === "PAID") {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Este pedido não pode mais ser cancelado pelo perfil",
          });
        }

        const updated = await tx.order.updateMany({
          where: {
            id: input.id,
            userId: ctx.user.id,
            status: "PENDING",
          },
          data: { status: "CANCELLED" },
        });

        if (updated.count !== 1) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "O status do pedido mudou. Atualize a página e tente novamente.",
          });
        }

        await tx.payment.updateMany({
          where: { orderId: input.id, status: "PENDING" },
          data: { status: "CANCELLED" },
        });

        return tx.order.findUniqueOrThrow({
          where: { id: input.id },
          include: orderInclude,
        });
      });
    }),

  deleteCancelled: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) =>
      prisma.$transaction(async (tx) => {
        const order = await tx.order.findFirst({
          where: { id: input.id, userId: ctx.user.id },
          select: { status: true, payment: { select: { status: true } } },
        });

        if (!order) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Pedido não encontrado",
          });
        }

        if (order.status !== "CANCELLED" || order.payment?.status === "PAID") {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Somente pedidos cancelados e não pagos podem ser excluídos",
          });
        }

        const deleted = await tx.order.deleteMany({
          where: {
            id: input.id,
            userId: ctx.user.id,
            status: "CANCELLED",
          },
        });

        if (deleted.count !== 1) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "O pedido mudou. Atualize a página e tente novamente.",
          });
        }

        return { id: input.id };
      }),
    ),

  // Somente admin: avança o status do pedido
  updateStatus: adminProcedure
    .input(z.object({ id: z.string().min(1), status: orderStatusSchema }))
    .mutation(async ({ input }) => {
      const order = await prisma.order.findUnique({
        where: { id: input.id },
        select: { status: true },
      });

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pedido não encontrado",
        });
      }

      if (!STATUS_TRANSITIONS[order.status].includes(input.status)) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Não é possível mudar de ${order.status} para ${input.status}`,
        });
      }

      return prisma.order.update({
        where: { id: input.id },
        data: { status: input.status },
        include: orderInclude,
      });
    }),
});
