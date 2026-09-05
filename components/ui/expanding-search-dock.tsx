"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ExpandingSearchDock({ placeholder = "Search Cozy Craft..." }: { placeholder?: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setIsExpanded(false);
      setQuery("");
    }
  };

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          <motion.button
            key="icon"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsExpanded(true)}
            aria-label="Open search"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-taupe)]/40 bg-[var(--color-cream)] transition-colors hover:bg-[var(--color-cream-soft)]"
          >
            <Search className="h-5 w-5 text-[var(--color-espresso)]" strokeWidth={1.5} />
          </motion.button>
        ) : (
          <motion.form
            key="input"
            initial={{ width: 44, opacity: 0 }}
            animate={{ width: 300, opacity: 1 }}
            exit={{ width: 44, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onSubmit={handleSubmit}
            className="relative"
          >
            <div className="relative flex items-center gap-2 overflow-hidden rounded-full border border-[var(--color-taupe)]/40 bg-[var(--color-cream)]">
              <Search className="ml-4 h-4 w-4 text-[var(--color-espresso-soft)]" strokeWidth={1.5} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                autoFocus
                className="h-11 flex-1 bg-transparent pr-2 text-sm text-[var(--color-espresso)] outline-none placeholder:text-[var(--color-espresso-soft)]/70"
              />
              <button
                type="button"
                onClick={() => {
                  setIsExpanded(false);
                  setQuery("");
                }}
                aria-label="Close search"
                className="mr-2 flex h-7 w-7 items-center justify-center rounded-full hover:bg-[var(--color-cream-soft)]"
              >
                <X className="h-4 w-4 text-[var(--color-espresso-soft)]" />
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
