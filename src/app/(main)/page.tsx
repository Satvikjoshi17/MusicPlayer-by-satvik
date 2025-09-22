'use client';

import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { placeholderImages } from '@/lib/placeholder-images';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { usePlayer } from '@/hooks/use-player';
import type { Track } from '@/lib/types';
import { useMemo, useEffect, useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { recommendMusic } from '@/ai/flows/recommend-music-flow';
import { Skeleton } from '@/components/ui/skeleton';
import { MoreVertical, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TrackActions } from '@/components/music/track-actions';

export default function HomePage() {
  const { playTrack } = usePlayer();
  const router = useRouter();

  const [recommended, setRecommended] = useState<Track[]>([]);
  const [isRecommendationPending, startRecommendationTransition] = useTransition();
  const recentTracksHistorySize = useRef(0);

  const recentTracks = useLiveQuery(
    () => db.recent.orderBy('lastPlayedAt').reverse().limit(8).toArray(),
    []
  );

  useEffect(() => {
    // Only fetch new recommendations if the number of recent tracks has changed significantly.
    // This prevents the recommendations from changing on every single song play.
    if (recentTracks && recentTracks.length > recentTracksHistorySize.current) {
      recentTracksHistorySize.current = recentTracks.length;
      startRecommendationTransition(async () => {
        try {
          const recent = recentTracks.map(t => ({ title: t.title, artist: t.artist }));
          const { recommendations } = await recommendMusic({ recentTracks: recent });
          
          const fullTracks: Track[] = recommendations.slice(0, 4).map((rec, index) => {
            let thumbnail = `https://i.ytimg.com/vi/${new URL(rec.url).searchParams.get('v')}/hqdefault.jpg`;
            // If the AI returns a placeholder URL, use the picsum photo
            if (rec.url.includes('dQw4w9WgXcQ')) {
              thumbnail = placeholderImages[index].imageUrl;
            }

            return {
              id: rec.url,
              title: rec.title,
              artist: rec.artist,
              duration: rec.duration,
              thumbnail: thumbnail,
              url: rec.url.includes('dQw4w9WgXcQ') ? '' : rec.url,
              viewCount: 0,
              reason: rec.reason,
            };
          });

          setRecommended(fullTracks);
        } catch (error) {
          console.error("Failed to get recommendations:", error);
           const fallbackTracks = placeholderImages.slice(0, 4).map(p => ({
            id: p.id,
            title: p.description,
            artist: 'Various Artists',
            duration: 0,
            thumbnail: p.imageUrl,
            url: '',
            viewCount: 0,
          }));
          setRecommended(fallbackTracks);
        }
      });
    } else if (recentTracks && recentTracks.length === 0 && recommended.length === 0) {
        startRecommendationTransition(() => {
            const fallbackTracks = placeholderImages.slice(0, 4).map(p => ({
                id: p.id,
                title: p.description,
                artist: 'Various Artists',
                duration: 0,
                thumbnail: p.imageUrl,
                url: '',
                viewCount: 0,
              }));
              setRecommended(fallbackTracks);
        });
    }
  }, [recentTracks, recommended.length]);

  const recentlyPlayedItems = useMemo(() => {
    if (!recentTracks || recentTracks.length === 0) {
      return placeholderImages.slice(4, 8).map(p => ({...p, isPlaceholder: true}));
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
    if (item.isPlaceholder || !item.track) return;
    
    const playlist = recentlyPlayedItems
        .filter(p => !p.isPlaceholder)
        .map(p => p.track)
        .filter((t): t is Track => !!t);

    playTrack(item.track, playlist, { type: 'recent' });
  };
  
  const handlePlayRecommendation = (track: Track) => {
    if (!track.url) return; // Don't play placeholder fallbacks
    playTrack(track, recommended.filter(t => t.url), { type: 'search', query: 'recommended' });
  };

  return (
    <div className="container mx-auto px-4 py-8 md:p-8 space-y-12">
      <header className="text-center md:text-left">
        <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tighter text-primary">
          Welcome to Satvik Beats
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Stream and enjoy your favorite music.
        </p>
      </header>

      <section>
        <h2 className="text-2xl font-bold font-headline mb-4">Recommended For You</h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {isRecommendationPending || recommended.length === 0 ? (
            Array.from({ length: 4 }).map((_, i) => (
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
            recommended.map((track) => (
              <Card key={track.id} className={cn("bg-secondary border-0 overflow-hidden group h-full flex flex-col", track.url && 'cursor-pointer')} onClick={() => handlePlayRecommendation(track)}>
                <div className="aspect-square relative">
                  <Image
                    src={track.thumbnail || placeholderImages[0].imageUrl}
                    alt={track.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    data-ai-hint="album cover"
                  />
                  {track.url && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-12 h-12 text-white fill-white" />
                      </div>
                  )}
                  {track.url && (
                     <div className="absolute top-1 right-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        <TrackActions track={track} context={{ type: 'search' }} >
                            <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full text-white bg-black/30 hover:bg-black/50 hover:text-white">
                                <MoreVertical className="w-4 h-4"/>
                            </Button>
                        </TrackActions>
                     </div>
                  )}
                </div>
                <CardContent className="p-3 flex-1 flex flex-col">
                   <h3 className="font-semibold text-sm truncate text-foreground">{track.title}</h3>
                   <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                   {track.reason && (
                      <p className="text-xs text-muted-foreground/80 italic mt-2 truncate">
                          &ldquo;{track.reason}&rdquo;
                      </p>
                   )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold font-headline">Recently Played</h2>
          <Button variant="link" asChild>
            <Link href="/recent">See all</Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {recentlyPlayedItems.map((item) => (
            <Card key={item.id} className={cn("bg-secondary border-0 overflow-hidden group", !item.isPlaceholder && "cursor-pointer")} onClick={() => handlePlayRecent(item as any)}>
              <CardContent className="p-0">
                <div className="aspect-square relative">
                  <Image
                    src={item.imageUrl}
                    alt={item.description}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    data-ai-hint={item.imageHint}
                  />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
                   <div className="p-3 absolute bottom-0 left-0 w-full pointer-events-none">
                    <h3 className="font-semibold text-sm truncate text-foreground">{item.description}</h3>
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
