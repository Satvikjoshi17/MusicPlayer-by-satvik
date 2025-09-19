import type { SearchResponse, StreamResponse, Track } from './types';

const API_BASE_URL = 'https://musicplayerbackend-us5o.onrender.com/api';

export async function searchTracks(query: string): Promise<Track[]> {
  if (!query) return [];

  const response = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) {
    throw new Error('Failed to fetch search results');
  }
  const data: SearchResponse = await response.json();
  return data.results;
}

export async function getStreamUrl(youtubeUrl: string): Promise<StreamResponse> {
  const response = await fetch(`${API_BASE_URL}/stream?url=${encodeURIComponent(youtubeUrl)}`);
  if (!response.ok) {
    throw new Error('Failed to get stream URL');
  }
  return response.json();
}
