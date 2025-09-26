
'use client';

import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { placeholderImages } from '@/lib/placeholder-images';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { usePlayer } from '@/hooks/use-player';
import type { Track, DbPlaylist, RecommendationPlaylist, RecentlyPlayedItem } from '@/lib/types';
import { useMemo, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MoreVertical, Music } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TrackActions } from '@/components/music/track-actions';
import { TrackCard } from '@/components/music/track-card';

export default function HomePage() {
  const { playTrack } = usePlayer();
  const [hydrated, setHydrated] = useState(false);

  const recentTracks = useLiveQuery(
    () => db.recent.orderBy('lastPlayedAt').reverse().limit(20).toArray(),
    []
  );

  useEffect(() => {
    setHydrated(true);
  }, []);

  const getFallbackPlaylists = (): RecommendationPlaylist[] => {
    return [{
        playlistTitle: 'Popular Playlists',
        tracks: placeholderImages.slice(0, 6).map(p => ({
            id: p.id,
            title: p.description,
            artist: 'Various Artists',
            duration: 0,
            thumbnail: p.imageUrl,
            url: '',
            viewCount: 0,
        }))
    }];
  };

  const recentlyPlayedItems: RecentlyPlayedItem[] = useMemo(() => {
    if (!recentTracks || recentTracks.length === 0) {
      return placeholderImages.slice(0, 4).map(p => ({...p, isPlaceholder: true}));
    }
    return recentTracks.slice(0, 4).map((track, index) => ({
      id: track.id,
      description: track.title,
      imageUrl: track.thumbnail || placeholderImages[(4 + index) % placeholderImages.length].imageUrl,
      imageHint: "album cover",
      track: track as Track,
      isPlaceholder: false,
    }));
  }, [recentTracks]);

  const handlePlayRecent = (item: { track: Track, isPlaceholder?: boolean }) => {
    if (item.isPlaceholder || !item.track || !recentTracks) return;
    const fullRecentPlaylist = recentTracks.map(t => t as Track);
    playTrack(item.track, fullRecentPlaylist, { type: 'recent' });
  };
  
  const handlePlayRecommendation = (track: Track, playlist: RecommendationPlaylist) => {
    if (!track.url) return;
    const playableTracks = playlist.tracks.filter(t => t.url);
    const fullPlaylistObject: DbPlaylist = {
      id: playlist.playlistTitle,
      name: playlist.playlistTitle,
      tracks: playableTracks,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    playTrack(track, playableTracks, { type: 'playlist', playlist: fullPlaylistObject });
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    if (target.src.includes('picsum.photos')) {
        return;
    }
    const placeholderIndex = (target.alt.length || 0) % placeholderImages.length;
    const newSrc = placeholderImages[placeholderIndex].imageUrl;
    if(target.src !== newSrc) {
        target.src = newSrc;
    }
  };

  if (!hydrated) {
    return (
       <div className="container mx-auto px-4 py-8 md:p-8 space-y-12">
        <header className="text-center md:text-left">
            <Skeleton className="h-12 w-3/4 mx-auto md:mx-0" />
            <Skeleton className="h-6 w-1/2 mt-4 mx-auto md:mx-0" />
        </header>
        <section>
            <div className="flex items-center gap-3 mb-4">
                <Music className="w-8 h-8 text-muted" />
                <Skeleton className="h-8 w-48" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="bg-secondary border-0">
                      <CardContent className="p-0">
                          <Skeleton className="aspect-square w-full" />
                          <div className="p-3">
                              <Skeleton className="h-5 w-3/4 mb-2" />
                              <Skeleton className="h-4 w-1/2" />
                          </div>
                      </CardContent>
                  </Card>
              ))}
            </div>
        </section>
         <section>
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-6 w-20" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({length: 4}).map((_, i) => (
              <Card key={i} className="bg-secondary border-0 overflow-hidden group">
                <CardContent className="p-0">
                  <Skeleton className="aspect-square w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    );
  }

  const displayPlaylists = getFallbackPlaylists();

  return (
    <div className="container mx-auto px-4 py-8 md:p-8 space-y-12">
      <header className="text-center md:text-left">
        <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tighter text-primary">
          Welcome to satvikx
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Stream and enjoy your favorite music.
        </p>
      </header>
      
      <section className="space-y-8">
        {displayPlaylists.map((playlist, playlistIndex) => (
          <div key={playlist.playlistTitle + playlistIndex}>
            <div className="flex items-center gap-3 mb-4">
                <Music className="w-8 h-8 text-primary" />
                <h2 className="text-2xl font-bold font-headline">
                  {playlist.playlistTitle}
                </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {playlist.tracks.map((track) => (
                <TrackCard 
                  key={track.id} 
                  track={track} 
                  playlist={playlist}
                  onPlay={() => handlePlayRecommendation(track, playlist)} 
                  prefetch={false}
                />
              ))}
            </div>
          </div>
        ))}
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold font-headline">Recently Played</h2>
          <Button variant="link" asChild>
            <Link href="/recent" prefetch={false}>See all</Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {recentlyPlayedItems.map((item) => (
            <Card key={item.id} className={cn("bg-secondary border-0 overflow-hidden group", !item.isPlaceholder && "cursor-pointer")} onClick={() => handlePlayRecent(item as any)}>
              <CardContent className="p-0">
                <div className="aspect-square relative">
                  <Image
                    src={item.imageUrl}
                    alt={item.description}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 50vw, 25vw"
                    data-ai-hint={item.imageHint}
                    onError={handleImageError}
                  />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
                   <div className="p-3 absolute bottom-0 left-0 w-full pointer-events-none">
                    <h3 className="font-semibold text-sm truncate text-white">{item.description}</h3>
                  </div>

                   {!item.isPlaceholder && item.track && (
                       <div className="absolute top-1 right-1 z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                          <TrackActions track={item.track} context={{ type: 'recent' }} >
                              <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full text-white bg-black/30 hover:bg-black/50 hover:text-white">
                                  <MoreVertical className="w-4 h-4"/>
                              </Button>
                          </TrackActions>
                       </div>
                    )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
