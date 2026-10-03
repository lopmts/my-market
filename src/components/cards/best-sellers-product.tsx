"use client";

import { useCartNotificationStore } from "@/lib/cart-notification-store";
import {
  useCartItem,
  useCartStore,
  type CartProduct,
} from "@/store/cart-store";
import { useTRPC } from "@/trpc/client";
import { formatRating, formatReviewsCount } from "@/utils/formatRating";
import { formatPrice } from "@/utils/price-format";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Check,
  FlameIcon,
  ImageOff,
  ShoppingCart,
  Star,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ProductGridSkeleton } from "@/components/skeletons/catalog-skeletons";
import { ScrollReveal } from "@/components/scroll-reveal";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader } from "../ui/card";

type ProductRatingProps = {
  rating: number | string | null | undefined;
  reviewsCount: number | null | undefined;
};

export function ProductRating({ rating, reviewsCount }: ProductRatingProps) {
  const hasReviews = !!reviewsCount && reviewsCount > 0;

  if (!hasReviews) {
    return <span className="text-sm text-zinc-400">Sem avaliações ainda</span>;
  }

  return (
    <div className="flex items-center gap-1">
      <Star size={16} className="fill-amber-400 text-amber-400" />
      <span className="text-sm font-medium">{formatRating(rating)}</span>
      <span className="text-sm text-zinc-400">
        ({formatReviewsCount(reviewsCount)})
      </span>
    </div>
  );
}

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

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        {c.image ? (
          <Link
            href={`/cardapio/${c.id}`}
            className="relative w-full h-48 overflow-hidden rounded-md"
          >
            <Image
              src={c.image}
              alt={c.name}
              className="object-cover hover:opacity-75 transition-all"
              fill
              quality={90}
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
            />
          </Link>
        ) : (
          <div className="w-full h-48 rounded-md bg-zinc-800/50">
            <div className="flex items-center justify-center w-full h-full">
              <ImageOff size={30} />
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex flex-col flex-1">
        <Link
          href={`/cardapio/${c.id}`}
          className="flex flex-col gap-1.5 flex-1 hover:text-amber-300"
        >
          <h2 className="text-xl font-semibold line-clamp-1">{c.name}</h2>
          <p className="text-base dark:text-zinc-300 text-zinc-500 line-clamp-2">
            {c.description || "Sem descrição"}
          </p>

          <div className="h-5 flex items-center">
            <ProductRating rating={c.rating} reviewsCount={c.reviewsCount} />
          </div>

          <span className="text-lg font-semibold mt-auto">
            {formatPrice(c.price)}
          </span>
        </Link>

        <div className="mt-2">
          <Button
            className="w-full bg-amber-500 dark:text-white disabled:opacity-70 disabled:cursor-not-allowed"
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
      </CardContent>
    </Card>
  );
}

const BestSellers = () => {
  const trpc = useTRPC();

  const { data, isLoading, isError, error } = useQuery(
    trpc.product.bestSellers.queryOptions({
      limit: 5,
    }),
  );

  if (isLoading) {
    return (
      <div className="mt-8 w-full">
        <div className="flex items-center gap-2 pb-3.5">
          <FlameIcon size={40} className="text-amber-500" />
          <div>
            <h2 className="text-2xl font-semibold">Mais Vendidos</h2>
            <p className="text-base text-zinc-400 dark:text-zinc-300">
              Os pratos que todo mundo ama!
            </p>
          </div>
        </div>
        <ProductGridSkeleton
          count={5}
          className="grid-cols-2 md:grid-cols-3 lg:grid-cols-5"
        />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full p-2 mx-auto h-full mt-3 max-w-7xl">
        <p className="text-sm text-red-500">
          Não foi possível carregar os mais vendidos.{" "}
          {error instanceof Error ? error.message : ""}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full mt-8">
      <div className="flex items-center justify-between w-full pb-3.5">
        <div className="flex items-center gap-2">
          <FlameIcon size={40} className="text-amber-500" />
          <div className="flex flex-col">
            <h1 className="font-semibold text-2xl">Mais Vendidos</h1>
            <span className="dark:text-zinc-300 text-zinc-400 text-base">
              Os pratos que todo mundo ama!
            </span>
          </div>
        </div>
        <div className="">
          <Link
            href={"/mais-vendidos"}
            aria-label="Mais vendidos"
            className="text-amber-500 hover:underline flex items-center gap-1"
          >
            <span>Ver todos</span>
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {data?.map((c, index) => (
          <ScrollReveal key={c.id} delay={index * 45}>
            <ProductCard product={c} />
          </ScrollReveal>
        ))}
      </div>
    </div>
  );
};

export default BestSellers;
