import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

import { auth } from "@/lib/auth";
import { sendMail } from "@/lib/mailer"; // o helper do nodemailer que você enviou
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../init";

/* ------------------------------------------------------------------ */
/* Troca de e-mail com código de 6 dígitos                             */
/* Reaproveita a tabela `Verification` (não precisa de migration).     */
/* ------------------------------------------------------------------ */
const CODE_TTL_MS = 10 * 60 * 1000; // validade do código
const RESEND_COOLDOWN_MS = 60 * 1000; // intervalo mínimo entre envios
const MAX_ATTEMPTS = 5; // tentativas erradas antes de invalidar o código

const emailChangeKey = (userId: string) => `email-change:${userId}`;

type PendingEmailChange = {
  hash: string;
  newEmail: string;
  attempts: number;
};

/** O código nunca é salvo em texto: guardamos um HMAC atrelado ao usuário e ao novo e-mail. */
function hashCode(code: string, userId: string, newEmail: string) {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Configuração de segurança ausente.",
    });
  }
  return createHmac("sha256", secret)
    .update(`${userId}:${newEmail}:${code}`)
    .digest("hex");
}

function parsePending(value: string): PendingEmailChange | null {
  try {
    const data = JSON.parse(value) as Partial<PendingEmailChange>;
    if (
      typeof data.hash === "string" &&
      typeof data.newEmail === "string" &&
      typeof data.attempts === "number"
    ) {
      return data as PendingEmailChange;
    }
    return null;
  } catch {
    return null;
  }
}

function emailChangeHtml(code: string) {
  return `
  <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1f2937">
    <h2 style="margin:0 0 12px">Confirme seu novo e-mail</h2>
    <p style="margin:0 0 16px">Use o código abaixo para confirmar a troca de e-mail da sua conta no SaborTop.</p>
    <p style="font-size:32px;font-weight:700;letter-spacing:8px;margin:0 0 16px;color:#f97316">${code}</p>
    <p style="margin:0 0 8px;font-size:14px;color:#6b7280">O código expira em ${CODE_TTL_MS / 60000} minutos.</p>
    <p style="margin:0;font-size:14px;color:#6b7280">Se você não pediu essa alteração, ignore este e-mail.</p>
  </div>`;
}

const newEmailSchema = z.string().trim().toLowerCase().email("E-mail inválido");

