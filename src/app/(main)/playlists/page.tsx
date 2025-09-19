'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Music, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

export default function PlaylistsPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const playlists = useLiveQuery(() => db.playlists.toArray());

  const handleCreatePlaylist = async () => {
    if (newPlaylistName.trim() === '') return;
    try {
      await db.playlists.add({
        id: crypto.randomUUID(),
        name: newPlaylistName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tracks: [],
      });
      setNewPlaylistName('');
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Failed to create playlist', error);
      // You could show a toast here
    }
  };

  return (
    <>
      <div className="container mx-auto px-4 py-8 md:p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
             <div className="p-3 rounded-full bg-primary/10 text-primary">
                <Music className="w-8 h-8" />
            </div>
            <div>
                <h1 className="text-3xl font-bold font-headline">Playlists</h1>
                <p className="text-muted-foreground">Your curated collections of music.</p>
            </div>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" /> Create Playlist
          </Button>
        </div>

        {playlists && playlists.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {playlists.map((playlist) => (
              <Card key={playlist.id} className="bg-secondary border-0 group cursor-pointer">
                 <CardContent className="p-4 flex flex-col items-start justify-end h-32">
                    <h3 className="font-semibold text-base truncate text-foreground">{playlist.name}</h3>
                    <p className="text-sm text-muted-foreground">{playlist.tracks.length} tracks</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground flex flex-col items-center gap-4 border rounded-lg border-dashed">
            <Music className="w-16 h-16" />
            <h3 className="text-xl font-semibold">No Playlists Yet</h3>
            <p>Click "Create Playlist" to start your first collection.</p>
          </div>
        )}
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Playlist</DialogTitle>
            <DialogDescription>
              Give your new playlist a name. You can add songs later.
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
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
