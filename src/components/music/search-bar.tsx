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
    // If we are on the search page and the query is cleared, go back home
    if (pathname === '/search' && !debouncedQuery) {
      router.push('/');
      return;
    }
    
    // Only navigate to search page if there is a query
    if (debouncedQuery) {
      const url = `/search?q=${encodeURIComponent(debouncedQuery)}`;
      router.push(url);
    }
  }, [debouncedQuery, router, pathname]);

  useEffect(() => {
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
      />
    </div>
  );
}
