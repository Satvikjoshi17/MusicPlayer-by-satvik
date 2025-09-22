import type { SearchResponse, StreamResponse, Track } from './types';

const API_BASE_URL = 'https://musicplayerbackend-us5o.onrender.com';
const FETCH_TIMEOUT = 15000; // 15 seconds

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = FETCH_TIMEOUT) {
  const controller = new AbortController();
  const { signal } = controller;
  options.signal = signal;

  const timeoutPromise = new Promise<Response>((_, reject) => {
    setTimeout(() => {
      controller.abort();
      reject(new Error('Request timed out. The server is taking too long to respond.'));
    }, timeout);
  });

  return Promise.race([
    fetch(url, options),
    timeoutPromise
  ]);
}

export async function searchTracks(query: string): Promise<Track[]> {
  if (!query) return [];

  // The backend endpoint for search is /api/search
  const url = `${API_BASE_URL}/api/search?q=${encodeURIComponent(query)}`;
  const response = await fetchWithTimeout(url);

  if (!response.ok) {
    throw new Error('Failed to fetch search results');
  }
  const data: SearchResponse = await response.json();
  return data.results;
}

export async function getStreamUrl(youtubeUrl: string): Promise<StreamResponse> {
  const url = `${API_BASE_URL}/api/stream?url=${encodeURIComponent(youtubeUrl)}`;
  const response = await fetchWithTimeout(url, {}, 30000); // Longer timeout for streaming
  if (!response.ok) {
    throw new Error('Failed to get stream URL');
  }
  return response.json();
}

export function getDownloadUrl(youtubeUrl: string, quality: 'best' | 'medium' | 'worst' = 'best'): string {
  return `${API_BASE_URL}/api/download?url=${encodeURIComponent(youtubeUrl)}&quality=${quality}`;
}
