'use client';

import { 
  createContext, 
  useState, 
  useRef, 
  useEffect, 
  useCallback,
  type ReactNode 
} from 'react';
import { getStreamUrl, getDownloadUrl } from '@/lib/api';
import type { Track, DbPlaylist, DbDownload } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/db';
import axios from 'axios';

export type LoopMode = 'off' | 'queue' | 'single';

export type PlayerContextSource = 
    | { type: 'playlist', playlist: DbPlaylist }
    | { type: 'search', query: string }
    | { type: 'downloads' }
    | { type: 'recent' }
    | { type: 'unknown' };

type PlayerContextType = {
  audioRef: React.RefObject<HTMLAudioElement>;
  currentTrack: Track | null;
  queue: Track[];
  source: PlayerContextSource;
  isPlaying: boolean;
  duration: number;
  progress: number;
  volume: number;
  isShuffled: boolean;
  loopMode: LoopMode;
  isSeeking: boolean;
  isLoading: boolean;
  playTrack: (track: Track, playlist?: Track[], source?: PlayerContextSource) => void;
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
  const currentBlobUrl = useRef<string | null>(null);
  const { toast } = useToast();

  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [source, setSource] = useState<PlayerContextSource>({ type: 'unknown' });
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
  
  const playTrack = useCallback((track: Track, playlist: Track[] = [], sourceInfo: PlayerContextSource = { type: 'unknown' }) => {
    if (!audioRef.current) return;
  
    const playAudio = async () => {
      setIsLoading(true);
      audioRef.current!.pause();
  
      if (currentBlobUrl.current) {
          URL.revokeObjectURL(currentBlobUrl.current);
          currentBlobUrl.current = null;
      }
  
      // Determine if this is a new context or playing from the same queue
      const isNewContext = JSON.stringify(source) !== JSON.stringify(sourceInfo) || playlist.map(t => t.id).join() !== queue.map(t => t.id).join();
  
      setCurrentTrack(track);
      setSource(sourceInfo);
      
      if (isNewContext) {
        const newQueue = playlist.length > 0 ? playlist : [track];
        setQueue(newQueue);
        if (isShuffled) {
          const shuffled = [...newQueue].sort(() => Math.random() - 0.5);
          // Place the current track at the beginning of the shuffled queue
          const currentIndex = shuffled.findIndex(t => t.id === track.id);
          if (currentIndex > -1) { // Ensure track is in the shuffled list
            const [current] = shuffled.splice(currentIndex, 1);
            shuffled.unshift(current);
          }
          setShuffledQueue(shuffled);
        } else {
          // If not shuffled, ensure the queue is in the correct order for playback
          setShuffledQueue([]); 
        }
      } else {
        // If same context, just update the current track
        // The queue remains the same.
      }
  
      addTrackToRecents(track);
      
      try {
          let finalStreamUrl: string;
          const downloadedTrack = await db.downloads.get(track.id) as DbDownload | undefined;
  
          if (downloadedTrack?.blob) {
              finalStreamUrl = URL.createObjectURL(downloadedTrack.blob);
              currentBlobUrl.current = finalStreamUrl;
          } else {
              const { streamUrl } = await getStreamUrl(track.url);
              finalStreamUrl = streamUrl;
          }
          
          audioRef.current!.src = finalStreamUrl;
          await audioRef.current!.play();
  
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
    };
  
    playAudio();
  }, [toast, isShuffled, queue, source]);
  
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
        return;
      }
    }
    playTrack(activeQueue[nextIndex], queue, source);
  }, [currentTrack, queue, isShuffled, shuffledQueue, loopMode, playTrack, source]);

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
            prevIndex = activeQueue.length - 1;
        } else {
            if (audioRef.current) audioRef.current.currentTime = 0;
            return;
        }
    }
    playTrack(activeQueue[prevIndex], queue, source);
  }, [currentTrack, queue, isShuffled, shuffledQueue, playTrack, loopMode, source]);
  
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
        if (currentTrack) {
          // Keep the current track at the top of the new shuffled queue
          const currentIndex = shuffled.findIndex(t => t.id === currentTrack.id);
          if (currentIndex > 0) {
            const [current] = shuffled.splice(currentIndex, 1);
            shuffled.unshift(current);
          }
        }
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

  // MediaSession API integration
  useEffect(() => {
    if ('mediaSession' in navigator) {
      if (currentTrack) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: currentTrack.title,
          artist: currentTrack.artist,
          album: 'satvikx',
          artwork: [
            { src: currentTrack.thumbnail, sizes: '96x96', type: 'image/jpeg' },
            { src: currentTrack.thumbnail, sizes: '128x128', type: 'image/jpeg' },
            { src: currentTrack.thumbnail, sizes: '192x192', type: 'image/jpeg' },
            { src: currentTrack.thumbnail, sizes: '256x256', type: 'image/jpeg' },
            { src: currentTrack.thumbnail, sizes: '384x384', type: 'image/jpeg' },
            { src: currentTrack.thumbnail, sizes: '512x512', type: 'image/jpeg' },
          ],
        });
        
        navigator.mediaSession.setActionHandler('play', togglePlay);
        navigator.mediaSession.setActionHandler('pause', togglePlay);
        navigator.mediaSession.setActionHandler('previoustrack', skipPrev);
        navigator.mediaSession.setActionHandler('nexttrack', skipNext);
      }
    }
  }, [currentTrack, togglePlay, skipPrev, skipNext]);
  
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updatePositionState = () => {
      if ('mediaSession' in navigator && isFinite(audio.duration)) {
        navigator.mediaSession.setPositionState({
          duration: audio.duration,
          playbackRate: audio.playbackRate,
          position: audio.currentTime,
        });
      }
    };

    const handleTimeUpdate = () => {
      if (!isSeeking && isFinite(audio.duration) && audio.duration > 0) {
        setProgress(audio.currentTime / audio.duration);
        if (currentTrack && audio.currentTime > 0) {
            db.recent.update(currentTrack.id, { position: audio.currentTime }).catch(() => {});
        }
      }
      updatePositionState();
    };
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
      updatePositionState();
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

  // Clean up blob URL on unmount
  useEffect(() => {
    return () => {
      if (currentBlobUrl.current) {
        URL.revokeObjectURL(currentBlobUrl.current);
      }
    };
  }, []);
  
  const value = {
    audioRef,
    currentTrack,
    queue,
    source,
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
