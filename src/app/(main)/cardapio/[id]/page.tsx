import { prisma } from "@/lib/prisma";
import { siteUrl } from "@/lib/site-url";
import type { Metadata } from "next";
import { ProductContent } from "./product-content";

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await prisma.product.findFirst({
    where: {
      id,
      active: true,
      category: { active: true },
    },
    select: {
      name: true,
      description: true,
      image: true,
    },
  });

  if (!product) {
    return {
      title: "Produto não encontrado | My Market",
      robots: { index: false, follow: false },
    };
  }

  const title = `${product.name} | My Market`;
  const description =
    product.description?.trim().slice(0, 160) ||
    `Confira ${product.name} no cardápio do My Market e faça seu pedido online.`;
  const url = new URL(
    `/cardapio/${encodeURIComponent(id)}`,
    siteUrl,
  ).toString();

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      ...(product.image && {
        images: [{ url: product.image, alt: product.name }],
      }),
    },
    twitter: {
      card: product.image ? "summary_large_image" : "summary",
      title,
      description,
      ...(product.image && { images: [product.image] }),
    },
  };
}

export default function ProductPage() {
  return <ProductContent />;
}
