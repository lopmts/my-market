"use client";

import { ArrowRight } from "lucide-react";
import Image from "next/image";

/**
 * PromoBanners
 * -----------------------------------------------------------------------
 * Dois banners promocionais menores, pensados para ficar lado a lado
 * abaixo do HeroBanner (grid de 2 colunas no desktop, empilhados no
 * mobile).
 *
 * Tema do site: as cores de cada card são fixas (marca), não mudam com
 * dark/light mode do site — mas cada card carrega sua própria sombra +
 * anel sutil (`shadow-*` + `ring-*`), então eles mantêm contorno e
 * profundidade tanto numa página branca quanto numa página escura, sem
 * precisar de nenhuma classe `dark:`.
 *
 * Como usar as imagens:
 *  - Pizza:  /public/product/pizza-01.png   (PNG recortado, fundo transparente)
 *  - Combo:  /public/product/combo-01.png   (PNG recortado, fundo transparente)
 *  - Sem imagem, cada card cai num fundo só de cor/gradiente (mesmo
 *    esquema do HeroBanner), então funciona antes de você ter as fotos.
 *
 * Uso:
 *   <div className="grid gap-4 md:grid-cols-2">
 *     <PromoPizzaBanner onCta={...} />
 *     <ComboDoDiaBanner onCta={...} />
 *   </div>
 */

interface PromoCardProps {
  imageSrc?: string;
  onCta?: () => void;
}

export function PromoPizzaBanner({ imageSrc, onCta }: PromoCardProps) {
  return (
    <div className="relative isolate flex h-56 items-center overflow-hidden rounded-2xl bg-neutral-950 px-6 shadow-xl shadow-black/30 ring-1 ring-white/10 sm:h-64 sm:px-8">
      {/* fundo: glow vermelho sutil + textura escura */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_50%,#3a1210_0%,#150d0c_60%,#0b0908_100%)]" />

      {/* rabiscos decorativos, tipo confete */}
      <svg
        className="pointer-events-none absolute right-24 top-4 h-16 w-24 text-orange-500/40 sm:right-36"
        viewBox="0 0 100 60"
        fill="none"
      >
        <path
          d="M2 40 Q 20 10, 38 30 T 74 20"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M50 50 Q 65 35, 80 45"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>

      {/* imagem da pizza */}
      <div className="absolute right-0 top-0 h-full w-[55%]">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt="Pizza em promoção"
            fill
            quality={90}
            priority
            className="object-contain object-bottom"
            sizes="(min-width: 768px) 25vw, 45vw"
          />
        ) : (
          <div className="h-full w-full rounded-full bg-linear-to-br from-amber-700/40 to-transparent blur-2xl" />
        )}
      </div>

      {/* conteúdo */}
      <div className="relative z-10 max-w-[62%]">
        <span className="inline-block rounded-full bg-red-500 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
          Promoção
        </span>

        <h2 className="mt-3 text-xl font-extrabold leading-tight text-white sm:text-2xl">
          Pizzas com
          <br />
          <span className="text-amber-400">30%</span> de desconto!
        </h2>

        <p className="mt-2 text-xs text-neutral-400 sm:text-sm">
          Aproveite essa oferta por tempo limitado!
        </p>

        <button
          onClick={onCta}
          className="mt-4 flex items-center gap-2 rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-neutral-900 transition hover:brightness-105 active:scale-[0.98]"
        >
          Ver Pizzas
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function ComboDoDiaBanner({ imageSrc, onCta }: PromoCardProps) {
  return (
    <div className="relative isolate flex h-56 items-center overflow-hidden rounded-2xl px-6 shadow-xl shadow-orange-900/30 ring-1 ring-black/5 sm:h-64 sm:px-8">
      {/* fundo: gradiente laranja -> amarelo */}
      <div className="absolute inset-0 bg-linear-to-br from-orange-600 via-orange-500 to-amber-400" />

      {/* rabiscos decorativos */}
      <svg
        className="pointer-events-none absolute right-28 top-3 h-16 w-24 text-red-600/30 sm:right-40"
        viewBox="0 0 100 60"
        fill="none"
      >
        <path
          d="M2 30 Q 20 5, 40 25 T 78 15"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>

      {/* imagem do combo */}
      <div className="absolute right-0 top-0 h-full w-[58%]">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt="Combo do dia: hambúrguer, batata e bebida"
            fill
            className="object-contain object-bottom"
            sizes="(min-width: 768px) 26vw, 48vw"
          />
        ) : (
          <div className="h-full w-full rounded-full bg-linear-to-br from-red-700/30 to-transparent blur-2xl" />
        )}
      </div>

      {/* conteúdo */}
      <div className="relative z-10 max-w-[58%]">
        <h2 className="text-xl font-extrabold leading-tight text-neutral-900 sm:text-2xl">
          Combo do Dia
        </h2>

        <p className="mt-1 text-xs font-medium text-neutral-900/80 sm:text-sm">
          Hambúrguer + Batata + Bebida
        </p>

        <p className="mt-3 text-2xl font-extrabold text-neutral-900 sm:text-3xl">
          R$ 29,90
        </p>

        <button
          onClick={onCta}
          className="mt-4 flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 active:scale-[0.98]"
        >
          Pedir agora
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/** Exemplo de uso lado a lado */
export default function PromoBanners() {
  return (
    <div className="mt-9 grid gap-4 md:grid-cols-2">
      <PromoPizzaBanner imageSrc="/product/pizza-02.webp" />
      <ComboDoDiaBanner imageSrc="/product/hamburguer-01.png" />
    </div>
  );
}
