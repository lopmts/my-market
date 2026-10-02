import { useTRPC } from "@/trpc/client";
import { useInfiniteQuery } from "@tanstack/react-query";
import { cn } from "cn";
import { Loader2, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";

export function ReviewsSection({ productId }: { productId: string }) {
  const trpc = useTRPC();

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery(
    trpc.review.list.infiniteQueryOptions(
      { productId, limit: 5 },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    ),
  );

  const reviews = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="space-y-6">
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={20} className="animate-spin text-muted-foreground" />
        </div>
      )}

      {isError && (
        <p className="text-sm text-red-500">
          Não foi possível carregar as avaliações.
        </p>
      )}

      {!isLoading && reviews.length === 0 && (
        <p className="text-sm text-muted-foreground py-4">
          Este produto ainda não tem avaliações.
        </p>
      )}

      <div className="space-y-5">
        {reviews.map((review) => (
          <div key={review.id} className="rounded-xl border p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={review.user.image ?? undefined} />
                  <AvatarFallback>
                    {review.user.name.slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold">{review.user.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Intl.DateTimeFormat("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    }).format(new Date(review.createdAt))}
                  </p>
                </div>
              </div>
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={13}
                    className={cn(
                      i < review.rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground/30",
                    )}
                  />
                ))}
              </div>
            </div>

            {review.comment && (
              <p className="text-sm text-muted-foreground mt-3">
                {review.comment}
              </p>
            )}
          </div>
        ))}
      </div>

      {hasNextPage && (
        <Button
          variant="outline"
          className="w-full"
          disabled={isFetchingNextPage}
          onClick={() => fetchNextPage()}
        >
          {isFetchingNextPage && (
            <Loader2 size={14} className="animate-spin mr-1" />
          )}
          Carregar mais avaliações
        </Button>
      )}
    </div>
  );
}
