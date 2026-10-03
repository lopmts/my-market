"use client";

import { DashboardStatCards } from "@/components/admin/dashboard/dashboard-stat-cards";
import { OrderStatusChart } from "@/components/admin/dashboard/order-status-chart";
import { RecentOrders } from "@/components/admin/dashboard/recent-orders";
import { SalesChart } from "@/components/admin/dashboard/sales-chart";
import { TopProducts } from "@/components/admin/dashboard/top-products";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/hooks/use_data";
import { useAdminDashboard } from "@/hooks/use-admin-dashboard";
import { AlertCircle, Hand, RefreshCw } from "lucide-react";

function DashboardLoading() {
  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-32" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const dashboard = useAdminDashboard();
  const { user } = useUser();

  if (dashboard.isLoading) return <DashboardLoading />;

  if (dashboard.error || !dashboard.data) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-xl items-center justify-center p-6">
        <Card className="w-full p-6 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
            <AlertCircle className="size-6" />
          </span>
          <h1 className="mt-4 text-lg font-semibold">
            Não foi possível carregar o painel
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {dashboard.error?.message ??
              "O serviço não retornou os dados administrativos."}
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-5 gap-2"
            onClick={() => void dashboard.refetch()}
          >
            <RefreshCw className="size-4" />
            Tentar novamente
          </Button>
        </Card>
      </div>
    );
  }

  const firstName = user?.name?.trim().split(/\s+/)[0] || "Admin";

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5 p-4 sm:space-y-6 sm:p-6 lg:p-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
            <Hand className="size-7 text-amber-500" aria-hidden="true" />
            Olá, {firstName}!
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Aqui está o resumo da sua loja nos últimos 7 dias.
          </p>
        </div>
        <div className="flex items-center gap-2 text-right text-xs text-muted-foreground">
          <span className="hidden text-right sm:block">
            Dados atualizados automaticamente a cada minuto
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Atualizar dados do painel"
            title="Atualizar"
            disabled={dashboard.isFetching}
            onClick={() => void dashboard.refetch()}
          >
            <RefreshCw
              className={dashboard.isFetching ? "size-4 animate-spin" : "size-4"}
            />
          </Button>
        </div>
      </header>

      <DashboardStatCards stats={dashboard.data.stats} />

      <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,1fr)]">
        <SalesChart data={dashboard.data.chart} />
        <OrderStatusChart statuses={dashboard.data.orderStatuses} />
      </section>

      <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
        <RecentOrders orders={dashboard.data.recentOrders} />
        <TopProducts products={dashboard.data.topProducts} />
      </section>
    </div>
  );
}
