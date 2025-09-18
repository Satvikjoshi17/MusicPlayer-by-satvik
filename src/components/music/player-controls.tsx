'use client';

import { Button } from '@/components/ui/button';
import { usePlayer } from '@/hooks/use-player';
import {
  Shuffle,
  SkipBack,
  Play,
  Pause,
  SkipForward,
  Repeat,
  Repeat1,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type PlayerControlsProps = {
  variant?: 'default' | 'compact';
};

export function PlayerControls({ variant = 'default' }: PlayerControlsProps) {
  const { 
    isPlaying, 
    togglePlay, 
    skipNext, 
    skipPrev, 
    isShuffled, 
    toggleShuffle, 
    loopMode, 
    toggleLoopMode 
  } = usePlayer();
  
  const size = variant === 'compact' ? 'w-10 h-10' : 'w-16 h-16';
  const iconSize = variant === 'compact' ? 'w-5 h-5' : 'w-8 h-8';

  return (
    <div className="flex items-center justify-center gap-4">
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'text-muted-foreground hover:text-foreground',
          isShuffled && 'text-primary'
        )}
        onClick={toggleShuffle}
        aria-label={isShuffled ? 'Disable shuffle' : 'Enable shuffle'}
      >
        <Shuffle className="w-5 h-5" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="text-foreground"
        onClick={skipPrev}
        aria-label="Previous track"
      >
        <SkipBack className={cn(iconSize, "fill-current")} />
      </Button>

      <Button
        variant="default"
        className={cn(
          'rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg',
          size
        )}
        onClick={togglePlay}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <Pause className={cn(iconSize, "fill-current")} />
        ) : (
          <Play className={cn(iconSize, "fill-current")} />
        )}
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="text-foreground"
        onClick={skipNext}
        aria-label="Next track"
      >
        <SkipForward className={cn(iconSize, "fill-current")} />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'text-muted-foreground hover:text-foreground',
          loopMode !== 'off' && 'text-primary'
        )}
        onClick={toggleLoopMode}
        aria-label={`Loop mode: ${loopMode}`}
      >
        {loopMode === 'single' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
      </Button>
    </div>
  );
}
