// API Response Types
export type Track = {
  id: string;
  title: string;
  duration: number;
  thumbnail: string;
  artist: string;
  url: string;
  viewCount: number;
};

export type SearchResponse = {
  results: Track[];
};

export type StreamResponse = {
  streamUrl: string;
  cached: boolean;
  message: string;
};


// IndexedDB Schema Types
export type DbDownload = {
  id: string;
  title: string;
  artist: string;
  blob: Blob;
  mimeType: string;
  size: number;
  duration: number;
  thumbnail: string;
  downloadedAt: string; // ISO string
  originalUrl: string;
};

export type PlaylistTrack = {
  id: string;
  title: string;
  artist: string;
  duration: number;
  thumbnail: string;
  sourceUrl: string;
};

export type DbPlaylist = {
  id: string; // uuid
  name: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  tracks: PlaylistTrack[];
};

export type DbRecent = {
  id: string;
  lastPlayedAt: string; // ISO string
  position: number;
};

export type DbSetting = {
  key: string;
  value: any;
};
