"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { SearchBar } from "@/components/music/search-bar"
import { Suspense } from "react"
import { TrackListSkeleton } from "./track-list-skeleton"
import { SearchResults } from "./search-results"


export function SearchClientPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialQuery = searchParams.get("q") || ""
  const [query, setQuery] = useState(initialQuery)

  useEffect(() => {
    // When the query state changes, update the URL.
    // This is debounced because the query state is driven by the
    // debounced value in SearchBar.
    const url = query ? `/search?q=${encodeURIComponent(query)}` : "/search"
    router.replace(url, { scroll: false })
  }, [query, router])

  return (
    <div className="container mx-auto px-4 py-8 md:p-8 space-y-8">
      <div className="max-w-2xl mx-auto">
        <SearchBar initialQuery={initialQuery} onQueryChange={setQuery} />
      </div>

      <Suspense fallback={<TrackListSkeleton count={5} />}>
        <SearchResults query={query} />
      </Suspense>
    </div>
  )
}
