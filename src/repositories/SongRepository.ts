// ALT-STAGE2-PART2: repository layer. Screens/UI must never call
// StorageProvider directly -- they go through a repository, which is the
// only thing that knows the collection name and does any entity-specific
// logic. This keeps storage swappable (IndexedDB today, SQLite later)
// without UI code ever needing to change.

import type { StorageProvider } from '../core/StorageProvider'
import type { Song } from '../songModel'

const COLLECTION = 'songs'

export class SongRepository {
  constructor(private storage: StorageProvider) {}

  getAll(): Promise<Song[]> {
    return this.storage.getAll<Song>(COLLECTION)
  }

  save(song: Song): Promise<void> {
    return this.storage.put(COLLECTION, song)
  }

  saveAll(songs: Song[]): Promise<void> {
    return this.storage.putAll(COLLECTION, songs)
  }

  delete(id: string): Promise<void> {
    return this.storage.remove(COLLECTION, id)
  }
}
