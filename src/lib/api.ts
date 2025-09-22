import type { SearchResponse, StreamResponse, Track } from './types';

const API_BASE_URL = 'https://musicplayerbackend-us5o.onrender.com';
const FETCH_TIMEOUT = 15000; // 15 seconds

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = FETCH_TIMEOUT) {
  // Use the signal from options if it's provided, otherwise create a new controller.
  const controller = options.signal ? null : new AbortController();
  const signal = options.signal || controller?.signal;
  
  if (controller) {
    options.signal = signal;
  }

  const timeoutId = setTimeout(() => {
      // Only abort if we created the controller. If the signal was passed in,
      // the caller is responsible for aborting it.
      controller?.abort();
  }, timeout);

  try {
    const response = await fetch(url, options);
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      // Re-throw if it's an external signal that was aborted. This is expected.
      // If we created the controller, it means our internal timeout was triggered.
      if (options.signal?.aborted && !controller) {
        throw error;
      }
      throw new Error('Request timed out. The server is taking too long to respond.');
    }
    throw new Error('Request failed: ' + error.message);
  }
}

export async function searchTracks(query: string, signal?: AbortSignal): Promise<Track[]> {
  if (!query) return [];

  const url = `${API_BASE_URL}/api/search?q=${encodeURIComponent(query)}`;
  
  try {
    // Use the default 15 second timeout for search
    const response = await fetchWithTimeout(url, { signal }, FETCH_TIMEOUT);
    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Search API returned an error:", response.status, errorBody);
      throw new Error(`Failed to fetch search results. Server responded with ${response.status}.`);
    }
    const data: SearchResponse = await response.json();
    return data.results;
  } catch (error) {
    // Don't throw for abort errors that we trigger internally for cancellation
    if ((error as Error).name !== 'AbortError') {
      console.error("Search API error:", error);
      throw error; // Re-throw other errors
    }
    return []; // Return empty for aborts
  }
}

export async function getStreamUrl(youtubeUrl: string, signal?: AbortSignal): Promise<StreamResponse> {
  const url = `${API_BASE_URL}/api/stream?url=${encodeURIComponent(youtubeUrl)}`;
  // Give this a longer timeout, as fetching the stream can be slow.
  const response = await fetchWithTimeout(url, { signal }, 30000); 
  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Stream API returned an error:", response.status, errorBody);
    throw new Error(`Failed to get stream URL. Server responded with ${response.status}.`);
  }
  return response.json();
}

export function getDownloadUrl(youtubeUrl: string, quality: 'best' | 'medium' | 'worst' = 'best'): string {
  return `${API_BASE_URL}/api/download?url=${encodeURIComponent(youtubeUrl)}&quality=${quality}`;
}

    