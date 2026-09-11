"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Flower2, KeyRound, Gift, Heart, Mail, Phone, MapPin } from "lucide-react";
import { Black_Ops_One, Akaya_Kanadaka } from "next/font/google";

const blackOpsOne = Black_Ops_One({
  weight: "400",
  subsets: ["latin"],
});

const akayaKanadaka = Akaya_Kanadaka({
  weight: "400",
  subsets: ["latin"],
});

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

// Register ScrollTrigger safely for React
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// -------------------------------------------------------------------------
// 1. THEME-ADAPTIVE INLINE STYLES (Cozy Craft Palette & Cinematic Motion)
// -------------------------------------------------------------------------
const STYLES = `
.cinematic-footer-wrapper {
  font-family: var(--font-manrope), sans-serif;
  -webkit-font-smoothing: antialiased;
  
  --pill-bg-1: color-mix(in srgb, var(--color-cream) 85%, white);
  --pill-bg-2: color-mix(in srgb, var(--color-cream-soft) 85%, white);
  --pill-shadow: rgba(62, 44, 34, 0.07);
  --pill-highlight: rgba(255, 255, 255, 0.9);
  --pill-inset-shadow: rgba(62, 44, 34, 0.03);
  --pill-border: color-mix(in srgb, var(--color-taupe) 40%, transparent);
  
  --pill-bg-1-hover: #ffffff;
  --pill-bg-2-hover: var(--color-cream-soft);
  --pill-border-hover: var(--color-sage);
  --pill-shadow-hover: rgba(62, 44, 34, 0.14);
  --pill-highlight-hover: #ffffff;
}

@keyframes footer-breathe {
  0% { transform: translate(-50%, -50%) scale(1); opacity: 0.55; }
  100% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.95; }
}

@keyframes footer-scroll-marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

@keyframes footer-heartbeat {
  0%, 100% { transform: scale(1); filter: drop-shadow(0 0 4px rgba(225, 29, 72, 0.4)); }
  15%, 45% { transform: scale(1.2); filter: drop-shadow(0 0 8px rgba(225, 29, 72, 0.7)); }
  30% { transform: scale(1); }
}

.animate-footer-breathe {
  animation: footer-breathe 8s ease-in-out infinite alternate;
}

.animate-footer-scroll-marquee {
  animation: footer-scroll-marquee 40s linear infinite;
}

.animate-footer-heartbeat {
  animation: footer-heartbeat 2s cubic-bezier(0.25, 1, 0.5, 1) infinite;
}

/* Theme-adaptive Grid Background */
.footer-bg-grid {
  background-size: 60px 60px;
  background-image: 
    linear-gradient(to right, color-mix(in srgb, var(--color-espresso) 4%, transparent) 1px, transparent 1px),
    linear-gradient(to bottom, color-mix(in srgb, var(--color-espresso) 4%, transparent) 1px, transparent 1px);
  mask-image: linear-gradient(to bottom, transparent, black 25%, black 75%, transparent);
  -webkit-mask-image: linear-gradient(to bottom, transparent, black 25%, black 75%, transparent);
}

/* Theme-adaptive Aurora Glow */
.footer-aurora {
  background: radial-gradient(
    circle at 50% 50%, 
    color-mix(in srgb, var(--color-sage) 25%, transparent) 0%, 
    color-mix(in srgb, var(--color-gold) 15%, transparent) 40%, 
    transparent 70%
  );
}

/* Glass Pill Theming */
.footer-glass-pill {
  background: linear-gradient(145deg, var(--pill-bg-1) 0%, var(--pill-bg-2) 100%);
  box-shadow: 
      0 10px 30px -10px var(--pill-shadow), 
      inset 0 1px 1px var(--pill-highlight), 
      inset 0 -1px 2px var(--pill-inset-shadow);
  border: 1px solid var(--pill-border);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.footer-glass-pill:hover {
  background: linear-gradient(145deg, var(--pill-bg-1-hover) 0%, var(--pill-bg-2-hover) 100%);
  border-color: var(--pill-border-hover);
  box-shadow: 
      0 18px 36px -10px var(--pill-shadow-hover), 
      inset 0 1px 1px var(--pill-highlight-hover);
  color: var(--color-espresso);
}

/* Giant Background Text Masking */
.footer-giant-bg-text {
  font-size: 18vw;
  line-height: 0.75;
  font-weight: 900;
  letter-spacing: -0.04em;
  color: transparent;
  -webkit-text-stroke: 1px color-mix(in srgb, var(--color-espresso) 8%, transparent);
  background: linear-gradient(180deg, color-mix(in srgb, var(--color-espresso) 12%, transparent) 0%, transparent 65%);
  -webkit-background-clip: text;
  background-clip: text;
}

/* Metallic Text Glow */
.footer-text-glow {
  background: linear-gradient(180deg, var(--color-espresso) 0%, color-mix(in srgb, var(--color-espresso) 75%, transparent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0px 0px 18px color-mix(in srgb, var(--color-espresso) 10%, transparent));
}
`;

