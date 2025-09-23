'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreVertical, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Track, DbPlaylist } from '@/lib/types';
import { placeholderImages } from '@/lib/placeholder-images';
import type { RecommendationPlaylist } from '@/app/(main)/page';
import { TrackActions } from './track-actions';

type TrackCardProps = {
  track: Track;
  playlist: RecommendationPlaylist;
  onPlay: () => void;
};

export function TrackCard({ track, playlist, onPlay }: TrackCardProps) {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const imageUrl = imageError
    ? placeholderImages.find(p => p.id === '1')?.imageUrl || 'https://picsum.photos/seed/1/400/400'
    : track.thumbnail;

  const fullPlaylistObject: DbPlaylist = {
    id: playlist.playlistTitle,
    name: playlist.playlistTitle,
    tracks: playlist.tracks,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return (
    <Card 
      className={cn("bg-secondary border-0 overflow-hidden group h-full flex flex-col", track.url && 'cursor-pointer')} 
      onClick={onPlay}
    >
      <div className="aspect-square relative">
        <Image
          src={imageUrl}
          alt={track.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 50vw, 16.6vw"
          data-ai-hint="album cover"
          onError={handleImageError}
        />
        {track.url && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Play className="w-12 h-12 text-white fill-white" />
          </div>
        )}
        {track.url && (
          <div className="absolute top-1 right-1 z-10 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
            <TrackActions track={track} context={{ type: 'playlist', playlist: fullPlaylistObject }}>
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
      </CardContent>
    </Card>
  );
}
