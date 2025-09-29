
import { getStreamUrl } from './api';
import type { StreamResponse } from './types';

// Simple in-memory cache for stream URLs
const streamCache = new Map<string, Promise<StreamResponse>>();
const preloadingControllers = new Map<string, AbortController>();

/**
 * Gets a stream URL, either from the cache or by fetching it.
 * This function is used for actual playback.
 */
export async function getStream(youtubeUrl: string, signal?: AbortSignal): Promise<StreamResponse> {
  if (streamCache.has(youtubeUrl)) {
    return streamCache.get(youtubeUrl)!;
  }

  const promise = getStreamUrl(youtubeUrl, signal);
  streamCache.set(youtubeUrl, promise);

  try {
    const result = await promise;
    return result;
  } catch (error) {
    // If fetching fails, remove the promise from the cache to allow retries
    streamCache.delete(youtubeUrl);
    throw error;
  }
}

/**
 * Preloads a stream URL and stores it in the cache.
 * This is for background loading and doesn't return the value.
 */
export function preloadStream(youtubeUrl: string): void {
  // Don't preload if it's already in the cache or currently preloading
  if (streamCache.has(youtubeUrl) || preloadingControllers.has(youtubeUrl)) {
    return;
  }

  const controller = new AbortController();
  preloadingControllers.set(youtubeUrl, controller);

  const promise = getStreamUrl(youtubeUrl, controller.signal);
  streamCache.set(youtubeUrl, promise);

  promise.then(() => {
    preloadingControllers.delete(youtubeUrl);
  }).catch((error) => {
    // If preloading fails (e.g., aborted), remove from cache
    if ((error as Error).name === 'AbortError') {
      console.log(`Preloading aborted for ${youtubeUrl}`);
    } else {
      console.error(`Preloading failed for ${youtubeUrl}:`, error);
    }
    streamCache.delete(youtubeUrl);
    preloadingControllers.delete(youtubeUrl);
  });
}

/**
 * Cancels all ongoing preloading requests.
 * This should be called when the user makes a choice that changes the upcoming track.
 */
export function cancelPreloading(): void {
  for (const [url, controller] of preloadingControllers.entries()) {
    controller.abort();
    preloadingControllers.delete(url);
    // Don't clear the main cache, just the preloading controllers
  }
}
