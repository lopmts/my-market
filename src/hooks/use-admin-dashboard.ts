"use client";

import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";

export function useAdminDashboard() {
  const trpc = useTRPC();
  return useQuery({
    ...trpc.admin.dashboard.queryOptions(),
    refetchInterval: 60_000,
  });
}
