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

const RECOMMENDATION_REFRESH_THRESHOLD = 5; // Changed to 5 as requested
const MAX_PLAYLISTS = 3;
const LOCALSTORAGE_KEY = 'musicRecommendations';


export type RecommendationPlaylist = {
  playlistTitle: string;
  tracks: Track[];
};

// Robust function to extract YouTube video ID from various URL formats
function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  let videoId = null;
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === 'youtu.be') {
      videoId = urlObj.pathname.slice(1);
    } else if (urlObj.hostname.includes('youtube.com')) {
      videoId = urlObj.searchParams.get('v');
    }
  } catch (e) {
    // Regex fallback for non-URL strings or malformed URLs
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    if (match) videoId = match[1];
  }
  return videoId;
}


export default function HomePage() {
  const { playTrack } = usePlayer();

  const [recommendations, setRecommendations] = useState<RecommendationPlaylist[]>(() => {
    // Load recommendations from localStorage on initial client-side render
    if (typeof window === 'undefined') {
      return [];
    }
    try {
      const saved = window.localStorage.getItem(LOCALSTORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error("Failed to parse recommendations from localStorage", error);
      return [];
    }
  });
  
  const [isRecommendationPending, startRecommendationTransition] = useTransition();
  const lastRecTrackIds = useRef<Set<string>>(new Set());

  const recentTracks = useLiveQuery(
    () => db.recent.orderBy('lastPlayedAt').reverse().limit(20).toArray(),
    []
  );

  // Effect to save recommendations to localStorage whenever they change
  useEffect(() => {
    if(typeof window !== 'undefined'){
        try {
            window.localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(recommendations));
        } catch (error) {
            console.error("Failed to save recommendations to localStorage", error);
        }
    }
  }, [recommendations]);
  
  useEffect(() => {
    if (recentTracks === undefined) return; // Still loading from DB

    const currentTrackIds = new Set(recentTracks.map(t => t.id));
    const shouldFetchInitial = recommendations.length === 0 && currentTrackIds.size > 0 && !isRecommendationPending;

    const newPlayedTrackIds = new Set([...currentTrackIds].filter(id => !lastRecTrackIds.current.has(id)));
    const hasPlayedEnoughNewTracks = newPlayedTrackIds.size >= RECOMMENDATION_REFRESH_THRESHOLD;

    if (shouldFetchInitial || hasPlayedEnoughNewTracks) {
      lastRecTrackIds.current = currentTrackIds;
      
      startRecommendationTransition(async () => {
        try {
          const recent = recentTracks.map(t => ({ title: t.title, artist: t.artist }));
          if (recent.length === 0 && recommendations.length > 0) return;

          const { playlistTitle, recommendations: newTracks } = await recommendMusic({ recentTracks: recent.slice(0, 10) });
          
          const fullTracks: Track[] = newTracks.slice(0, 6).map((rec) => {
            let thumbnail = placeholderImages[0].imageUrl;
            const videoId = getYouTubeVideoId(rec.url);
            if (videoId) {
              thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
            } else {
               console.error("Could not extract Video ID from AI URL:", rec.url);
            }

            return {
              id: rec.url,
              title: rec.title,
              artist: rec.artist,
              duration: rec.duration,
              thumbnail: thumbnail,
              url: rec.url,
              viewCount: 0,
            };
          });

          const newPlaylist: RecommendationPlaylist = { playlistTitle, tracks: fullTracks };
          
          setRecommendations(prev => {
              const updatedPlaylists = [...prev, newPlaylist];
              return updatedPlaylists.slice(-MAX_PLAYLISTS);
          });

        } catch (error) {
          console.error("Failed to get recommendations:", error);
          if (recommendations.length === 0) {
             setRecommendations([{
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
            }]);
          }
        }
      });
    } else if (recommendations.length === 0 && recentTracks.length === 0) {
        if (recommendations.length === 0) { 
            setRecommendations([{
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
            }]);
        }
    }
  }, [recentTracks, isRecommendationPending, recommendations]);

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
        {(isRecommendationPending && recommendations.length === 0) ? (
            <div>
              <div className="flex items-center gap-3 mb-4">
                  <Music className="w-8 h-8 text-primary" />
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
            </div>
        ) : (
          recommendations.slice().reverse().map((playlist, playlistIndex) => (
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
                  />
                ))}
              </div>
            </div>
          ))
        )}
         {isRecommendationPending && recommendations.length > 0 && (
            <div className="text-center text-muted-foreground py-8 flex items-center justify-center gap-2">
                <div role="status">
                    <svg aria-hidden="true" className="w-6 h-6 text-primary animate-spin" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                        <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0492C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                    </svg>
                    <span className="sr-only">Loading...</span>
                </div>
                <p>Curating new music for you...</p>
            </div>
          )}
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
                       <div className="absolute top-1 right-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
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
