'use client';

import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Download, MoreVertical, Play, Pause, ListPlus, Plus, Trash2, CheckCircle } from 'lucide-react';
import type { DbPlaylist, Track } from '@/lib/types';
import { usePlayer } from '@/hooks/use-player';
import { cn } from '@/lib/utils';
import { placeholderImages } from '@/lib/placeholder-images';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '../ui/input';
import axios from 'axios';
import { getStreamUrl } from '@/lib/api';

type TrackItemContext = 
  | { type: 'search' }
  | { type: 'playlist'; playlistId: string; }
  | { type: 'downloads' };

type TrackItemProps = {
  track: Track;
  onPlay: (track: Track) => void;
  context: TrackItemContext;
};


function formatDuration(seconds: number) {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function TrackItem({ track, onPlay, context }: TrackItemProps) {
  const { currentTrack, isPlaying } = usePlayer();
  const { toast } = useToast();
  const playlists = useLiveQuery(() => db.playlists.toArray(), []);
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const downloadedTrack = useLiveQuery(() => db.downloads.get(track.id), [track.id]);
  const isDownloaded = !!downloadedTrack;

  const isActive = currentTrack?.id === track.id;
  const isCurrentlyPlaying = isActive && isPlaying;
  const fallbackImage = placeholderImages[0];

  const handleAddToPlaylist = async (playlist: DbPlaylist) => {
    if (playlist.tracks.some(t => t.id === track.id)) {
      toast({
        title: 'Already in Playlist',
        description: `"${track.title}" is already in "${playlist.name}".`,
      });
      return;
    }

    try {
      const trackToAdd = { ...track, addedAt: new Date().toISOString() };
      await db.playlists.update(playlist.id, {
        tracks: [...playlist.tracks, trackToAdd],
        updatedAt: new Date().toISOString(),
      });
      toast({
        title: 'Added to Playlist',
        description: `Added "${track.title}" to "${playlist.name}".`,
      });
    } catch (error) {
      console.error('Failed to add to playlist', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add track to playlist.',
      });
    }
  };
  
  const handleCreatePlaylist = async () => {
    if (newPlaylistName.trim() === '') return;
    try {
      const newPlaylistId = crypto.randomUUID();
      const trackToAdd = { ...track, addedAt: new Date().toISOString() };
      await db.playlists.add({
        id: newPlaylistId,
        name: newPlaylistName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tracks: [trackToAdd],
      });
      toast({
        title: 'Playlist Created',
        description: `Created "${newPlaylistName}" and added "${track.title}".`,
      });
      setNewPlaylistName('');
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Failed to create playlist', error);
    }
  };

  const handleRemoveFromPlaylist = async () => {
    if (context.type !== 'playlist') return;
    try {
        const playlist = await db.playlists.get(context.playlistId);
        if (!playlist) return;

        const updatedTracks = playlist.tracks.filter(t => t.id !== track.id);
        await db.playlists.update(context.playlistId, {
            tracks: updatedTracks,
            updatedAt: new Date().toISOString(),
        });

        toast({
            title: 'Track Removed',
            description: `Removed "${track.title}" from "${playlist.name}".`,
        });
    } catch (error) {
        console.error('Failed to remove track from playlist', error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not remove track.' });
    }
  };

  const handleDownload = async () => {
    if (isDownloaded) {
        toast({ title: 'Already Downloaded', description: 'You have already saved this track.' });
        return;
    }

    toast({ title: 'Starting Download', description: `Downloading "${track.title}"...` });
    try {
        const { streamUrl } = await getStreamUrl(track.url);
        const response = await axios.get(streamUrl, { responseType: 'blob' });
        const blob = response.data as Blob;

        await db.downloads.add({
            ...track,
            blob: blob,
            mimeType: blob.type,
            size: blob.size,
            downloadedAt: new Date().toISOString(),
            originalUrl: track.url,
        });
        toast({ title: 'Download Complete', description: `"${track.title}" is saved for offline playback.` });
    } catch (error) {
        console.error("Download failed:", error);
        toast({ variant: 'destructive', title: 'Download Failed', description: 'Could not download the track.' });
    }
  };

  const handleRemoveFromDownloads = async () => {
    if (!isDownloaded) return;
    try {
        await db.downloads.delete(track.id);
        toast({ title: 'Removed from Downloads', description: `"${track.title}" has been removed.` });
    } catch (error) {
        console.error("Failed to remove download", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not remove the download.' });
    }
  };

  return (
    <>
      <div
        className={cn(
          'group flex items-center p-3 gap-4 hover:bg-secondary/50 transition-colors',
          isActive && 'bg-secondary'
        )}
      >
        <div className="relative w-12 h-12 flex-shrink-0">
          <Image
            src={track.thumbnail || fallbackImage.imageUrl}
            alt={track.title}
            width={48}
            height={48}
            className="rounded-md object-cover"
            data-ai-hint="song artwork"
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute inset-0 w-full h-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-md text-white"
            onClick={() => onPlay(track)}
          >
            {isCurrentlyPlaying ? (
              <Pause className="w-6 h-6 fill-white" />
            ) : (
              <Play className="w-6 h-6 fill-white" />
            )}
          </Button>
        </div>
        <div className="flex-1 overflow-hidden">
          <p className={cn("font-semibold truncate", isActive && 'text-primary')}>{track.title}</p>
          <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
        </div>
        <div className="text-sm text-muted-foreground">
          {formatDuration(track.duration)}
        </div>
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {context.type === 'playlist' && (
                <DropdownMenuItem onClick={handleRemoveFromPlaylist}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Remove from playlist</span>
                </DropdownMenuItem>
              )}

              {context.type !== 'playlist' && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <ListPlus className="mr-2 h-4 w-4" />
                    <span>Add to playlist</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem onClick={() => setShowCreateDialog(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        <span>New playlist</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {playlists?.map((playlist) => (
                        <DropdownMenuItem key={playlist.id} onClick={() => handleAddToPlaylist(playlist)}>
                          <span>{playlist.name}</span>
                        </DropdownMenuItem>
                      ))}
                      {playlists?.length === 0 && (
                        <DropdownMenuItem disabled>No playlists yet</DropdownMenuItem>
                      )}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
              )}
              
              <DropdownMenuSeparator />
              
              {isDownloaded ? (
                 <DropdownMenuItem onClick={handleRemoveFromDownloads}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Remove from downloads</span>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={handleDownload}>
                    <Download className="mr-2 h-4 w-4" />
                    <span>Download</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Playlist</DialogTitle>
            <DialogDescription>
              Give your new playlist a name.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="e.g. Morning Jams, Workout Mix"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreatePlaylist()}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button onClick={handleCreatePlaylist} disabled={!newPlaylistName.trim()}>
              Create and Add Song
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