export const userRouter = createTRPCRouter({
  /** Encerra a sessão atual. */
  logout: protectedProcedure.mutation(async ({ ctx }) => {
    await auth.api.signOut({ headers: ctx.headers });
    return { success: true as const };
  }),

  /** Retorna os dados do usuário autenticado. */
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.user.id },
      include: {
        orders: true,
        aaddresses: { where: { isActive: true }, take: 1 },
      },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Usuário não encontrado.",
      });
    }

    return user;
  }),

  /** Atualiza nome/imagem. */
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).max(80).optional(),
        image: z.string().url().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await auth.api.updateUser({ headers: ctx.headers, body: input });
      return { success: true as const };
    }),

  /** Passo 1: envia um código de 6 dígitos para o NOVO e-mail. */
  requestEmailChange: protectedProcedure
    .input(z.object({ newEmail: newEmailSchema }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const identifier = emailChangeKey(userId);

      const current = await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      if (!current) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Usuário não encontrado.",
        });
      }

      if (current.email.toLowerCase() === input.newEmail) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "O novo e-mail é igual ao atual.",
        });
      }

      const taken = await ctx.prisma.user.findUnique({
        where: { email: input.newEmail },
        select: { id: true },
      });

      if (taken) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Este e-mail já está em uso.",
        });
      }

      // Intervalo mínimo entre envios (evita spam para qualquer endereço)
      const existing = await ctx.prisma.verification.findFirst({
        where: { identifier },
        orderBy: { createdAt: "desc" },
      });

      if (existing) {
        const waitMs =
          existing.createdAt.getTime() + RESEND_COOLDOWN_MS - Date.now();
        if (waitMs > 0) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: `Aguarde ${Math.ceil(waitMs / 1000)}s para reenviar o código.`,
          });
        }
      }

      const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
      const pending: PendingEmailChange = {
        hash: hashCode(code, userId, input.newEmail),
        newEmail: input.newEmail,
        attempts: 0,
      };

      // Só existe um código pendente por usuário
      await ctx.prisma.$transaction([
        ctx.prisma.verification.deleteMany({ where: { identifier } }),
        ctx.prisma.verification.create({
          data: {
            identifier,
            value: JSON.stringify(pending),
            expiresAt: new Date(Date.now() + CODE_TTL_MS),
          },
        }),
      ]);

      try {
        await sendMail({
          to: input.newEmail,
          subject: "Seu código de verificação - SaborTop",
          html: emailChangeHtml(code),
        });
      } catch {
        await ctx.prisma.verification.deleteMany({ where: { identifier } });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Não foi possível enviar o e-mail. Tente novamente.",
        });
      }

      return {
        success: true as const,
        expiresInSeconds: CODE_TTL_MS / 1000,
        resendInSeconds: RESEND_COOLDOWN_MS / 1000,
      };
    }),

  /** Passo 2: confere o código e só então troca o e-mail. */
  confirmEmailChange: protectedProcedure
    .input(
      z.object({
        newEmail: newEmailSchema,
        code: z.string().regex(/^\d{6}$/, "Código inválido"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const identifier = emailChangeKey(userId);

      const record = await ctx.prisma.verification.findFirst({
        where: { identifier },
        orderBy: { createdAt: "desc" },
      });
      const pending = record ? parsePending(record.value) : null;

      if (!record || !pending || pending.newEmail !== input.newEmail) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Solicite um novo código.",
        });
      }

      if (record.expiresAt.getTime() < Date.now()) {
        await ctx.prisma.verification.deleteMany({ where: { identifier } });
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Código expirado. Solicite um novo.",
        });
      }

      if (pending.attempts >= MAX_ATTEMPTS) {
        await ctx.prisma.verification.deleteMany({ where: { identifier } });
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Muitas tentativas. Solicite um novo código.",
        });
      }

      const expected = Buffer.from(pending.hash, "hex");
      const received = Buffer.from(
        hashCode(input.code, userId, input.newEmail),
        "hex",
      );
      const valid =
        expected.length === received.length &&
        timingSafeEqual(expected, received);

      if (!valid) {
        const attempts = pending.attempts + 1;
        await ctx.prisma.verification.update({
          where: { id: record.id },
          data: { value: JSON.stringify({ ...pending, attempts }) },
        });
        const left = MAX_ATTEMPTS - attempts;
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            left > 0
              ? `Código incorreto. Restam ${left} tentativa${left > 1 ? "s" : ""}.`
              : "Código incorreto. Solicite um novo código.",
        });
      }

      try {
        await ctx.prisma.$transaction([
          ctx.prisma.user.update({
            where: { id: userId },
            // o código prova que o usuário controla o novo e-mail
            data: { email: input.newEmail, emailVerified: true },
          }),
          ctx.prisma.verification.deleteMany({ where: { identifier } }),
        ]);
      } catch (error) {
        // P2002 = violação de unique (alguém pegou o e-mail nesse meio tempo)
        if ((error as { code?: string }).code === "P2002") {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Este e-mail já está em uso.",
          });
        }
        throw error;
      }

      return { success: true as const, email: input.newEmail };
    }),

  /** Troca de senha. */
  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string().min(8),
        newPassword: z.string().min(8),
        revokeOtherSessions: z.boolean().default(true),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await auth.api.changePassword({
          headers: ctx.headers,
          body: input,
        });
      } catch {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Senha atual incorreta.",
        });
      }
      return { success: true as const };
    }),
});
