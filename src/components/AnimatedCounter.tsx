"use client";

import { useRef, useEffect, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register ScrollTrigger
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export default function AnimatedCounter({
  value,
  duration = 2,
  prefix = "",
  suffix = "",
  decimals = 0,
}: AnimatedCounterProps) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useGSAP(() => {
    if (!nodeRef.current || hasAnimated) return;

    const node = nodeRef.current;
    
    // Create an object to tween
    const obj = { val: 0 };

    ScrollTrigger.create({
      trigger: node,
      start: "top 85%", // Trigger when element is 85% down the viewport
      onEnter: () => {
        gsap.to(obj, {
          val: value,
          duration: duration,
          ease: "power2.out",
          onUpdate: () => {
            if (node) {
              // Format number with commas and decimals
              const formattedValue = obj.val.toLocaleString("en-US", {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals,
              });
              node.innerHTML = `${prefix}${formattedValue}${suffix}`;
            }
          },
          onComplete: () => {
            setHasAnimated(true);
          }
        });
      },
      once: true, // Only animate once
    });

  }, { scope: nodeRef, dependencies: [value, hasAnimated] });

  return (
    <span ref={nodeRef} className="tabular-nums">
      {prefix}0{suffix}
    </span>
  );
}
