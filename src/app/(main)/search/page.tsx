
import { SearchClientPage } from '@/components/music/search-client-page';
import { Suspense } from 'react';
import { TrackListSkeleton } from '@/components/music/track-list-skeleton';

export default function SearchPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:p-8 space-y-8">
      <Suspense fallback={<TrackListSkeleton count={5} />}>
        <SearchClientPage />
      </Suspense>
    </div>
  );
}
