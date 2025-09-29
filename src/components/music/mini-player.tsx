'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePlayer } from '@/hooks/use-player';
import { Pause, Play, SkipForward } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { placeholderImages } from '@/lib/placeholder-images';
import { useIsMobile } from '@/hooks/use-mobile';

export function MiniPlayer() {
  const { 
    currentTrack, 
    isPlaying, 
    togglePlay, 
    progress,
    skipNext,
  } = usePlayer();
  const isMobile = useIsMobile();

  if (!currentTrack) {
    return null;
  }

  const handleTogglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    togglePlay();
  };

  const handleSkipNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    skipNext();
  };
  
  const fallbackImage = placeholderImages[0];

  return (
    <div 
      key={currentTrack.id} // Force re-mount on track change
      className={cn(
        "fixed left-0 right-0 z-50",
        isMobile ? 'bottom-20' : 'bottom-0',
        'md:bottom-auto md:top-auto'
    )}>
      <Link href="/player" className="block" prefetch={false}>
        <div 
          className={cn(
            "h-20 w-full bg-secondary/80 backdrop-blur-lg transition-transform duration-300",
            "md:h-20 md:fixed md:bottom-4 md:left-1/2 md:-translate-x-1/2 md:w-[95%] md:max-w-4xl md:rounded-lg md:border",
            "border-t md:border-border"
          )}
        >
          <div className="w-full h-full p-2 md:p-3 flex items-center gap-3">
            <div className="relative aspect-square h-full overflow-hidden rounded-md">
              <Image
                src={currentTrack.thumbnail || fallbackImage.imageUrl}
                alt={currentTrack.title}
                fill
                className="object-cover"
                data-ai-hint="album cover"
              />
            </div>

            <div className="flex-1 overflow-hidden">
              <p className="font-semibold truncate text-foreground">{currentTrack.title}</p>
              <p className="text-sm text-muted-foreground truncate">{currentTrack.artist}</p>
            </div>

            <div className="flex items-center gap-3 pr-2">
              <button
                onClick={handleTogglePlay}
                className="p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
              </button>
              <button
                onClick={handleSkipNext}
                className="p-2 rounded-full hover:bg-white/10 transition-colors hidden md:block"
                aria-label="Next track"
              >
                <SkipForward className="w-5 h-5 fill-current" />
              </button>
            </div>
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 h-1 md:h-0.5">
            <Slider
              value={[progress * 100]}
              max={100}
              className="w-full h-1 p-0 group [&_span]:hidden [&_.relative]:h-1 [&_div:last-child]:h-1"
            />
          </div>
        </div>
      </Link>
    </div>
  );
}
