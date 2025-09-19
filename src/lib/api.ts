import type { SearchResponse, StreamResponse, Track } from './types';

const API_BASE_URL = 'https://musicplayerbackend-us5o.onrender.com/api';

export async function searchTracks(query: string): Promise<Track[]> {
  if (!query) return [];
  
  const url = `${API_BASE_URL}/search?q=${encodeURIComponent(query)}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: SearchResponse = await response.json();
    return data.results;
  } catch (error) {
    console.error("Failed to search tracks:", error);
    // Since the API is not working, we will return an empty array to avoid crashes.
    // In a real-world scenario, you'd want to handle this more gracefully.
    return [];
  }
}

export async function getStreamUrl(youtubeUrl: string): Promise<StreamResponse> {
  const url = `${API_BASE_URL}/stream?url=${encodeURIComponent(youtubeUrl)}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: StreamResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to get stream URL:", error);
    throw error;
  }
}
