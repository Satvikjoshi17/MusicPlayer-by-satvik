
// API Response Types
export type Track = {
  id: string;
  title: string;
  duration: number;
  thumbnail: string;
  artist: string;
  url: string;
  viewCount: number;
  reason?: string; // For AI recommendations
};

export type SearchResponse = {
  results: Track[];
};

export type StreamResponse = {
  streamUrl: string;
  cached: boolean;
  message: string;
};

// For AI-generated playlists on the homepage
export type RecommendationPlaylist = {
  playlistTitle: string;
  tracks: Track[];
};


// IndexedDB Schema Types
export type DbDownload = Track & {
  blob: Blob;
  mimeType: string;
  size: number;
  downloadedAt: string; // ISO string
  originalUrl: string;
};

export type PlaylistTrack = Track & {
  addedAt: string; // ISO string
};

export type DbPlaylist = {
  id: string; // uuid
  name: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  tracks: PlaylistTrack[];
};

export type DbRecent = Track & {
  lastPlayedAt: string; // ISO string
  position: number;
};

export type DbSetting = {
  key: string;
  value: any;
};
