"use client"
import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { ShoppingBag, Menu, Heart } from "lucide-react"
import { useCartStore } from "@/hooks/useCartStore"
import { cn } from "@/lib/utils"
import { CartDrawer } from "@/components/cart/cart-drawer"
import { MobileNav } from "./mobile-nav"
import { SearchOverlay } from "@/components/search/search-overlay"
import { MainNav } from "./main-nav"
import { ExpandingSearchDock } from "@/components/ui/expanding-search-dock"

export function Header() {
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isCartOpen, setIsCartOpen] = React.useState(false);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  
  const cartItems = useCartStore((state) => state.items);
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-30 w-full bg-cream transition-all duration-300",
          {
            "shadow-sm py-3": isScrolled,
            "py-5 lg:py-6": !isScrolled,
          }
        )}
      >
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
          
          {/* Mobile Menu Toggle (Left on Mobile) */}
          <div className="flex-1 md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 text-espresso hover:bg-cream-soft rounded-full transition-colors"
              aria-label="Open menu"
            >
              <Menu size={24} />
            </button>
          </div>

          {/* Logo + Nav grouped on the left (Desktop) / Centered Logo (Mobile) */}
          <div className="flex md:flex-1 items-center md:gap-10 justify-center md:justify-start">
            <Link href="/" aria-label="Cozy Craft home" className="shrink-0 flex items-center">
              <Image
                src="/assets/logo.png"
                alt="Cozy Craft"
                width={220}
                height={64}
                priority
                className={cn("w-auto transition-all duration-300", isScrolled ? "h-7 lg:h-9" : "h-9 md:h-12 lg:h-14")}
              />
            </Link>
            <div className="hidden md:block">
              <MainNav />
            </div>
          </div>

          {/* Actions (Right) */}
          <div className="flex flex-1 items-center justify-end gap-2 md:gap-4">
            <div className="hidden sm:block">
              <ExpandingSearchDock />
            </div>
            {/* Track Order — desktop only text link */}
            <Link
              href="/track-order"
              className="hidden text-xs font-medium text-espresso-soft hover:text-espresso lg:inline transition-colors"
            >
              Track Order
            </Link>
            <Link
              href="/wishlist"
              className="p-2 text-espresso hover:bg-cream-soft rounded-full transition-colors hidden md:block"
              aria-label="Wishlist"
            >
              <Heart size={20} />
            </Link>
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-espresso hover:bg-cream-soft rounded-full transition-colors"
              aria-label="Cart"
            >
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-sage text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <MobileNav isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  )
}
