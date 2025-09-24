"use client"

import { useSearchParams } from "next/navigation"
import { SearchBar } from "@/components/music/search-bar"
import { SearchResults } from "./search-results"

export function SearchClientPage() {
  const searchParams = useSearchParams()
  const query = searchParams.get("q") || ""

  return (
    <>
      <form className="max-w-2xl mx-auto" action="/search" method="GET">
        <SearchBar initialQuery={query} />
        {/* No submit button needed, hitting Enter in the input will submit the form */}
      </form>
      <SearchResults query={query} />
    </>
  )
}
