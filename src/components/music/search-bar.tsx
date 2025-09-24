"use client"

import { useState, useEffect, useTransition } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"

type SearchBarProps = {
  initialQuery?: string
}

export function SearchBar({
  initialQuery = "",
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery)
  const debouncedQuery = useDebounce(query, 300)
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition();


  useEffect(() => {
    // Only update the URL if the debounced query is different from the initial prop.
    // This prevents an unnecessary router push on initial render.
    if (debouncedQuery !== initialQuery) {
        startTransition(() => {
            const url = debouncedQuery ? `${pathname}?q=${encodeURIComponent(debouncedQuery)}` : pathname;
            router.replace(url, { scroll: false });
        });
    }
  }, [debouncedQuery, initialQuery, pathname, router])

  // Sync the input value if the initialQuery prop changes (e.g., browser back/forward)
  useEffect(() => {
    setQuery(initialQuery)
  }, [initialQuery])

  return (
    <div className="relative w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search for songs, artists, albums..."
        className="w-full pl-10 pr-4 py-3 h-12 text-base bg-secondary border-0 focus-visible:ring-primary focus-visible:ring-2"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
      />
    </div>
  )
}
