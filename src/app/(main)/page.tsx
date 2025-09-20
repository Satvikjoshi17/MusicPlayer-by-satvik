'use client';

import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { placeholderImages } from '@/lib/placeholder-images';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { usePlayer } from '@/hooks/use-player';
import type { Track } from '@/lib/types';
import { useMemo, useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { recommendMusic } from '@/ai/flows/recommend-music-flow';
import { searchTracks } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Play } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function HomePage() {
  const { playTrack } = usePlayer();
  const router = useRouter();

  const [recommended, setRecommended] = useState<Track[]>([]);
  const [isRecommendationPending, startRecommendationTransition] = useTransition();

  const recentTracks = useLiveQuery(
    () => db.recent.orderBy('lastPlayedAt').reverse().limit(8).toArray(),
    []
  );

  useEffect(() => {
    if (recentTracks && recentTracks.length > 0) {
      startRecommendationTransition(async () => {
        try {
          const recent = recentTracks.map(t => ({ title: t.title, artist: t.artist }));
          const { recommendations } = await recommendMusic({ recentTracks: recent });

          // Fetch track details for each recommendation
          const recommendationPromises = recommendations.slice(0, 4).map(async (rec) => {
            const searchResults = await searchTracks(`${rec.title} ${rec.artist}`);
            return searchResults.length > 0 ? searchResults[0] : null;
          });

          const fullTracks = (await Promise.all(recommendationPromises)).filter((t): t is Track => t !== null);
          setRecommended(fullTracks);
        } catch (error) {
          console.error("Failed to get recommendations:", error);
          // Fallback to placeholders if AI fails
          setRecommended(placeholderImages.slice(0, 4).map(p => ({
            id: p.id,
            title: p.description,
            artist: 'Various Artists',
            duration: 0,
            thumbnail: p.imageUrl,
            url: '',
            viewCount: 0,
          })));
        }
      });
    } else {
        // Fallback for new users
        setRecommended(placeholderImages.slice(0, 4).map(p => ({
            id: p.id,
            title: p.description,
            artist: 'Various Artists',
            duration: 0,
            thumbnail: p.imageUrl,
            url: '',
            viewCount: 0,
          })));
    }
  }, [recentTracks]);

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
    if (item.isPlaceholder) return;
    
    const playlist = recentlyPlayedItems
        .filter(p => !p.isPlaceholder)
        .map(p => p.track)
        .filter((t): t is Track => !!t);

    playTrack(item.track, playlist, { type: 'recent' });
  };
  
  const handlePlayRecommendation = (track: Track) => {
    if (!track.url) return; // Don't play placeholder fallbacks
    playTrack(track, recommended, { type: 'search', query: 'recommended' });
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

      <section>
        <h2 className="text-2xl font-bold font-headline mb-4">Recommended For You</h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {isRecommendationPending ? (
            Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="bg-secondary border-0">
                    <CardContent className="p-0">
                        <Skeleton className="aspect-square w-full" />
                    </CardContent>
                </Card>
            ))
          ) : (
            recommended.map((track) => (
              <Card key={track.id} className={cn("bg-secondary border-0 overflow-hidden group", track.url && 'cursor-pointer')} onClick={() => handlePlayRecommendation(track)}>
                <CardContent className="p-0">
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
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
                    <div className="p-3 absolute bottom-0 left-0 w-full pointer-events-none">
                     <h3 className="font-semibold text-sm truncate text-foreground">{track.title}</h3>
                     <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                    </div>
                  </div>
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
                   <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                   <div className="p-3 absolute bottom-0 left-0 w-full">
                    <h3 className="font-semibold text-sm truncate text-foreground">{item.description}</h3>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
