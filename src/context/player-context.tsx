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
import type { Track, DbPlaylist, DbDownload } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/db';

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
  playTrack: (track: Track, playlist?: Track[], source?: PlayerContextSource) => void;
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
  const playIdRef = useRef(0);

  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [playQueue, setPlayQueue] = useState<Track[]>([]);
  const [source, setSource] = useState<PlayerContextSource>({ type: 'unknown' });
  const [shuffledPlayQueue, setShuffledPlayQueue] = useState<Track[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isShuffled, setIsShuffled] = useState(false);
  const [loopMode, setLoopMode] = useState<LoopMode>('off');
  const [isSeeking, setIsSeeking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
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
    if (!audioRef.current) return;
    
    playIdRef.current += 1;
    const currentPlayId = playIdRef.current;

    setIsLoading(true);
    setCurrentTrack(track); // Set current track immediately for UI responsiveness
    
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
    addTrackToRecents(track);

    if (isShuffled) {
        // Re-shuffle only if context changes, otherwise just reorder
        const upcomingTracks = newPlayQueue.filter(t => t.id !== track.id);
        const shuffled = [...upcomingTracks].sort(() => Math.random() - 0.5);
        shuffled.unshift(track);
        setShuffledPlayQueue(shuffled);
    } else {
        setShuffledPlayQueue([]);
    }

    const playAudio = async () => {
        if (!audioRef.current) return;
        audioRef.current.pause();

        // Revoke the previous blob URL if it exists
        if (currentBlobUrl.current) {
            URL.revokeObjectURL(currentBlobUrl.current);
            currentBlobUrl.current = null;
        }

        try {
            let finalStreamUrl: string;
            const downloadedTrack = await db.downloads.get(track.id) as DbDownload | undefined;

            if (downloadedTrack?.blob) {
                finalStreamUrl = URL.createObjectURL(downloadedTrack.blob);
                currentBlobUrl.current = finalStreamUrl; // Store the new blob URL
            } else {
                const { streamUrl } = await getStreamUrl(track.url);
                finalStreamUrl = streamUrl;
            }
            
            if (playIdRef.current !== currentPlayId) {
                // A new track was requested while this one was loading, so abort.
                if (currentBlobUrl.current) {
                    URL.revokeObjectURL(currentBlobUrl.current);
                    currentBlobUrl.current = null;
                }
                return;
            }

            audioRef.current.src = finalStreamUrl;
            await audioRef.current.play();

        } catch (error) {
            if (playIdRef.current === currentPlayId) {
                console.error('Failed to get stream URL', error);
                toast({
                    variant: "destructive",
                    title: "Playback Error",
                    description: "Could not stream the selected track. Check your internet connection.",
                });
                setCurrentTrack(null);
                setIsLoading(false);
            }
        }
    };

    playAudio();
  }, [audioRef, toast, isShuffled, queue, source]);

  const addToQueue = (track: Track) => {
    if (!currentTrack) {
      playTrack(track, [track], { type: 'unknown' });
      toast({ title: 'Added to queue', description: `"${track.title}" is now playing.` });
      return;
    }
    
    setQueue(prev => {
        if (prev.find(t => t.id === track.id)) return prev;
        return [...prev, track];
    });
    
    setPlayQueue(prev => {
        const newQueue = [...prev];
        if (newQueue.findIndex(t => t.id === track.id) === -1) {
            newQueue.splice(1, 0, track);
        }
        return newQueue;
    });

    if (isShuffled) {
        setShuffledPlayQueue(prev => {
            const newQueue = [...prev];
            if (newQueue.findIndex(t => t.id === track.id) === -1) {
                newQueue.splice(1, 0, track);
            }
            return newQueue;
        });
    }

    toast({
        title: 'Added to queue',
        description: `"${track.title}" is up next.`,
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
  
  const skipNext = useCallback(() => {
    const activeQueue = isShuffled ? shuffledPlayQueue : playQueue;
    const currentIndex = activeQueue.findIndex(t => t.id === currentTrack?.id);
    
    let nextTrack: Track | undefined;

    if (currentIndex !== -1 && currentIndex < activeQueue.length - 1) {
      nextTrack = activeQueue[currentIndex + 1];
    } else if (loopMode === 'queue' && queue.length > 0) {
      nextTrack = isShuffled ? (shuffledPlayQueue[0] ?? queue[0]) : queue[0];
    }
    
    if (nextTrack) {
       playTrack(nextTrack, queue, source);
    } else {
       setIsPlaying(false);
       if(audioRef.current) audioRef.current.currentTime = duration;
    }
  }, [isShuffled, shuffledPlayQueue, playQueue, loopMode, queue, playTrack, source, duration, audioRef, currentTrack]);

  const handleTrackEnd = useCallback(() => {
    if (loopMode === 'single' && currentTrack && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    } else {
      skipNext();
    }
  }, [loopMode, skipNext, currentTrack, audioRef]);
  
  const skipPrev = useCallback(() => {
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }

    const activeQueue = isShuffled ? shuffledPlayQueue : playQueue;
    const currentIndex = queue.findIndex(t => t.id === currentTrack?.id);
    
    if (currentIndex <= 0) {
        if (loopMode === 'queue' && queue.length > 0) {
            playTrack(queue[queue.length - 1], queue, source);
        } else {
            if (audioRef.current) audioRef.current.currentTime = 0;
        }
        return;
    }
    
    const prevTrack = queue[currentIndex - 1];
    playTrack(prevTrack, queue, source);

  }, [currentTrack, queue, playTrack, loopMode, source, audioRef, isShuffled, shuffledPlayQueue, playQueue]);
  
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
        const upNext = playQueue.filter(t => t.id !== currentTrack.id);
        const shuffled = [...upNext].sort(() => Math.random() - 0.5);
        shuffled.unshift(currentTrack);
        setShuffledPlayQueue(shuffled);
    } else {
        setShuffledPlayQueue([]);
    }
  }, [isShuffled, playQueue, currentTrack]);

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
            { src: currentTrack.thumbnail || '', sizes: '96x96', type: 'image/jpeg' },
            { src: currentTrack.thumbnail || '', sizes: '128x128', type: 'image/jpeg' },
            { src: currentTrack.thumbnail || '', sizes: '192x192', type: 'image/jpeg' },
            { src: currentTrack.thumbnail || '', sizes: '256x256', type: 'image/jpeg' },
            { src: currentTrack.thumbnail || '', sizes: '384x384', type: 'image/jpeg' },
            { src: currentTrack.thumbnail || '', sizes: '512x512', type: 'image/jpeg' },
          ],
        });
        
        try {
          navigator.mediaSession.setActionHandler('play', togglePlay);
          navigator.mediaSession.setActionHandler('pause', togglePlay);
          navigator.mediaSession.setActionHandler('previoustrack', skipPrev);
          navigator.mediaSession.setActionHandler('nexttrack', skipNext);
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

      }
    }
  }, [currentTrack, togglePlay, skipPrev, skipNext, duration, audioRef, updatePositionState]);
  
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
    audio.addEventListener('canplaythrough', handleCanPlay);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleTrackEnd);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('playing', handleCanPlay);
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

  useEffect(() => {
    // Final cleanup when the provider unmounts
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
    playQueue,
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
