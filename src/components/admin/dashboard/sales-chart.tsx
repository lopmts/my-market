"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/trpc/routers/_app";

type Dashboard = inferRouterOutputs<AppRouter>["admin"]["dashboard"];
type Metric = "revenue" | "orders";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

export function SalesChart({ data }: { data: Dashboard["chart"] }) {
  const [metric, setMetric] = useState<Metric>("revenue");
  const values = data.map((point) =>
    metric === "revenue" ? point.revenue : point.orders,
  );
  const maxValue = Math.max(...values, 0);
  const chartMax = maxValue === 0 ? 4 : Math.ceil(maxValue / 4) * 4;
  const ticks = [0, 1, 2, 3, 4].map((index) => (chartMax / 4) * index);
  const width = 720;
  const height = 280;
  const left = 66;
  const right = 18;
  const top = 18;
  const bottom = 42;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const points = values.map((value, index) => ({
    x: left + (data.length <= 1 ? plotWidth / 2 : (index * plotWidth) / (data.length - 1)),
    y: top + plotHeight - (value / chartMax) * plotHeight,
    value,
  }));
  const line = points.map(({ x, y }) => `${x},${y}`).join(" ");
  const area = `${left},${top + plotHeight} ${line} ${left + plotWidth},${top + plotHeight}`;

  return (
    <Card className="min-w-0">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div>
          <CardTitle>Vendas dos últimos 7 dias</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Valores de pagamentos confirmados
          </p>
        </div>
        <label className="sr-only" htmlFor="dashboard-chart-metric">
          Métrica do gráfico
        </label>
        <select
          id="dashboard-chart-metric"
          value={metric}
          onChange={(event) => setMetric(event.target.value as Metric)}
          className="h-8 rounded-lg border border-input bg-background px-2 text-xs"
        >
          <option value="revenue">Faturamento</option>
          <option value="orders">Pedidos</option>
        </select>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label={
              metric === "revenue"
                ? "Gráfico de faturamento diário nos últimos sete dias"
                : "Gráfico de pedidos diários nos últimos sete dias"
            }
            className="h-64 min-w-[540px] w-full"
          >
            <defs>
              <linearGradient id="admin-sales-fill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity="0.24" />
                <stop offset="100%" stopColor="#f97316" stopOpacity="0.01" />
              </linearGradient>
            </defs>
            {ticks.map((tick, index) => {
              const y = top + plotHeight - (tick / chartMax) * plotHeight;
              return (
                <g key={tick}>
                  <line
                    x1={left}
                    x2={left + plotWidth}
                    y1={y}
                    y2={y}
                    stroke="currentColor"
                    className="text-zinc-100 dark:text-zinc-800"
                  />
                  <text
                    x={left - 10}
                    y={y + 4}
                    textAnchor="end"
                    className="fill-zinc-500 text-[11px]"
                  >
                    {metric === "revenue" ? currency.format(tick) : Math.round(tick)}
                  </text>
                  {index === ticks.length - 1 && (
                    <title>Escala vertical do gráfico</title>
                  )}
                </g>
              );
            })}
            <polygon points={area} fill="url(#admin-sales-fill)" />
            <polyline
              points={line}
              fill="none"
              stroke="#f97316"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {points.map(({ x, y, value }, index) => (
              <g key={data[index].date}>
                <circle cx={x} cy={y} r="4.5" fill="#f97316" stroke="white" strokeWidth="2" />
                <title>
                  {new Date(`${data[index].date}T12:00:00`).toLocaleDateString(
                    "pt-BR",
                    { weekday: "long", day: "2-digit", month: "2-digit" },
                  )}
                  : {metric === "revenue" ? currency.format(value) : value}
                </title>
                <text
                  x={x}
                  y={height - 12}
                  textAnchor="middle"
                  className="fill-zinc-500 text-[10px]"
                >
                  {new Date(`${data[index].date}T12:00:00`).toLocaleDateString(
                    "pt-BR",
                    { weekday: "short", day: "2-digit" },
                  )}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </CardContent>
    </Card>
  );
}
