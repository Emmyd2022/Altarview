// ALT-STAGE5-PART5/22: the Song domain repository. Wraps the existing
// Stage 2 SongRepository (src/repositories/SongRepository.ts, pure
// persistence -- getAll/save/saveAll/delete against StorageProvider)
// with domain-level operations: create, duplicate, and the ID/section/
// arrangement bookkeeping those require. The React UI never calls
// StorageProvider or the Stage 2 repository directly.

import type { SongRepository as PersistenceSongRepository } from '../../repositories/SongRepository'
import type { Song, LyricSection } from '../../songModel'
import { newSongId, newSectionId, newArrangementId } from '../id'

export class SongDomainRepository {
  constructor(private persistence: PersistenceSongRepository) {}

  getAll(): Promise<Song[]> {
    return this.persistence.getAll()
  }

  get(id: string): Promise<Song | null> {
    return this.persistence.getAll().then((songs) => songs.find((s) => s.id === id) ?? null)
  }

  create(input: { title: string; artist?: string; isHymn?: boolean; sections: { label: string; lines: string[] }[]; source?: Song['source']; metadataSource?: Song['metadata']['source'] }): Song {
    const sections: LyricSection[] = input.sections.map((s) => ({ id: newSectionId(), label: s.label, lines: s.lines }))
    const arrangement = { id: newArrangementId(), name: 'Default', sectionIds: sections.map((s) => s.id) }
    const now = Date.now()
    return {
      id: newSongId(),
      title: input.title,
      artist: input.artist ?? '',
      source: input.source ?? 'Imported',
      isHymn: input.isHymn ?? false,
      linesPerSlide: 2,
      sections,
      arrangements: [arrangement],
      defaultArrangementId: arrangement.id,
      metadata: { createdAt: now, updatedAt: now, source: input.metadataSource ?? 'manual' },
    }
  }

  // ALT-STAGE5-PART8/49: a genuinely independent copy -- new song id,
  // new section ids, new arrangement ids (referencing the new section
  // ids), so editing the duplicate can never affect the original.
  duplicate(song: Song, titleSuffix = ' (Copy)'): Song {
    const newSections: LyricSection[] = song.sections.map((sec) => ({ ...sec, id: newSectionId() }))
    const oldToNewSectionId = new Map(song.sections.map((sec, i) => [sec.id, newSections[i].id]))
    const newArrangements = song.arrangements.map((arr) => ({
      id: newArrangementId(),
      name: arr.name,
      sectionIds: arr.sectionIds.map((sid) => oldToNewSectionId.get(sid) ?? sid),
    }))
    const oldToNewArrangementId = new Map(song.arrangements.map((arr, i) => [arr.id, newArrangements[i].id]))
    const now = Date.now()
    return {
      ...song,
      id: newSongId(),
      title: `${song.title}${titleSuffix}`,
      sections: newSections,
      arrangements: newArrangements,
      defaultArrangementId: oldToNewArrangementId.get(song.defaultArrangementId) ?? newArrangements[0]?.id ?? '',
      metadata: { ...song.metadata, createdAt: now, updatedAt: now },
    }
  }

  async save(song: Song): Promise<void> {
    await this.persistence.save({ ...song, metadata: { ...song.metadata, updatedAt: Date.now() } })
  }

  async saveAll(songs: Song[]): Promise<void> {
    await this.persistence.saveAll(songs)
  }

  async delete(id: string): Promise<void> {
    await this.persistence.delete(id)
  }
}
