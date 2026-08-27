// ALT-STAGE5-PART57: three explicit end-to-end integration tests, each
// proving a real multi-step path through the actual domain classes
// together, not just an isolated helper function. All fixture text is
// fabricated placeholder content, never real lyrics.

import { describe, it, expect } from 'vitest'
import { SongDomainRepository } from './repository/SongDomainRepository'
import { SongRepository as PersistenceSongRepository } from '../repositories/SongRepository'
import { SongService } from './services/SongService'
import { migrateSongs } from './migration/songMigration'
import { migrateSongPin } from './migration/songPinMigration'
import type { StorageProvider } from '../core/StorageProvider'
import type { PinnedItem } from '../pinModel'

function makeInMemoryStorage(): StorageProvider {
  const collections = new Map<string, Map<string, unknown>>()
  const meta = new Map<string, string>()
  function store(collection: string) {
    if (!collections.has(collection)) collections.set(collection, new Map())
    return collections.get(collection)!
  }
  return {
    async init() {},
    async getAll<T>(collection: string) {
      return Array.from(store(collection).values()) as T[]
    },
    async get<T>(collection: string, id: string) {
      return (store(collection).get(id) as T) ?? null
    },
    async put<T extends { id: string }>(collection: string, item: T) {
      store(collection).set(item.id, item)
    },
    async putAll<T extends { id: string }>(collection: string, items: T[]) {
      for (const item of items) store(collection).set(item.id, item)
    },
    async remove(collection: string, id: string) {
      store(collection).delete(id)
    },
    async clear(collection: string) {
      store(collection).clear()
    },
    async getMeta(key: string) {
      return meta.get(key) ?? null
    },
    async setMeta(key: string, value: string) {
      meta.set(key, value)
    },
  }
}

describe('Integration 1: create -> persist -> retrieve -> search -> identify by stable Song ID', () => {
  it('proves the full path through real repository, service, and search classes together', async () => {
    const storage = makeInMemoryStorage()
    const service = new SongService(new SongDomainRepository(new PersistenceSongRepository(storage)))

    const created = await service.create({ title: 'Integration Test Song', artist: 'Integration Artist', sections: [{ label: 'Verse 1', lines: ['integration line one'] }] })
    expect(created.id).toBeTruthy()

    const retrieved = await service.get(created.id)
    expect(retrieved?.title).toBe('Integration Test Song')

    const searchResults = await service.search('Integration Test Song')
    expect(searchResults.length).toBe(1)
    expect(searchResults[0].song.id).toBe(created.id) // identified by stable ID, not by matching text again
  })
})

describe('Integration 2: legacy song -> migration -> stable Song ID -> persistence -> reload -> same ID', () => {
  it('proves a legacy song keeps the SAME id across a real reload cycle', async () => {
    const storage = makeInMemoryStorage()
    const persistenceRepo = new PersistenceSongRepository(storage)

    // Step 1: simulate a legacy song sitting in storage (pre-Stage-5
    // shape, written directly -- exactly as real old persisted data
    // would be found on disk).
    await storage.put('songs', { id: 'legacy-song-1', title: 'Legacy Integration Song', artist: 'Legacy Artist', source: 'Imported', isHymn: false, linesPerSlide: 2, sections: [{ label: 'Verse 1', lines: ['legacy integration line'] }] })

    // Step 2: load through the real persistence repository, migrate
    // through the real migration function -- this is the exact
    // sequence App.tsx performs on real app startup.
    const rawLoaded = await persistenceRepo.getAll()
    const { songs: migratedFirstPass } = migrateSongs(rawLoaded as unknown[])
    const firstPassId = migratedFirstPass[0].id
    expect(firstPassId).toBeTruthy()

    // Step 3: persist the migrated result (as App.tsx does).
    await persistenceRepo.saveAll(migratedFirstPass)

    // Step 4: simulate an app RELOAD -- load again from storage and
    // migrate again (idempotent -- this song is now already-current).
    const reloaded = await persistenceRepo.getAll()
    const { songs: migratedSecondPass } = migrateSongs(reloaded as unknown[])

    expect(migratedSecondPass[0].id).toBe(firstPassId) // SAME id across reload
    expect(migratedSecondPass[0].title).toBe('Legacy Integration Song') // data preserved
  })
})

describe('Integration 3: Song pin -> Song ID -> rename Song -> pin still resolves correct Song', () => {
  it('proves a pin resolved to a stable songId survives a real rename', async () => {
    const storage = makeInMemoryStorage()
    const domainRepo = new SongDomainRepository(new PersistenceSongRepository(storage))

    // Step 1: create and save a real song.
    const song = domainRepo.create({ title: 'Original Song Name', sections: [{ label: 'Verse 1', lines: ['pin integration line'] }] })
    await domainRepo.save(song)

    // Step 2: a legacy title-based pin gets migrated/resolved against
    // the real song list -- this is the real migrateSongPin path.
    const legacyPin: PinnedItem = { id: 'pin-1', label: 'Original Song Name', createdAt: 1, target: { type: 'song', songTitle: 'Original Song Name', songLines: ['pin integration line'] } }
    const { pin: resolvedPin, outcome } = migrateSongPin(legacyPin, [song])
    expect(outcome).toBe('resolved')
    expect(resolvedPin.target.type === 'song' && resolvedPin.target.songId).toBe(song.id)

    // Step 3: rename the song (a real update through the domain
    // repository -- id must not change).
    const renamed = { ...song, title: 'Completely Renamed Song' }
    await domainRepo.save(renamed)
    expect(renamed.id).toBe(song.id)

    // Step 4: the pin, still carrying the ORIGINAL songId, resolves to
    // the CORRECT (renamed) song when looked up by id -- not by the now-
    // stale cached title.
    const allSongs = await domainRepo.getAll()
    const resolvedSong = allSongs.find((s) => s.id === (resolvedPin.target.type === 'song' ? resolvedPin.target.songId : undefined))
    expect(resolvedSong?.title).toBe('Completely Renamed Song')
    expect(resolvedSong?.id).toBe(song.id)
  })
})
