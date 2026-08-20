"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type Props = {
  children: React.ReactNode;
  className?: string;
  /** stagger children instead of animating the wrapper */
  stagger?: boolean;
  delay?: number;
  y?: number;
  as?: "div" | "section" | "li" | "ul";
};

export default function Reveal({
  children,
  className = "",
  stagger = false,
  delay = 0,
  y = 28,
  as = "div",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(stagger ? el.children : el, { opacity: 1, y: 0 });
      return;
    }

    const targets = stagger ? Array.from(el.children) : el;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        targets,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          delay,
          ease: "expo.out",
          stagger: stagger ? 0.08 : 0,
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        },
      );
    }, el);

    return () => ctx.revert();
  }, [stagger, delay, y]);

  const Tag = as as React.ElementType;
  return (
    <Tag ref={ref} className={`${stagger ? "reveal-children" : "reveal"} ${className}`}>
      {children}
    </Tag>
  );
}
