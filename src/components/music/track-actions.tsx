'use client';

import { useState } from 'react';
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
import { Download, MoreVertical, ListPlus, Plus, Trash2, CheckCircle, ListVideo } from 'lucide-react';
import type { DbPlaylist, Track } from '@/lib/types';
import { usePlayer } from '@/hooks/use-player';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
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
import { getDownloadUrl } from '@/lib/api';

type TrackItemContext = 
  | { type: 'search' }
  | { type: 'playlist'; playlistId: string; }
  | { type: 'downloads' }
  | { type: 'recent' };

type TrackActionsProps = {
  track: Track;
  context: TrackItemContext;
  children: React.ReactNode;
};

export function TrackActions({ track, context, children }: TrackActionsProps) {
  const { addToQueue } = usePlayer();
  const { toast } = useToast();
  const playlists = useLiveQuery(() => db.playlists.toArray(), []);
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const downloadedTrack = useLiveQuery(() => db.downloads.get(track.id), [track.id]);
  const isDownloaded = !!downloadedTrack;

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
    toast({ title: 'Preparing Download', description: `Your download for "${track.title}" will begin shortly.` });
    try {
        const downloadUrl = getDownloadUrl(track.url);
        const response = await axios.get(downloadUrl, { responseType: 'blob' });
        const blob = response.data as Blob;
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        // Sanitize title for filename
        const safeTitle = track.title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_');
        a.download = `${safeTitle}.mp3`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        
        toast({ title: 'Download Started', description: `"${track.title}" is downloading.` });
    } catch (error) {
        console.error("Download failed:", error);
        toast({ variant: 'destructive', title: 'Download Failed', description: 'Could not download the track.' });
    }
  };

  const handleSaveForOffline = async () => {
    if (isDownloaded) {
        toast({ title: 'Already Saved', description: 'You have already saved this track for offline use.' });
        return;
    }

    toast({ title: 'Saving for Offline', description: `Downloading "${track.title}"... This may take a moment.` });
    try {
        const downloadUrl = getDownloadUrl(track.url);
        const response = await axios.get(downloadUrl, { responseType: 'blob' });
        const blob = response.data as Blob;

        await db.downloads.add({
            ...track,
            blob: blob,
            mimeType: blob.type,
            size: blob.size,
            downloadedAt: new Date().toISOString(),
            originalUrl: track.url,
        });
        toast({ title: 'Saved for Offline', description: `"${track.title}" is now available for offline playback.` });
    } catch (error) {
        console.error("Offline save failed:", error);
        toast({ variant: 'destructive', title: 'Offline Save Failed', description: 'Could not save the track for offline use due to a network or CORS issue.' });
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
        <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => addToQueue(track)}>
                <ListVideo className="mr-2 h-4 w-4" />
                <span>Add to queue</span>
            </DropdownMenuItem>

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
          
          <DropdownMenuItem onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              <span>Download MP3</span>
          </DropdownMenuItem>

          {isDownloaded ? (
             <DropdownMenuItem onClick={handleRemoveFromDownloads}>
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Remove from offline</span>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={handleSaveForOffline}>
                <CheckCircle className="mr-2 h-4 w-4" />
                <span>Save for offline</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

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
