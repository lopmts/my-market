"use client";

import { useUser } from "@/hooks/use_data";
import { cn } from "@/lib/utils";
import {
  Flame,
  Home,
  Info,
  Loader,
  Menu,
  Search,
  ShoppingBag,
  Star,
  Tags,
  User,
  User2,
  UtensilsCrossed,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import CartDropdown from "./cart-dropdown";
import { ModeToggle } from "./ModeToggle";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

const LINKS_NAV = [
  { label: "Início", href: "/", icon: Home },
  { label: "Cardápio", href: "/cardapio", icon: UtensilsCrossed },
  { label: "Mais vendidos", href: "/mais-vendidos", icon: Star },
  { label: "Categorias", href: "/categorias", icon: Tags },
  { label: "Sobre nós", href: "/sobre", icon: Info },
];

const LINKS_ADMIN = [
  { label: "Dashboard", href: "/admin", icon: Home },
  { label: "Pedidos", href: "/admin/pedidos", icon: UtensilsCrossed },
  { label: "Produtos", href: "/admin/produtos", icon: Star },
  { label: "Categorias", href: "/admin/categorias", icon: Tags },
  { label: "Usuários", href: "/admin/usuarios", icon: User },
];

/* ---------- Partes reutilizáveis ---------- */

const Logo = () => (
  <Link
    href="/"
    className="flex items-center gap-2 shrink-0"
    aria-label="SaborTop - Início"
  >
    <div className="relative md:h-19 md:w-19  h-11 w-11">
      <Image
        src="/icon.png"
        alt=""
        fill
        priority
        className="w-full h-full object-contain"
      />
    </div>
    <div className="flex flex-col leading-none">
      <span className="text-xl sm:text-2xl font-extrabold tracking-tight">
        <span className="dark:text-white">Sabor</span>
        <span className="text-amber-500">Top</span>
      </span>
      <span className="hidden sm:block mt-1 text-[11px] text-zinc-400">
        Sabor em cada momento
      </span>
    </div>
  </Link>
);

const SearchBar = ({
  className,
  autoFocus,
  onSubmitted,
}: {
  className?: string;
  autoFocus?: boolean;
  onSubmitted?: () => void;
}) => {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/cardapio?q=${encodeURIComponent(q)}`);
    onSubmitted?.();
  };

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className={cn("relative", className)}
    >
      <Search
        aria-hidden
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
      />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus={autoFocus}
        placeholder="O que você está procurando?"
        aria-label="Buscar no cardápio"
        className="h-10 w-full rounded-full border border-white/10 dark:bg-zinc-800/70 bg-zinc-200/70 pl-10 pr-4 text-sm placeholder:text-zinc-800  dark:text-white dark:placeholder:text-zinc-400 outline-none transition focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/30"
      />
    </form>
  );
};

const UserButton = () => {
  const { isLoading, user } = useUser();

  if (isLoading) {
    return (
      <Loader
        size={22}
        className="animate-spin text-zinc-400"
        aria-label="Carregando"
      />
    );
  }

  if (user) {
    const initials = user.name
      ?.split(" ")
      .map((n: string) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

    return (
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Avatar className="h-9 w-9 ring-2 ring-transparent transition hover:ring-amber-500/60">
            <AvatarImage
              src={user.image ?? undefined}
              alt={user.name ?? "Usuário"}
              referrerPolicy="no-referrer"
            />
            <AvatarFallback className="bg-amber-600 text-xs font-semibold dark:text-white">
              {initials || <User size={16} />}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuItem
              render={(props) => (
                <Link href="/perfil" {...props}>
                  <User2 size={20} className="mr-2" />
                  Perfil
                </Link>
              )}
            ></DropdownMenuItem>
            <DropdownMenuItem
              render={(props) => (
                <Link href="/compras" {...props}>
                  <ShoppingBag size={20} className="mr-2" />
                  Compras
                </Link>
              )}
            ></DropdownMenuItem>
          </DropdownMenuGroup>
          {user.role === "ADMIN" && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel>Admin</DropdownMenuLabel>
                {LINKS_ADMIN.map(({ label, href, icon: Icon }) => (
                  <DropdownMenuItem
                    key={href}
                    render={(props) => (
                      <Link href={href} {...props}>
                        <Icon size={20} className="mr-2" />
                        {label}
                      </Link>
                    )}
                  ></DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Link
      href="/login"
      aria-label="Entrar"
      className="grid h-10 w-10 place-items-center rounded-full dark:text-white transition hover:bg-white/10"
    >
      <User size={22} />
    </Link>
  );
};

/* ---------- Header ---------- */

const Header = () => {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 w-full border-b dark:border-white/10 dark:bg-zinc-950/90 backdrop-blur bg-zinc-200/30 dark:supports-backdrop-filter:bg-zinc-950/75">
      <nav
        aria-label="Principal"
        className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-3 sm:px-4 lg:h-18 lg:gap-6"
      >
        {/* Esquerda: menu mobile + logo */}
        <div className="flex items-center gap-1">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger
              render={(props) => (
                <Button
                  variant="ghost"
                  {...props}
                  size="icon"
                  className="text-white hover:bg-white/10 dark:hover:text-white lg:hidden"
                  aria-label="Abrir menu"
                >
                  <Menu size={24} />
                </Button>
              )}
            ></SheetTrigger>

            <SheetContent
              side="left"
              className="w-70 border-white/10 bg-zinc-950 p-0 dark:text-white"
            >
              <SheetHeader className="border-b border-white/10 p-4">
                <SheetTitle className="flex items-center gap-2 text-left">
                  <Flame className="text-amber-500" size={22} />
                  <span className="text-xl font-extrabold">
                    Sabor<span className="text-amber-500">Top</span>
                  </span>
                </SheetTitle>
                <p className="text-left text-xs text-zinc-400">
                  Sabor em cada momento
                </p>
              </SheetHeader>

              <ul className="flex flex-col gap-1 p-3">
                {LINKS_NAV.map(({ href, label, icon: Icon }) => (
                  <li key={href}>
                    <SheetClose
                      render={(props) => (
                        <Link
                          href={href}
                          {...props}
                          aria-current={isActive(href) ? "page" : undefined}
                          className={cn(
                            "flex items-center gap-3 rounded-lg  px-3 py-3 text-base transition",
                            isActive(href)
                              ? "bg-amber-500/10 font-semibold text-amber-500"
                              : "text-zinc-200 hover:bg-white/5 hover:text-amber-400",
                          )}
                        >
                          <Icon size={20} />
                          {label}
                        </Link>
                      )}
                    ></SheetClose>
                  </li>
                ))}
              </ul>
            </SheetContent>
          </Sheet>

          <Logo />
        </div>

        {/* Centro: links desktop */}
        <ul className="hidden items-center gap-6 lg:flex">
          {LINKS_NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex items-center gap-1.5 py-2 text-[15px] font-medium transition-colors",
                    active
                      ? "text-amber-500"
                      : "dark:text-white hover:text-amber-400 hover:opacity-75",
                  )}
                >
                  {active && Icon === Home && <Home size={18} />}
                  {label}
                  {active && (
                    <span className="absolute inset-x-0 -bottom-1 h-0.5 rounded-full bg-amber-500" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Direita: busca, usuário, carrinho */}
        <div className="flex items-center gap-1 sm:gap-2">
          <SearchBar className="hidden w-64 xl:w-72 md:block" />

          <Button
            variant="ghost"
            size="icon"
            className="dark:text-white hover:bg-white/10 dark:hover:text-white md:hidden"
            onClick={() => setSearchOpen((v) => !v)}
            aria-label={searchOpen ? "Fechar busca" : "Abrir busca"}
            aria-expanded={searchOpen}
          >
            {searchOpen ? <X size={22} /> : <Search size={22} />}
          </Button>

          <UserButton />
          <CartDropdown />
          <ModeToggle />
        </div>
      </nav>

      {/* Busca expansível no mobile */}
      <div
        className={cn(
          "grid transition-all duration-200 md:hidden",
          searchOpen
            ? "grid-rows-[1fr] border-t border-white/10"
            : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="p-3">
            {searchOpen && (
              <SearchBar autoFocus onSubmitted={() => setSearchOpen(false)} />
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
