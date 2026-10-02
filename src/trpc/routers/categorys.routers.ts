import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { adminProcedure, createTRPCRouter, publicProcedure } from "../init";
// import { adminProcedure } from "../init";

// "Pizzas Doces" -> "pizzas-doces"
const slugify = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const categoryInput = z.object({
  name: z.string().trim().min(2).max(60),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug inválido")
    .max(60)
    .optional(), // se omitido, é gerado a partir do nome
  description: z.string().max(300).nullish(),
  image: z.string().url().nullish(),
  active: z.boolean().default(true),
});

const duplicatedSlug = () =>
  new TRPCError({
    code: "CONFLICT",
    message: "Já existe uma categoria com esse slug.",
  });

const notFound = () =>
  new TRPCError({ code: "NOT_FOUND", message: "Categoria não encontrada." });

export const categoryRouter = createTRPCRouter({
  // ---------- PÚBLICO ----------

  list: publicProcedure
    .input(
      z.object({
        withCount: z.boolean().default(true),
        take: z.number().int().positive().optional(),
      }),
    )
    .query(async ({ input }) => {
      const categories = await prisma.category.findMany({
        where: { active: true },
        take: input.take ?? 6,
        orderBy: [{ position: "asc" }, { name: "asc" }],
        include: {
          _count: { select: { products: { where: { active: true } } } },
        },
      });

      return categories.map(({ _count, ...category }) => ({
        ...category,
        ...(input.withCount && { productCount: _count.products }),
      }));
    }),

  bySlug: publicProcedure
    .input(z.object({ slug: z.string().min(1) }))
    .query(async ({ input }) => {
      const category = await prisma.category.findFirst({
        where: { slug: input.slug, active: true },
      });

      if (!category) throw notFound();

      return category;
    }),

  // ---------- ADMIN (troque publicProcedure por adminProcedure) ----------

  adminList: adminProcedure.query(() =>
    prisma.category.findMany({
      orderBy: [{ position: "asc" }, { name: "asc" }],
      include: { _count: { select: { products: true } } },
    }),
  ),

  create: adminProcedure.input(categoryInput).mutation(async ({ input }) => {
    const slug = input.slug ?? slugify(input.name);

    if (!slug) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Não foi possível gerar o slug a partir do nome.",
      });
    }

    // nova categoria vai para o final da lista
    const last = await prisma.category.aggregate({ _max: { position: true } });

    try {
      return await prisma.category.create({
        data: { ...input, slug, position: (last._max.position ?? -1) + 1 },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        throw duplicatedSlug();
      }
      throw e;
    }
  }),

  update: adminProcedure
    .input(z.object({ id: z.string().cuid(), data: categoryInput.partial() }))
    .mutation(async ({ input }) => {
      try {
        // o slug só muda se for enviado explicitamente (mantém as URLs estáveis)
        return await prisma.category.update({
          where: { id: input.id },
          data: input.data,
        });
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
          if (e.code === "P2025") throw notFound();
          if (e.code === "P2002") throw duplicatedSlug();
        }
        throw e;
      }
    }),

  setActive: adminProcedure
    .input(z.object({ id: z.string().cuid(), active: z.boolean() }))
    .mutation(async ({ input }) => {
      try {
        return await prisma.category.update({
          where: { id: input.id },
          data: { active: input.active },
        });
      } catch (e) {
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === "P2025"
        ) {
          throw notFound();
        }
        throw e;
      }
    }),

  // recebe os ids na nova ordem: ["id3", "id1", "id2"]
  reorder: adminProcedure
    .input(z.object({ ids: z.array(z.string().cuid()).min(1) }))
    .mutation(async ({ input }) => {
      await prisma.$transaction(
        input.ids.map((id, index) =>
          prisma.category.update({ where: { id }, data: { position: index } }),
        ),
      );

      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ input }) => {
      const category = await prisma.category.findUnique({
        where: { id: input.id },
        select: { _count: { select: { products: true } } },
      });

      if (!category) throw notFound();

      // Product -> Category tem onDelete: Cascade: excluir apagaria os produtos junto
      if (category._count.products > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "A categoria possui produtos. Mova ou exclua os produtos, ou desative a categoria.",
        });
      }

      await prisma.category.delete({ where: { id: input.id } });

      return { success: true };
    }),
});
