"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Camera,
  ChevronRight,
  CircleHelp,
  CreditCard,
  Home,
  Info,
  LogOut,
  Mail,
  PackageSearch,
  Pencil,
  Phone,
  Plus,
  User as UserIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

import {
  AddressDialog,
  formatCep,
  type AddressData,
} from "@/components/profile/address-dialog";
import { UserEditeProfile } from "@/components/profile/user-dialog";
import { useTRPC } from "@/trpc/client"; // ajuste para o seu client tRPC

/* ------------------------------------------------------------------ */
/* Dados fake (campos que ainda não existem no banco)                  */
/* ------------------------------------------------------------------ */
const FAKE_PHONE = "(11) 98765-4321";
const APP_VERSION = "1.0.0";

/* ------------------------------------------------------------------ */
/* Peças de UI                                                         */
/* ------------------------------------------------------------------ */
function SectionTitle({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-2 flex items-center justify-between px-1">
      <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-50">
        {children}
      </h2>
      {action}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900">
      {children}
    </div>
  );
}

function IconBubble({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-500 dark:bg-orange-500/15 dark:text-orange-400">
      {children}
    </span>
  );
}

function Row({
  icon,
  title,
  subtitle,
  onClick,
  trailing,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onClick?: () => void;
  trailing?: React.ReactNode;
}) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:hover:bg-neutral-800/60"
    >
      <IconBubble>{icon}</IconBubble>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
          {title}
        </p>
        {subtitle && (
          <p className="truncate text-sm text-neutral-500 dark:text-neutral-400">
            {subtitle}
          </p>
        )}
      </div>
      {trailing ?? (
        <ChevronRight className="size-4 shrink-0 text-neutral-400" />
      )}
    </Comp>
  );
}

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-900 ${
        checked ? "bg-orange-500" : "bg-neutral-300 dark:bg-neutral-700"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : ""
        }`}
      />
    </button>
  );
}

function ProfileSkeleton() {
  return (
    <div className="w-full h-full min-h-screen">
      <div className="mx-auto w-full max-w-7xl animate-pulse space-y-4 px-4 py-6">
        <div className="h-8 w-40 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-36 rounded-3xl bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-48 rounded-2xl bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-32 rounded-2xl bg-neutral-200 dark:bg-neutral-800" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */
export const ProfileContent = () => {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery(trpc.user.me.queryOptions());
  const { data: addresses = [] } = useQuery(trpc.address.list.queryOptions());

  const [userOpen, setUserOpen] = useState(false);
  const [addressOpen, setAddressOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressData | null>(
    null,
  );
  const [showAll, setShowAll] = useState(false);
  const [notifications, setNotifications] = useState(true); // fake (sem DB)

  const setActive = useMutation(
    trpc.address.setActive.mutationOptions({
      onSuccess: () =>
        Promise.all([
          queryClient.invalidateQueries({
            queryKey: trpc.address.list.queryKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.address.getActive.queryKey(),
          }),
        ]),
    }),
  );

  const logout = useMutation(
    trpc.user.logout.mutationOptions({
      onSuccess: () => {
        queryClient.clear();
        router.push("/login"); // ajuste a rota de login
        router.refresh();
      },
    }),
  );

  if (isLoading || !user) return <ProfileSkeleton />;

  const visibleAddresses = showAll ? addresses : addresses.slice(0, 1);

  const openNewAddress = () => {
    setEditingAddress(null);
    setAddressOpen(true);
  };

  const openEditAddress = (address: AddressData) => {
    setEditingAddress(address);
    setAddressOpen(true);
  };

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
            Meu Perfil
          </h1>
          <button
            type="button"
            aria-label="Notificações"
            className="relative flex size-10 items-center justify-center rounded-full text-neutral-700 transition-colors hover:bg-neutral-200/60 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            <Bell className="size-5" />
            <span className="absolute top-2 right-2 size-2 rounded-full bg-orange-500" />
          </button>
        </header>

        {/* Cabeçalho do usuário */}
        <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-orange-100 via-orange-50 to-amber-100 p-5 dark:from-orange-500/20 dark:via-neutral-900 dark:to-amber-500/10">
          <div className="pointer-events-none absolute -right-10 -bottom-12 size-44 rounded-full bg-orange-300/40 blur-2xl dark:bg-orange-500/20" />
          <div className="relative flex items-center gap-4">
            <div className="relative shrink-0">
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.image}
                  alt={user.name}
                  className="size-24 rounded-full border-4 border-white object-cover shadow-md dark:border-neutral-800"
                />
              ) : (
                <div className="flex size-24 items-center justify-center rounded-full border-4 border-white bg-orange-200 text-3xl font-bold text-orange-700 shadow-md dark:border-neutral-800 dark:bg-orange-500/30 dark:text-orange-200">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="absolute right-0 bottom-0 flex size-7 items-center justify-center rounded-full border-2 border-white bg-orange-500 text-white dark:border-neutral-800">
                <Camera className="size-3.5" />
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="truncate text-xl font-bold text-neutral-900 dark:text-neutral-50">
                {user.name}
              </h2>
              <p className="mt-0.5 truncate text-sm text-neutral-600 dark:text-neutral-300">
                {user.email}
              </p>
              <button
                type="button"
                onClick={() => setUserOpen(true)}
                className="mt-3 rounded-full border border-neutral-300 bg-white px-4 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
              >
                Editar perfil
              </button>
            </div>
          </div>
        </section>

        <Link
          href="/perfil/pedidos"
          className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:border-orange-300 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-orange-500/50"
        >
          <IconBubble>
            <PackageSearch className="size-5" />
          </IconBubble>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-neutral-900 dark:text-neutral-50">
              Meus pedidos
            </span>
            <span className="mt-0.5 block text-sm text-neutral-500 dark:text-neutral-400">
              Acompanhe entregas e consulte seu histórico de compras.
            </span>
          </span>
          <ChevronRight className="size-5 shrink-0 text-neutral-400" />
        </Link>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            {/* Informações pessoais */}
            <section>
              <SectionTitle>Informações pessoais</SectionTitle>
              <Card>
                <Row
                  icon={<UserIcon className="size-5" />}
                  title="Nome"
                  subtitle={user.name}
                  onClick={() => setUserOpen(true)}
                />
                <Row
                  icon={<Mail className="size-5" />}
                  title="E-mail"
                  subtitle={user.email}
                  onClick={() => setUserOpen(true)}
                />
                <Row
                  icon={<Phone className="size-5" />}
                  title="Telefone"
                  subtitle={FAKE_PHONE}
                  onClick={() => setUserOpen(true)}
                />
              </Card>
            </section>

            {/* Endereços */}
            <section>
              <SectionTitle
                action={
                  addresses.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => setShowAll((v) => !v)}
                      className="text-xs font-medium text-orange-600 hover:underline dark:text-orange-400"
                    >
                      {showAll
                        ? "Ver menos"
                        : `Ver todos (${addresses.length}) ›`}
                    </button>
                  ) : null
                }
              >
                Endereços
              </SectionTitle>
              <Card>
                {visibleAddresses.length === 0 && (
                  <p className="px-4 py-5 text-sm text-neutral-500 dark:text-neutral-400">
                    Você ainda não cadastrou nenhum endereço.
                  </p>
                )}

                {visibleAddresses.map((address) => (
                  <div
                    key={address.id}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <IconBubble>
                      <Home className="size-5" />
                    </IconBubble>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                          {address.name}
                        </p>
                        {address.isActive && (
                          <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-medium text-orange-700 dark:bg-orange-500/20 dark:text-orange-300">
                            Principal
                          </span>
                        )}
                      </div>
                      <p className="truncate text-sm text-neutral-500 dark:text-neutral-400">
                        {address.road}
                        {address.housenumber ? `, ${address.housenumber}` : ""}
                      </p>
                      <p className="truncate text-sm text-neutral-500 dark:text-neutral-400">
                        CEP {formatCep(address.cep)}
                        {address.observasion ? ` · ${address.observasion}` : ""}
                      </p>
                      {!address.isActive && (
                        <button
                          type="button"
                          onClick={() => setActive.mutate({ id: address.id })}
                          disabled={setActive.isPending}
                          className="mt-1 text-xs font-medium text-orange-600 hover:underline disabled:opacity-60 dark:text-orange-400"
                        >
                          Usar como principal
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      aria-label={`Editar endereço ${address.name}`}
                      onClick={() => openEditAddress(address)}
                      className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                    >
                      <Pencil className="size-4" />
                    </button>
                  </div>
                ))}

                <div className="p-3">
                  <button
                    type="button"
                    onClick={openNewAddress}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-orange-300 py-2.5 text-sm font-medium text-orange-600 transition-colors hover:bg-orange-50 dark:border-orange-500/40 dark:text-orange-400 dark:hover:bg-orange-500/10"
                  >
                    <Plus className="size-4" />
                    Adicionar novo endereço
                  </button>
                </div>
              </Card>
            </section>
          </div>

          <div className="space-y-6">
            {/* Preferências */}
            <section>
              <SectionTitle>Preferências</SectionTitle>
              <Card>
                <Row
                  icon={<Bell className="size-5" />}
                  title="Notificações"
                  subtitle="Receba novidades e ofertas"
                  trailing={
                    <Switch
                      checked={notifications}
                      onChange={setNotifications}
                      label="Ativar notificações"
                    />
                  }
                />
                <Row
                  icon={<CreditCard className="size-5" />}
                  title="Método de pagamento"
                  subtitle="Gerencie seus cartões e PIX"
                  onClick={() => {}}
                />
                <Row
                  icon={<CircleHelp className="size-5" />}
                  title="Ajuda e suporte"
                  subtitle="Tire suas dúvidas"
                  onClick={() => {}}
                />
                <Row
                  icon={<Info className="size-5" />}
                  title="Sobre o app"
                  subtitle={`Versão ${APP_VERSION}`}
                  onClick={() => {}}
                />
              </Card>
            </section>

            {/* Sair */}
            <Card>
              <button
                type="button"
                onClick={() => logout.mutate()}
                disabled={logout.isPending}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60 dark:text-red-400 dark:hover:bg-red-500/10"
              >
                <span className="flex size-10 items-center justify-center rounded-full bg-red-50 dark:bg-red-500/15">
                  <LogOut className="size-5" />
                </span>
                {logout.isPending ? "Saindo..." : "Sair da conta"}
              </button>
            </Card>
          </div>
        </div>
      </div>

      <UserEditeProfile
        open={userOpen}
        onOpenChange={setUserOpen}
        user={{ name: user.name, email: user.email, image: user.image }}
        phone={FAKE_PHONE}
      />
      <AddressDialog
        open={addressOpen}
        onOpenChange={setAddressOpen}
        address={editingAddress}
      />
    </main>
  );
};
