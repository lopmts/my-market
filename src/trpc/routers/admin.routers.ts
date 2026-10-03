import { OrderStatus, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { adminProcedure, createTRPCRouter } from "../init";

const DAY_MS = 24 * 60 * 60 * 1000;
const DASHBOARD_DAYS = 7;

const orderStatuses = Object.values(OrderStatus);

function percentageChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 100);
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export const adminRouter = createTRPCRouter({
  dashboard: adminProcedure.query(async () => {
    const now = new Date();
    const today = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    const currentStart = new Date(today.getTime() - (DASHBOARD_DAYS - 1) * DAY_MS);
    const previousStart = new Date(currentStart.getTime() - DASHBOARD_DAYS * DAY_MS);

    const [
      currentOrders,
      previousOrders,
      currentPayments,
      previousPayments,
      currentCustomers,
      previousCustomers,
      productsActive,
      productsSold,
      statusCounts,
      recentOrders,
      topProductsGrouped,
    ] = await Promise.all([
      prisma.order.findMany({
        where: { createdAt: { gte: currentStart, lt: new Date(today.getTime() + DAY_MS) } },
        select: { createdAt: true, status: true },
      }),
      prisma.order.count({
        where: { createdAt: { gte: previousStart, lt: currentStart } },
      }),
      prisma.payment.findMany({
        where: {
          status: "PAID",
          paidAt: { gte: currentStart, lt: new Date(today.getTime() + DAY_MS) },
        },
        select: { amount: true, paidAt: true },
      }),
      prisma.payment.aggregate({
        where: {
          status: "PAID",
          paidAt: { gte: previousStart, lt: currentStart },
        },
        _sum: { amount: true },
      }),
      prisma.user.count({
        where: { role: "USER", createdAt: { gte: currentStart } },
      }),
      prisma.user.count({
        where: {
          role: "USER",
          createdAt: { gte: previousStart, lt: currentStart },
        },
      }),
      prisma.product.count({ where: { active: true } }),
      prisma.orderItem.groupBy({
        by: ["productId"],
        where: {
          order: {
            status: { not: "CANCELLED" },
            payment: { is: { status: "PAID" } },
            createdAt: { gte: currentStart, lt: new Date(today.getTime() + DAY_MS) },
          },
        },
        _sum: { quantity: true, subtotal: true },
        orderBy: { _sum: { quantity: "desc" } },
      }),
      prisma.order.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          status: true,
          total: true,
          createdAt: true,
          user: { select: { name: true } },
          customer: { select: { name: true } },
          payment: { select: { status: true, method: true } },
          _count: { select: { items: true } },
        },
      }),
      prisma.orderItem.groupBy({
        by: ["productId"],
        where: {
          order: {
            status: { not: "CANCELLED" },
            payment: { is: { status: "PAID" } },
          },
        },
        _sum: { quantity: true, subtotal: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
    ]);

    const currentRevenue = currentPayments.reduce(
      (total, payment) => total.plus(payment.amount),
      new Prisma.Decimal(0),
    );
    const currentPaidRevenueByDate = new Map<string, Prisma.Decimal>();
    for (const payment of currentPayments) {
      if (!payment.paidAt) continue;
      const key = dateKey(payment.paidAt);
      currentPaidRevenueByDate.set(
        key,
        (currentPaidRevenueByDate.get(key) ?? new Prisma.Decimal(0)).plus(
          payment.amount,
        ),
      );
    }

    const ordersByDate = new Map<string, number>();
    for (const order of currentOrders) {
      const key = dateKey(order.createdAt);
      ordersByDate.set(key, (ordersByDate.get(key) ?? 0) + 1);
    }
    const chart = Array.from({ length: DASHBOARD_DAYS }, (_, index) => {
      const date = new Date(currentStart.getTime() + index * DAY_MS);
      const key = dateKey(date);
      return {
        date: key,
        orders: ordersByDate.get(key) ?? 0,
        revenue: currentPaidRevenueByDate.get(key)?.toNumber() ?? 0,
      };
    });

    const allStatuses = orderStatuses.map((status) => ({
      status,
      count: statusCounts.find((entry) => entry.status === status)?._count._all ?? 0,
    }));

    const recentProductIds = [
      ...new Set(topProductsGrouped.map((product) => product.productId)),
    ];
    const recentProducts = await prisma.product.findMany({
      where: { id: { in: recentProductIds } },
      select: { id: true, name: true, image: true, price: true },
    });
    const productById = new Map(recentProducts.map((product) => [product.id, product]));
    const topProducts = topProductsGrouped.flatMap((group) => {
      const product = productById.get(group.productId);
      if (!product) return [];
      return [
        {
          id: product.id,
          name: product.name,
          image: product.image,
          price: product.price.toNumber(),
          sold: group._sum.quantity ?? 0,
          revenue: group._sum.subtotal?.toNumber() ?? 0,
        },
      ];
    });

    const currentSoldCount = productsSold.reduce(
      (sum, product) => sum + (product._sum.quantity ?? 0),
      0,
    );

    return {
      period: {
        start: currentStart.toISOString(),
        end: now.toISOString(),
        days: DASHBOARD_DAYS,
      },
      stats: {
        orders: {
          value: currentOrders.length,
          change: percentageChange(currentOrders.length, previousOrders),
        },
        revenue: {
          value: currentRevenue.toNumber(),
          change: percentageChange(
            currentRevenue.toNumber(),
            previousPayments._sum.amount?.toNumber() ?? 0,
          ),
        },
        customers: {
          value: currentCustomers,
          change: percentageChange(currentCustomers, previousCustomers),
        },
        productsSold: {
          value: currentSoldCount,
          activeProducts: productsActive,
        },
      },
      chart,
      orderStatuses: allStatuses,
      recentOrders: recentOrders.map((order) => ({
        id: order.id,
        status: order.status,
        total: order.total.toNumber(),
        createdAt: order.createdAt.toISOString(),
        customerName: order.customer?.name ?? order.user.name,
        itemCount: order._count.items,
        paymentStatus: order.payment?.status ?? null,
        paymentMethod: order.payment?.method ?? null,
      })),
      topProducts,
    };
  }),
});
