"use client"

import { useState, useEffect } from "react"
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

  // Effect to inform the parent component about the debounced query change
  useEffect(() => {
    onQueryChange(debouncedQuery)
  }, [debouncedQuery, onQueryChange])

  // Effect to sync local state if the initialQuery from props changes
  // This happens on initial load and when navigating via browser history
  useEffect(() => {
    if (initialQuery !== query) {
        setQuery(initialQuery)
    }
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
