"use client";

import * as React from "react";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";
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
// 1. THEME-ADAPTIVE INLINE STYLES
// -------------------------------------------------------------------------
const STYLES = `
.cinematic-footer-wrapper {
  /* Dynamic Variables using Cozy Craft tokens */
  --background: var(--color-espresso);
  --foreground: var(--color-cream);
  --primary: var(--color-sage);
  --secondary: var(--color-gold);
  --border: var(--color-espresso-soft);
  --muted-foreground: var(--color-taupe);
  --destructive: var(--color-blush-deep);

  --pill-bg-1: color-mix(in oklch, var(--foreground) 3%, transparent);
  --pill-bg-2: color-mix(in oklch, var(--foreground) 1%, transparent);
  --pill-shadow: color-mix(in oklch, var(--background) 50%, transparent);
  --pill-highlight: color-mix(in oklch, var(--foreground) 10%, transparent);
  --pill-inset-shadow: color-mix(in oklch, var(--background) 80%, transparent);
  --pill-border: color-mix(in oklch, var(--foreground) 8%, transparent);
  
  --pill-bg-1-hover: color-mix(in oklch, var(--foreground) 8%, transparent);
  --pill-bg-2-hover: color-mix(in oklch, var(--foreground) 2%, transparent);
  --pill-border-hover: color-mix(in oklch, var(--foreground) 20%, transparent);
  --pill-shadow-hover: color-mix(in oklch, var(--background) 70%, transparent);
  --pill-highlight-hover: color-mix(in oklch, var(--foreground) 20%, transparent);
}

@keyframes footer-breathe {
  0% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
  100% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
}

@keyframes footer-scroll-marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

@keyframes footer-heartbeat {
  0%, 100% { transform: scale(1); filter: drop-shadow(0 0 5px color-mix(in oklch, var(--destructive) 50%, transparent)); }
  15%, 45% { transform: scale(1.2); filter: drop-shadow(0 0 10px color-mix(in oklch, var(--destructive) 80%, transparent)); }
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
    linear-gradient(to right, color-mix(in oklch, var(--foreground) 3%, transparent) 1px, transparent 1px),
    linear-gradient(to bottom, color-mix(in oklch, var(--foreground) 3%, transparent) 1px, transparent 1px);
  mask-image: linear-gradient(to bottom, transparent, black 30%, black 70%, transparent);
  -webkit-mask-image: linear-gradient(to bottom, transparent, black 30%, black 70%, transparent);
}

/* Theme-adaptive Aurora Glow */
.footer-aurora {
  background: radial-gradient(
    circle at 50% 50%, 
    color-mix(in oklch, var(--primary) 15%, transparent) 0%, 
    color-mix(in oklch, var(--secondary) 15%, transparent) 40%, 
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
      0 20px 40px -10px var(--pill-shadow-hover), 
      inset 0 1px 1px var(--pill-highlight-hover);
  color: var(--foreground);
}

/* Giant Background Text Masking */
.footer-giant-bg-text {
  font-size: 26vw;
  line-height: 0.75;
  font-weight: 900;
  letter-spacing: -0.05em;
  color: transparent;
  -webkit-text-stroke: 1px color-mix(in oklch, var(--foreground) 5%, transparent);
  background: linear-gradient(180deg, color-mix(in oklch, var(--foreground) 10%, transparent) 0%, transparent 60%);
  -webkit-background-clip: text;
  background-clip: text;
}

/* Metallic Text Glow */
.footer-text-glow {
  background: linear-gradient(180deg, var(--foreground) 0%, color-mix(in oklch, var(--foreground) 40%, transparent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0px 0px 20px color-mix(in oklch, var(--foreground) 15%, transparent));
}
`;

// -------------------------------------------------------------------------
// 2. MAGNETIC BUTTON PRIMITIVE (Zero Dependency)
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
            x: x * 0.4,
            y: y * 0.4,
            rotationX: -y * 0.15,
            rotationY: x * 0.15,
            scale: 1.05,
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
    },[]);

    // Determine the underlying element correctly, particularly for Next.js <Link> wrapper
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
// 3. MAIN COMPONENT
// -------------------------------------------------------------------------
const MarqueeItem = () => (
  <div className="flex items-center space-x-12 px-6">
    <span>Little Things</span> <span className="text-primary/60">✦</span>
    <span>Made With Love</span> <span className="text-secondary/60">✦</span>
    <span>Handcrafted</span> <span className="text-primary/60">✦</span>
    <span>Unique Treasures</span> <span className="text-secondary/60">✦</span>
    <span>Everyday Joy</span> <span className="text-primary/60">✦</span>
  </div>
);

