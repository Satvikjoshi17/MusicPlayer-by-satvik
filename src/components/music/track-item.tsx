'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Download, MoreVertical, Play, Pause } from 'lucide-react';
import type { Track } from '@/lib/types';
import { usePlayer } from '@/hooks/use-player';
import { cn } from '@/lib/utils';
import { placeholderImages } from '@/lib/placeholder-images';

type TrackItemProps = {
  track: Track;
  onPlay: (track: Track) => void;
};

function formatDuration(seconds: number) {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function TrackItem({ track, onPlay }: TrackItemProps) {
  const { currentTrack, isPlaying } = usePlayer();
  const isActive = currentTrack?.id === track.id;
  const isCurrentlyPlaying = isActive && isPlaying;
  const fallbackImage = placeholderImages[0];

  return (
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
      <div className="hidden md:block text-sm text-muted-foreground">
        {formatDuration(track.duration)}
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
          <Download className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
          <MoreVertical className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
