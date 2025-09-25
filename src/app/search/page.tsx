
import { SearchBar } from '@/components/music/search-bar';
import { SearchResults } from '@/components/music/search-results';
import { Suspense } from 'react';
import { TrackListSkeleton } from '@/components/music/track-list-skeleton';

type SearchPageProps = {
  searchParams: {
    q?: string;
  };
};

export default function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q || '';

  return (
    <div className="container mx-auto px-4 py-8 md:p-8 space-y-8">
      <form className="max-w-2xl mx-auto" action="/search" method="GET">
        <SearchBar initialQuery={query} />
      </form>
      <Suspense fallback={<TrackListSkeleton count={5} />}>
        <SearchResults query={query} />
      </Suspense>
    </div>
  );
}
