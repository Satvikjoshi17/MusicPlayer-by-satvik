"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"

type SearchBarProps = {
  initialQuery?: string
  onQueryChange: (query: string) => void
}

export function SearchBar({
  initialQuery = "",
  onQueryChange,
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery)
  const debouncedQuery = useDebounce(query, 500)
  const isInitialMount = useRef(true)

  // Effect to inform the parent component about the debounced query change
  useEffect(() => {
    // We don't want to trigger a URL update on the initial mount.
    // The parent component will handle the initial state from the URL.
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    // Only call the parent if the debounced query is different from the initial one
    // that came from the URL. This prevents an extra router.replace call on load.
    if (debouncedQuery !== initialQuery) {
        onQueryChange(debouncedQuery);
    }
  }, [debouncedQuery, onQueryChange, initialQuery])

  // Effect to sync local input state if the parent passes a new initialQuery.
  // This happens when navigating via browser history (back/forward buttons).
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
