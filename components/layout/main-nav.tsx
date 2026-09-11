"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { RandomLetterSwap } from "@/components/ui/random-letter-swap";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Gifts", href: "/shop/gift-bundles" },
  { label: "New Arrivals", href: "/shop/new-arrivals" },
  { label: "About", href: "/about" },
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden md:flex items-center gap-8">
      {NAV_LINKS.map(({ label, href }) => {
        const isActive = pathname === href;
        return (
          <Link key={href} href={href} className="relative inline-block">
            <RandomLetterSwap
              label={label}
              staggerDuration={0.025}
              transition={{ duration: 0.5, type: "spring" }}
              className={`text-sm font-medium tracking-wide transition-colors ${
                isActive
                  ? "text-espresso"
                  : "text-espresso-soft hover:text-espresso"
              }`}
            />
            {isActive && (
              <span className="absolute -bottom-1 left-0 h-[1.5px] w-full bg-sage" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
