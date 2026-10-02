import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { createTRPCRouter, protectedProcedure } from "../init";

const orderInclude = {
  items: {
    include: { product: { select: { id: true, name: true, image: true } } },
  },
  payment: true,
  customer: true,
} satisfies Prisma.OrderInclude;

// Busca o pedido garantindo que pertence ao usuário (ou que ele é admin)
async function getOrderForUser(
  tx: Prisma.TransactionClient,
  orderId: string,
  userId: string,
) {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      userId: true,
      status: true,
      deliveryFee: true,
      payment: { select: { status: true } },
    },
  });

  if (!order) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Pedido não encontrado",
    });
  }

  if (order.userId !== userId) {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (user?.role !== "ADMIN") {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Pedido não encontrado",
      });
    }
  }

  return order;
}

// Itens só podem ser alterados enquanto o pedido está pendente
function assertEditable(status: string, paymentStatus?: string) {
  if (status !== "PENDING") {
    throw new TRPCError({
      code: "CONFLICT",
      message: "Só é possível alterar itens de pedidos pendentes",
    });
  }

  if (paymentStatus === "PENDING" || paymentStatus === "PAID") {
    throw new TRPCError({
      code: "CONFLICT",
      message: "Não é possível alterar itens após iniciar o pagamento",
    });
  }
}

// Recalcula subtotal e total do pedido a partir dos itens
async function recalcOrder(
  tx: Prisma.TransactionClient,
  orderId: string,
  deliveryFee: Prisma.Decimal,
) {
  const { _sum } = await tx.orderItem.aggregate({
    where: { orderId },
    _sum: { subtotal: true },
  });
  const subtotal = _sum.subtotal ?? new Prisma.Decimal(0);

  return tx.order.update({
    where: { id: orderId },
    data: { subtotal, total: subtotal.plus(deliveryFee) },
    include: orderInclude,
  });
}

const quantitySchema = z.number().int().min(1).max(50);

export const orderItemRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ orderId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      await getOrderForUser(prisma, input.orderId, ctx.user.id);

      return prisma.orderItem.findMany({
        where: { orderId: input.orderId },
        include: { product: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: "asc" },
      });
    }),

  // Adiciona um produto ao pedido (soma a quantidade se já existir)
  add: protectedProcedure
    .input(
      z.object({
        orderId: z.string().min(1),
        productId: z.string().min(1),
        quantity: quantitySchema,
      }),
    )
    .mutation(({ ctx, input }) =>
      prisma.$transaction(async (tx) => {
        const order = await getOrderForUser(tx, input.orderId, ctx.user.id);
        assertEditable(order.status, order.payment?.status);

        const product = await tx.product.findFirst({
          where: {
            id: input.productId,
            active: true,
            category: { active: true },
          },
        });

        if (!product) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Produto não encontrado ou indisponível",
          });
        }

        const existing = await tx.orderItem.findFirst({
          where: { orderId: order.id, productId: product.id },
        });

        if (existing) {
          const quantity = existing.quantity + input.quantity;
          if (quantity > 50) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Quantidade máxima por item é 50",
            });
          }

          await tx.orderItem.update({
            where: { id: existing.id },
            data: { quantity, subtotal: existing.unitPrice.mul(quantity) },
          });
        } else {
          await tx.orderItem.create({
            data: {
              orderId: order.id,
              productId: product.id,
              quantity: input.quantity,
              unitPrice: product.price,
              subtotal: product.price.mul(input.quantity),
            },
          });
        }

        return recalcOrder(tx, order.id, order.deliveryFee);
      }),
    ),

  updateQuantity: protectedProcedure
    .input(
      z.object({
        orderId: z.string().min(1),
        itemId: z.string().min(1),
        quantity: quantitySchema,
      }),
    )
    .mutation(({ ctx, input }) =>
      prisma.$transaction(async (tx) => {
        const order = await getOrderForUser(tx, input.orderId, ctx.user.id);
        assertEditable(order.status, order.payment?.status);

        const item = await tx.orderItem.findFirst({
          where: { id: input.itemId, orderId: order.id },
        });

        if (!item) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Item não encontrado",
          });
        }

        // Mantém o preço unitário registrado no momento do pedido
        await tx.orderItem.update({
          where: { id: item.id },
          data: {
            quantity: input.quantity,
            subtotal: item.unitPrice.mul(input.quantity),
          },
        });

        return recalcOrder(tx, order.id, order.deliveryFee);
      }),
    ),

  remove: protectedProcedure
    .input(
      z.object({
        orderId: z.string().min(1),
        itemId: z.string().min(1),
      }),
    )
    .mutation(({ ctx, input }) =>
      prisma.$transaction(async (tx) => {
        const order = await getOrderForUser(tx, input.orderId, ctx.user.id);
        assertEditable(order.status, order.payment?.status);

        const items = await tx.orderItem.findMany({
          where: { orderId: order.id },
          select: { id: true },
        });

        if (!items.some((item) => item.id === input.itemId)) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Item não encontrado",
          });
        }

        if (items.length === 1) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "O pedido precisa ter ao menos um item. Cancele o pedido.",
          });
        }

        await tx.orderItem.delete({ where: { id: input.itemId } });

        return recalcOrder(tx, order.id, order.deliveryFee);
      }),
    ),
});
