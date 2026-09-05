"use client"
import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface AccordionProps {
  items: { id: string; title: string; content: React.ReactNode }[];
  className?: string;
}

export function Accordion({ items, className }: AccordionProps) {
  const [openItems, setOpenItems] = React.useState<Set<string>>(new Set([items[0]?.id]));

  const toggle = (id: string) => {
    setOpenItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className={cn("divide-y divide-taupe/20", className)}>
      {items.map((item) => {
        const isOpen = openItems.has(item.id);
        return (
          <div key={item.id} className="py-4">
            <button
              onClick={() => toggle(item.id)}
              className="flex w-full items-center justify-between text-left focus:outline-none"
              aria-expanded={isOpen}
            >
              <span className="font-semibold text-espresso">{item.title}</span>
              <ChevronDown
                className={cn("h-5 w-5 text-taupe transition-transform duration-200", {
                  "rotate-180": isOpen,
                })}
              />
            </button>
            <div
              className={cn("overflow-hidden transition-all duration-300", {
                "max-h-96 mt-4 opacity-100": isOpen,
                "max-h-0 opacity-0": !isOpen,
              })}
            >
              <div className="text-sm text-espresso-soft leading-relaxed">
                {item.content}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  )
}
