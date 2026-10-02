"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useTRPC } from "../trpc/client";

export function useUser() {
  const trpc = useTRPC();
  const hasRefetchedRef = useRef(false);

  const { data, isLoading, error, refetch } = useQuery({
    ...trpc.user.me.queryOptions(undefined, {
      staleTime: 1000 * 60 * 10, // 10 minutos (maior!)
      gcTime: 1000 * 60 * 60, // 1 hora
    }),
  });

  useEffect(() => {
    if (!hasRefetchedRef.current) {
      hasRefetchedRef.current = true;
      refetch();
    }
  }, []); // Sem dependências!

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Refetch apenas se está stale
        if (data) refetch();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [data]); // Dependência segura

  return { user: data, data, isLoading, error, refetch };
}
