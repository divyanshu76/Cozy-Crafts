import * as React from "react"
import { Drawer } from "@/components/ui/drawer"

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  return (
    <Drawer isOpen={isOpen} onClose={onClose} side="right" className="w-full max-w-lg">
      <div className="p-6">
        <h2 className="text-2xl font-serif text-espresso mb-4">Search</h2>
        <input type="text" className="w-full border-b-2 border-espresso bg-transparent text-xl py-2 focus:outline-none focus:border-sage placeholder:text-taupe" placeholder="What are you looking for?" autoFocus />
      </div>
    </Drawer>
  )
}
