'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';

type SearchBarProps = {
  initialQuery?: string;
};

export function SearchBar({ initialQuery = '' }: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const debouncedQuery = useDebounce(query, 600);
  const isInitialMount = useRef(true);

  useEffect(() => {
    // This effect should only run on updates, not on the initial mount.
    // The initial render is handled by the server with the correct query.
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (debouncedQuery) {
      // Update the URL with the new query
      const url = `/search?q=${encodeURIComponent(debouncedQuery)}`;
      router.replace(url); // Use replace to avoid polluting history
    } else {
      // If the query is cleared, go to the base search page
      router.replace('/search');
    }
  }, [debouncedQuery, router]);

  useEffect(() => {
    // Sync the input field if the query in the URL changes (e.g., browser back/forward)
    // and it's not the initial mount.
    if (!isInitialMount.current) {
        setQuery(initialQuery);
    }
  }, [initialQuery]);

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
  );
}
