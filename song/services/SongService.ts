// ALT-STAGE5-PART5: the Song Service facade. This is what UI code (and,
// later, an AI matching layer) should consume -- nothing outside this
// file and its direct dependencies needs to know about persistence
// internals.

import type { Song } from '../../songModel'
import { SongDomainRepository } from '../repository/SongDomainRepository'
import { searchSongs, type SongSearchResult } from '../search/songSearch'

// ALT-STAGE5-PART30: minimal future-ready type for AI matching, per
// Section 30's explicit guidance -- introduced because it materially
// clarifies the future integration boundary (what a Song Matching
// Engine would eventually hand back), NOT because any matching logic
// exists yet. No confidence algorithm is implemented; nothing produces
// this type today.
export interface SongMatchCandidate {
  songId: string
  confidence: number
  sectionId?: string
  lyricPosition?: number
}

export class SongService {
  constructor(private repo: SongDomainRepository) {}

  getAll(): Promise<Song[]> {
    return this.repo.getAll()
  }

  get(id: string): Promise<Song | null> {
    return this.repo.get(id)
  }

  create(input: Parameters<SongDomainRepository['create']>[0]): Promise<Song> {
    const song = this.repo.create(input)
    return this.repo.save(song).then(() => song)
  }

  async update(song: Song): Promise<Song> {
    const updated = { ...song, metadata: { ...song.metadata, updatedAt: Date.now() } }
    await this.repo.save(updated)
    return updated
  }

  async duplicate(song: Song): Promise<Song> {
    const copy = this.repo.duplicate(song)
    await this.repo.save(copy)
    return copy
  }

  delete(id: string): Promise<void> {
    return this.repo.delete(id)
  }

  async search(query: string): Promise<SongSearchResult[]> {
    const songs = await this.repo.getAll()
    return searchSongs(songs, query)
  }
}
