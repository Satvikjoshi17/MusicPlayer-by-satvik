
'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { History, Music } from 'lucide-react';
import { TrackItem } from '@/components/music/track-item';
import { usePlayer } from '@/hooks/use-player';
import type { DbRecent, Track } from '@/lib/types';
import { TrackListSkeleton } from '@/components/music/track-list-skeleton';

export default function RecentPage() {
  const { playTrack } = usePlayer();
  const recentTracks = useLiveQuery(() => db.recent.orderBy('lastPlayedAt').reverse().toArray());

  const handlePlay = (track: DbRecent) => {
    // We need to convert DbRecent to Track
    const playerTrack: Track = {
      id: track.id,
      title: track.title,
      artist: track.artist,
      duration: track.duration,
      thumbnail: track.thumbnail,
      url: track.url,
      viewCount: track.viewCount,
    };
    if (recentTracks) {
      const playlist = recentTracks.map(t => ({
        id: t.id,
        title: t.title,
        artist: t.artist,
        duration: t.duration,
        thumbnail: t.thumbnail,
        url: t.url,
        viewCount: t.viewCount,
      }));
      playTrack(playerTrack, playlist, { type: 'recent' });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 md:p-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 rounded-full bg-primary/10 text-primary">
          <History className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-headline">Recently Played</h1>
          <p className="text-muted-foreground">Your listening history.</p>
        </div>
      </div>
      
      {!recentTracks && <TrackListSkeleton count={5} />}

      {recentTracks && recentTracks.length > 0 && (
        <div className="divide-y divide-border rounded-lg border">
          {recentTracks.map((track) => (
            <TrackItem key={track.id} track={track} onPlay={() => handlePlay(track)} context={{ type: 'recent' }} />
          ))}
        </div>
      )}

      {recentTracks && recentTracks.length === 0 && (
        <div className="text-center py-16 text-muted-foreground flex flex-col items-center gap-4 border rounded-lg border-dashed">
          <Music className="w-16 h-16" />
          <h3 className="text-xl font-semibold">No Recent Activity</h3>
          <p>Play some songs to see your history here.</p>
        </div>
      )}
    </div>
  );
}
