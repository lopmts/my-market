"use client";

import { ChevronLeft, ChevronRight, Play, UtensilsCrossed } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * HeroBanner
 * -----------------------------------------------------------------------
 * Banner principal da home (estilo "delivery de lanches").
 *
 * Como usar a imagem de fundo:
 *  - Coloque o arquivo em /public/images/hero-burger.jpg (ou .webp)
 *  - Passe o caminho na prop `backgroundSrc`, ex:
 *      <HeroBanner backgroundSrc="/images/hero-burger.jpg" />
 *  - Sem imagem, o componente usa um gradiente escuro no lugar, então
 *    ele já funciona (e fica bonito) mesmo antes de você ter a foto.
 *
 * Slides do carrossel:
 *  - Passe um array em `slides` para trocar categorias/headline/preço
 *    quando o usuário clicar nas setas. Se não passar nada, usa 1 slide
 *    com os textos padrão (os do print).
 */

export type HeroSlide = {
  categories: string[];
  headline: [string, string, string]; // 3 linhas do título
  description: string;
  comboLabel?: string; // ex: "COMBO ESPECIAL"
  comboDescription?: string; // ex: "Hambúrguer + Batata + Bebida"
  comboPrice?: string; // ex: "R$ 34,90"
  backgroundSrc?: string;
};

interface HeroBannerProps {
  slides?: HeroSlide[];
  onVerCardapio?: () => void;
  onComoFunciona?: () => void;
}

const defaultSlides: HeroSlide[] = [
  {
    categories: ["Pizzas", "Lanches", "Porções", "Bebidas"],
    headline: ["A pizza que", "você ama, agora", "mais perto de você!"],
    backgroundSrc: "/product/pizza-02.webp",
    description:
      "Ingredientes selecionados, muito mais sabor e praticidade no seu dia a dia.",
    comboLabel: "Pizza especial",
    comboDescription: "Pizza + Bebida",
    comboPrice: "R$ 39,90",
  },
  {
    categories: ["Lanches", "Pizzas", "Porções", "Bebidas"],
    headline: ["O sabor que", "você ama, agora", "mais perto de você!"],
    backgroundSrc: "/product/hamburguer-01.png",
    description:
      "Ingredientes selecionados, muito mais sabor e praticidade no seu dia a dia.",
    comboLabel: "Combo especial",
    comboDescription: "Hambúrguer + Batata + Bebida",
    comboPrice: "R$ 34,90",
  },
];