export function CinematicFooter() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const giantTextRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!wrapperRef.current) return;

    // React strict mode compatible GSAP context cleanup
    const ctx = gsap.context(() => {
      // Background Parallax
      gsap.fromTo(
        giantTextRef.current,
        { y: "10vh", scale: 0.8, opacity: 0 },
        {
          y: "0vh",
          scale: 1,
          opacity: 1,
          ease: "power1.out",
          scrollTrigger: {
            trigger: wrapperRef.current,
            start: "top 80%",
            end: "bottom bottom",
            scrub: 1,
          },
        }
      );

      // Staggered Content Reveal
      gsap.fromTo(
        [headingRef.current, linksRef.current],
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: wrapperRef.current,
            start: "top 40%",
            end: "bottom bottom",
            scrub: 1,
          },
        }
      );
    }, wrapperRef);

    return () => ctx.revert();
  },[]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      
      {/* 
        The "Curtain Reveal" Wrapper:
        It sits in standard flow. Because it has clip-path, its contents
        are ONLY visible within its bounding box. 
      */}
      <div
        ref={wrapperRef}
        className="relative h-screen w-full"
        style={{ clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}
      >
        {/* The actual footer stays fixed to the viewport underneath everything */}
        <footer 
          className="fixed bottom-0 left-0 flex h-screen w-full flex-col justify-between overflow-hidden cinematic-footer-wrapper bg-[var(--color-cream-logo)]"
        >
          
          {/* Ambient Light & Grid Background (Removed) */}

          {/* 1. Diagonal Sleek Marquee (Top of footer) */}
          <div className="absolute top-12 left-0 w-full overflow-hidden border-y border-[var(--color-taupe)]/25 py-4 z-10 -rotate-2 scale-110">
            <div className={cn("flex w-max animate-footer-scroll-marquee text-xs font-medium tracking-widest text-[var(--color-espresso-soft)] uppercase", akayaKanadaka.className)}>
              <MarqueeItem />
              <MarqueeItem />
            </div>
          </div>

          {/* 2. Main Center Content */}
          <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 mt-20 w-full max-w-5xl mx-auto">
            <Link href="/" aria-label="Cozy Craft home" className="mx-auto block w-fit mb-6">
              <Image 
                src="/assets/logo.png" 
                alt="Cozy Craft" 
                width={320}
                height={160}
                className="h-20 w-auto sm:h-24" 
              />
            </Link>
            
            <h2
              ref={headingRef}
              className={cn("text-5xl text-[var(--color-espresso)] sm:text-6xl mb-12 text-center", blackOpsOne.className)}
            >
              Handmade for You
            </h2>

            {/* Interactive Magnetic Pills Layout */}
            <div ref={linksRef} className="flex flex-col items-center gap-6 w-full">
              {/* Primary Links */}
              <div className={cn("flex flex-wrap items-center justify-center gap-4 w-full mt-10", akayaKanadaka.className)}>
                <MagneticButton as="a" href="/shop/flower-bouquets" className="inline-flex items-center gap-2 rounded-full border border-[var(--color-sage)]/50 px-6 py-3 text-sm text-[var(--color-espresso)] transition-colors hover:bg-[var(--color-sage)]/10">
                  <Flower2 className="h-4 w-4 text-[var(--color-sage-deep)]" strokeWidth={1.5} />
                  Shop Bouquets
                </MagneticButton>
                
                <MagneticButton as="a" href="/shop/keychains" className="inline-flex items-center gap-2 rounded-full border border-[var(--color-sage)]/50 px-6 py-3 text-sm text-[var(--color-espresso)] transition-colors hover:bg-[var(--color-sage)]/10">
                  <KeyRound className="h-4 w-4 text-[var(--color-sage-deep)]" strokeWidth={1.5} />
                  Shop Keychains
                </MagneticButton>
                
                <MagneticButton as="a" href="/collections/gift-bundles" className="inline-flex items-center gap-2 rounded-full border border-[var(--color-sage)]/50 px-6 py-3 text-sm text-[var(--color-espresso)] transition-colors hover:bg-[var(--color-sage)]/10">
                  <Gift className="h-4 w-4 text-[var(--color-sage-deep)]" strokeWidth={1.5} />
                  Gift Bundles
                </MagneticButton>
              </div>

              {/* Secondary Text Links */}
              <div className={cn("flex flex-wrap items-center justify-center gap-3 w-full mt-6 text-sm", akayaKanadaka.className)}>
                <MagneticButton as="a" href="/about" className="rounded-full border border-[var(--color-taupe)]/40 px-5 py-2 text-[var(--color-espresso-soft)] transition-colors hover:border-[var(--color-taupe)] hover:text-[var(--color-espresso)]">
                  About Us
                </MagneticButton>
                <MagneticButton as="a" href="/contact" className="rounded-full border border-[var(--color-taupe)]/40 px-5 py-2 text-[var(--color-espresso-soft)] transition-colors hover:border-[var(--color-taupe)] hover:text-[var(--color-espresso)]">
                  Contact
                </MagneticButton>
                <MagneticButton as="a" href="/policies/shipping" className="rounded-full border border-[var(--color-taupe)]/40 px-5 py-2 text-[var(--color-espresso-soft)] transition-colors hover:border-[var(--color-taupe)] hover:text-[var(--color-espresso)]">
                  Shipping & Returns
                </MagneticButton>
                <MagneticButton as="a" href="/policies/privacy" className="rounded-full border border-[var(--color-taupe)]/40 px-5 py-2 text-[var(--color-espresso-soft)] transition-colors hover:border-[var(--color-taupe)] hover:text-[var(--color-espresso)]">
                  Privacy Policy
                </MagneticButton>
              </div>

              {/* Contact Details */}
              <div className={cn("mt-10 flex flex-col items-center gap-2 text-sm text-[var(--color-espresso-soft)]", akayaKanadaka.className)}>
                <a href="mailto:k7616168@gmail.com" className="inline-flex items-center gap-2 hover:text-[var(--color-espresso)]">
                  <Mail className="h-4 w-4" strokeWidth={1.5} /> k7616168@gmail.com
                </a>
              
                {/* TODO: replace with the real business phone number before launch */}
                <a href="tel:+919999999999" className="inline-flex items-center gap-2 hover:text-[var(--color-espresso)]">
                  <Phone className="h-4 w-4" strokeWidth={1.5} /> +91 99999 99999
                </a>
              
                <p className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4" strokeWidth={1.5} /> Ramaipatti, Mirzapur, 231001, Uttar Pradesh, India
                </p>
              
                {/* TODO: replace with the real Instagram handle before launch */}
                <a
                  href="https://instagram.com/cozycrafts"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 hover:text-[var(--color-espresso)]"
                >
                  <InstagramIcon className="h-4 w-4" /> @cozycrafts
                </a>
              </div>
            </div>
          </div>

          {/* 3. Bottom Bar / Credits */}
          <div className={cn("relative z-20 w-full pb-8 px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-6", akayaKanadaka.className)}>
            
            {/* Copyright */}
            <div className="text-[var(--color-espresso-soft)] text-[10px] md:text-xs font-semibold tracking-widest uppercase order-2 md:order-1">
              © {new Date().getFullYear()} Cozy Craft. All rights reserved.
            </div>

            {/* "Made with Love" Badge */}
            <div className="flex items-center gap-2 order-1 md:order-2 cursor-default bg-transparent px-6 py-3 rounded-full border border-[var(--color-taupe)]/40">
              <span className="text-[var(--color-espresso-soft)] text-[10px] md:text-xs font-bold uppercase tracking-widest">Handcrafted with</span>
              <Heart className="h-4 w-4 text-[var(--color-destructive)] fill-[var(--color-destructive)] animate-footer-heartbeat" strokeWidth={1.5} />
              <span className="text-[var(--color-espresso-soft)] text-[10px] md:text-xs font-bold uppercase tracking-widest">by</span>
              <span className="text-[var(--color-espresso)] font-black text-xs md:text-sm tracking-normal ml-1">Cozy Craft</span>
            </div>

            {/* Back to top */}
            <MagneticButton
              as="button"
              onClick={scrollToTop}
              className="w-12 h-12 rounded-full flex items-center justify-center text-[var(--color-espresso-soft)] hover:text-[var(--color-sage-deep)] bg-transparent border border-[var(--color-taupe)]/40 transition-colors group order-3"
            >
              <svg className="w-5 h-5 transform group-hover:-translate-y-1.5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
              </svg>
            </MagneticButton>

          </div>

          <div className="relative mt-8 h-[12vw] max-h-28 min-h-[56px] overflow-hidden sm:h-[9vw]">
            <span
              aria-hidden="true"
              className="absolute inset-x-0 top-0 select-none whitespace-nowrap text-center font-serif font-semibold leading-none text-[var(--color-espresso)]/[0.05]"
              style={{ fontSize: "18vw" }}
            >
              COZY CRAFT
            </span>
          </div>
        </footer>
      </div>
    </>
  );
}
