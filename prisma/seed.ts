import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import { PrismaClient, User } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

type SeedProduct = {
  name: string;
  image?: string;
  description: string;
  price: number;
  featured?: boolean;
};

type SeedCategory = {
  name: string;
  slug: string;
  image?: string;
  description: string;
  position: number;
  products: SeedProduct[];
};

/**
 * Gera uma URL de imagem pública a partir de palavras-chave.
 * Usa o LoremFlickr (https://loremflickr.com), que busca fotos reais
 * de bancos públicos a partir das keywords informadas.
 * O parâmetro `lock` fixa sempre a mesma imagem para o mesmo produto.
 */
function productImage(keywords: string, lock: number): string {
  const query = encodeURIComponent(keywords);
  return `https://loremflickr.com/640/480/${query}?lock=${lock}`;
}

const users: User[] = [
  {
    id: "test-user-1",
    name: "Usuário Teste 1",
    email: "teste1@exemplo.com",
    emailVerified: false,
    image: null,
    role: "USER",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "test-user-2",
    name: "Usuário Teste 2",
    email: "teste2@exemplo.com",
    emailVerified: false,
    image: null,
    role: "USER",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "test-user-3",
    name: "Usuário Teste 3",
    email: "teste3@exemplo.com",
    emailVerified: false,
    image: null,
    role: "USER",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "test-user-4",
    name: "Usuário Teste 4",
    email: "teste4@exemplo.com",
    emailVerified: false,
    image: null,
    role: "USER",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "test-user-5",
    name: "Usuário Teste 5",
    email: "teste5@exemplo.com",
    emailVerified: false,
    image: null,
    role: "USER",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// ---------- Avaliações ----------

type SeedReview = {
  productName: string;
  categorySlug: string;
  reviews: { userId: string; rating: number; comment?: string }[];
};

const reviewsData: SeedReview[] = [
  {
    productName: "Pizza Margherita",
    categorySlug: "pizzas",
    reviews: [
      {
        userId: "test-user-1",
        rating: 5,
        comment: "Melhor margherita que já comi, massa fininha e crocante.",
      },
      {
        userId: "test-user-2",
        rating: 4,
        comment: "Muito boa, só achei o manjericão meio pouco.",
      },
      {
        userId: "test-user-3",
        rating: 5,
        comment: "Chegou quentinha e no tempo certo.",
      },
    ],
  },
  {
    productName: "Pizza Calabresa",
    categorySlug: "pizzas",
    reviews: [
      {
        userId: "test-user-1",
        rating: 5,
        comment: "Calabresa de qualidade, nada de gordura em excesso.",
      },
      { userId: "test-user-4", rating: 5 },
      {
        userId: "test-user-5",
        rating: 4,
        comment: "Podia vir com mais cebola.",
      },
    ],
  },
  {
    productName: "X-Burger Clássico",
    categorySlug: "hamburgueres",
    reviews: [
      {
        userId: "test-user-2",
        rating: 5,
        comment: "Pão brioche realmente faz diferença.",
      },
      { userId: "test-user-3", rating: 4 },
      { userId: "test-user-4", rating: 5, comment: "Ponto da carne perfeito." },
    ],
  },
  {
    productName: "X-Bacon",
    categorySlug: "hamburgueres",
    reviews: [
      {
        userId: "test-user-1",
        rating: 5,
        comment: "A cebola caramelizada é surreal.",
      },
      { userId: "test-user-5", rating: 5 },
    ],
  },
  {
    productName: "Batata com Cheddar e Bacon",
    categorySlug: "porcoes",
    reviews: [
      {
        userId: "test-user-2",
        rating: 5,
        comment: "Porção generosa, dá pra dividir.",
      },
      {
        userId: "test-user-3",
        rating: 3,
        comment: "Boa, mas chegou meio fria.",
      },
      { userId: "test-user-4", rating: 4 },
    ],
  },
  {
    productName: "Pudim de Leite",
    categorySlug: "doces",
    reviews: [
      {
        userId: "test-user-1",
        rating: 5,
        comment: "Textura perfeita, nem muito doce nem muito mole.",
      },
      { userId: "test-user-2", rating: 5 },
    ],
  },
  {
    productName: "Petit Gâteau",
    categorySlug: "doces",
    reviews: [
      {
        userId: "test-user-3",
        rating: 5,
        comment: "O sorvete derretendo no chocolate quente é tudo.",
      },
      { userId: "test-user-4", rating: 4 },
      { userId: "test-user-5", rating: 5 },
    ],
  },
];

async function seedReviews() {
  for (const entry of reviewsData) {
    const product = await prisma.product.findFirst({
      where: {
        name: entry.productName,
        category: { slug: entry.categorySlug },
      },
    });

    if (!product) {
      console.warn(
        `⚠️  Produto "${entry.productName}" não encontrado para avaliações.`,
      );
      continue;
    }

    for (const review of entry.reviews) {
      const existing = await prisma.review.findFirst({
        where: { productId: product.id, userId: review.userId },
      });

      if (existing) {
        await prisma.review.update({
          where: { id: existing.id },
          data: { rating: review.rating, comment: review.comment },
        });
      } else {
        await prisma.review.create({
          data: {
            productId: product.id,
            userId: review.userId,
            rating: review.rating,
            comment: review.comment,
          },
        });
      }
    }

    // recalcula o cache de rating/reviewsCount a partir das avaliações reais
    const agg = await prisma.review.aggregate({
      where: { productId: product.id },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.product.update({
      where: { id: product.id },
      data: {
        rating: agg._avg.rating ? Math.round(agg._avg.rating * 10) / 10 : 0,
        reviewsCount: agg._count.rating,
      },
    });
  }

  console.log(`✅ Avaliações: ${reviewsData.length} produtos avaliados`);
}

// ---------- Pedidos (para "mais vendidos") ----------

// Produtos com peso maior aparecem mais vezes e com quantidades maiores,
// simulando um histórico real de vendas em vez de um campo fixo no Product
// (que ficaria desatualizado). "Mais vendidos" deve ser calculado via
// groupBy/sum em OrderItem, não armazenado.
type SeedSaleItem = {
  productName: string;
  categorySlug: string;
  quantity: number;
};
type SeedOrder = { userId: string; status: "DELIVERED"; items: SeedSaleItem[] };

const salesData: SeedOrder[] = [
  {
    userId: "test-user-1",
    status: "DELIVERED",
    items: [
      { productName: "Pizza Calabresa", categorySlug: "pizzas", quantity: 2 },
      { productName: "Refrigerante 2L", categorySlug: "bebidas", quantity: 1 },
    ],
  },
  {
    userId: "test-user-2",
    status: "DELIVERED",
    items: [
      { productName: "X-Bacon", categorySlug: "hamburgueres", quantity: 3 },
      {
        productName: "Batata com Cheddar e Bacon",
        categorySlug: "porcoes",
        quantity: 2,
      },
    ],
  },
  {
    userId: "test-user-3",
    status: "DELIVERED",
    items: [
      { productName: "Pizza Calabresa", categorySlug: "pizzas", quantity: 1 },
    ],
  },
  {
    userId: "test-user-4",
    status: "DELIVERED",
    items: [
      {
        productName: "X-Burger Clássico",
        categorySlug: "hamburgueres",
        quantity: 2,
      },
      {
        productName: "Refrigerante Lata 350ml",
        categorySlug: "bebidas",
        quantity: 2,
      },
    ],
  },
  {
    userId: "test-user-5",
    status: "DELIVERED",
    items: [
      { productName: "Pizza Margherita", categorySlug: "pizzas", quantity: 1 },
      { productName: "Petit Gâteau", categorySlug: "doces", quantity: 2 },
    ],
  },
  {
    userId: "test-user-1",
    status: "DELIVERED",
    items: [
      { productName: "X-Bacon", categorySlug: "hamburgueres", quantity: 2 },
    ],
  },
  {
    userId: "test-user-2",
    status: "DELIVERED",
    items: [
      { productName: "Pizza Calabresa", categorySlug: "pizzas", quantity: 2 },
    ],
  },
  {
    userId: "test-user-3",
    status: "DELIVERED",
    items: [
      {
        productName: "Batata com Cheddar e Bacon",
        categorySlug: "porcoes",
        quantity: 1,
      },
      {
        productName: "Água Mineral 500ml",
        categorySlug: "bebidas",
        quantity: 1,
      },
    ],
  },
];

async function seedSales() {
  for (const order of salesData) {
    const items: { productId: string; quantity: number; unitPrice: number }[] =
      [];

    for (const item of order.items) {
      const product = await prisma.product.findFirst({
        where: {
          name: item.productName,
          category: { slug: item.categorySlug },
        },
      });

      if (!product) {
        console.warn(
          `⚠️  Produto "${item.productName}" não encontrado para pedido.`,
        );
        continue;
      }

      items.push({
        productId: product.id,
        quantity: item.quantity,
        unitPrice: product.price.toNumber(),
      });
    }

    if (items.length === 0) continue;

    const subtotal = items.reduce(
      (sum, i) => sum + i.unitPrice * i.quantity,
      0,
    );
    const deliveryFee = 6.0;

    await prisma.order.create({
      data: {
        userId: order.userId,
        status: order.status,
        subtotal,
        deliveryFee,
        total: subtotal + deliveryFee,
        items: {
          create: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            subtotal: i.unitPrice * i.quantity,
          })),
        },
      },
    });
  }

  console.log(`✅ Pedidos: ${salesData.length} pedidos de exemplo criados`);
}

async function main() {
  console.log("🌱 Iniciando seed...");

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name, role: user.role },
      create: user,
    });
  }

  await seedReviews();
  await seedSales();

  console.log("🎉 Seed finalizado!");
}

main()
  .catch((error) => {
    console.error("❌ Erro ao executar o seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
