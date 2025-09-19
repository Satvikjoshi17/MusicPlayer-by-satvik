import { Suspense } from 'react';
import { SearchClientPage } from '@/components/music/search-client-page';
import { TrackListSkeleton } from '@/components/music/track-list-skeleton';

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchPageSkeleton />}>
      <SearchClientPage />
    </Suspense>
  );
}

function SearchPageSkeleton() {
    return (
        <div className="container mx-auto px-4 py-8 md:p-8 space-y-8">
            <div className="max-w-2xl mx-auto">
                <div className="h-12 w-full bg-secondary rounded-md" />
            </div>
            <TrackListSkeleton count={5} />
        </div>
    )
}
