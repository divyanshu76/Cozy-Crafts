"use client";

import { motion, useScroll, useTransform, useReducedMotion, type MotionValue } from "framer-motion";
import { useRef } from "react";
import { cn } from "@/lib/utils";

type ScrollCharacterProps = {
  char: string;
  index: number;
  centerIndex: number;
  scrollYProgress: MotionValue<number>;
};

function ScrollCharacter({ char, index, centerIndex, scrollYProgress }: ScrollCharacterProps) {
  const isSpace = char === " ";
  const distanceFromCenter = index - centerIndex;

  const x = useTransform(scrollYProgress, [0, 1], [distanceFromCenter * 28, 0]);
  const rotateX = useTransform(scrollYProgress, [0, 1], [distanceFromCenter * 24, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [0.15, 1]);

  return (
    <motion.span
      className={cn("inline-block text-[var(--color-espresso)]", isSpace && "w-[0.28em]")}
      style={{ x, rotateX, opacity }}
    >
      {char}
    </motion.span>
  );
}

interface ScrollRevealHeadlineProps {
  text: string;
  className?: string;
}

export function ScrollRevealHeadline({ text, className }: ScrollRevealHeadlineProps) {
  const targetRef = useRef<HTMLDivElement | null>(null);

  // Trigger the convergence quickly as the section scrolls into view, instead
  // of spanning a huge fixed height — this is what removes the dead space.
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start 0.9", "start 0.35"],
  });
  const shouldReduceMotion = useReducedMotion();
  const characters = text.split("");
  const centerIndex = Math.floor(characters.length / 2);

  // Fluid single-line sizing: font size scales down as the phrase gets
  // longer, so it always fits on one line without wrapping, at any width.
  const fluidVw = Math.min(8, Math.max(3.2, 85 / characters.length));
  const fontSize = `clamp(1.1rem, ${fluidVw}vw, 4.5rem)`;

  if (shouldReduceMotion) {
    return (
      <div className="flex items-center justify-center bg-[var(--color-cream-soft)] px-4 py-16">
        <p className={cn("font-serif whitespace-nowrap text-center font-semibold", className)} style={{ fontSize }}>
          {text}
        </p>
      </div>
    );
  }

  return (
    <div
      ref={targetRef}
      className="relative flex items-center justify-center overflow-hidden bg-[var(--color-cream-soft)] py-20 sm:py-28"
    >
      <p
        className={cn("font-serif whitespace-nowrap px-4 text-center font-semibold tracking-tight", className)}
        style={{ fontSize, perspective: "600px" }}
      >
        {characters.map((char, index) => (
          <ScrollCharacter
            key={index}
            char={char}
            index={index}
            centerIndex={centerIndex}
            scrollYProgress={scrollYProgress}
          />
        ))}
      </p>
    </div>
  );
}
