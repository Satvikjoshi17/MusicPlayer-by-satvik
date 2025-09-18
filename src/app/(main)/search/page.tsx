'use client';

import { useState, useEffect, useMemo, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { searchTracks } from '@/lib/api';
import type { Track } from '@/lib/types';
import { SearchBar } from '@/components/music/search-bar';
import { TrackItem } from '@/components/music/track-item';
import { TrackListSkeleton } from '@/components/music/track-list-skeleton';
import { Button } from '@/components/ui/button';
import { usePlayer } from '@/hooks/use-player';
import { Music, ServerCrash } from 'lucide-react';

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [results, setResults] = useState<Track[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const { playTrack } = usePlayer();

  const debouncedQuery = useMemo(() => {
    return query;
  }, [query]);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      setError(null);
      return;
    }

    startTransition(async () => {
      setError(null);
      try {
        const searchResults = await searchTracks(debouncedQuery);
        setResults(searchResults);
      } catch (e) {
        console.error(e);
        setError('Failed to fetch search results. The server might be down.');
      }
    });
  }, [debouncedQuery]);

  const handlePlay = (track: Track) => {
    playTrack(track, results);
  };

  return (
    <div className="container mx-auto px-4 py-8 md:p-8 space-y-8">
      <div className="max-w-2xl mx-auto">
        <SearchBar initialQuery={query} />
      </div>

      <div className="space-y-4">
        {isPending && <TrackListSkeleton count={5} />}
        
        {!isPending && error && (
          <div className="text-center py-16 text-muted-foreground flex flex-col items-center gap-4">
            <ServerCrash className="w-16 h-16 text-destructive" />
            <h3 className="text-xl font-semibold">An Error Occurred</h3>
            <p>{error}</p>
          </div>
        )}

        {!isPending && !error && debouncedQuery && results.length === 0 && (
          <div className="text-center py-16 text-muted-foreground flex flex-col items-center gap-4">
            <Music className="w-16 h-16" />
            <h3 className="text-xl font-semibold">No results found for "{debouncedQuery}"</h3>
            <p>Try a different search term.</p>
          </div>
        )}

        {!isPending && results.length > 0 && (
          <div className="divide-y divide-border rounded-lg border">
            {results.map((track) => (
              <TrackItem key={track.id} track={track} onPlay={() => handlePlay(track)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
