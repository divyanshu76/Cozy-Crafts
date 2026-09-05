"use client";

import { motion, type Transition } from "framer-motion";

interface RandomLetterSwapProps {
  label: string;
  className?: string;
  staggerDuration?: number;
  transition?: Transition;
}

export function RandomLetterSwap({
  label,
  className,
  staggerDuration = 0.025,
  transition = { duration: 0.5, type: "spring" },
}: RandomLetterSwapProps) {
  const letters = label.split("");

  return (
    <motion.span
      initial="rest"
      animate="rest"
      whileHover="hover"
      className={`relative inline-flex overflow-hidden ${className ?? ""}`}
      style={{ lineHeight: 1.1 }}
    >
      {letters.map((letter, i) => (
        <span
          key={i}
          className="relative inline-block"
          style={{ whiteSpace: "pre" }}
        >
          {/* current letter, slides up and out on hover */}
          <motion.span
            className="inline-block"
            variants={{ rest: { y: 0 }, hover: { y: "-100%" } }}
            transition={{ ...transition, delay: i * staggerDuration }}
          >
            {letter === " " ? "\u00A0" : letter}
          </motion.span>
          {/* duplicate letter, slides up into place on hover */}
          <motion.span
            className="absolute left-0 top-0 inline-block"
            variants={{ rest: { y: "100%" }, hover: { y: 0 } }}
            transition={{ ...transition, delay: i * staggerDuration }}
          >
            {letter === " " ? "\u00A0" : letter}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}
