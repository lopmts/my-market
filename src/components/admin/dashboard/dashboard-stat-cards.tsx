"use client";

import { Card } from "@/components/ui/card";
import { ArrowDownRight, ArrowUpRight, Box, ShoppingBag, Users, Wallet } from "lucide-react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/trpc/routers/_app";

type Dashboard = inferRouterOutputs<AppRouter>["admin"]["dashboard"];

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const number = new Intl.NumberFormat("pt-BR");

export function DashboardStatCards({ stats }: { stats: Dashboard["stats"] }) {
  const cards = [
    {
      title: "Pedidos",
      value: number.format(stats.orders.value),
      change: stats.orders.change,
      description: "vs. 7 dias anteriores",
      icon: ShoppingBag,
      iconClass: "bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-300",
    },
    {
      title: "Faturamento recebido",
      value: currency.format(stats.revenue.value),
      change: stats.revenue.change,
      description: "pagamentos confirmados",
      icon: Wallet,
      iconClass: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300",
    },
    {
      title: "Novos clientes",
      value: number.format(stats.customers.value),
      change: stats.customers.change,
      description: "vs. 7 dias anteriores",
      icon: Users,
      iconClass: "bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-300",
    },
    {
      title: "Produtos vendidos",
      value: number.format(stats.productsSold.value),
      change: undefined,
      description: `${number.format(stats.productsSold.activeProducts)} produtos ativos`,
      icon: Box,
      iconClass: "bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-300",
    },
  ];

  return (
    <section
      aria-label="Indicadores dos últimos sete dias"
      className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4"
    >
      {cards.map(({ title, value, change, description, icon: Icon, iconClass }) => (
        <Card key={title} className="min-w-0 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-zinc-500 dark:text-zinc-400">
                {title}
              </p>
              <p className="mt-2 truncate text-2xl font-bold tracking-tight tabular-nums">
                {value}
              </p>
            </div>
            <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${iconClass}`}>
              <Icon className="size-5" aria-hidden="true" />
            </span>
          </div>
          <div className="mt-4 flex min-h-5 items-center gap-1.5 text-xs">
            {change !== null && change !== undefined && (
              <>
                {change >= 0 ? (
                  <ArrowUpRight className="size-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <ArrowDownRight className="size-4 text-red-600 dark:text-red-400" />
                )}
                <span
                  className={
                    change >= 0
                      ? "font-semibold text-emerald-700 dark:text-emerald-400"
                      : "font-semibold text-red-700 dark:text-red-400"
                  }
                >
                  {change === 0 ? "0%" : `${Math.abs(change)}%`}
                </span>
                <span className="text-zinc-500 dark:text-zinc-400">
                  {description}
                </span>
              </>
            )}
            {change === undefined && (
              <span className="text-zinc-500 dark:text-zinc-400">
                {description}
              </span>
            )}
            {change === null && (
              <span className="text-zinc-500 dark:text-zinc-400">
                Sem comparação no período anterior
              </span>
            )}
          </div>
        </Card>
      ))}
    </section>
  );
}
