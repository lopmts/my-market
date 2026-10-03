"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronRightIcon,
  CreditCard,
  Heart,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Star,
  Truck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { ReviewsSection } from "@/components/reviews-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductDetailSkeleton } from "@/components/skeletons/catalog-skeletons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCartNotificationStore } from "@/lib/cart-notification-store";
import { cn } from "@/lib/utils";
import {
  CartProduct,
  useCartItem,
  useCartItems,
  useCartStore,
} from "@/store/cart-store";
import { useTRPC } from "@/trpc/client";

export const ProductContent = () => {
  const { id } = useParams();
  const trpc = useTRPC();

  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const increment = useCartStore((s) => s.increment);
  const decrement = useCartStore((s) => s.decrement);
  const items = useCartItems();

  const {
    data: product,
    isLoading,
    isError,
    error,
  } = useQuery(
    trpc.product.byId.queryOptions({
      id: id as string,
    }),
  );

  const { data: related } = useQuery(
    trpc.product.related.queryOptions(
      { productId: id as string, limit: 4 },
      { enabled: !!id },
    ),
  );

  const { data: breakdown, isLoading: isLoadingBreakdown } = useQuery(
    trpc.review.ratingBreakdown.queryOptions(
      { productId: id as string },
      { enabled: !!id },
    ),
  );

  if (isLoading || isLoadingBreakdown) return <ProductDetailSkeleton />;

  if (isError || !product) {
    return (
      <div className="w-full p-2 mx-auto h-full mt-3 max-w-7xl min-h-screen">
        <p className="text-sm text-red-500">
          Não foi possível carregar o produto.{" "}
          {error instanceof Error ? error.message : ""}
        </p>
      </div>
    );
  }

  const gallery = [product.image, ...product.images].filter(
    (img): img is string => Boolean(img),
  );
  const currentImage = gallery[activeImage] ?? "/placeholder-product.png";

  const goToImage = (dir: 1 | -1) => {
    setActiveImage((prev) => {
      const next = prev + dir;
      if (next < 0) return gallery.length - 1;
      if (next >= gallery.length) return 0;
      return next;
    });
  };

  return (
    <div className="md:p-5 p-3 max-w-7xl mx-auto w-full">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
        <Link href="/" className="hover:text-foreground transition-colors">
          Início
        </Link>
        <ChevronRightIcon size={14} />
        <Link
          href="/cardapio"
          className="hover:text-foreground transition-colors"
        >
          Cardápio
        </Link>
        <ChevronRightIcon size={14} />
        <Link
          href={`/cardapio/${product.category.slug}`}
          className="hover:text-foreground transition-colors"
        >
          {product.category.name}
        </Link>
        <ChevronRightIcon size={14} />
        <span className="text-foreground font-medium">{product.name}</span>
      </nav>

      {/* Topo: galeria + info principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Galeria */}
        <div>
          <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-muted">
            {product.featured && (
              <Badge className="absolute top-3 left-3 z-10 gap-1 bg-orange-500 hover:bg-orange-500">
                🔥 Mais vendido
              </Badge>
            )}

            <Image
              src={currentImage}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />

            {gallery.length > 1 && (
              <>
                <button
                  onClick={() => goToImage(-1)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center h-9 w-9 rounded-full bg-white/90 shadow hover:bg-white transition-colors"
                  aria-label="Imagem anterior"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => goToImage(1)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center h-9 w-9 rounded-full bg-white/90 shadow hover:bg-white transition-colors"
                  aria-label="Próxima imagem"
                >
                  <ChevronRight size={18} />
                </button>
                <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs text-white">
                  {activeImage + 1} / {gallery.length}
                </span>
              </>
            )}
          </div>

          {gallery.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {gallery.map((img, i) => (
                <button
                  key={img + i}
                  onClick={() => setActiveImage(i)}
                  className={cn(
                    "relative aspect-square overflow-hidden rounded-lg border-2 transition-colors",
                    i === activeImage
                      ? "border-orange-500"
                      : "border-transparent",
                  )}
                >
                  <Image
                    src={img}
                    alt={`${product.name} ${i + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <Badge variant="secondary" className="w-fit mb-2">
            {product.category.name}
          </Badge>

          <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>

          {product.description && (
            <p className="mt-2 text-muted-foreground leading-relaxed">
              {product.description}
            </p>
          )}

          <div className="mt-3 flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Star size={16} className="fill-yellow-400 text-yellow-400" />
              <span className="font-semibold text-sm">
                {product.rating.toFixed(1)}
              </span>
            </div>
            <span className="text-sm text-muted-foreground">
              ({product.reviewsCountLabel} avaliações)
            </span>
          </div>

          <div className="mt-4">
            <span className="text-3xl font-bold text-orange-600">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(product.price)}
            </span>
          </div>

          <div className="mt-1 flex items-center gap-1.5 text-sm text-green-600">
            <ShieldCheck size={15} />
            {product.active
              ? "Em estoque · Pronto para envio"
              : "Indisponível no momento"}
          </div>

          {/* Quantidade */}
          <div className="mt-6">
            <span className="text-sm font-medium">Quantidade</span>
            {items.map((it) => (
              <div
                className="mt-2 flex items-center gap-3 w-fit rounded-lg border p-1"
                key={it.id}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => decrement(it.id)}
                >
                  <Minus size={14} />
                </Button>
                <span className="w-6 text-center text-sm font-medium">
                  {it.quantity}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => increment(it.id)}
                >
                  <Plus size={14} />
                </Button>
              </div>
            ))}
          </div>

          {/* Ações */}
          <div className="mt-6 flex items-center gap-3">
            <ProductCard product={product} />
          </div>

          {/* Selos */}
          <div className="mt-6 grid grid-cols-3 gap-3 border-t pt-5 text-xs text-muted-foreground">
            <div className="flex flex-col items-center gap-1.5 text-center">
              <Truck size={20} />
              Entrega rápida e segura
            </div>
            <div className="flex flex-col items-center gap-1.5 text-center">
              <ShieldCheck size={20} />
              Ingredientes de qualidade
            </div>
            <div className="flex flex-col items-center gap-1.5 text-center">
              <CreditCard size={20} />
              Diversas formas de pagamento
            </div>
          </div>
        </div>
      </div>

      {/* Descrição / Avaliações */}
      <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="border rounded-md p-2 lg:col-span-2">
          <div className="">
            <Tabs defaultValue="descricao" className="">
              <TabsList>
                <TabsTrigger value="descricao">Descrição</TabsTrigger>
                <TabsTrigger value="avaliacoes">
                  Avaliações ({product.reviewsCount})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="descricao" className="">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {product.description ??
                    "Sem descrição disponível para este produto."}
                </p>
              </TabsContent>

              <TabsContent value="avaliacoes" className="mt-4">
                <ReviewsSection productId={product.id} />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div className="rounded-xl border p-5 h-fit">
          <h3 className="font-bold text-lg mb-3">Avaliações dos clientes</h3>

          <div className="flex items-center gap-2 mb-4">
            <span className="text-4xl font-bold">
              {product.rating.toFixed(1)}
            </span>
            <div className="flex flex-col gap-1">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={cn(
                      i < Math.round(product.rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground/30",
                    )}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                ({product.reviewsCountLabel} avaliações)
              </span>
            </div>
          </div>

          <div className="space-y-2.5">
            {breakdown?.breakdown.map((b) => (
              <div
                key={b.star}
                className="flex items-center gap-3 text-xs text-muted-foreground"
              >
                <span className="w-16 shrink-0">
                  {b.star} estrela{b.star > 1 ? "s" : ""}
                </span>
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full transition-all"
                    style={{ width: `${b.percentage}%` }}
                  />
                </div>
                <span className="w-8 text-right">{b.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Relacionados */}
      {related && related.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Você também pode gostar</h2>
            <Link
              href={`/cardapio/${product.category.slug}`}
              className="text-sm text-orange-600 hover:underline flex items-center gap-1"
            >
              Ver todos <ChevronRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.map((item) => (
              <Link
                key={item.id}
                href={`/produto/${item.id}`}
                className="group rounded-xl border overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="relative aspect-square bg-muted">
                  {item.featured && (
                    <Badge className="absolute top-2 left-2 z-10 bg-orange-500 hover:bg-orange-500 text-[10px]">
                      🔥 Mais vendido
                    </Badge>
                  )}
                  {item.image && (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium line-clamp-1">
                    {item.name}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                    {item.description}
                  </p>
                  <p className="mt-1.5 font-bold text-orange-600 text-sm">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(item.price)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

type ProductCardProps = {
  product: CartProduct & {
    description?: string | null;
    rating: number | string | null;
    reviewsCount: number | null;
  };
};

function ProductCard({ product: c }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const notify = useCartNotificationStore((s) => s.notify);
  const router = useRouter();

  // se o produto já está no carrinho, o botão fica desabilitado;
  // aumentar/diminuir quantidade só acontece na página do carrinho
  const itemInCart = useCartItem(c.id);
  const isInCart = !!itemInCart;

  const handleAddToCart = () => {
    if (isInCart) return; // trava dupla, além do disabled no botão

    addItem(c);

    const updated = useCartStore.getState().getItem(c.id);
    if (updated) {
      notify({
        productId: updated.id,
        productName: updated.name,
        productImage: updated.image,
        totalQuantity: updated.quantity,
        totalPrice: updated.price * updated.quantity,
      });
    }
  };

  const handlePurchase = () => {
    router.push(`/checkout/product/${c.id}`);
  };

  return (
    <div className="w-full flex items-center gap-3">
      <div className="flex flex-col gap-1.5 w-full">
        <Button
          className="w-full cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed p-4"
          onClick={handlePurchase}
          aria-label={
            isInCart
              ? `${c.name} já está no carrinho`
              : `Adicionar ${c.name} ao carrinho`
          }
        >
          <span>Fazer pedido agora</span>
        </Button>
        <Button
          className="w-full bg-amber-500 cursor-pointer  dark:text-white disabled:opacity-70 disabled:cursor-not-allowed p-4"
          onClick={handleAddToCart}
          disabled={isInCart}
          aria-label={
            isInCart
              ? `${c.name} já está no carrinho`
              : `Adicionar ${c.name} ao carrinho`
          }
        >
          {isInCart ? (
            <>
              <Check size={20} />
              <span>No carrinho ({itemInCart.quantity})</span>
            </>
          ) : (
            <>
              <ShoppingCart size={20} />
              <span>Adicionar</span>
            </>
          )}
        </Button>
      </div>
      <Button size="lg" variant="outline" className="w-11 px-0">
        <Heart size={18} />
      </Button>
    </div>
  );
}
