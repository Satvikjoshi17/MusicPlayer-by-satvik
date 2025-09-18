'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { usePlayer } from '@/hooks/use-player';
import { SeekBar } from '@/components/music/seek-bar';
import { PlayerControls } from '@/components/music/player-controls';
import { Button } from '@/components/ui/button';
import { ChevronDown, ListMusic, Volume2, Mic, Music2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { placeholderImages } from '@/lib/placeholder-images';
import { Slider } from '../ui/slider';

export function PlayerFull() {
  const router = useRouter();
  const { currentTrack, isPlaying, volume, setVolume } = usePlayer();
  const fallbackImage = placeholderImages[0];

  return (
    <div className="relative flex flex-col h-full w-full p-6 md:p-8 justify-between">
      <div className="absolute inset-0 z-0">
        {currentTrack ? (
          <Image
            src={currentTrack.thumbnail || fallbackImage.imageUrl}
            alt={currentTrack.title}
            fill
            className="object-cover blur-3xl scale-125 opacity-30"
            data-ai-hint="album cover"
          />
        ) : (
          <Skeleton className="w-full h-full"/>
        )}
         <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
      </div>
      
      <header className="relative z-10 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="bg-black/20 hover:bg-black/40"
          aria-label="Close player"
        >
          <ChevronDown className="w-6 h-6" />
        </Button>
        <div className="text-center">
            <p className="text-sm uppercase tracking-widest text-muted-foreground">Playing from</p>
            <p className="font-semibold text-foreground">Search Results</p>
        </div>
        <Button variant="ghost" size="icon" className="bg-black/20 hover:bg-black/40">
          <ListMusic className="w-6 h-6" />
        </Button>
      </header>
      
      <main className="relative z-10 flex-1 flex flex-col justify-center items-center gap-8 py-8">
        <div className="relative w-full max-w-sm aspect-square shadow-2xl rounded-lg overflow-hidden">
          {currentTrack ? (
            <Image
              src={currentTrack.thumbnail || fallbackImage.imageUrl}
              alt={currentTrack.title}
              fill
              className="object-cover"
              data-ai-hint="album cover"
            />
          ) : (
            <Skeleton className="w-full h-full" />
          )}
        </div>
        
        <div className="text-center w-full px-4">
          {currentTrack ? (
            <>
              <h2 className="text-3xl font-bold font-headline truncate">{currentTrack.title}</h2>
              <p className="text-lg text-muted-foreground mt-1 truncate">{currentTrack.artist}</p>
            </>
          ) : (
            <>
              <Skeleton className="h-8 w-3/4 mx-auto" />
              <Skeleton className="h-6 w-1/2 mx-auto mt-2" />
            </>
          )}
        </div>
      </main>

      <footer className="relative z-10 space-y-8">
        <SeekBar />
        <PlayerControls />
        <div className="flex items-center justify-between gap-4">
            <Button variant="ghost" size="icon" disabled>
                <Music2 className="w-5 h-5 text-muted-foreground"/>
            </Button>
             <div className="flex items-center gap-2 flex-1 max-w-xs">
                <Volume2 className="w-5 h-5 text-muted-foreground"/>
                <Slider
                    value={[volume * 100]}
                    onValueChange={(value) => setVolume(value[0] / 100)}
                    max={100}
                />
             </div>
            <Button variant="ghost" size="icon" disabled>
                <Mic className="w-5 h-5 text-muted-foreground"/>
            </Button>
        </div>
      </footer>
    </div>
  );
}
