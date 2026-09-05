import * as React from "react"
import Link from "next/link"
import { Drawer } from "@/components/ui/drawer"
import { ChevronRight, Search, Heart, User } from "lucide-react"
import { RandomLetterSwap } from "@/components/ui/random-letter-swap"
import { usePathname } from "next/navigation"

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname();
  
  const links = [
    { name: "Home", href: "/" },
    { name: "Shop All", href: "/shop" },
    { name: "Keychains", href: "/shop/keychains" },
    { name: "Flower Bouquets", href: "/shop/flower-bouquets" },
    { name: "Hair Accessories", href: "/shop/hair-accessories" },
    { name: "Charms", href: "/shop/charms" },
    { name: "Gift Bundles", href: "/collections/gift-bundles" },
    { name: "New Arrivals", href: "/shop/new-arrivals" },
  ];

  return (
    <Drawer isOpen={isOpen} onClose={onClose} side="left" className="w-[85vw] sm:w-[400px]">
      <div className="flex flex-col h-full">
        {/* Search */}
        <div className="p-4 border-b border-taupe/20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-taupe h-5 w-5" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="w-full bg-cream-soft rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
        </div>

        {/* Links */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    onClick={onClose}
                    className="flex items-center justify-between px-4 py-3 text-lg font-medium text-espresso rounded-md hover:bg-cream-soft transition-colors"
                  >
                    <div className="relative inline-block">
                      <RandomLetterSwap
                        label={link.name}
                        staggerDuration={0.025}
                        transition={{ duration: 0.5, type: "spring" }}
                        className={isActive ? "text-sage" : ""}
                      />
                    </div>
                    <ChevronRight size={18} className="text-taupe" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer actions */}
        <div className="p-4 border-t border-taupe/20 bg-cream-soft/50 space-y-4">
          <Link href="/account" onClick={onClose} className="flex items-center gap-3 text-espresso font-medium px-2 py-2 hover:text-sage">
            <User size={20} />
            My Account
          </Link>
          <Link href="/wishlist" onClick={onClose} className="flex items-center gap-3 text-espresso font-medium px-2 py-2 hover:text-sage">
            <Heart size={20} />
            Wishlist
          </Link>
        </div>
      </div>
    </Drawer>
  )
}
