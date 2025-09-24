"use client"

import { useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { SearchBar } from "@/components/music/search-bar"
import { SearchResults } from "./search-results"

export function SearchClientPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialQuery = searchParams.get("q") || ""
  
  const handleQueryChange = (newQuery: string) => {
    const url = newQuery ? `/search?q=${encodeURIComponent(newQuery)}` : "/search"
    // We use router.replace to avoid adding to the browser history
    router.replace(url, { scroll: false })
  }

  return (
    <>
      <div className="max-w-2xl mx-auto">
        <SearchBar initialQuery={initialQuery} onQueryChange={handleQueryChange} />
      </div>
      <SearchResults query={initialQuery} />
    </>
  )
}
