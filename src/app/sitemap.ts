import { prisma } from "@/lib/prisma";
import { siteUrl } from "@/lib/site-url";
import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await prisma.product.findMany({
    where: {
      active: true,
      category: { active: true },
    },
    select: {
      id: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });
  const categories = await prisma.category.findMany({
    where: { active: true },
    select: { id: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: new URL("/", siteUrl).toString(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: new URL("/cardapio", siteUrl).toString(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: new URL("/mais-vendidos", siteUrl).toString(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: new URL("/sobre", siteUrl).toString(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: new URL("/categorias", siteUrl).toString(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  return [
    ...staticRoutes,
    ...categories.map(({ id, updatedAt }) => ({
      url: new URL(
        `/categorias/${encodeURIComponent(id)}`,
        siteUrl,
      ).toString(),
      lastModified: updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...products.map(({ id, updatedAt }) => ({
      url: new URL(`/cardapio/${encodeURIComponent(id)}`, siteUrl).toString(),
      lastModified: updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
