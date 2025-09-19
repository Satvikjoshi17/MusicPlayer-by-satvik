import type { SearchResponse, StreamResponse, Track } from './types';

const API_BASE_URL = 'https://musicplayerbackend-us5o.onrender.com';

export async function searchTracks(query: string): Promise<Track[]> {
  if (!query) return [];

  // The backend endpoint is /api/search/ but the base URL already ends with /api
  // So we just need to call search/
  const response = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) {
    throw new Error('Failed to fetch search results');
  }
  const data: SearchResponse = await response.json();
  return data.results;
}

export async function getStreamUrl(youtubeUrl: string): Promise<StreamResponse> {
  const response = await fetch(`${API_BASE_URL}/api/stream?url=${encodeURIComponent(youtubeUrl)}`);
  if (!response.ok) {
    throw new Error('Failed to get stream URL');
  }
  return response.json();
}

export function getDownloadUrl(youtubeUrl: string, quality: 'best' | 'medium' | 'worst' = 'best'): string {
  return `${API_BASE_URL}/api/download?url=${encodeURIComponent(youtubeUrl)}&quality=${quality}`;
}
