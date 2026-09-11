"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface PromoBannerProps {
  image: string;
  badge?: string;
  title: string;
  description: string;
  ctaText: string;
  ctaLink: string;
  align?: "left" | "center" | "right";
  countdownTo?: string; // ISO string date
  fullWidth?: boolean;
}

export default function PromoBanner({
  image,
  badge,
  title,
  description,
  ctaText,
  ctaLink,
  align = "left",
  countdownTo,
  fullWidth = false,
}: PromoBannerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  // Countdown logic
  useEffect(() => {
    if (!countdownTo) return;

    const target = new Date(countdownTo).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = target - now;

      if (distance < 0) {
        setTimeLeft(null);
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [countdownTo]);

  const alignmentClasses = {
    left: "items-start text-left",
    center: "items-center text-center mx-auto",
    right: "items-end text-right ml-auto",
  };

  const Wrapper = fullWidth ? "div" : "div";
  const wrapperClasses = fullWidth
    ? "relative w-full h-[500px] md:h-[600px] overflow-hidden"
    : "relative w-full h-[450px] md:h-[500px] rounded-2xl overflow-hidden";

  return (
    <Wrapper className={wrapperClasses}>
      {/* Background Image */}
      <Image
        src={image}
        alt={title}
        fill
        sizes="100vw"
        className="object-cover object-center transition-transform duration-1000 hover:scale-105"
      />
      
      {/* Gradient Overlay */}
      <div 
        className={cn(
          "absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/40 to-transparent",
          align === "left" && "md:bg-gradient-to-r md:from-ink/90 md:via-ink/50",
          align === "right" && "md:bg-gradient-to-l md:from-ink/90 md:via-ink/50"
        )} 
      />

      {/* Content */}
      <div className={cn(
        "absolute inset-0 p-6 md:p-12 flex flex-col justify-end",
        fullWidth ? "container-x mx-auto pb-16" : ""
      )}>
        <div className={cn("flex flex-col max-w-xl", alignmentClasses[align])}>
          {badge && (
            <span className="inline-block bg-[#F7F4EE] text-ink border border-[#E5DDD0] text-xs font-bold px-3.5 py-1 rounded-full mb-4 uppercase tracking-wider shadow-xs">
              {badge}
            </span>
          )}
          
          <h3 className="display text-3xl md:text-5xl text-white mb-3">
            {title}
          </h3>
          
          <p className="text-white/80 text-[15px] md:text-base leading-relaxed mb-6">
            {description}
          </p>

          {/* Countdown Timer */}
          {timeLeft && (
            <div className="flex items-center gap-3 mb-8">
              <div className="flex flex-col items-center bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/20">
                <span className="text-xl font-bold text-white leading-none mb-1">{String(timeLeft.days).padStart(2, '0')}</span>
                <span className="text-[10px] uppercase text-white/70 tracking-wider">Days</span>
              </div>
              <span className="text-white/50 text-xl font-bold">:</span>
              <div className="flex flex-col items-center bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/20">
                <span className="text-xl font-bold text-white leading-none mb-1">{String(timeLeft.hours).padStart(2, '0')}</span>
                <span className="text-[10px] uppercase text-white/70 tracking-wider">Hours</span>
              </div>
              <span className="text-white/50 text-xl font-bold">:</span>
              <div className="flex flex-col items-center bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/20">
                <span className="text-xl font-bold text-white leading-none mb-1">{String(timeLeft.minutes).padStart(2, '0')}</span>
                <span className="text-[10px] uppercase text-white/70 tracking-wider">Mins</span>
              </div>
              <span className="text-white/50 text-xl font-bold">:</span>
              <div className="flex flex-col items-center bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/20">
                <span className="text-xl font-bold text-[#F7F4EE] leading-none mb-1">{String(timeLeft.seconds).padStart(2, '0')}</span>
                <span className="text-[10px] uppercase text-white/70 tracking-wider">Secs</span>
              </div>
            </div>
          )}

          <Link href={ctaLink} className="btn bg-[#F7F4EE] text-ink hover:bg-white border border-[#E5DDD0]">
            {ctaText}
          </Link>
        </div>
      </div>
    </Wrapper>
  );
}
