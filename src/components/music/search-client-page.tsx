"use client"

import { useSearchParams } from "next/navigation"
import { SearchBar } from "@/components/music/search-bar"
import { SearchResults } from "./search-results"

export function SearchClientPage() {
  const searchParams = useSearchParams()
  const query = searchParams.get("q") || ""

  return (
    <>
      <div className="max-w-2xl mx-auto">
        <SearchBar initialQuery={query} />
      </div>
      <SearchResults query={query} />
    </>
  )
}