// -------------------------------------------------------------------------
// 2. MAGNETIC BUTTON PRIMITIVE (Zero Dependency with GSAP spring)
// -------------------------------------------------------------------------
export type MagneticButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    as?: React.ElementType;
    href?: string;
  };

const MagneticButton = React.forwardRef<HTMLElement, MagneticButtonProps>(
  ({ className, children, as: Component = "button", ...props }, forwardedRef) => {
    const localRef = useRef<HTMLElement>(null);

    useEffect(() => {
      if (typeof window === "undefined") return;
      const element = localRef.current;
      if (!element) return;

      const ctx = gsap.context(() => {
        const handleMouseMove = (e: MouseEvent) => {
          const rect = element.getBoundingClientRect();
          const h = rect.width / 2;
          const w = rect.height / 2;
          const x = e.clientX - rect.left - h;
          const y = e.clientY - rect.top - w;

          gsap.to(element, {
            x: x * 0.35,
            y: y * 0.35,
            rotationX: -y * 0.12,
            rotationY: x * 0.12,
            scale: 1.04,
            ease: "power2.out",
            duration: 0.4,
          });
        };

        const handleMouseLeave = () => {
          gsap.to(element, {
            x: 0,
            y: 0,
            rotationX: 0,
            rotationY: 0,
            scale: 1,
            ease: "elastic.out(1, 0.3)",
            duration: 1.2,
          });
        };

        element.addEventListener("mousemove", handleMouseMove as any);
        element.addEventListener("mouseleave", handleMouseLeave);

        return () => {
          element.removeEventListener("mousemove", handleMouseMove as any);
          element.removeEventListener("mouseleave", handleMouseLeave);
        };
      }, element);

      return () => ctx.revert();
    }, []);

    // Route internal links through Next.js <Link>
    if (Component === "a" && props.href && props.href.startsWith("/")) {
      return (
        <Link
          href={props.href}
          ref={(node: any) => {
            (localRef as any).current = node;
            if (typeof forwardedRef === "function") forwardedRef(node);
            else if (forwardedRef) (forwardedRef as any).current = node;
          }}
          className={cn("cursor-pointer block", className)}
          {...(props as any)}
        >
          {children}
        </Link>
      );
    }

    return (
      <Component
        ref={(node: HTMLElement) => {
          (localRef as any).current = node;
          if (typeof forwardedRef === "function") forwardedRef(node);
          else if (forwardedRef) (forwardedRef as any).current = node;
        }}
        className={cn("cursor-pointer", className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);
MagneticButton.displayName = "MagneticButton";

// -------------------------------------------------------------------------
// 3. MARQUEE ITEM
// -------------------------------------------------------------------------
const MarqueeItem = () => (
  <div className="flex items-center space-x-10 sm:space-x-14 px-6">
    <span>Handmade With Love</span> <span className="text-[var(--color-sage-deep)]">✦</span>
    <span>Small Batch Crafts</span> <span className="text-[var(--color-gold)]">✦</span>
    <span>Flower Bouquets</span> <span className="text-[var(--color-sage-deep)]">✦</span>
    <span>Cute Keychains</span> <span className="text-[var(--color-gold)]">✦</span>
    <span>Handcrafted in India</span> <span className="text-[var(--color-sage-deep)]">✦</span>
    <span>Everyday Joy</span> <span className="text-[var(--color-gold)]">✦</span>
  </div>
);

// -------------------------------------------------------------------------
// 4. MAIN CINEMATIC FOOTER COMPONENT
// -------------------------------------------------------------------------
export function CinematicFooter() {
  const [email, setEmail] = useState("");
  const router = useRouter();
  
  // Hidden Admin Shortcut state
  const [tapCount, setTapCount] = useState(0);
  const [lastTap, setLastTap] = useState(0);

  const handleAdminShortcut = (e: React.MouseEvent | React.TouchEvent) => {
    // Prevent accidentally highlighting text if user taps repeatedly
    if (e.type === 'mousedown' && e.detail > 1) {
      e.preventDefault();
    }

    const now = Date.now();
    
    if (now - lastTap > 2000) {
      // Reset if more than 2 seconds since last tap
      setTapCount(1);
    } else {
      const newCount = tapCount + 1;
      setTapCount(newCount);
      if (newCount >= 5) {
        setTapCount(0); // Reset immediately
        router.push("/admin/login");
      }
    }
    setLastTap(now);
  };

  const footerRef = useRef<HTMLElement>(null);
  const giantTextRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!footerRef.current) return;

    // React strict mode compatible GSAP context cleanup
    const ctx = gsap.context(() => {
      // Parallax for giant background watermark text
      if (giantTextRef.current) {
        gsap.fromTo(
          giantTextRef.current,
          { y: "3vh", opacity: 0.6 },
          {
            y: "-3vh",
            opacity: 1,
            ease: "none",
            scrollTrigger: {
              trigger: footerRef.current,
              start: "top bottom",
              end: "bottom top",
              scrub: 1,
            },
          }
        );
      }

      // Smooth subtle entrance for heading and links
      gsap.fromTo(
        [headingRef.current, linksRef.current],
        { y: 20, opacity: 0.7 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.1,
          duration: 0.7,
          ease: "power2.out",
          scrollTrigger: {
            trigger: footerRef.current,
            start: "top 90%",
            once: true,
          },
        }
      );
    }, footerRef);

    return () => ctx.revert();
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <footer
        ref={footerRef}
        className="relative z-20 flex w-full flex-col justify-between overflow-hidden bg-[var(--color-cream-logo)] text-[var(--color-espresso)] cinematic-footer-wrapper pt-12 pb-8 sm:pt-16 sm:pb-10 min-h-[560px]"
      >
        {/* Ambient Light & Grid Background */}
        <div className="footer-aurora absolute left-1/2 top-1/2 h-[60vh] w-[80vw] -translate-x-1/2 -translate-y-1/2 animate-footer-breathe rounded-[50%] blur-[80px] pointer-events-none z-0" />
        <div className="footer-bg-grid absolute inset-0 z-0 pointer-events-none" />

        {/* Giant background text mask with Parallax */}
        <div
          ref={giantTextRef}
          className="footer-giant-bg-text absolute -bottom-[1vh] left-1/2 -translate-x-1/2 whitespace-nowrap z-0 pointer-events-none select-none font-serif"
        >
          COZY CRAFT
        </div>

        {/* 1. Diagonal Sleek Marquee (Top of footer) */}
        <div className="relative w-full overflow-hidden border-y border-[var(--color-taupe)]/35 bg-[var(--color-cream-logo)]/85 backdrop-blur-md py-3 sm:py-3.5 z-10 -rotate-1 scale-105 shadow-xs mb-8 sm:mb-12">
          <div className={cn("flex w-max animate-footer-scroll-marquee text-xs md:text-sm font-bold tracking-[0.25em] text-[var(--color-espresso-soft)] uppercase", akayaKanadaka.className)}>
            <MarqueeItem />
            <MarqueeItem />
          </div>
        </div>

        {/* 2. Main Center Content (Logo, Heading, CTAs, Secondary Links, Contact) */}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 sm:px-6 w-full max-w-5xl mx-auto my-3 sm:my-6">
          {/* Cozy Craft Logo */}
          <Link href="/" aria-label="Cozy Craft home" className="mx-auto block w-fit mb-3 sm:mb-4">
            <Image
              src="/assets/logo.png"
              alt="Cozy Craft"
              width={360}
              height={180}
              className="h-20 sm:h-24 md:h-28 w-auto object-contain"
            />
          </Link>

          <h2
            ref={headingRef}
            className={cn("text-3xl sm:text-5xl md:text-6xl text-[var(--color-espresso)] font-serif mb-5 sm:mb-7 text-center footer-text-glow", blackOpsOne.className)}
          >
            Handmade for You
          </h2>

          {/* Interactive Magnetic Pills Layout */}
          <div ref={linksRef} className="flex flex-col items-center gap-4 sm:gap-5 w-full">
            {/* Primary Shop Links */}
            <div className={cn("flex flex-wrap justify-center gap-3 sm:gap-4 w-full", akayaKanadaka.className)}>
              <MagneticButton as="a" href="/shop/flower-bouquets" className="footer-glass-pill px-6 sm:px-8 py-3 sm:py-3.5 rounded-full text-[var(--color-espresso)] font-bold text-sm md:text-base flex items-center gap-2.5 group">
                <Flower2 className="h-5 w-5 text-[var(--color-sage-deep)] group-hover:scale-110 transition-transform" strokeWidth={1.5} />
                Shop Bouquets
              </MagneticButton>

              <MagneticButton as="a" href="/shop/keychains" className="footer-glass-pill px-6 sm:px-8 py-3 sm:py-3.5 rounded-full text-[var(--color-espresso)] font-bold text-sm md:text-base flex items-center gap-2.5 group">
                <KeyRound className="h-5 w-5 text-[var(--color-sage-deep)] group-hover:scale-110 transition-transform" strokeWidth={1.5} />
                Shop Keychains
              </MagneticButton>

              <MagneticButton as="a" href="/shop/gift-bundles" className="footer-glass-pill px-6 sm:px-8 py-3 sm:py-3.5 rounded-full text-[var(--color-espresso)] font-bold text-sm md:text-base flex items-center gap-2.5 group">
                <Gift className="h-5 w-5 text-[var(--color-sage-deep)] group-hover:scale-110 transition-transform" strokeWidth={1.5} />
                Gift Bundles
              </MagneticButton>
            </div>

            {/* Secondary Info Links */}
            <div className={cn("flex flex-wrap justify-center gap-2.5 sm:gap-4 w-full text-xs sm:text-sm", akayaKanadaka.className)}>
              <MagneticButton as="a" href="/about" className="footer-glass-pill px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-[var(--color-espresso-soft)] font-medium hover:text-[var(--color-espresso)]">
                About Us
              </MagneticButton>
              <MagneticButton as="a" href="/contact" className="footer-glass-pill px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-[var(--color-espresso-soft)] font-medium hover:text-[var(--color-espresso)]">
                Contact
              </MagneticButton>
              <MagneticButton as="a" href="/policies/shipping-returns" className="footer-glass-pill px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-[var(--color-espresso-soft)] font-medium hover:text-[var(--color-espresso)]">
                Shipping & Returns
              </MagneticButton>
              <MagneticButton as="a" href="/policies/privacy" className="footer-glass-pill px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-[var(--color-espresso-soft)] font-medium hover:text-[var(--color-espresso)]">
                Privacy Policy
              </MagneticButton>
            </div>

            {/* Contact Details */}
            <div className={cn("mt-1 sm:mt-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs sm:text-sm text-[var(--color-espresso-soft)]", akayaKanadaka.className)}>
              <a href="mailto:k7616168@gmail.com" className="inline-flex items-center gap-1.5 hover:text-[var(--color-espresso)] transition-colors">
                <Mail className="h-4 w-4 text-[var(--color-sage-deep)]" strokeWidth={1.5} /> k7616168@gmail.com
              </a>
              <a href="tel:+919999999999" className="inline-flex items-center gap-1.5 hover:text-[var(--color-espresso)] transition-colors">
                <Phone className="h-4 w-4 text-[var(--color-sage-deep)]" strokeWidth={1.5} /> +91 99999 99999
              </a>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-[var(--color-sage-deep)]" strokeWidth={1.5} /> Ramaipatti, Mirzapur, 231001, UP, India
              </span>
              <a
                href="https://www.instagram.com/cozycraftss.in/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow Cozy Craft on Instagram"
                className="inline-flex items-center gap-1.5 hover:text-[var(--color-espresso)] transition-colors"
              >
                <InstagramIcon className="h-4 w-4 text-[var(--color-sage-deep)]" /> @cozycraftss.in
              </a>
            </div>
          </div>
        </div>

        {/* 3. Bottom Bar / Credits (3-column grid for true center alignment) */}
        <div className={cn("relative z-20 w-full pt-8 pb-4 px-4 sm:px-12 grid grid-cols-1 sm:grid-cols-3 items-center gap-4 text-sm mt-8 border-t border-[var(--color-taupe)]/20", akayaKanadaka.className)}>
          {/* Copyright */}
          <p className="text-center sm:text-left text-[var(--color-espresso-soft)] text-[10px] md:text-xs font-semibold tracking-widest uppercase">
            © {new Date().getFullYear()} Cozy Craft. All rights reserved.
          </p>

          {/* "Made with Love" Badge - Visually Centered */}
          <div className="flex justify-center">
            <div 
              className="footer-glass-pill px-5 sm:px-6 py-2.5 rounded-full flex items-center gap-2 cursor-default border-[var(--color-taupe)]/40 select-none"
              onMouseDown={handleAdminShortcut}
              onTouchStart={handleAdminShortcut}
            >
              <span className="text-[var(--color-espresso-soft)] text-[10px] md:text-xs font-bold uppercase tracking-widest pointer-events-none">Handcrafted with</span>
              <Heart className="h-4 w-4 text-[var(--color-destructive)] fill-[var(--color-destructive)] animate-footer-heartbeat" strokeWidth={1.5} />
              <span className="text-[var(--color-espresso-soft)] text-[10px] md:text-xs font-bold uppercase tracking-widest">by</span>
              <span className="text-[var(--color-espresso)] font-black text-xs md:text-sm tracking-normal ml-1">Cozy Craft</span>
            </div>
          </div>

          {/* Back to top */}
          <div className="flex justify-center sm:justify-end">
            <MagneticButton
              as="button"
              onClick={scrollToTop}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full footer-glass-pill flex items-center justify-center text-[var(--color-espresso-soft)] hover:text-[var(--color-espresso)] transition-colors group"
              aria-label="Back to top"
            >
              <svg className="w-5 h-5 transform group-hover:-translate-y-1.5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
              </svg>
            </MagneticButton>
          </div>
        </div>
      </footer>
    </>
  );
}
