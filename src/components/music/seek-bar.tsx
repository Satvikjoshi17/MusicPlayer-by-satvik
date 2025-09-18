'use client';

import { Slider } from '@/components/ui/slider';
import { usePlayer } from '@/hooks/use-player';

function formatTime(seconds: number) {
  if (isNaN(seconds)) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function SeekBar() {
  const { progress, duration, seek, isSeeking, setIsSeeking } = usePlayer();

  const handleSeek = (value: number[]) => {
    seek(value[0] / 100);
  };
  
  const handlePointerDown = () => {
    setIsSeeking(true);
  }

  const handlePointerUp = () => {
    setIsSeeking(false);
  }

  const currentProgress = progress * 100;

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-10 text-center">{formatTime(progress * duration)}</span>
      <Slider
        value={[currentProgress]}
        onValueChange={handleSeek}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        max={100}
        step={0.1}
        aria-label="Track progress"
      />
      <span className="text-xs text-muted-foreground w-10 text-center">{formatTime(duration)}</span>
    </div>
  );
}
