
'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { useRouter, useParams } from 'next/navigation';
import { db } from '@/lib/db';
import { TrackItem } from '@/components/music/track-item';
import { TrackListSkeleton } from '@/components/music/track-list-skeleton';
import { usePlayer } from '@/hooks/use-player';
import type { PlaylistTrack, Track, DbPlaylist } from '@/lib/types';
import { Music, Trash2, ChevronLeft, Play, Shuffle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function PlaylistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string;
  const { playTrack, toggleShuffle: togglePlayerShuffle, isShuffled } = usePlayer();

  const playlist = useLiveQuery(() => db.playlists.get(id), [id]);

  const handlePlay = (track: PlaylistTrack) => {
    if (playlist) {
      playTrack(track, playlist.tracks, { type: 'playlist', playlist });
    }
  };

  const handlePlayAll = () => {
    if (playlist && playlist.tracks.length > 0) {
      if (isShuffled) togglePlayerShuffle(); // Turn off shuffle if it's on
      playTrack(playlist.tracks[0], playlist.tracks, { type: 'playlist', playlist });
    }
  };

  const handleShufflePlay = () => {
    if (playlist && playlist.tracks.length > 0) {
      if (!isShuffled) togglePlayerShuffle(); // Turn on shuffle if it's off
      const shuffledTracks = [...playlist.tracks].sort(() => Math.random() - 0.5);
      playTrack(shuffledTracks[0], shuffledTracks, { type: 'playlist', playlist });
    }
  };

  const handleDeletePlaylist = async () => {
    if (!playlist) return;
    try {
      await db.playlists.delete(playlist.id);
      toast({
        title: 'Playlist Deleted',
        description: `"${playlist.name}" has been deleted.`,
      });
      router.push('/playlists');
    } catch (error) {
      console.error('Failed to delete playlist', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete the playlist.',
      });
    }
  };


  return (
    <div className="container mx-auto px-4 py-8 md:p-8">
      {playlist ? (
        <>
          <div className="flex items-center justify-between gap-4 mb-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ChevronLeft className="h-6 w-6" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the "{playlist.name}" playlist. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeletePlaylist}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="flex flex-col items-center md:items-start text-center md:text-left gap-4 mb-8">
            <div className="p-3 rounded-full bg-primary/10 text-primary">
                <Music className="w-12 h-12" />
            </div>
            <div>
                <h1 className="text-4xl font-bold font-headline">{playlist.name}</h1>
                <p className="text-muted-foreground">{playlist.tracks.length} tracks</p>
            </div>
            <div className="flex items-center gap-4 mt-4">
              <Button onClick={handlePlayAll} disabled={playlist.tracks.length === 0} size="lg">
                <Play className="mr-2 h-5 w-5 fill-current" />
                Play All
              </Button>
              <Button onClick={handleShufflePlay} disabled={playlist.tracks.length === 0} variant="secondary" size="lg">
                <Shuffle className="mr-2 h-5 w-5" />
                Shuffle
              </Button>
            </div>
          </div>
          
          {playlist.tracks.length > 0 ? (
            <div className="divide-y divide-border rounded-lg border">
              {playlist.tracks.map((track) => (
                <TrackItem key={track.id} track={track} onPlay={() => handlePlay(track)} context={{ type: 'playlist', playlist: playlist as DbPlaylist }} />
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
