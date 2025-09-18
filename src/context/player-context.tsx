'use client';

import { 
  createContext, 
  useState, 
  useRef, 
  useEffect, 
  useCallback,
  type ReactNode 
} from 'react';
import { getStreamUrl } from '@/lib/api';
import type { Track } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export type LoopMode = 'off' | 'queue' | 'single';

type PlayerContextType = {
  audioRef: React.RefObject<HTMLAudioElement>;
  currentTrack: Track | null;
  queue: Track[];
  isPlaying: boolean;
  duration: number;
  progress: number;
  volume: number;
  isShuffled: boolean;
  loopMode: LoopMode;
  isSeeking: boolean;
  playTrack: (track: Track, playlist?: Track[]) => void;
  togglePlay: () => void;
  seek: (progress: number) => void;
  skipNext: () => void;
  skipPrev: () => void;
  setVolume: (volume: number) => void;
  toggleShuffle: () => void;
  toggleLoopMode: () => void;
  setIsSeeking: (isSeeking: boolean) => void;
};

export const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [shuffledQueue, setShuffledQueue] = useState<Track[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isShuffled, setIsShuffled] = useState(false);
  const [loopMode, setLoopMode] = useState<LoopMode>('off');
  const [isSeeking, setIsSeeking] = useState(false);
  
  const playTrack = useCallback(async (track: Track, playlist: Track[] = []) => {
    if (audioRef.current) {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTrack(track);
      setQueue(playlist.length > 0 ? playlist : [track]);
      
      try {
        const { streamUrl } = await getStreamUrl(track.url);
        audioRef.current.src = streamUrl;
        audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('Failed to get stream URL', error);
        toast({
          variant: "destructive",
          title: "Playback Error",
          description: "Could not stream the selected track.",
        });
        setIsPlaying(false);
      }
    }
  }, [toast]);
  
  const togglePlay = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        if (currentTrack) audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying, currentTrack]);
  
  const skipNext = useCallback(() => {
    if (!currentTrack) return;
    const activeQueue = isShuffled ? shuffledQueue : queue;
    const currentIndex = activeQueue.findIndex(t => t.id === currentTrack.id);
    let nextIndex = currentIndex + 1;
    if (nextIndex >= activeQueue.length) {
      if (loopMode === 'queue') {
        nextIndex = 0;
      } else {
        setIsPlaying(false);
        return; // End of queue
      }
    }
    playTrack(activeQueue[nextIndex], queue);
  }, [currentTrack, queue, isShuffled, shuffledQueue, loopMode, playTrack]);

  const handleTrackEnd = useCallback(() => {
    if (loopMode === 'single' && currentTrack) {
        if(audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play();
        }
    } else {
      skipNext();
    }
  }, [loopMode, skipNext, currentTrack]);
  
  const skipPrev = useCallback(() => {
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }
    if (!currentTrack) return;
    const activeQueue = isShuffled ? shuffledQueue : queue;
    const currentIndex = activeQueue.findIndex(t => t.id === currentTrack.id);
    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) {
      prevIndex = activeQueue.length - 1; // Loop to end
    }
    playTrack(activeQueue[prevIndex], queue);
  }, [currentTrack, queue, isShuffled, shuffledQueue, playTrack]);
  
  const seek = (newProgress: number) => {
    if (audioRef.current && isFinite(duration)) {
      audioRef.current.currentTime = duration * newProgress;
      setProgress(newProgress);
    }
  };

  const toggleShuffle = () => {
    setIsShuffled(prev => {
        const newState = !prev;
        if (newState) {
            const shuffled = [...queue].sort(() => Math.random() - 0.5);
            setShuffledQueue(shuffled);
        }
        return newState;
    });
  };

  const toggleLoopMode = () => {
    setLoopMode(prev => {
        if (prev === 'off') return 'queue';
        if (prev === 'queue') return 'single';
        return 'off';
    });
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (!isSeeking && isFinite(audio.duration)) {
        setProgress(audio.currentTime / audio.duration);
      }
    };
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleTrackEnd);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleTrackEnd);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [handleTrackEnd, isSeeking]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);
  
  const value = {
    audioRef,
    currentTrack,
    queue,
    isPlaying,
    duration,
    progress,
    volume,
    isShuffled,
    loopMode,
    isSeeking,
    playTrack,
    togglePlay,
    seek,
    skipNext,
    skipPrev,
    setVolume,
    toggleShuffle,
    toggleLoopMode,
    setIsSeeking,
  };

  return (
    <PlayerContext.Provider value={value}>
      <audio ref={audioRef} />
      {children}
    </PlayerContext.Provider>
  );
}
