"use client"

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

type SearchBarProps = {
  initialQuery?: string
}

export function SearchBar({
  initialQuery = "",
}: SearchBarProps) {

  // This component is now an "uncontrolled component".
  // It uses defaultValue to set the initial text, but after that,
  // the browser's DOM manages the input's state. This is simpler
  // and avoids all the useEffect/useState complexity that was
  // causing the router initialization race condition.

  return (
    <div className="relative w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
      <Input
        type="search"
        name="q" // Use name attribute for form submission
        placeholder="Search for songs, artists, albums..."
        className="w-full pl-10 pr-4 py-3 h-12 text-base bg-secondary border-0 focus-visible:ring-primary focus-visible:ring-2"
        defaultValue={initialQuery}
        autoFocus
      />
    </div>
  )
}
