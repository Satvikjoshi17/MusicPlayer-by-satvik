'use client';

import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { placeholderImages } from '@/lib/placeholder-images';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { usePlayer } from '@/hooks/use-player';
import type { Track, DbPlaylist } from '@/lib/types';
import { useMemo, useEffect, useState, useTransition, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { recommendMusic } from '@/ai/flows/recommend-music-flow';
import { Skeleton } from '@/components/ui/skeleton';
import { MoreVertical, Music } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TrackActions } from '@/components/music/track-actions';
import { TrackCard } from '@/components/music/track-card';

const RECOMMENDATION_REFRESH_THRESHOLD = 5;
const MAX_PLAYLISTS = 3;
const LOCALSTORAGE_KEY = 'musicRecommendations';


export type RecommendationPlaylist = {
  playlistTitle: string;
  tracks: Track[];
};

export default function HomePage() {
  const { playTrack } = usePlayer();

  const [recommendations, setRecommendations] = useState<RecommendationPlaylist[]>([]);
  
  const [isRecommendationPending, startRecommendationTransition] = useTransition();
  const lastRecTrackIds = useRef<Set<string>>(new Set());
  const hasInitialized = useRef(false);

  const recentTracks = useLiveQuery(
    () => db.recent.orderBy('lastPlayedAt').reverse().limit(20).toArray(),
    []
  );

  // Load from localStorage on client-side mount
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(LOCALSTORAGE_KEY);
      if (saved) {
        setRecommendations(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Failed to parse recommendations from localStorage", error);
    }
  }, []);

  // Effect to save recommendations to localStorage whenever they change
  useEffect(() => {
    try {
        window.localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(recommendations));
    } catch (error) {
        console.error("Failed to save recommendations to localStorage", error);
    }
  }, [recommendations]);
  
  // Effect to fetch new recommendations based on listening history
  useEffect(() => {
    if (recentTracks === undefined) return; // Still loading from DB

    const currentTrackIds = new Set(recentTracks.map(t => t.id));

    if (!hasInitialized.current) {
        hasInitialized.current = true;
        lastRecTrackIds.current = currentTrackIds;
        // If we have recommendations already, sync the lastRecTrackIds to prevent immediate refetch
        if (recommendations.length > 0) {
            lastRecTrackIds.current = new Set([...lastRecTrackIds.current, ...recommendations.flatMap(p => p.tracks.map(t => t.id))]);
        }
    }
    
    const shouldFetchInitial = recommendations.length === 0 && currentTrackIds.size > 0;
    const newPlayedTrackIds = new Set([...currentTrackIds].filter(id => !lastRecTrackIds.current.has(id)));
    const hasPlayedEnoughNewTracks = newPlayedTrackIds.size >= RECOMMENDATION_REFRESH_THRESHOLD;
    
    if ((shouldFetchInitial || hasPlayedEnoughNewTracks) && !isRecommendationPending) {
      lastRecTrackIds.current = currentTrackIds;
      
      startRecommendationTransition(async () => {
        try {
          const recent = recentTracks.map(t => ({ title: t.title, artist: t.artist }));
          
          // Don't fetch if a new user has no history yet.
          if (recent.length === 0) return;

          // Optimistically add a skeleton UI
          const tempId = `skeleton-${Date.now()}`;
          const skeletonPlaylist: RecommendationPlaylist = {
            playlistTitle: 'Curating new music...',
            tracks: Array.from({ length: 6 }).map((_, i) => ({
              id: `${tempId}-${i}`,
              title: 'Loading...',
              artist: '...',
              duration: 0,
              thumbnail: '',
              url: '',
              viewCount: 0,
            })),
          };
          setRecommendations(prev => [...prev.slice(-MAX_PLAYLISTS + 1), skeletonPlaylist]);

          const { playlistTitle, recommendations: newTracks } = await recommendMusic({ recentTracks: recent.slice(0, 10) });
          
          // Only update if the AI returned valid tracks.
          if (newTracks.length > 0) {
            const newPlaylist: RecommendationPlaylist = { playlistTitle, tracks: newTracks };
            
            setRecommendations(prev => {
                // Replace the skeleton playlist with the real one
                const updatedPlaylists = prev.map(p => p.tracks[0]?.id.startsWith('skeleton-') ? newPlaylist : p);
                if (!updatedPlaylists.some(p => p.playlistTitle === newPlaylist.playlistTitle)) {
                  // This case handles if the skeleton wasn't there for some reason
                  updatedPlaylists.push(newPlaylist);
                }
                return updatedPlaylists.slice(-MAX_PLAYLISTS);
            });
          } else {
            console.warn("Received 0 valid recommendations from the AI. Not updating playlist.");
            // Remove the skeleton if no tracks are found
            setRecommendations(prev => prev.filter(p => !p.tracks[0]?.id.startsWith('skeleton-')));
          }

        } catch (error) {
          console.error("Failed to get recommendations:", error);
           // Remove skeleton and show placeholder if it was the first fetch
           setRecommendations(prev => {
              const withoutSkeleton = prev.filter(p => !p.tracks[0]?.id.startsWith('skeleton-'));
              if (withoutSkeleton.length === 0) {
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
              }
              return withoutSkeleton;
           });
        }
      });
    }
  }, [recentTracks, isRecommendationPending, recommendations.length]);

  const recentlyPlayedItems = useMemo(() => {
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
        {recommendations.slice().reverse().map((playlist, playlistIndex) => (
          <div key={playlist.playlistTitle + playlistIndex}>
            <div className="flex items-center gap-3 mb-4">
                <Music className="w-8 h-8 text-primary" />
                <h2 className="text-2xl font-bold font-headline">
                  {playlist.playlistTitle}
                </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {playlist.tracks[0]?.id.startsWith('skeleton-') ? (
                Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="bg-secondary border-0">
                        <CardContent className="p-0">
                            <Skeleton className="aspect-square w-full" />
                            <div className="p-3">
                                <Skeleton className="h-5 w-3/4 mb-2" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                        </CardContent>
                    </Card>
                ))
              ) : (
                playlist.tracks.map((track) => (
                  <TrackCard 
                    key={track.id} 
                    track={track} 
                    playlist={playlist}
                    onPlay={() => handlePlayRecommendation(track, playlist)} 
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold font-headline">Recently Played</h2>
          <Button variant="link" asChild>
            <Link href="/recent">See all</Link>
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
