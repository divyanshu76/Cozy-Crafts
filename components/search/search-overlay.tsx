import * as React from "react"
import { Drawer } from "@/components/ui/drawer"
import { useRouter } from "next/navigation"

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [query, setQuery] = React.useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      onClose();
      setQuery("");
    }
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} side="right" className="w-full max-w-lg">
      <div className="p-6">
        <h2 className="text-2xl font-serif text-espresso mb-4">Search</h2>
        <form onSubmit={handleSubmit}>
          <input 
            type="text" 
            className="w-full border-b-2 border-espresso bg-transparent text-xl py-2 focus:outline-none focus:border-sage placeholder:text-taupe" 
            placeholder="What are you looking for?" 
            autoFocus 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>
      </div>
    </Drawer>
  )
}
