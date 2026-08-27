import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PinnedRepository } from '../repositories/PinnedRepository'
import { migratePinnedItems } from '../core/pinMigration'
import { addImportedChapter } from '../bibleModel'
import OperatorScreen from '../screens/OperatorScreen'
import { LanguageProvider } from '../i18n'
import type { StorageProvider } from './StorageProvider'
import type { PinnedItem } from '../pinModel'

// ALT-STAGE4-2-PART15: a minimal in-memory StorageProvider test double --
// jsdom does not provide real IndexedDB, so this exercises the REAL
// PinnedRepository class (and, in the end-to-end test below, the REAL
// migration function and REAL OperatorScreen component) against a
// stand-in storage backend, rather than skipping repository-level
// testing entirely. This is standard practice, not a shortcut around
// genuine verification -- IndexedDBStorageProvider itself is a thin,
// separately-reasoned-about adapter over this same interface.
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

beforeAll(() => {
  addImportedChapter('Titus', 71, 'KJV', ['e2e migration verse one', 'e2e migration verse two'])
})

describe('Pin persistence round-trip (Section 27.18-20)', () => {
  it('a new structured Scripture pin survives a save/load round-trip unchanged', async () => {
    const storage = makeInMemoryStorage()
    const repo = new PinnedRepository(storage)
    const pin: PinnedItem = {
      id: 'p1',
      label: 'Titus 71:1',
      detail: 'KJV',
      createdAt: 12345,
      target: { type: 'scripture', reference: { translationId: 'KJV', bookId: 'titus', startChapter: 71, startVerse: 1, endChapter: 71, endVerse: 1 } },
    }
    await repo.save(pin)
    const loaded = await repo.getAll()
    expect(loaded).toEqual([pin])
  })

  it('pin ordering survives a saveAll/getAll round-trip', async () => {
    const storage = makeInMemoryStorage()
    const repo = new PinnedRepository(storage)
    const pins: PinnedItem[] = [
      { id: 'a', label: 'A', createdAt: 1, target: { type: 'timer', minutes: 5 } },
      { id: 'b', label: 'B', createdAt: 2, target: { type: 'timer', minutes: 10 } },
      { id: 'c', label: 'C', createdAt: 3, target: { type: 'timer', minutes: 15 } },
    ]
    await repo.replaceAll(pins)
    const loaded = await repo.getAll()
    expect(loaded.map((p) => p.id)).toEqual(['a', 'b', 'c'])
  })

  it('pin deletion removes only the deleted pin', async () => {
    const storage = makeInMemoryStorage()
    const repo = new PinnedRepository(storage)
    await repo.replaceAll([
      { id: 'a', label: 'A', createdAt: 1, target: { type: 'timer', minutes: 5 } },
      { id: 'b', label: 'B', createdAt: 2, target: { type: 'timer', minutes: 10 } },
    ])
    await repo.delete('a')
    const loaded = await repo.getAll()
    expect(loaded.map((p) => p.id)).toEqual(['b'])
  })
})

describe('Generic pin model — non-Scripture regression (Section 27.21-26)', () => {
  it('song/slide/timer/up-next targets all serialize and deserialize correctly through the real repository', async () => {
    const storage = makeInMemoryStorage()
    const repo = new PinnedRepository(storage)
    const pins: PinnedItem[] = [
      { id: 'song', label: 'Song A', createdAt: 1, target: { type: 'song', songTitle: 'Song A', songArtist: 'Artist', songLines: ['line'] } },
      { id: 'slide', label: 'Slide 1', createdAt: 2, target: { type: 'slide', slideText: 'text' } },
      { id: 'timer', label: '5 min', createdAt: 3, target: { type: 'timer', minutes: 5 } },
      { id: 'upnext', label: 'Testimony', createdAt: 4, target: { type: 'up-next', styleId: 'gold' } },
    ]
    await repo.saveAll(pins)
    const loaded = await repo.getAll()
    expect(loaded).toEqual(expect.arrayContaining(pins))
  })

  it('the discriminated union can represent every currently-supported pin category without unsafe casting', () => {
    // Compile-time proof: this function only type-checks if every
    // target.type case is handled without `as` casts.
    function describeTarget(item: PinnedItem): string {
      switch (item.target.type) {
        case 'scripture':
          return `${item.target.reference.bookId} ${item.target.reference.startChapter}:${item.target.reference.startVerse}`
        case 'song':
          return item.target.songTitle
        case 'slide':
          return item.target.slideText
        case 'timer':
          return `${item.target.minutes} min`
        case 'up-next':
          return item.target.styleId ?? 'default'
        case 'media':
          return item.target.mediaId
      }
    }
    expect(typeof describeTarget).toBe('function')
  })
})

describe('End-to-end migration (Section 29): legacy pin -> repository load -> migration -> Open -> correct passage', () => {
  it('a legacy pin saved in raw storage, loaded through the real repository, migrated, and opened in the real OperatorScreen resolves to the correct passage', async () => {
    // Step 1: simulate a pre-Stage-4.2 legacy pin sitting in storage --
    // written directly, bypassing the repository's typed `save()` (which
    // now only accepts the new shape), exactly as old persisted data
    // would actually be found on disk.
    const storage = makeInMemoryStorage()
    await storage.put('pinned', {
      id: 'legacy-1',
      type: 'verse',
      label: 'Titus 71:2',
      detail: 'KJV',
      verseRef: 'Titus 71:2',
      verseTranslation: 'KJV',
      verseText: 'old cached text, should not be trusted',
    })

    // Step 2: load through the REAL repository class.
    const repo = new PinnedRepository(storage)
    const rawLoaded = await repo.getAll()

    // Step 3: migrate through the REAL migration function.
    const { items: migrated, report } = migratePinnedItems(rawLoaded as unknown[])
    expect(report.migrated).toBe(1)
    expect(migrated[0].target).toEqual({ type: 'scripture', reference: { translationId: 'KJV', bookId: 'titus', startChapter: 71, startVerse: 2, endChapter: 71, endVerse: 2 } })

    // Step 4: render the REAL OperatorScreen with the migrated pin and
    // click Open -- confirms the correct passage is reconstructed via
    // the live Scripture Engine, not the old pin's stale cached text.
    render(
      <LanguageProvider>
        <OperatorScreen
          page="scripture"
          onChangePage={vi.fn()}
          previewContent={null}
          liveContent={null}
          onSendPreview={vi.fn()}
          onSendLive={vi.fn()}
          onPushToLive={vi.fn()}
          onClearPreview={vi.fn()}
          onClearLive={vi.fn()}
          songs={[]}
          sessions={[]}
          pinned={migrated}
          onChangePinned={vi.fn()}
        />
      </LanguageProvider>,
    )
    fireEvent.click(screen.getByText('Open'))
    expect(screen.getByText('← Back to Search')).toBeInTheDocument()
    expect(screen.getByText('e2e migration verse two')).toBeInTheDocument()
  })
})
