
import type { SearchResponse, StreamResponse, Track } from './types';

const API_BASE_URL = 'https://musicplayerbackend-us5o.onrender.com';
const FETCH_TIMEOUT = 15000; // 15 seconds

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = FETCH_TIMEOUT) {
  const controller = new AbortController();
  const { signal: timeoutSignal } = controller;
  options.signal = options.signal ? anySignal([options.signal, timeoutSignal]) : timeoutSignal;

  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, options);
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      if (options.signal?.aborted) {
        throw error;
      }
      throw new Error('Request timed out. The server is taking too long to respond.');
    }
    throw new Error('Request failed: ' + error.message);
  }
}

// Helper to combine multiple AbortSignals
function anySignal(signals: AbortSignal[]) {
    const controller = new AbortController();
    for (const signal of signals) {
        if (signal.aborted) {
            controller.abort(signal.reason);
            return signal;
        }
        signal.addEventListener('abort', () => controller.abort(signal.reason), { once: true, signal: controller.signal });
    }
    return controller.signal;
}

export async function searchTracks(query: string, signal?: AbortSignal): Promise<Track[]> {
  if (!query) return [];

  const url = `${API_BASE_URL}/api/search?q=${encodeURIComponent(query)}`;
  
  try {
    const response = await fetchWithTimeout(url, { signal, cache: 'no-store' }, 10000); 
    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Search API returned an error:", response.status, errorBody);
      throw new Error(`Failed to fetch search results. Server responded with ${response.status}.`);
    }
    const data: SearchResponse = await response.json();
    return data.results;
  } catch (error) {
    if ((error as Error).name !== 'AbortError') {
      console.error("Search API error:", error);
      throw error;
    }
    return [];
  }
}

export async function getStreamUrl(youtubeUrl: string, signal?: AbortSignal): Promise<StreamResponse> {
  const url = `${API_BASE_URL}/api/stream?url=${encodeURIComponent(youtubeUrl)}`;
  const response = await fetchWithTimeout(url, { signal }, 60000); // Increased timeout to 60 seconds
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
