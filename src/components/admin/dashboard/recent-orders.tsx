"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { inferRouterOutputs } from "@trpc/server";
import { CreditCard, QrCode } from "lucide-react";
import type { AppRouter } from "@/trpc/routers/_app";

type Dashboard = inferRouterOutputs<AppRouter>["admin"]["dashboard"];
type RecentOrder = Dashboard["recentOrders"][number];

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const statusLabels: Record<RecentOrder["status"], string> = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmado",
  PREPARING: "Preparando",
  READY: "Pronto",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
};
const statusClasses: Record<RecentOrder["status"], string> = {
  PENDING: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950/50 dark:text-orange-300",
  CONFIRMED: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300",
  PREPARING: "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900 dark:bg-cyan-950/50 dark:text-cyan-300",
  READY: "border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-900 dark:bg-teal-950/50 dark:text-teal-300",
  DELIVERED: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/50 dark:text-violet-300",
  CANCELLED: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300",
};

export function RecentOrders({ orders }: { orders: Dashboard["recentOrders"] }) {
  return (
    <Card className="min-w-0">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div>
          <CardTitle>Últimos pedidos</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Atividade mais recente da loja
          </p>
        </div>
        <span className="text-xs text-muted-foreground">
          {orders.length} recentes
        </span>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Ainda não há pedidos para mostrar.
          </p>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[700px] text-sm">
                <thead className="text-left text-xs text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-2 py-2 font-medium">Pedido</th>
                    <th scope="col" className="px-2 py-2 font-medium">Cliente</th>
                    <th scope="col" className="px-2 py-2 font-medium">Itens</th>
                    <th scope="col" className="px-2 py-2 font-medium">Total</th>
                    <th scope="col" className="px-2 py-2 font-medium">Status</th>
                    <th scope="col" className="px-2 py-2 font-medium">Pagamento</th>
                    <th scope="col" className="px-2 py-2 font-medium">Horário</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {orders.map((order) => (
                    <OrderRow key={order.id} order={order} />
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="divide-y divide-zinc-100 md:hidden dark:divide-zinc-800">
              {orders.map((order) => (
                <li key={order.id} className="space-y-2 py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-mono text-xs font-semibold">
                        #{order.id.slice(-7).toUpperCase()}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {order.customerName}
                      </p>
                    </div>
                    <Badge variant="outline" className={statusClasses[order.status]}>
                      {statusLabels[order.status]}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{order.itemCount} item(s)</span>
                    <span className="font-semibold text-foreground">
                      {currency.format(order.total)}
                    </span>
                    <span>
                      {new Date(order.createdAt).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function OrderRow({ order }: { order: RecentOrder }) {
  const PaymentIcon = order.paymentMethod === "PIX" ? QrCode : CreditCard;
  return (
    <tr>
      <td className="px-2 py-3 font-mono text-xs">
        #{order.id.slice(-7).toUpperCase()}
      </td>
      <td className="max-w-40 truncate px-2 py-3">{order.customerName}</td>
      <td className="px-2 py-3 text-muted-foreground">{order.itemCount}</td>
      <td className="px-2 py-3 font-medium tabular-nums">
        {currency.format(order.total)}
      </td>
      <td className="px-2 py-3">
        <Badge variant="outline" className={statusClasses[order.status]}>
          {statusLabels[order.status]}
        </Badge>
      </td>
      <td className="px-2 py-3">
        {order.paymentMethod ? (
          <span className="inline-flex items-center gap-1.5 text-xs">
            <PaymentIcon className="size-3.5 text-muted-foreground" />
            {order.paymentMethod === "PIX" ? "Pix" : "Cartão"}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Aguardando</span>
        )}
      </td>
      <td className="px-2 py-3 text-xs text-muted-foreground">
        {new Date(order.createdAt).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </td>
    </tr>
  );
}
