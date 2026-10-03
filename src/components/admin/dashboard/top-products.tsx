"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { inferRouterOutputs } from "@trpc/server";
import { ImageOff, Trophy } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { AppRouter } from "@/trpc/routers/_app";

type Dashboard = inferRouterOutputs<AppRouter>["admin"]["dashboard"];

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function TopProducts({
  products,
}: {
  products: Dashboard["topProducts"];
}) {
  const maxSold = Math.max(...products.map((product) => product.sold), 1);

  return (
    <Card className="min-w-0">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div>
          <CardTitle>Produtos mais vendidos</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Acumulado, exceto pedidos cancelados
          </p>
        </div>
        <Link
          href="/admin/produtos"
          className="text-xs font-medium text-orange-600 hover:underline dark:text-orange-400"
        >
          Ver produtos
        </Link>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Ainda não há vendas registradas.
          </p>
        ) : (
          <ol className="space-y-4">
            {products.map((product, index) => (
              <li key={product.id} className="flex items-center gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  {index + 1}
                </span>
                <div className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-900">
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.name}
                      width={48}
                      height={48}
                      unoptimized
                      className="size-full object-cover"
                    />
                  ) : (
                    <ImageOff className="size-5 text-zinc-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{product.name}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {product.sold} vendido(s)
                    </span>
                    <span
                      className="h-1.5 rounded-full bg-orange-500"
                      style={{
                        width: `${Math.max(8, (product.sold / maxSold) * 72)}px`,
                      }}
                    />
                  </div>
                </div>
                <span className="shrink-0 text-xs font-semibold tabular-nums">
                  {currency.format(product.revenue)}
                </span>
              </li>
            ))}
          </ol>
        )}
        {products.length > 0 && (
          <div className="mt-5 flex items-center gap-2 rounded-lg bg-zinc-50 p-3 text-xs text-muted-foreground dark:bg-zinc-900">
            <Trophy className="size-4 shrink-0 text-amber-500" />
            Ranking calculado pela quantidade vendida.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
