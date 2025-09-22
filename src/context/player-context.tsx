'use client';

import {
  createContext,
  useState,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { getStreamUrl } from '@/lib/api';
import type { Track, DbPlaylist, DbDownload } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/db';

export type LoopMode = 'off' | 'queue' | 'single';

export type PlayerContextSource =
  | { type: 'playlist'; playlist: DbPlaylist }
  | { type: 'search'; query: string }
  | { type: 'downloads' }
  | { type: 'recent' }
  | { type: 'unknown' };

type PlayerContextType = {
  audioRef: React.RefObject<HTMLAudioElement>;
  currentTrack: Track | null;
  queue: Track[]; // The original full playlist/context
  playQueue: Track[]; // The queue of tracks to be played (current + up next)
  source: PlayerContextSource;
  isPlaying: boolean;
  duration: number;
  progress: number;
  volume: number;
  isShuffled: boolean;
  loopMode: LoopMode;
  isSeeking: boolean;
  isLoading: boolean;
  playTrack: (track: Track, newQueue?: Track[], sourceInfo?: PlayerContextSource) => void;
  addToQueue: (track: Track) => void;
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

export function PlayerProvider({ children, audioRef }: { children: ReactNode, audioRef: React.RefObject<HTMLAudioElement> }) {
  const currentBlobUrl = useRef<string | null>(null);
  const { toast } = useToast();

  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [playQueue, setPlayQueue] = useState<Track[]>([]);
  const [shuffledPlayQueue, setShuffledPlayQueue] = useState<Track[]>([]);
  const [source, setSource] = useState<PlayerContextSource>({ type: 'unknown' });

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
  
  const playTrack = useCallback((track: Track, newQueue: Track[] = [], sourceInfo: PlayerContextSource = { type: 'unknown' }) => {
    const isNewContext = JSON.stringify(source) !== JSON.stringify(sourceInfo) || newQueue.map(t => t.id).join() !== queue.map(t => t.id).join();
    
    let targetQueue: Track[];
    if (isNewContext) {
      targetQueue = newQueue.length > 0 ? newQueue : [track];
      setQueue(targetQueue);
      setSource(sourceInfo);
    } else {
      targetQueue = queue;
    }

    const trackIndex = targetQueue.findIndex(t => t.id === track.id);
    const newPlayQueue = trackIndex !== -1 ? targetQueue.slice(trackIndex) : [track];
    setPlayQueue(newPlayQueue);

    if (isShuffled) {
      const upcomingTracks = newPlayQueue.filter(t => t.id !== track.id);
      const shuffled = [...upcomingTracks].sort(() => Math.random() - 0.5);
      shuffled.unshift(track);
      setShuffledPlayQueue(shuffled);
    } else {
      setShuffledPlayQueue([]);
    }

    setCurrentTrack(track);
    addTrackToRecents(track);
  }, [queue, source, isShuffled]);

  const skipNext = useCallback(() => {
    const activeQueue = isShuffled ? shuffledPlayQueue : playQueue;
    const currentIndex = activeQueue.findIndex(t => t.id === currentTrack?.id);
    
    let nextTrack: Track | undefined;

    if (currentIndex !== -1 && currentIndex < activeQueue.length - 1) {
      nextTrack = activeQueue[currentIndex + 1];
    } else if (loopMode === 'queue' && queue.length > 0) {
      if (isShuffled) {
          const shuffledOriginalQueue = [...queue].sort(() => Math.random() - 0.5);
          nextTrack = shuffledOriginalQueue[0];
          playTrack(nextTrack, shuffledOriginalQueue, source);
          return;
      } else {
          nextTrack = queue[0];
      }
    }
    
    if (nextTrack) {
       playTrack(nextTrack, queue, source);
    } else {
       setIsPlaying(false);
       if(audioRef.current) {
          audioRef.current.currentTime = duration;
          setProgress(1);
       }
    }
  }, [isShuffled, shuffledPlayQueue, playQueue, loopMode, queue, playTrack, source, duration, audioRef, currentTrack]);

  const skipPrev = useCallback(() => {
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }
    
    // Find previous track in the original (non-shuffled) queue to maintain listening history logic
    const currentIndexInOriginal = queue.findIndex(t => t.id === currentTrack?.id);

    let prevTrack: Track | undefined;
    if (currentIndexInOriginal > 0) {
        prevTrack = queue[currentIndexInOriginal - 1];
    } else if (loopMode === 'queue' && queue.length > 0) {
        prevTrack = queue[queue.length - 1];
    }
    
    if (prevTrack) {
        playTrack(prevTrack, queue, source);
    } else {
        if (audioRef.current) audioRef.current.currentTime = 0;
    }
  }, [currentTrack, queue, playTrack, loopMode, source, audioRef]);
  
  const handleTrackEnd = useCallback(() => {
    if (loopMode === 'single' && currentTrack && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    } else {
      skipNext();
    }
  }, [loopMode, currentTrack, audioRef, skipNext]);

  // Effect to handle loading and playing the audio when currentTrack changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!currentTrack || !audio) {
      return;
    }

    const abortController = new AbortController();
    
    const loadAndPlay = async () => {
      // Cleanup previous blob URL if it exists
      if (currentBlobUrl.current) {
        URL.revokeObjectURL(currentBlobUrl.current);
        currentBlobUrl.current = null;
      }

      audio.pause();
      audio.src = '';
      setIsLoading(true);
      setProgress(0);
      setDuration(0);

      try {
        let streamUrl: string;
        const downloadedTrack = await db.downloads.get(currentTrack.id) as DbDownload | undefined;

        if (downloadedTrack?.blob) {
          streamUrl = URL.createObjectURL(downloadedTrack.blob);
          currentBlobUrl.current = streamUrl;
        } else {
          const response = await getStreamUrl(currentTrack.url, abortController.signal);
          streamUrl = response.streamUrl;
        }
        
        if (abortController.signal.aborted) return;
        
        audio.src = streamUrl;
        await audio.play();

      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.log('Track loading aborted.');
          return;
        }
        console.error('Failed to get stream URL', error);
        toast({
          variant: "destructive",
          title: "Playback Error",
          description: "Could not stream the selected track.",
        });
        setIsLoading(false);
        setCurrentTrack(null);
      }
    };

    loadAndPlay();

    return () => {
      abortController.abort();
    };
  }, [currentTrack, audioRef, toast]);


  const addToQueue = (track: Track) => {
    if (!currentTrack) {
      playTrack(track, [track], { type: 'unknown' });
      toast({ title: 'Playing next', description: `"${track.title}"` });
      return;
    }
  
    // Add to the main queue if not already there
    setQueue(prevQueue => {
      if (prevQueue.some(t => t.id === track.id)) {
        return prevQueue;
      }
      const currentIdx = prevQueue.findIndex(t => t.id === currentTrack.id);
      const newQueue = [...prevQueue];
      newQueue.splice(currentIdx + 1, 0, track);
      return newQueue;
    });
  
    // Add to the currently active play queue (shuffled or ordered)
    if (isShuffled) {
      setShuffledPlayQueue(prev => {
        if (prev.some(t => t.id === track.id)) return prev;
        const newQueue = [...prev];
        newQueue.splice(1, 0, track); // Add after current track
        return newQueue;
      });
    } else {
      setPlayQueue(prev => {
        if (prev.some(t => t.id === track.id)) return prev;
        const newQueue = [...prev];
        newQueue.splice(1, 0, track); // Add after current track
        return newQueue;
      });
    }
  
    toast({
      title: 'Added to queue',
      description: `"${track.title}"`,
    });
  };

  const togglePlay = useCallback(() => {
    if (audioRef.current && currentTrack) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
  }, [audioRef, isPlaying, currentTrack]);

  const seek = (newProgress: number) => {
    if (audioRef.current && isFinite(duration)) {
      audioRef.current.currentTime = duration * newProgress;
      setProgress(newProgress);
    }
  };

  const toggleShuffle = useCallback(() => {
    const newState = !isShuffled;
    setIsShuffled(newState);

    if (newState && currentTrack) {
        const upcomingInOrder = playQueue.slice(1);
        const shuffledUpcoming = [...upcomingInOrder].sort(() => Math.random() - 0.5);
        setShuffledPlayQueue([currentTrack, ...shuffledUpcoming]);
    } else {
        setShuffledPlayQueue([]);
        if (currentTrack) {
          const trackIndex = queue.findIndex(t => t.id === currentTrack.id);
          const newPlayQueue = trackIndex !== -1 ? queue.slice(trackIndex) : [currentTrack];
          setPlayQueue(newPlayQueue);
        }
    }
  }, [isShuffled, playQueue, currentTrack, queue]);

  const toggleLoopMode = () => {
    setLoopMode(prev => {
        if (prev === 'off') return 'queue';
        if (prev === 'queue') return 'single';
        return 'off';
    });
  };

  const updatePositionState = useCallback(() => {
    const audio = audioRef.current;
    if (audio && 'mediaSession' in navigator && isFinite(audio.duration)) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
      try {
        navigator.mediaSession.setPositionState({
          duration: audio.duration,
          playbackRate: audio.playbackRate,
          position: audio.currentTime,
        });
      } catch (error) {
        // setPositionState can fail if media metadata is not set or on some browsers.
      }
    }
  }, [audioRef, isPlaying]);

  // Effect to update media session when play state changes
  useEffect(() => {
    updatePositionState();
  }, [isPlaying, updatePositionState]);
  
  // MediaSession API integration
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    if (currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: 'satvikx',
        artwork: [
          { src: currentTrack.thumbnail || '', sizes: '96x96', type: 'image/jpeg' },
          { src: currentTrack.thumbnail || '', sizes: '128x128', type: 'image/jpeg' },
          { src: currentTrack.thumbnail || '', sizes: '192x192', type: 'image/jpeg' },
          { src: currentTrack.thumbnail || '', sizes: '256x256', type: 'image/jpeg' },
          { src: currentTrack.thumbnail || '', sizes: '384x384', type: 'image/jpeg' },
          { src: currentTrack.thumbnail || '', sizes: '512x512', type: 'image/jpeg' },
        ],
      });
    }

    try {
      navigator.mediaSession.setActionHandler('play', togglePlay);
      navigator.mediaSession.setActionHandler('pause', togglePlay);
      navigator.mediaSession.setActionHandler('nexttrack', skipNext);
      navigator.mediaSession.setActionHandler('previoustrack', skipPrev);
      navigator.mediaSession.setActionHandler('seekbackward', (details) => {
        const skipTime = details.seekOffset || 10;
        if (audioRef.current) audioRef.current.currentTime = Math.max(audioRef.current.currentTime - skipTime, 0);
        updatePositionState();
      });
      navigator.mediaSession.setActionHandler('seekforward', (details) => {
        const skipTime = details.seekOffset || 10;
        if (audioRef.current) audioRef.current.currentTime = Math.min(audioRef.current.currentTime + skipTime, duration);
        updatePositionState();
      });
       navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (audioRef.current && details.seekTime !== null && details.seekTime !== undefined) {
          audioRef.current.currentTime = details.seekTime;
          updatePositionState();
        }
      });
    } catch (error) {
      console.error('Error setting media session action handlers:', error);
    }
  }, [currentTrack, togglePlay, skipNext, skipPrev, duration, audioRef, updatePositionState]);
  
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

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
      if (isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
      setIsLoading(false);
      updatePositionState();
    }
    const handlePlay = () => setIsPlaying(true);
    const handleCanPlay = () => setIsLoading(false);
    const handlePlaying = () => {
      setIsPlaying(true);
      setIsLoading(false);
    };
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => setIsLoading(true);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleTrackEnd);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('canplaythrough', handleCanPlay);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleTrackEnd);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('canplaythrough', handleCanPlay);
    };
  }, [handleTrackEnd, isSeeking, currentTrack, updatePositionState, audioRef]);
  
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume, audioRef]);

  // Final cleanup on unmount
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
    playQueue: isShuffled ? shuffledPlayQueue : playQueue,
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
    addToQueue,
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
      {children}
    </PlayerContext.Provider>
  );
}

export function PlayerWrapper({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);

  return (
    <PlayerProvider audioRef={audioRef}>
      <>
        {children}
        <audio ref={audioRef} />
      </>
    </PlayerProvider>
  )
}

    