"use client";

import { cn } from "@/lib/utils";
import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from "react";

type RevealStyle = CSSProperties & {
  "--scroll-reveal-delay": string;
};

export function ScrollReveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    if (!("IntersectionObserver" in window)) {
      element.dataset.visible = "true";
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setIsVisible(true);
        observer.disconnect();
      },
      { threshold: 0.08, rootMargin: "0px 0px -32px 0px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const style: RevealStyle = {
    "--scroll-reveal-delay": `${Math.min(Math.max(delay, 0), 420)}ms`,
  };

  return (
    <div
      ref={elementRef}
      className={cn("scroll-reveal", className)}
      data-visible={isVisible ? "true" : "false"}
      style={style}
    >
      {children}
    </div>
  );
}
