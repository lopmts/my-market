import { ShieldCheck, Star, Truck } from "lucide-react";
import Image from "next/image";

const features = [
  {
    icon: Truck,
    title: "Entrega rápida",
    description: "Seu pedido chega quentinho",
  },
  {
    icon: ShieldCheck,
    title: "Pagamento seguro",
    description: "Diversas formas de pagamento",
  },
  {
    icon: Star,
    title: "Qualidade garantida",
    description: "Os melhores ingredientes",
  },
];

const LayoutAuth = ({ children }: LayoutProps<"/">) => {
  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-2">
      {/* Painel de imagem — some no mobile */}
      <div className="relative hidden lg:flex flex-col justify-between p-10 xl:p-14 overflow-hidden">
        <Image
          src="/auth-hero.jpg" // TODO: trocar pela imagem real (burger/fritas)
          alt=""
          fill
          className="object-cover -z-10"
          priority
        />
        <div className="absolute inset-0 -z-10 bg-linear-to-t from-black/90 via-black/60 to-black/40" />

        {/* Logo */}
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-500 text-2xl">
            🍔
          </span>
          <div>
            <p className="text-xl font-bold text-white leading-tight">
              Sabor<span className="text-orange-500">Top</span>
            </p>
            <p className="text-xs text-white/70">Sabor em cada momento</p>
          </div>
        </div>

        {/* Headline + features */}
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight">
              O melhor sabor,
              <br />
              <span className="text-orange-500">na sua casa!</span>
            </h1>
            <p className="mt-4 text-white/80 max-w-sm">
              Peça agora seus pratos favoritos com praticidade, rapidez e muito
              sabor.
            </p>
          </div>

          <div className="space-y-4">
            {features.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-orange-500/60 bg-black/30 text-orange-500">
                  <Icon size={18} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="text-xs text-white/60">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/50 text-sm italic">
          Mais que comida,{" "}
          <span className="text-orange-500">é sabor real!</span>
        </p>
      </div>

      {/* Painel do formulário */}
      <div className="flex min-h-screen w-full items-center justify-center bg-background px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
};

export default LayoutAuth;
