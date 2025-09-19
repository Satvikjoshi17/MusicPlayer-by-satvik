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
import { db } from '@/lib/db';

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
  isLoading: boolean;
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
  const [isLoading, setIsLoading] = useState(false);

  const addTrackToRecents = async (track: Track) => {
    try {
      await db.recent.put({
        ...track,
        lastPlayedAt: new Date().toISOString(),
        position: 0,
      });
    } catch (error) {
      console.error("Failed to add to recents:", error);
    }
  };
  
  const playTrack = useCallback(async (track: Track, playlist: Track[] = []) => {
    if (audioRef.current) {
      setIsLoading(true);
      setIsPlaying(false);
      setCurrentTrack(track);
      
      const newQueue = playlist.length > 0 ? playlist : [track];
      setQueue(newQueue);
      if (isShuffled) {
        const shuffled = [...newQueue].sort(() => Math.random() - 0.5);
        setShuffledQueue(shuffled);
      }

      addTrackToRecents(track);
      
      try {
        const { streamUrl } = await getStreamUrl(track.url);
        audioRef.current.src = streamUrl;
        await audioRef.current.play();
      } catch (error) {
        console.error('Failed to get stream URL', error);
        toast({
          variant: "destructive",
          title: "Playback Error",
          description: "Could not stream the selected track.",
        });
        setCurrentTrack(null);
        setIsLoading(false);
      }
    }
  }, [toast, isShuffled]);
  
  const togglePlay = useCallback(() => {
    if (audioRef.current && currentTrack) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
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
    if (loopMode === 'single' && currentTrack && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
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
        if (loopMode === 'queue') {
            prevIndex = activeQueue.length - 1; // Loop to end
        } else {
            audioRef.current.currentTime = 0;
            return;
        }
    }
    playTrack(activeQueue[prevIndex], queue);
  }, [currentTrack, queue, isShuffled, shuffledQueue, playTrack, loopMode]);
  
  const seek = (newProgress: number) => {
    if (audioRef.current && isFinite(duration)) {
      audioRef.current.currentTime = duration * newProgress;
    }
  };

  const toggleShuffle = () => {
    const newState = !isShuffled;
    setIsShuffled(newState);
    if (newState) {
        const shuffled = [...queue].sort(() => Math.random() - 0.5);
        setShuffledQueue(shuffled);
    }
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
        if (currentTrack && audio.currentTime > 0) {
            db.recent.update(currentTrack.id, { position: audio.currentTime }).catch(() => {});
        }
      }
    };
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    }
    const handlePlay = () => {
      setIsPlaying(true);
      setIsLoading(false);
    }
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleTrackEnd);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('playing', handleCanPlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleTrackEnd);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('playing', handleCanPlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [handleTrackEnd, isSeeking, currentTrack]);

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
    isLoading,
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
