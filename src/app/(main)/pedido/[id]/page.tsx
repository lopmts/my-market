import { TRPCError } from "@trpc/server";
import {
  AlertCircle,
  Check,
  Clock,
  FileText,
  Headphones,
  Home,
  LifeBuoy,
  RefreshCw,
  ShieldCheck,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";

import { auth } from "@/lib/auth";
import { caller } from "@/trpc/server"; // server caller do tRPC (veja a nota abaixo do código)

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const orderNumber = id.slice(-8).toUpperCase();

  return {
    title: `Pedido #${orderNumber} | My Market`,
    description: `Acompanhe o status e consulte os detalhes do pedido #${orderNumber} no My Market.`,
    robots: { index: false, follow: false },
  };
}

type PaymentType = "success" | "pending" | "failure";

type Action = {
  label: string;
  href: string;
  icon: LucideIcon;
  variant: "primary" | "outline";
};

// Classes completas (o Tailwind precisa enxergar as strings inteiras)
const variants: Record<
  PaymentType,
  {
    title: string;
    text: string;
    bg: string;
    blob: string;
    badge: string;
    ring: string;
    banner: string;
    bannerIcon: string;
    bannerTitle: string;
    bannerIcon2: LucideIcon;
    bannerTitleText: string;
    bannerText: string;
    primary: string;
    outline: string;
    BadgeIcon: LucideIcon;
    deco: LucideIcon;
    decoClass: string;
  }
> = {
  success: {
    title: "Pagamento aprovado!",
    text: "Seu pedido foi confirmado.",
    bg: "bg-gradient-to-b from-green-50 to-background dark:from-green-950/40 dark:to-background",
    blob: "bg-green-400/30 dark:bg-green-500/20",
    badge: "bg-green-600 shadow-green-600/40",
    ring: "ring-green-200 dark:ring-green-900",
    banner:
      "bg-green-100/70 border-green-200 dark:bg-green-950/40 dark:border-green-900",
    bannerIcon: "text-green-700 dark:text-green-400",
    bannerTitle: "text-green-800 dark:text-green-300",
    bannerIcon2: Wallet,
    bannerTitleText: "Obrigado por comprar conosco!",
    bannerText:
      "Em breve você receberá o código de rastreio no seu e-mail e no app.",
    primary: "bg-green-600 hover:bg-green-700 text-white",
    outline:
      "border-green-200 text-foreground hover:bg-green-50 dark:border-green-900 dark:hover:bg-green-950/40",
    BadgeIcon: Check,
    deco: Check,
    decoClass: "text-green-500/20",
  },
  pending: {
    title: "Aguardando pagamento",
    text: "Estamos confirmando.",
    bg: "bg-gradient-to-b from-amber-50 to-background dark:from-amber-950/40 dark:to-background",
    blob: "bg-amber-400/30 dark:bg-amber-500/20",
    badge: "bg-amber-500 shadow-amber-500/40",
    ring: "ring-amber-200 dark:ring-amber-900",
    banner:
      "bg-amber-100/70 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900",
    bannerIcon: "text-amber-600 dark:text-amber-400",
    bannerTitle: "text-amber-700 dark:text-amber-300",
    bannerIcon2: Clock,
    bannerTitleText: "Pode levar alguns minutos.",
    bannerText:
      "Assim que o pagamento for confirmado, você receberá a atualização do seu pedido.",
    primary: "bg-orange-500 hover:bg-orange-600 text-white",
    outline:
      "border-amber-200 text-foreground hover:bg-amber-50 dark:border-amber-900 dark:hover:bg-amber-950/40",
    BadgeIcon: Clock,
    deco: Clock,
    decoClass: "text-amber-500/20",
  },
  failure: {
    title: "Pagamento não concluído",
    text: "Tente novamente.",
    bg: "bg-gradient-to-b from-red-50 to-background dark:from-red-950/40 dark:to-background",
    blob: "bg-red-400/30 dark:bg-red-500/20",
    badge: "bg-red-500 shadow-red-500/40",
    ring: "ring-red-200 dark:ring-red-900",
    banner:
      "bg-red-100/70 border-red-200 dark:bg-red-950/40 dark:border-red-900",
    bannerIcon: "text-red-600 dark:text-red-400",
    bannerTitle: "text-red-700 dark:text-red-300",
    bannerIcon2: AlertCircle,
    bannerTitleText: "Ocorreu um problema no pagamento.",
    bannerText:
      "Verifique seus dados e tente novamente. Se o problema persistir, entre em contato com o suporte.",
    primary: "bg-red-500 hover:bg-red-600 text-white",
    outline:
      "border-red-200 text-foreground hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/40",
    BadgeIcon: X,
    deco: LifeBuoy,
    decoClass: "text-red-500/20",
  },
};

