
'use client';

import { useState, useEffect, useTransition, useRef } from "react"
import { searchTracks } from "@/lib/api"
import type { Track } from "@/lib/types"
import { TrackItem } from "@/components/music/track-item"
import { TrackListSkeleton } from "@/components/music/track-list-skeleton"
import { usePlayer } from "@/hooks/use-player"
import { Music, ServerCrash } from "lucide-react"

type SearchResultsProps = {
  query: string;
};

export function SearchResults({ query }: SearchResultsProps) {
  const [results, setResults] = useState<Track[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const abortControllerRef = useRef<AbortController | null>(null)

  const { playTrack } = usePlayer()

  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    if (query.length < 1) {
      setResults([])
      setError(null)
      return
    }

    const newAbortController = new AbortController()
    abortControllerRef.current = newAbortController

    const fetchResults = async () => {
      startTransition(async () => {
        try {
          const searchResults = await searchTracks(
            query,
            newAbortController.signal
          )
          if (!newAbortController.signal.aborted) {
            setError(null);
            setResults(searchResults);
          }
        } catch (e: any) {
          if (e.name !== "AbortError" && !newAbortController.signal.aborted) {
            console.error(e)
            setError(
              e.message || "Failed to fetch search results. The server might be down."
            )
            setResults([]);
          }
        }
      });
    }

    fetchResults()

    return () => {
      newAbortController.abort()
    }
  }, [query])

  const handlePlay = (track: Track) => {
    playTrack(track, results, { type: "search", query })
  }

  if (isPending && results.length === 0) {
    return <TrackListSkeleton count={5} />;
  }

  return (
    <div className="space-y-4">
        {error && (
          <div className="text-center py-16 text-muted-foreground flex flex-col items-center gap-4">
            <ServerCrash className="w-16 h-16 text-destructive" />
            <h3 className="text-xl font-semibold">An Error Occurred</h3>
            <p>{error}</p>
          </div>
        )}

        {!error && query && results.length === 0 && !isPending && (
          <div className="text-center py-16 text-muted-foreground flex flex-col items-center gap-4">
            <Music className="w-16 h-16" />
            <h3 className="text-xl font-semibold">
              No results found for "{query}"
            </h3>
            <p>Try a different search term.</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="divide-y divide-border rounded-lg border">
            {results.map((track) => (
              <TrackItem
                key={track.id}
                track={track}
                onPlay={() => handlePlay(track)}
                context={{ type: "search" }}
              />
            ))}
          </div>
        )}
      </div>
  )
}
