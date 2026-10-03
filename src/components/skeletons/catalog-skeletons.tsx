import { Skeleton } from "@/components/ui/skeleton";

export function ProductGridSkeleton({
  count = 8,
  className = "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-label="Carregando produtos"
      className={`grid gap-4 ${className}`}
    >
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="flex h-full flex-col rounded-xl border bg-card p-2.5 shadow-sm"
        >
          <Skeleton className="aspect-4/3 w-full rounded-lg" />
          <div className="mt-3 flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
            <div className="mt-auto flex items-center justify-between gap-2 pt-3">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
      <span className="sr-only">Carregando produtos...</span>
    </div>
  );
}

export function ProductListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      role="status"
      aria-label="Carregando lista de produtos"
      className="grid gap-4 md:grid-cols-2"
    >
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="flex min-h-36 gap-3 rounded-xl border bg-card p-2.5 shadow-sm"
        >
          <Skeleton className="size-28 shrink-0 rounded-lg sm:size-32" />
          <div className="flex min-w-0 flex-1 flex-col gap-2 py-1">
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
            <div className="mt-auto flex items-center justify-between gap-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
      <span className="sr-only">Carregando lista de produtos...</span>
    </div>
  );
}

export function CategoryGridSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div
      role="status"
      aria-label="Carregando categorias"
      className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"
    >
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="relative h-44 overflow-hidden rounded-2xl md:h-52"
        >
          <Skeleton className="absolute inset-0 h-full w-full rounded-2xl" />
          <div className="absolute inset-x-1 bottom-1 space-y-2 rounded-xl border border-white/40 bg-white/60 p-3 dark:bg-zinc-900/60">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
      <span className="sr-only">Carregando categorias...</span>
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div
      role="status"
      aria-label="Carregando produto"
      className="mx-auto min-h-screen w-full max-w-7xl p-3 md:p-5"
    >
      <Skeleton className="mb-4 h-4 w-64 max-w-full" />
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <Skeleton className="aspect-square w-full rounded-xl" />
          <div className="mt-3 grid grid-cols-5 gap-2">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="aspect-square rounded-lg" />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-4 py-2">
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="h-9 w-4/5" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-2 h-9 w-36" />
          <Skeleton className="mt-3 h-24 w-full rounded-xl" />
          <Skeleton className="mt-auto h-12 w-full rounded-xl" />
        </div>
      </div>
      <span className="sr-only">Carregando informações do produto...</span>
    </div>
  );
}

export function MainPageSkeleton() {
  return (
    <main
      role="status"
      aria-label="Carregando página"
      className="min-h-screen bg-background"
    >
      <Skeleton className="h-52 w-full rounded-none sm:h-64 lg:h-72" />
      <div className="mx-auto max-w-7xl space-y-5 px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-8 w-64 max-w-full" />
        </div>
        <CategoryGridSkeleton count={4} />
        <div className="space-y-2 pt-4">
          <Skeleton className="h-7 w-52" />
          <ProductGridSkeleton count={4} />
        </div>
      </div>
      <span className="sr-only">Carregando conteúdo...</span>
    </main>
  );
}
