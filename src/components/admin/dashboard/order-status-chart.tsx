"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/trpc/routers/_app";

type Dashboard = inferRouterOutputs<AppRouter>["admin"]["dashboard"];
type OrderStatusItem = Dashboard["orderStatuses"][number];

const statusLabels: Record<OrderStatusItem["status"], string> = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmado",
  PREPARING: "Preparando",
  READY: "Pronto",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
};
const statusColors: Record<OrderStatusItem["status"], string> = {
  PENDING: "#f97316",
  CONFIRMED: "#3b82f6",
  PREPARING: "#06b6d4",
  READY: "#14b8a6",
  DELIVERED: "#8b5cf6",
  CANCELLED: "#ef4444",
};

export function OrderStatusChart({
  statuses,
}: {
  statuses: Dashboard["orderStatuses"];
}) {
  const total = statuses.reduce((sum, status) => sum + status.count, 0);
  let offset = 0;
  const gradient = statuses
    .map(({ status, count }) => {
      const start = offset;
      offset += total > 0 ? (count / total) * 100 : 0;
      return `${statusColors[status]} ${start}% ${offset}%`;
    })
    .join(", ");

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Pedidos por status</CardTitle>
        <p className="text-xs text-muted-foreground">Visão geral de todos os pedidos</p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-between">
          <div
            role="img"
            aria-label={`Distribuição dos pedidos por status, ${total} no total`}
            className="relative grid size-40 shrink-0 place-items-center rounded-full"
            style={{
              background:
                total > 0
                  ? `conic-gradient(${gradient})`
                  : "conic-gradient(#e4e4e7 0% 100%)",
            }}
          >
            <div className="grid size-24 place-content-center rounded-full bg-card text-center">
              <span className="text-2xl font-bold tabular-nums">{total}</span>
              <span className="text-[11px] text-muted-foreground">pedidos</span>
            </div>
          </div>
          <ul className="w-full space-y-2">
            {statuses.map(({ status, count }) => {
              const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <li
                  key={status}
                  className="flex items-center justify-between gap-2 text-xs"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: statusColors[status] }}
                    />
                    <span className="truncate text-muted-foreground">
                      {statusLabels[status]}
                    </span>
                  </span>
                  <span className="shrink-0 tabular-nums">
                    {count}{" "}
                    <span className="text-muted-foreground">({percentage}%)</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
