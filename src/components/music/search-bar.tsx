'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';

type SearchBarProps = {
  initialQuery?: string;
};

export function SearchBar({ initialQuery = '' }: SearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState(initialQuery);
  const debouncedQuery = useDebounce(query, 400);

  useEffect(() => {
    if (pathname === '/search') {
      if (debouncedQuery === '' && query === '') {
        // If on search page and query is cleared, go home
        router.push('/');
      } else {
        // Otherwise, update the URL with the new query
        const url = `/search?q=${encodeURIComponent(debouncedQuery)}`;
        router.replace(url); // Use replace to avoid polluting history
      }
    } else if (debouncedQuery) {
      // If on another page (like home) and user types, go to search page
      const url = `/search?q=${encodeURIComponent(debouncedQuery)}`;
      router.push(url);
    }
  }, [debouncedQuery, router, pathname, query]);

  useEffect(() => {
    // Sync the input field if the query in the URL changes (e.g., browser back/forward)
    setQuery(initialQuery);
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
