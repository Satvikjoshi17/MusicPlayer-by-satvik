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

  const timeoutPromise = new Promise<Response>((_, reject) => {
    setTimeout(() => {
      controller?.abort();
      reject(new Error('Request timed out. The server is taking too long to respond.'));
    }, timeout);
  });

  try {
    const response = await Promise.race([
      fetch(url, options),
      timeoutPromise
    ]);
    return response;
  } catch (error: any) {
    if (error.name === 'AbortError' && options.signal?.aborted) {
      // Re-throw the abort error if the signal was already aborted externally
      throw error;
    }
    // Otherwise, it's likely a timeout or other network error
    throw new Error('Request failed: ' + error.message);
  }
}

export async function searchTracks(query: string, signal?: AbortSignal): Promise<Track[]> {
  if (!query) return [];

  const url = `${API_BASE_URL}/api/search?q=${encodeURIComponent(query)}`;
  
  try {
    const response = await fetchWithTimeout(url, { signal });
    if (!response.ok) {
      throw new Error('Failed to fetch search results');
    }
    const data: SearchResponse = await response.json();
    return data.results;
  } catch (error) {
    // Don't throw for abort errors, as they are expected
    if ((error as Error).name !== 'AbortError') {
      console.error("Search API error:", error);
      throw error; // Re-throw other errors
    }
    return []; // Return empty for aborts
  }
}

export async function getStreamUrl(youtubeUrl: string, signal?: AbortSignal): Promise<StreamResponse> {
  const url = `${API_BASE_URL}/api/stream?url=${encodeURIComponent(youtubeUrl)}`;
  const response = await fetchWithTimeout(url, { signal }, 30000); // Longer timeout for streaming
  if (!response.ok) {
    throw new Error('Failed to get stream URL');
  }
  return response.json();
}

export function getDownloadUrl(youtubeUrl: string, quality: 'best' | 'medium' | 'worst' = 'best'): string {
  return `${API_BASE_URL}/api/download?url=${encodeURIComponent(youtubeUrl)}&quality=${quality}`;
}

    