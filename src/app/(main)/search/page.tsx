import { SearchClientPage } from '@/components/music/search-client-page';
import { TrackListSkeleton } from '@/components/music/track-list-skeleton';
import { Suspense } from 'react';

export default function SearchPage() {
  return (
    <Suspense fallback={<TrackListSkeleton count={5} />}>
      <SearchClientPage />
    </Suspense>
  );
}
