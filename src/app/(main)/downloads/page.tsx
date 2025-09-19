'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Download, Music } from 'lucide-react';
import { TrackItem } from '@/components/music/track-item';
import { usePlayer } from '@/hooks/use-player';
import type { DbDownload } from '@/lib/types';
import { TrackListSkeleton } from '@/components/music/track-list-skeleton';

export default function DownloadsPage() {
  const { playTrack } = usePlayer();
  const downloads = useLiveQuery(() => db.downloads.orderBy('downloadedAt').reverse().toArray());

  const handlePlay = (track: DbDownload) => {
    // We need to convert DbDownload to Track
    const playerTrack = {
      id: track.id,
      title: track.title,
      artist: track.artist,
      duration: track.duration,
      thumbnail: track.thumbnail,
      url: track.originalUrl,
      viewCount: 0, // Not available for downloaded tracks
    };
    if (downloads) {
      const playlist = downloads.map(t => ({
        id: t.id,
        title: t.title,
        artist: t.artist,
        duration: t.duration,
        thumbnail: t.thumbnail,
        url: t.originalUrl,
        viewCount: 0,
      }));
      playTrack(playerTrack, playlist);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 md:p-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 rounded-full bg-primary/10 text-primary">
          <Download className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-headline">Downloads</h1>
          <p className="text-muted-foreground">Music you've saved for offline listening.</p>
        </div>
      </div>
      
      {!downloads && <TrackListSkeleton count={3} />}

      {downloads && downloads.length > 0 && (
        <div className="divide-y divide-border rounded-lg border">
          {downloads.map((track) => (
            <TrackItem key={track.id} track={track} onPlay={() => handlePlay(track)} />
          ))}
        </div>
      )}

      {downloads && downloads.length === 0 && (
        <div className="text-center py-16 text-muted-foreground flex flex-col items-center gap-4 border rounded-lg border-dashed">
          <Music className="w-16 h-16" />
          <h3 className="text-xl font-semibold">No Downloads Yet</h3>
          <p>Click the download icon on a track to save it for offline playback.</p>
        </div>
      )}
    </div>
  );
}