const brl = (value: unknown) =>
  Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function formatDate(date: Date) {
  return new Date(date)
    .toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "America/Sao_Paulo",
    })
    .replace(", ", " às ");
}

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  // tRPC no server: o router já valida dono do pedido (ou admin) e devolve NOT_FOUND
  const order = await caller.order.getById({ id }).catch((error: unknown) => {
    if (error instanceof TRPCError && error.code === "NOT_FOUND") return null;
    throw error;
  });
  if (!order) notFound();

  const paymentStatus = order.payment?.status;
  const type: PaymentType =
    order.status === "CANCELLED" ||
    ["FAILED", "CANCELLED", "REFUNDED"].includes(paymentStatus ?? "")
      ? "failure"
      : paymentStatus === "PAID" ||
          ["CONFIRMED", "PREPARING", "READY", "DELIVERED"].includes(
            order.status,
          )
        ? "success"
        : "pending";
  const v = variants[type];
  const canRetryPayment =
    order.status === "PENDING" &&
    paymentStatus !== "PAID" &&
    !(paymentStatus === "PENDING" && order.payment?.method === "CARD");
  const orderStatusCopy = {
    PENDING: {
      title:
        paymentStatus === "PAID"
          ? "Pagamento aprovado!"
          : ["FAILED", "CANCELLED", "REFUNDED"].includes(paymentStatus ?? "")
            ? "Pagamento não concluído"
            : "Aguardando pagamento",
      text:
        paymentStatus === "PAID"
          ? "Estamos confirmando seu pedido."
          : ["FAILED", "CANCELLED", "REFUNDED"].includes(paymentStatus ?? "")
            ? "Revise o pagamento ou tente novamente para concluir seu pedido."
            : "Seu pedido aguarda a confirmação do pagamento.",
    },
    CONFIRMED: {
      title: "Pedido confirmado!",
      text: "Seu pedido foi confirmado e logo começará a ser preparado.",
    },
    PREPARING: {
      title: "Pedido em preparo!",
      text: "Estamos preparando seu pedido com todo o cuidado.",
    },
    READY: {
      title: "Pedido pronto!",
      text: "Seu pedido está pronto para entrega ou retirada.",
    },
    DELIVERED: {
      title: "Pedido entregue!",
      text: "Esperamos que aproveite sua refeição. Obrigado por pedir conosco!",
    },
    CANCELLED: {
      title: "Pedido cancelado",
      text: "Este pedido foi cancelado. Consulte o histórico para mais informações.",
    },
  }[order.status];

  const method = order.payment?.method ?? "PIX";
  const methodHref = method === "CARD" ? "card" : "pix";
  const paymentCode = `#${(
    order.payment?.providerPaymentId ??
    order.payment?.id ??
    order.id
  )
    .slice(-8)
    .toUpperCase()}`;
  const date = formatDate(order.payment?.paidAt ?? order.createdAt);

  const actions: Record<PaymentType, [Action, Action]> = {
    success: [
      {
        label: "Ver meus pedidos",
        href: "/perfil/pedidos",
        icon: FileText,
        variant: "primary",
      },
      {
        label: "Continuar comprando",
        href: "/cardapio",
        icon: Home,
        variant: "outline",
      },
    ],
    pending: [
      {
        label:
          paymentStatus === "PENDING" && order.payment?.method === "CARD"
            ? "Ver meus pedidos"
            : "Acompanhar pagamento",
        href:
          paymentStatus === "PENDING" && order.payment?.method === "CARD"
            ? "/perfil/pedidos"
            : `/payment/${methodHref}?orderId=${encodeURIComponent(order.id)}`,
        icon:
          paymentStatus === "PENDING" && order.payment?.method === "CARD"
            ? FileText
            : RefreshCw,
        variant: "primary",
      },
      {
        label: "Voltar para o início",
        href: "/",
        icon: Home,
        variant: "outline",
      },
    ],
    failure: [
      {
        label: canRetryPayment
          ? "Tentar pagamento novamente"
          : "Ver meus pedidos",
        href: canRetryPayment
          ? `/payment/${methodHref}?orderId=${encodeURIComponent(order.id)}`
          : "/perfil/pedidos",
        icon: canRetryPayment ? RefreshCw : FileText,
        variant: "primary",
      },
      {
        label: "Informações da loja",
        href: "/sobre",
        icon: Headphones,
        variant: "outline",
      },
    ],
  };

  const BadgeIcon = v.BadgeIcon;
  const BannerIcon = v.bannerIcon2;
  const Deco = v.deco;

  return (
    <section
      className={`relative flex min-h-screen justify-center overflow-hidden px-4 py-8 ${v.bg}`}
    >
      {/* Decoração de fundo */}
      <div
        aria-hidden
        className={`pointer-events-none absolute -right-24 -top-24 size-72 rounded-full blur-3xl ${v.blob}`}
      />
      <div
        aria-hidden
        className={`pointer-events-none absolute -bottom-24 -left-24 size-72 rounded-full blur-3xl ${v.blob}`}
      />
      <Deco
        aria-hidden
        className={`pointer-events-none absolute bottom-6 right-4 size-32 ${v.decoClass}`}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-extrabold tracking-tight text-orange-500">
              Sabor<span className="text-foreground">Top</span>
            </span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm font-medium text-foreground/80 hover:text-foreground"
          >
            <Home className="size-4" />
            Início
          </Link>
        </header>

        {/* Selo + título */}
        <section className="flex flex-col items-center text-center">
          <div
            className={`flex size-28 items-center justify-center rounded-full text-white shadow-xl ring-8 ${v.badge} ${v.ring}`}
          >
            <BadgeIcon className="size-14" strokeWidth={3} />
          </div>
          <h1 className="mt-6 text-2xl font-extrabold tracking-tight">
            {orderStatusCopy.title}
          </h1>
          <p className="mt-1 text-muted-foreground">{orderStatusCopy.text}</p>
        </section>

        {/* Aviso */}
        <div
          className={`mt-6 flex items-start gap-3 rounded-xl border p-4 ${v.banner}`}
        >
          <BannerIcon className={`mt-0.5 size-6 shrink-0 ${v.bannerIcon}`} />
          <div>
            <p className={`text-sm font-semibold ${v.bannerTitle}`}>
              {order.status === "CANCELLED"
                ? "Pedido cancelado."
                : paymentStatus === "PAID" ||
                    ["CONFIRMED", "PREPARING", "READY", "DELIVERED"].includes(
                      order.status,
                    )
                  ? "Atualização do seu pedido."
                  : v.bannerTitleText}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {order.status === "CANCELLED"
                ? "Consulte seus pedidos para ver outras compras."
                : orderStatusCopy.text}
            </p>
          </div>
        </div>

        {/* Card do pedido */}
        <section className="mt-4 rounded-2xl border bg-card p-4 text-card-foreground shadow-sm">
          <ul className="space-y-3">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center gap-3">
                <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {item.product.image && (
                    <Image
                      src={item.product.image}
                      alt={item.product.name}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {item.product.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.quantity}x {brl(item.unitPrice)}
                  </p>
                </div>
                <span className="text-sm font-bold">{brl(item.subtotal)}</span>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-2 border-t pt-4 text-xs">
            <Row
              label="Forma de pagamento"
              value={method === "CARD" ? "Cartão" : "Pix"}
            />
            <Row label="ID do pagamento" value={paymentCode} bold />
            <Row label="Data e hora" value={date} />
          </dl>

          <dl className="mt-4 space-y-2 border-t pt-4 text-xs">
            <Row label="Subtotal" value={brl(order.subtotal)} />
            <Row label="Taxa de entrega" value={brl(order.deliveryFee)} />
            <div className="flex items-center justify-between pt-1 text-base font-bold">
              <dt>Total</dt>
              <dd>{brl(order.total)}</dd>
            </div>
          </dl>

          <div className="mt-4 space-y-2 border-t pt-4">
            {actions[type].map(({ label, href, icon: Icon, variant }) => (
              <Link
                key={label}
                href={href}
                className={`flex h-11 w-full items-center justify-center gap-2 rounded-lg border text-sm font-semibold transition-colors ${
                  variant === "primary"
                    ? `border-transparent ${v.primary}`
                    : `bg-background ${v.outline}`
                }`}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            ))}
          </div>
        </section>

        {/* Compra segura */}
        <footer className="mt-5 flex items-center gap-2 text-xs">
          <ShieldCheck className="size-5 text-green-600 dark:text-green-500" />
          <div>
            <p className="font-semibold text-green-700 dark:text-green-400">
              Compra segura
            </p>
            <p className="text-muted-foreground">
              Seus dados estão protegidos.
            </p>
          </div>
        </footer>
      </div>
    </section>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={bold ? "font-semibold" : "text-foreground/80"}>{value}</dd>
    </div>
  );
}
