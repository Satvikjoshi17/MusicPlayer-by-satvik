
'use client';

import { useState, useEffect, useRef } from "react"
import { searchTracks } from "@/lib/api"
import type { Track } from "@/lib/types"
import { TrackItem } from "@/components/music/track-item"
import { TrackListSkeleton } from "@/components/music/track-list-skeleton"
import { usePlayer } from "@/hooks/use-player"
import { Music, ServerCrash } from "lucide-react"
import { preloadStream } from "@/lib/stream-cache";

type SearchResultsProps = {
  query: string;
};

export function SearchResults({ query }: SearchResultsProps) {
  const [results, setResults] = useState<Track[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  const { playTrack } = usePlayer()

  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (!query) {
      setResults([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    const newAbortController = new AbortController();
    abortControllerRef.current = newAbortController;
    
    const fetchResults = async () => {
      setIsLoading(true);
      setResults([]); // Clear previous results to ensure skeleton shows
      setError(null);
      try {
        const searchResults = await searchTracks(
          query,
          newAbortController.signal
        );
        if (!newAbortController.signal.aborted) {
          setResults(searchResults);
          // Preload first two search results
          if (searchResults.length > 0) preloadStream(searchResults[0].url);
          if (searchResults.length > 1) preloadStream(searchResults[1].url);
        }
      } catch (e: any) {
        if (e.name !== "AbortError" && !newAbortController.signal.aborted) {
          console.error(e);
          setResults([]);
          setError(
              e.message || "Failed to fetch search results. The server might be down."
          );
        }
      } finally {
        if (!newAbortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    // Debounce the fetch
    const timeoutId = setTimeout(fetchResults, 300);

    return () => {
      clearTimeout(timeoutId);
      newAbortController.abort();
    };
  }, [query]);

  const handlePlay = (track: Track) => {
    playTrack(track, results, { type: "search", query });
  };

  if (isLoading) {
    return <TrackListSkeleton count={5} />;
  }

  if (error) {
    return (
      <div className="text-center py-16 text-muted-foreground flex flex-col items-center gap-4">
        <ServerCrash className="w-16 h-16 text-destructive" />
        <h3 className="text-xl font-semibold">An Error Occurred</h3>
        <p>{error}</p>
      </div>
    );
  }
  
  if (!isLoading && query && results.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground flex flex-col items-center gap-4">
        <Music className="w-16 h-16" />
        <h3 className="text-xl font-semibold">
          No results found for "{query}"
        </h3>
        <p>Try a different search term.</p>
      </div>
    );
  }

  if (results.length > 0) {
    return (
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
    );
  }

  return (
    <div className="text-center py-16 text-muted-foreground">
        <Music className="w-16 h-16 mx-auto mb-4" />
        <h3 className="text-xl font-semibold">Search for Music</h3>
        <p>Find your favorite songs, artists, and albums.</p>
    </div>
  );
}
