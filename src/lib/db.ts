import Dexie, { type Table } from 'dexie';
import type { DbPlaylist, DbDownload, DbRecent, DbSetting } from './types';

export class SatvikBeatsDB extends Dexie {
  downloads!: Table<DbDownload>;
  playlists!: Table<DbPlaylist>;
  recent!: Table<DbRecent>;
  settings!: Table<DbSetting>;

  constructor() {
    super('satvik_music_db');
    this.version(1).stores({
      downloads: '++id, title, artist, downloadedAt',
      playlists: '++id, name, createdAt',
      recent: '++id, lastPlayedAt',
      settings: 'key',
    });
  }
}

export const db = new SatvikBeatsDB();
