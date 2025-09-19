import type { SearchResponse, StreamResponse, Track } from './types';

const API_BASE_URL = 'https://musicplayerbackend-us5o.onrender.com/api';

const sampleTrack: Track = {
  id: 'K4DyBUG242c',
  title: 'Cartoon - On & On (feat. Daniel Levi)',
  artist: 'NoCopyrightSounds',
  duration: 208,
  thumbnail: 'https://i.ytimg.com/vi/K4DyBUG242c/hqdefault.jpg',
  url: 'https://www.youtube.com/watch?v=K4DyBUG242c',
  viewCount: 450000000,
};

export async function searchTracks(query: string): Promise<Track[]> {
  if (!query) return [];
  // Return a sample track for testing since the API is facing CORS issues.
  return [sampleTrack];
  
  /* The original API call is commented out below */
  /*
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
    throw error;
  }
  */
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
