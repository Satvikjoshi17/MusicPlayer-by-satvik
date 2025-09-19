'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { useParams } from 'next/navigation';
import { db } from '@/lib/db';
import { TrackItem } from '@/components/music/track-item';
import { TrackListSkeleton } from '@/components/music/track-list-skeleton';
import { usePlayer } from '@/hooks/use-player';
import type { PlaylistTrack, Track } from '@/lib/types';
import { Music } from 'lucide-react';

export default function PlaylistDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { playTrack } = usePlayer();

  const playlist = useLiveQuery(() => db.playlists.get(id), [id]);

  const handlePlay = (track: PlaylistTrack) => {
    if (playlist) {
      playTrack(track, playlist.tracks);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 md:p-8">
      {playlist ? (
        <>
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 rounded-full bg-primary/10 text-primary">
              <Music className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold font-headline">{playlist.name}</h1>
              <p className="text-muted-foreground">{playlist.tracks.length} tracks</p>
            </div>
          </div>
          
          {playlist.tracks.length > 0 ? (
            <div className="divide-y divide-border rounded-lg border">
              {playlist.tracks.map((track) => (
                <TrackItem key={track.id} track={track} onPlay={() => handlePlay(track)} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground flex flex-col items-center gap-4 border rounded-lg border-dashed">
                <Music className="w-16 h-16" />
                <h3 className="text-xl font-semibold">Playlist is Empty</h3>
                <p>Search for songs and add them to this playlist.</p>
            </div>
          )}
        </>
      ) : (
        <>
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 rounded-full bg-muted">
                    <Music className="w-8 h-8" />
                </div>
                <div>
                    <div className="h-8 bg-muted rounded w-48 mb-2 animate-pulse" />
                    <div className="h-5 bg-muted rounded w-24 animate-pulse" />
                </div>
            </div>
            <TrackListSkeleton count={5} />
        </>
      )}
    </div>
  );
}