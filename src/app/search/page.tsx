
'use client';

import { Suspense } from 'react';
import { SearchClientPage } from '@/components/music/search-client-page';
import { TrackListSkeleton } from '@/components/music/track-list-skeleton';

// This is the server-side entry point for the search page.
// It uses Suspense to handle the client-side nature of search parameters.
export default function SearchPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:p-8 space-y-8">
      <Suspense fallback={<TrackListSkeleton count={5} />}>
        <SearchClientPage />
      </Suspense>
    </div>
  );
}
