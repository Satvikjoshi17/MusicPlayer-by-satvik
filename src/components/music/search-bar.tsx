"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

type SearchBarProps = {
  initialQuery?: string
}

export function SearchBar({
  initialQuery = "",
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery)

  // Sync the input value if the initialQuery prop changes (e.g., browser back/forward)
  useEffect(() => {
    setQuery(initialQuery)
  }, [initialQuery])

  return (
    <div className="relative w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
      <Input
        type="search"
        name="q" // Use name attribute for form submission
        placeholder="Search for songs, artists, albums..."
        className="w-full pl-10 pr-4 py-3 h-12 text-base bg-secondary border-0 focus-visible:ring-primary focus-visible:ring-2"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
      />
    </div>
  )
}
