import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { createTRPCRouter, protectedProcedure } from "../init";

const MAX_ADDRESSES_PER_USER = 10;

const cepSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/\D/g, ""))
  .refine((value) => value.length === 8, "CEP inválido");

const addressInput = z.object({
  name: z.string().trim().min(2, "Informe um nome para o endereço").max(60),
  cep: cepSchema,
  road: z.string().trim().min(3, "Informe a rua").max(150),
  housenumber: z.string().trim().max(20).optional().nullable(),
  observasion: z.string().trim().max(200).optional().nullable(),
});

// Busca o endereço garantindo que pertence ao usuário logado
async function getOwnedAddress(id: string, userId: string) {
  const address = await prisma.aaddress.findFirst({ where: { id, userId } });

  if (!address) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Endereço não encontrado",
    });
  }

  return address;
}

export const aoddressRouter = createTRPCRouter({
  // Lista os endereços do usuário (o ativo primeiro)
  list: protectedProcedure.query(({ ctx }) => {
    return prisma.aaddress.findMany({
      where: { userId: ctx.user.id },
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    });
  }),

  // Endereço atualmente ativo (usado no checkout, por exemplo)
  getActive: protectedProcedure.query(({ ctx }) => {
    return prisma.aaddress.findFirst({
      where: { userId: ctx.user.id, isActive: true },
    });
  }),

  byId: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(({ ctx, input }) => getOwnedAddress(input.id, ctx.user.id)),

  create: protectedProcedure
    .input(addressInput.extend({ isActive: z.boolean().optional() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      return prisma.$transaction(async (tx) => {
        const count = await tx.aaddress.count({ where: { userId } });

        if (count >= MAX_ADDRESSES_PER_USER) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Limite de ${MAX_ADDRESSES_PER_USER} endereços atingido`,
          });
        }

        // O primeiro endereço sempre vira o ativo
        const shouldBeActive = count === 0 || input.isActive === true;

        if (shouldBeActive) {
          await tx.aaddress.updateMany({
            where: { userId, isActive: true },
            data: { isActive: false },
          });
        }

        return tx.aaddress.create({
          data: {
            name: input.name,
            cep: input.cep,
            road: input.road,
            housenumber: input.housenumber || null,
            observasion: input.observasion || null,
            isActive: shouldBeActive,
            userId,
          },
        });
      });
    }),

  update: protectedProcedure
    .input(addressInput.partial().extend({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await getOwnedAddress(id, ctx.user.id);

      return prisma.aaddress.update({
        where: { id },
        data: {
          ...data,
          // string vazia vira null nos campos opcionais
          ...(data.housenumber !== undefined && {
            housenumber: data.housenumber || null,
          }),
          ...(data.observasion !== undefined && {
            observasion: data.observasion || null,
          }),
        },
      });
    }),

  // Define qual endereço é o ativo (só um por usuário)
  setActive: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      await getOwnedAddress(input.id, userId);

      return prisma.$transaction(async (tx) => {
        await tx.aaddress.updateMany({
          where: { userId, isActive: true },
          data: { isActive: false },
        });

        return tx.aaddress.update({
          where: { id: input.id },
          data: { isActive: true },
        });
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const address = await getOwnedAddress(input.id, userId);

      await prisma.$transaction(async (tx) => {
        await tx.aaddress.delete({ where: { id: address.id } });

        // Se apagou o ativo, promove o mais recente como novo ativo
        if (address.isActive) {
          const next = await tx.aaddress.findFirst({
            where: { userId },
            orderBy: { createdAt: "desc" },
          });

          if (next) {
            await tx.aaddress.update({
              where: { id: next.id },
              data: { isActive: true },
            });
          }
        }
      });

      return { success: true };
    }),
});
