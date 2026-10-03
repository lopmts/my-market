"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  Image as ImageIcon,
  LayoutDashboard,
  Menu,
  Package,
  Percent,
  Settings,
  ShoppingBag,
  Star,
  Tags,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type AdminUser = {
  name?: string | null;
  email: string;
  image?: string | null;
};

const NAV_ITEMS: {
  label: string;
  href?: string;
  icon: LucideIcon;
}[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Produtos", href: "/admin/produtos", icon: Package },
  { label: "Categorias", href: "/admin/categorias", icon: Tags },
  { label: "Pedidos", icon: ShoppingBag },
  { label: "Clientes", icon: UsersRound },
  { label: "Avaliações", icon: Star },
  { label: "Promoções", icon: Percent },
  { label: "Banners", icon: ImageIcon },
  { label: "Usuários", icon: Users },
  { label: "Configurações", icon: Settings },
];

function Navigation({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Navegação administrativa" className="flex-1 px-3 py-5">
      <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-500">
        Menu
      </p>
      <ul className="space-y-1">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active =
            href !== undefined &&
            (href === "/admin"
              ? pathname === href
              : pathname === href || pathname.startsWith(`${href}/`));

          return (
            <li key={label}>
              {href ? (
                <Link
                  href={href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                    active
                      ? "bg-zinc-900 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-950"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white",
                  )}
                >
                  <Icon
                    aria-hidden="true"
                    className={cn(
                      "size-[18px] shrink-0",
                      active
                        ? "text-white dark:text-zinc-950"
                        : "text-zinc-500 group-hover:text-zinc-800 dark:text-zinc-400 dark:group-hover:text-zinc-100",
                    )}
                  />
                  <span>{label}</span>
                </Link>
              ) : (
                <div
                  aria-disabled="true"
                  title={`${label}: página ainda não disponível`}
                  className="flex min-h-10 cursor-not-allowed items-center gap-3 rounded-lg px-3 text-sm font-medium text-zinc-400 dark:text-zinc-600"
                >
                  <Icon aria-hidden="true" className="size-[18px] shrink-0" />
                  <span className="flex-1">{label}</span>
                  <span className="text-[10px] font-medium uppercase tracking-wide">
                    Em breve
                  </span>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function SidebarContent({
  pathname,
  user,
  onNavigate,
}: {
  pathname: string;
  user: AdminUser;
  onNavigate?: () => void;
}) {
  const initials =
    user.name
      ?.split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "AD";

  return (
    <div className="flex h-full flex-col bg-white text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <Link
        href="/admin"
        onClick={onNavigate}
        className="flex h-16 shrink-0 items-center gap-3 border-b border-zinc-200 px-5 dark:border-zinc-800"
      >
        <span className="grid size-9 place-items-center rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950">
          <ShoppingBag className="size-[18px]" aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold tracking-tight">
            ShopAdmin
          </span>
          <span className="block text-xs text-zinc-500 dark:text-zinc-400">
            Painel administrativo
          </span>
        </span>
      </Link>

      <Navigation pathname={pathname} onNavigate={onNavigate} />

      <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
        <Link
          href="/perfil"
          onClick={onNavigate}
          className="flex min-w-0 items-center gap-3 rounded-lg p-2 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <Avatar className="size-9 shrink-0">
            <AvatarImage
              src={user.image ?? undefined}
              alt={user.name ?? "Administrador"}
              referrerPolicy="no-referrer"
            />
            <AvatarFallback className="bg-zinc-200 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">
              {user.name || "Administrador"}
            </span>
            <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
              {user.email}
            </span>
          </span>
        </Link>
      </div>
    </div>
  );
}

export function AdminSidebar({ user }: { user: AdminUser }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 lg:block">
        <SidebarContent pathname={pathname} user={user} />
      </aside>

      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-zinc-200 bg-white/95 px-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95 lg:hidden">
        <div className="flex items-center gap-3">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={(props) => (
                <Button
                  {...props}
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Abrir navegação administrativa"
                  aria-expanded={mobileOpen}
                >
                  <Menu className="size-5" />
                </Button>
              )}
            />
            <SheetContent
              side="left"
              showCloseButton
              className="w-[min(18rem,85vw)] gap-0 border-zinc-200 bg-white p-0 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <SheetTitle className="sr-only">Menu administrativo</SheetTitle>
              <SidebarContent
                pathname={pathname}
                user={user}
                onNavigate={() => setMobileOpen(false)}
              />
            </SheetContent>
          </Sheet>
          <Link href="/admin" className="text-sm font-bold tracking-tight">
            ShopAdmin
          </Link>
        </div>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          Administração
        </span>
      </header>
    </>
  );
}
