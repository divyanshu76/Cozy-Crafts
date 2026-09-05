"use client";

import * as React from "react";
import { Marquee } from "@/components/ui/marquee-01-utils/marquee";
import { Akaya_Kanadaka } from "next/font/google";
import { cn } from "@/lib/utils";

const akayaKanadaka = Akaya_Kanadaka({
  weight: "400",
  subsets: ["latin"],
});

export function AnnouncementRibbon() {
  return (
    <div className="relative z-0 mt-6 -rotate-1 overflow-visible">
      <div className="border-y border-[var(--color-taupe)]/40 bg-[var(--color-cream-soft)]/90 py-2.5 shadow-xs backdrop-blur-xs">
        <Marquee
          pauseOnHover
          className={cn(
            "[--duration:32s] text-xs sm:text-sm font-bold tracking-[0.22em] text-[var(--color-espresso)] uppercase",
            akayaKanadaka.className
          )}
        >
          <div className="flex items-center space-x-8 px-4">
            <span>SMALL BATCH CRAFTS</span>
            <span className="text-[var(--color-gold)]">✦</span>
            <span>HANDMADE WITH LOVE</span>
            <span className="text-[var(--color-sage-deep)]">✦</span>
            <span>DELIVERED ACROSS INDIA</span>
            <span className="text-[var(--color-gold)]">✦</span>
            <span>THOUGHTFULLY PACKED</span>
            <span className="text-[var(--color-sage-deep)]">✦</span>
            <span>TINY TREASURES</span>
            <span className="text-[var(--color-gold)]">✦</span>
          </div>
        </Marquee>
      </div>
    </div>
  );
}
