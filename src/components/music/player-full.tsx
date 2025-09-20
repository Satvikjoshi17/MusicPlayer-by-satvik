'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { usePlayer } from '@/hooks/use-player';
import { SeekBar } from '@/components/music/seek-bar';
import { PlayerControls } from '@/components/music/player-controls';
import { Button } from '@/components/ui/button';
import { ChevronDown, ListMusic, Volume2, Mic, ListPlus, Plus, Download, Trash2, CheckCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { placeholderImages } from '@/lib/placeholder-images';
import { Slider } from '../ui/slider';
import { useMemo, useState } from 'react';
import type { PlayerContextSource } from '@/context/player-context';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { QueueList } from './queue-list';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from '../ui/dropdown-menu';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import type { DbPlaylist, DbDownload } from '@/lib/types';
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
import { getDownloadUrl } from '@/lib/api';
import axios from 'axios';

function getPlayerSource(source: PlayerContextSource) {
  switch (source.type) {
    case 'playlist':
      return { title: 'Playing from Playlist', name: source.playlist.name };
    case 'search':
      return { title: 'Playing from Search', name: `"${source.query}"` };
    case 'downloads':
      return { title: 'Playing from', name: 'Downloads' };
    case 'recent':
      return { title: 'Playing from', name: 'Recently Played' };
    default:
      return { title: 'Now Playing', name: 'Unknown Source' };
  }
}

export function PlayerFull() {
  const router = useRouter();
  const { currentTrack, volume, setVolume, source, playQueue, playTrack, queue } = usePlayer();
  const { toast } = useToast();
  const playlists = useLiveQuery(() => db.playlists.toArray(), []);
  const downloadedTrack = useLiveQuery(() => currentTrack ? db.downloads.get(currentTrack.id) : undefined, [currentTrack?.id]);
  const isDownloaded = !!downloadedTrack;
  
  const fallbackImage = placeholderImages[0];
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const playerSource = useMemo(() => getPlayerSource(source), [source]);

  const handleSelectTrack = (trackId: string) => {
    const trackToPlay = queue.find(t => t.id === trackId);
    if (trackToPlay) {
      playTrack(trackToPlay, queue, source);
    }
  }

  const handleAddToPlaylist = async (playlist: DbPlaylist) => {
    if (!currentTrack) return;
    if (playlist.tracks.some(t => t.id === currentTrack.id)) {
      toast({
        title: 'Already in Playlist',
        description: `"${currentTrack.title}" is already in "${playlist.name}".`,
      });
      return;
    }

    try {
      const trackToAdd = { ...currentTrack, addedAt: new Date().toISOString() };
      await db.playlists.update(playlist.id, {
        tracks: [...playlist.tracks, trackToAdd],
        updatedAt: new Date().toISOString(),
      });
      toast({
        title: 'Added to Playlist',
        description: `Added "${currentTrack.title}" to "${playlist.name}".`,
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
    if (newPlaylistName.trim() === '' || !currentTrack) return;
    try {
      const newPlaylistId = crypto.randomUUID();
      const trackToAdd = { ...currentTrack, addedAt: new Date().toISOString() };
      await db.playlists.add({
        id: newPlaylistId,
        name: newPlaylistName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tracks: [trackToAdd],
      });
      toast({
        title: 'Playlist Created',
        description: `Created "${newPlaylistName}" and added "${currentTrack.title}".`,
      });
      setNewPlaylistName('');
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Failed to create playlist', error);
    }
  };

  const handleSaveForOffline = async () => {
    if (!currentTrack) return;
    if (isDownloaded) {
        toast({ title: 'Already Saved', description: 'You have already saved this track for offline use.' });
        return;
    }

    toast({ title: 'Saving for Offline', description: `Downloading "${currentTrack.title}"... This may take a moment.` });
    try {
        const downloadUrl = getDownloadUrl(currentTrack.url);
        const response = await axios.get(downloadUrl, { responseType: 'blob' });
        const blob = response.data as Blob;

        await db.downloads.add({
            ...currentTrack,
            blob: blob,
            mimeType: blob.type,
            size: blob.size,
            downloadedAt: new Date().toISOString(),
            originalUrl: currentTrack.url,
        });
        toast({ title: 'Saved for Offline', description: `"${currentTrack.title}" is now available for offline playback.` });
    } catch (error) {
        console.error("Offline save failed:", error);
        toast({ variant: 'destructive', title: 'Offline Save Failed', description: 'Could not save the track for offline use due to a network or CORS issue.' });
    }
  };

  const handleRemoveFromDownloads = async () => {
    if (!currentTrack || !isDownloaded) return;
    try {
        await db.downloads.delete(currentTrack.id);
        toast({ title: 'Removed from Downloads', description: `"${currentTrack.title}" has been removed.` });
    } catch (error) {
        console.error("Failed to remove download", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not remove the download.' });
    }
  };

  return (
    <>
      <div className="relative flex flex-col h-full w-full p-6 md:p-8 justify-between overflow-hidden">
        <div className="absolute inset-0 z-0">
          {currentTrack ? (
            <Image
              src={currentTrack.thumbnail || fallbackImage.imageUrl}
              alt={currentTrack.title}
              fill
              className="object-cover blur-3xl scale-125 opacity-30"
              data-ai-hint="album cover"
            />
          ) : (
            <Skeleton className="w-full h-full"/>
          )}
           <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
        </div>
        
        <header className="relative z-10 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="bg-black/20 hover:bg-black/40"
            aria-label="Close player"
          >
            <ChevronDown className="w-6 h-6" />
          </Button>
          <div className="text-center">
              <p className="text-sm uppercase tracking-widest text-muted-foreground">{playerSource.title}</p>
              <p className="font-semibold text-foreground truncate max-w-[200px]">{playerSource.name}</p>
          </div>
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="bg-black/20 hover:bg-black/40">
                <ListMusic className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Up Next</SheetTitle>
              </SheetHeader>
              <QueueList 
                tracks={playQueue} 
                currentTrackId={currentTrack?.id} 
                onSelectTrack={handleSelectTrack}
              />
            </SheetContent>
          </Sheet>
        </header>
        
        <main className="relative z-10 flex-1 flex flex-col justify-center items-center gap-8 py-8">
          <div className="relative max-w-sm w-full aspect-square shadow-2xl rounded-lg overflow-hidden">
            {currentTrack ? (
              <Image
                src={currentTrack.thumbnail || fallbackImage.imageUrl}
                alt={currentTrack.title}
                fill
                className="object-cover"
                data-ai-hint="album cover"
              />
            ) : (
              <Skeleton className="w-full h-full" />
            )}
          </div>
          
          <div className="text-center w-full px-4">
            {currentTrack ? (
              <>
                <h2 className="text-3xl font-bold font-headline truncate">{currentTrack.title}</h2>
                <p className="text-lg text-muted-foreground mt-1 truncate">{currentTrack.artist}</p>
              </>
            ) : (
              <>
                <Skeleton className="h-8 w-3/4 mx-auto" />
                <Skeleton className="h-6 w-1/2 mx-auto mt-2" />
              </>
            )}
          </div>
        </main>

        <footer className="relative z-10 space-y-8">
          <SeekBar />
          <PlayerControls />
          <div className="flex items-center justify-between gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" disabled={!currentTrack}>
                      <ListPlus className="w-5 h-5 text-muted-foreground"/>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
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
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={!currentTrack}>
                        <Download className="w-5 h-5 text-muted-foreground"/>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
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

               <div className="flex items-center gap-2 flex-1 max-w-xs">
                  <Volume2 className="w-5 h-5 text-muted-foreground"/>
                  <Slider
                      value={[volume * 100]}
                      onValueChange={(value) => setVolume(value[0] / 100)}
                      max={100}
                  />
               </div>
              <Button variant="ghost" size="icon" disabled>
                  <Mic className="w-5 h-5 text-muted-foreground"/>
              </Button>
          </div>
        </footer>
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