export default function HeroBanner({
  slides = defaultSlides,
  onVerCardapio,
  onComoFunciona,
}: HeroBannerProps) {
  const [active, setActive] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [hasFocus, setHasFocus] = useState(false);
  const reduceMotion = useReducedMotion();
  const availableSlides = slides.length ? slides : defaultSlides;
  const slide = availableSlides[active % availableSlides.length];

  const goTo = (index: number) => {
    setActive((index + availableSlides.length) % availableSlides.length);
  };

  useEffect(() => {
    if (availableSlides.length < 2 || reduceMotion || isHovered || hasFocus) {
      return;
    }

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        setActive((current) => (current + 1) % availableSlides.length);
      }
    }, 6500);

    return () => window.clearInterval(interval);
  }, [active, availableSlides.length, hasFocus, isHovered, reduceMotion]);

  return (
    <section
      aria-label="Destaques da loja"
      aria-roledescription="carrossel"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocusCapture={() => setHasFocus(true)}
      onBlurCapture={(event) => {
        if (
          !(event.relatedTarget instanceof Node) ||
          !event.currentTarget.contains(event.relatedTarget)
        ) {
          setHasFocus(false);
        }
      }}
      className="relative isolate mx-auto w-full overflow-hidden border border-white/10 bg-[#120b0a]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,140,0,0.15),transparent_20%),radial-gradient(circle_at_80%_30%,rgba(255,153,0,0.12),transparent_30%),linear-gradient(90deg,#060606_0%,#090909_25%,rgba(13,10,10,0.72)_52%,rgba(12,8,9,0.2)_100%)]" />

      <div className="max-w-7xl mx-auto">
        <div className="absolute left-[42%] top-6 z-20 hidden -rotate-3 text-white sm:block">
          <p className="font-serif text-xl italic tracking-wide text-[#f7d7a5] drop-shadow-[0_2px_12px_rgba(0,0,0,0.65)]">
            Hambúrguer artesanal
          </p>
        </div>

        <div
          key={slide.backgroundSrc}
          className="hero-enter absolute inset-0 z-10"
        >
          {slide.backgroundSrc ? (
            <Image
              src={slide.backgroundSrc}
              alt=""
              fill
              priority
              className="object-contain object-bottom"
              sizes="100vw"
              quality={100}
            />
          ) : (
            <div className="h-full w-full bg-[radial-gradient(ellipse_at_70%_60%,#4a2215_0%,#1b120f_38%,#0a0909_100%)]" />
          )}
        </div>

        <div className="absolute inset-0 z-10 bg-linear-to-r from-[#030303]/90 via-[#0a0909]/70 to-[#0d0a0a]/10" />

        <div className="relative z-20 flex min-h-105 flex-col justify-between px-5 py-6 sm:min-h-125 sm:px-8 sm:py-8 lg:min-h-140 lg:px-14 lg:py-10">
          <div
            key={active}
            aria-live="off"
            className="flex flex-1 flex-col justify-between"
          >
          <div className="flex items-start justify-between gap-4">
            <p className="hero-enter flex flex-wrap items-center gap-x-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#f6b35f] sm:text-xs lg:text-sm">
              {slide.categories.map((cat, i) => (
                <span
                  key={cat}
                  className="hero-enter flex items-center gap-2"
                  style={{ animationDelay: `${i * 45}ms` }}
                >
                  {i > 0 && <span className="text-[#f6b35f]/70">•</span>}
                  {cat}
                </span>
              ))}
            </p>

            {slide.comboPrice && (
              <div
                className="hero-enter hidden shrink-0 rounded-[18px] border border-[#f2d284]/15 bg-[#0b0b0b]/85 px-5 py-3 text-right shadow-[0_20px_30px_rgba(0,0,0,0.35)] backdrop-blur-[2px] sm:block"
                style={{ animationDelay: "100ms" }}
              >
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#f7b14b]">
                  {slide.comboLabel}
                </p>
                {slide.comboDescription && (
                  <p className="mt-1 text-xs text-neutral-200/80">
                    {slide.comboDescription}
                  </p>
                )}
                <p className="mt-2 text-3xl font-black text-[#f8c44d]">
                  {slide.comboPrice}
                </p>
              </div>
            )}
          </div>

          <div className="max-w-lg pt-4">
            <h1 className="text-4xl font-black leading-[0.9] tracking-[-0.06em] text-white sm:text-5xl lg:text-[5rem]">
              <span className="hero-enter block">{slide.headline[0]}</span>
              <span
                className="hero-enter mt-2 block text-[#ffca72] sm:mt-1"
                style={{ animationDelay: "80ms" }}
              >
                {slide.headline[1].split(" agora")[0]}{" "}
                <span className="text-[#ffca72]">agora</span>
              </span>
              <span
                className="hero-enter mt-2 block text-[#f8c44d] sm:mt-1"
                style={{ animationDelay: "150ms" }}
              >
                {slide.headline[2]}
              </span>
            </h1>

            <p
              className="hero-enter mt-4 max-w-92 text-sm leading-relaxed text-neutral-200/80 sm:text-base"
              style={{ animationDelay: "220ms" }}
            >
              {slide.description}
            </p>

            <div
              className="hero-enter mt-6 flex flex-wrap items-center gap-3"
              style={{ animationDelay: "290ms" }}
            >
              <button
                onClick={onVerCardapio}
                className="flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#ff9b2f_0%,#ff7a00_30%,#ffb949_100%)] px-5 py-3 text-sm font-extrabold text-[#1a120d] shadow-[0_10px_20px_rgba(255,125,0,0.35)] transition hover:brightness-105 active:scale-[0.98] sm:px-7 sm:py-3.5"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#21150f]/20 bg-black/10">
                  <UtensilsCrossed className="h-4 w-4" />
                </span>
                Ver Cardápio
              </button>

              <button
                onClick={onComoFunciona}
                className="flex items-center gap-2 rounded-full border border-white/35 bg-[#0b0b0b]/55 px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(0,0,0,0.25)] backdrop-blur-sm transition hover:bg-white/10 active:scale-[0.98] sm:px-6"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20">
                  <Play className="h-3 w-3 fill-white" />
                </span>
                Como funciona?
              </button>
            </div>
          </div>
          </div>

          {availableSlides.length > 1 && (
            <div className="flex items-center justify-end gap-3 pb-1">
              <div className="flex items-center gap-1.5">
                {availableSlides.map((_, i) => (
                  <button
                    key={i}
                    aria-label={`Ir para o slide ${i + 1}`}
                    aria-pressed={i === active}
                    onClick={() => goTo(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      i === active ? "w-6 bg-[#f9b44d]" : "w-1.5 bg-white/30"
                    }`}
                  />
                ))}
              </div>
              <button
                aria-label="Slide anterior"
                onClick={() => goTo(active - 1)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-[#131313]/20 text-white  transition hover:bg-white/10"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                aria-label="Próximo slide"
                onClick={() => goTo(active + 1)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-[#131313]/10 text-white  transition hover:bg-white/10"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
