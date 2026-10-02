import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { initTRPC, TRPCError } from "@trpc/server";

export const createTRPCContext = async (opts: { headers: Headers }) => {
  const data = await auth.api.getSession({ headers: opts.headers });

  return {
    prisma,
    session: data?.session ?? null,
    user: data?.user ?? null,
    headers: opts.headers,
  };
};

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<TRPCContext>().create();

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session || !ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Não autenticado.",
    });
  }

  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      user: ctx.user,
    },
  });
});

export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "ADMIN") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Acesso permitido apenas para administradores.",
    });
  }

  return next();
});
