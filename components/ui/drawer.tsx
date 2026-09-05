"use client"
import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/useMediaQuery"

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  side?: "left" | "right";
  className?: string;
}

export function Drawer({ isOpen, onClose, title, children, side = "right", className }: DrawerProps) {
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; }
  }, [isOpen]);

  const duration = prefersReducedMotion ? 0.01 : 0.3;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration }}
            className="fixed inset-0 z-40 bg-espresso/20 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            initial={{ x: side === "right" ? "100%" : "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: side === "right" ? "100%" : "-100%" }}
            transition={{ duration, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "fixed top-0 bottom-0 z-50 flex w-full max-w-md flex-col bg-cream shadow-xl",
              side === "right" ? "right-0" : "left-0",
              className
            )}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between border-b border-taupe/20 px-6 py-4">
              {title ? (
                <h2 className="text-lg font-serif font-semibold text-espresso">{title}</h2>
              ) : (
                <div />
              )}
              <button
                onClick={onClose}
                className="rounded-full p-2 text-espresso hover:bg-cream-soft transition-colors focus:outline-none focus:ring-2 focus:ring-sage"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
