import { auth } from "@/lib/auth";
import { TRPCError } from "@trpc/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import "server-only";

/**
 * Busca a sessão a partir de headers (usado no tRPC, onde os headers já vêm da request).
 */
export async function getSessionFromHeaders(h: Headers) {
  return auth.api.getSession({ headers: h });
}

/**
 * Busca a sessão no contexto do Next (RSC, server actions).
 * `cache` evita consultar o banco mais de uma vez por request.
 */
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

/** Para páginas/layouts: redireciona se não estiver logado. */
export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/** Para route handlers / server actions: lança erro se não estiver logado. */
export async function assertSession() {
  const session = await getSession();
  if (!session) throw new Error("Não autenticado.");
  return session;
}

/** Para o tRPC: converte a ausência de sessão em TRPCError. */
export function assertTRPCSession<
  T extends { session: unknown; user: unknown } | null,
>(data: T): NonNullable<T> {
  if (!data) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Não autenticado." });
  }
  return data as NonNullable<T>;
}

/** Checagem de role (se você adicionar `role` em `user.additionalFields`). */
export function assertRole(user: { role?: string | null }, role: string) {
  if (user.role !== role) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Sem permissão." });
  }
}
