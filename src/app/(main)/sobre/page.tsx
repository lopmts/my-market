import {
  ArrowRight,
  CalendarHeart,
  ChefHat,
  Heart,
  Medal,
  Star,
  Truck,
  Users,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sobre nós | My Market",
  description:
    "Conheça a história do My Market e nossa paixão por oferecer refeições saborosas, qualidade e praticidade.",
  alternates: { canonical: "/sobre" },
  openGraph: {
    title: "Sobre nós | My Market",
    description:
      "Conheça a história, os valores e a paixão por comida do My Market.",
    url: "/sobre",
    type: "website",
    images: [{ url: "/sobre-banner.jpg", alt: "Cardápio do My Market" }],
  },
};

const features: {
  icon: LucideIcon;
  title: string;
  text: string;
  color: string;
}[] = [
  {
    icon: Medal,
    title: "Qualidade garantida",
    text: "Selecionamos os melhores ingredientes.",
    color:
      "bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400",
  },
  {
    icon: Truck,
    title: "Entrega rápida",
    text: "Seu pedido no conforto da sua casa.",
    color:
      "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
  },
  {
    icon: ChefHat,
    title: "Receitas especiais",
    text: "Feitas com muito carinho e dedicação.",
    color: "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400",
  },
  {
    icon: Heart,
    title: "Clientes em primeiro lugar",
    text: "Sua satisfação é a nossa maior conquista.",
    color:
      "bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-400",
  },
];

const stats: {
  icon: LucideIcon;
  value: string;
  label: string;
  color: string;
}[] = [
  {
    icon: UtensilsCrossed,
    value: "+ 50 mil",
    label: "Pedidos entregues",
    color:
      "bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400",
  },
  {
    icon: Users,
    value: "+ 30 mil",
    label: "Clientes satisfeitos",
    color:
      "bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-400",
  },
  {
    icon: Star,
    value: "4.9",
    label: "Avaliação média",
    color:
      "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400",
  },
  {
    icon: CalendarHeart,
    value: "Desde 2020",
    label: "Servindo com amor",
    color: "bg-pink-100 text-pink-600 dark:bg-pink-500/15 dark:text-pink-400",
  },
];

const Sobre = () => {
  return (
    <div className="max-w-7xl mx-auto w-full min-h-screen space-y-10 px-4 pb-12 sm:px-6">
      {/* Hero */}
      <section className="relative grid overflow-hidden rounded-b-3xl bg-orange-50 dark:bg-card lg:grid-cols-2">
        <div className="relative z-10 flex flex-col justify-center gap-5 px-6 py-10 sm:px-10 lg:py-16">
          <span className="text-xs font-bold uppercase tracking-widest text-orange-500">
            Sobre nós
          </span>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Mais que comida,
            <span className="block text-orange-500 underline decoration-orange-400 decoration-4 underline-offset-8">
              é paixão!
            </span>
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            O SaborTop nasceu do sonho de levar mais sabor, qualidade e
            praticidade para a sua rotina. Acreditamos que uma boa refeição tem
            o poder de transformar o seu dia, e é por isso que trabalhamos todos
            os dias para oferecer o melhor em cada pedido.
          </p>
          <Link
            href="/cardapio"
            className="inline-flex w-fit items-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
          >
            Conheça nosso cardápio
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="relative min-h-64 lg:min-h-full">
          <Image
            src="/sobre-banner.jpg"
            alt="Hambúrguer artesanal com batatas fritas"
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
          <span className="absolute left-6 top-6 -rotate-6 text-lg font-semibold italic text-white drop-shadow-lg">
            Ingredientes selecionados <br /> para você!
          </span>
        </div>
      </section>

      {/* Diferenciais */}
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0 lg:divide-x">
        {features.map(({ icon: Icon, title, text, color }) => (
          <div key={title} className="flex items-center gap-3 lg:px-6">
            <span
              className={`flex size-12 shrink-0 items-center justify-center rounded-full ${color}`}
            >
              <Icon className="size-6" />
            </span>
            <div>
              <h3 className="text-sm font-bold">{title}</h3>
              <p className="text-xs text-muted-foreground">{text}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Nossa história */}
      <section className="grid items-center gap-8 lg:grid-cols-[1.2fr_1fr_0.8fr]">
        <div className="grid h-72 grid-cols-3 grid-rows-2 gap-3 sm:h-80 lg:h-96">
          <div className="relative col-span-2 row-span-2 overflow-hidden rounded-xl">
            <Image
              src="/restaurant-interior.jpg"
              alt="Interior do restaurante SaborTop"
              fill
              sizes="(min-width: 1024px) 30vw, 60vw"
              className="object-cover"
            />
          </div>
          <div className="relative overflow-hidden rounded-xl">
            <Image
              src="/auth-hero.jpg"
              alt="Hambúrguer sendo preparado"
              fill
              sizes="(min-width: 1024px) 15vw, 30vw"
              className="object-cover"
            />
          </div>
          <div className="relative overflow-hidden rounded-xl">
            <Image
              src="/cardapio-banner.jpg"
              alt="Pizza artesanal"
              fill
              sizes="(min-width: 1024px) 15vw, 30vw"
              className="object-cover"
            />
          </div>
        </div>

        <div className="space-y-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500">
            Nossa história
          </span>
          <h2 className="text-2xl font-extrabold leading-tight">
            Tudo começou com um grande sonho
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            O SaborTop foi fundado em 2020 por um grupo de amigos apaixonados
            por boa comida. Começamos com uma pequena cozinha e um grande
            objetivo: oferecer refeições deliciosas, feitas com ingredientes de
            qualidade e muito cuidado.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Hoje, somos muito mais que um restaurante. Somos uma família que
            cresce junto com você, levando sabor, praticidade e momentos
            especiais para o seu dia a dia.
          </p>
          <p className="font-semibold italic text-orange-500 underline decoration-orange-400 underline-offset-4">
            Obrigado por fazer parte dessa história!
          </p>
        </div>

        <div className="space-y-4 rounded-2xl border bg-card p-5">
          {stats.map(({ icon: Icon, value, label, color }) => (
            <div key={label} className="flex items-center gap-3">
              <span
                className={`flex size-11 shrink-0 items-center justify-center rounded-full ${color}`}
              >
                <Icon className="size-5" />
              </span>
              <div>
                <p className="text-lg font-extrabold leading-none">{value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-700 to-orange-600 text-white">
        <div className="relative z-10 grid items-center gap-6 px-6 py-8 sm:px-10 md:grid-cols-[1fr_1.2fr_1fr]">
          <p className="-rotate-3 text-2xl font-semibold italic leading-tight">
            Vem sentir <br /> o verdadeiro <br /> sabor!
          </p>
          <div className="space-y-3 text-center">
            <p className="text-sm">
              Peça agora e descubra por que somos a escolha de tantas pessoas!
            </p>
            <Link
              href="/cardapio"
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-neutral-900 transition-colors hover:bg-neutral-100"
            >
              Ver cardápio
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
        <div className="absolute inset-y-0 right-0 hidden w-1/3 md:block">
          <Image
            src="/cardapio-banner.jpg"
            alt=""
            fill
            sizes="33vw"
            className="object-cover [mask-image:linear-gradient(to_right,transparent,black_40%)]"
          />
        </div>
      </section>
    </div>
  );
};

export default Sobre;
