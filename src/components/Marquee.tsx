"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function Marquee({ items }: { items: string[] }) {
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const tween = gsap.to(el, {
      xPercent: -50,
      duration: 24,
      ease: "none",
      repeat: -1,
    });
    return () => {
      tween.kill();
    };
  }, []);

  const doubled = [...items, ...items];

  return (
    <div className="overflow-hidden border-y border-line bg-mist py-3">
      <div ref={track} className="flex w-max gap-10 whitespace-nowrap">
        {doubled.map((t, i) => (
          <span key={i} className="eyebrow text-muted">
            {t} <span className="ml-10 opacity-40">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
