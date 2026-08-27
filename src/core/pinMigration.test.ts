import { describe, it, expect, beforeAll } from 'vitest'
import { migratePinnedItem, migratePinnedItems } from './pinMigration'
import { addImportedChapter } from '../bibleModel'

// ALT-STAGE4-2-PART18: synthetic fixture covering every legacy reference
// form the old parser/pin system could have persisted, per Section 18's
// explicit list.
beforeAll(() => {
  addImportedChapter('John', 51, 'KJV', ['migration test v1', 'migration test v2', 'migration test v3', 'migration test v4', 'migration test v5'])
  addImportedChapter('Psalm', 51, 'KJV', ['migration psalm v1'])
  addImportedChapter('1 Corinthians', 51, 'KJV', ['migration cor v1', 'migration cor v2', 'migration cor v3', 'migration cor v4', 'migration cor v5', 'migration cor v6', 'migration cor v7'])
})

describe('migratePinnedItem — legacy Scripture pins', () => {
  it('migrates a legacy single-verse pin (John 51:2) to a structured PassageReference', () => {
    const legacy = { id: 'p1', type: 'verse', label: 'John 51:2', detail: 'KJV', verseRef: 'John 51:2', verseTranslation: 'KJV', verseText: 'migration test v2' }
    const result = migratePinnedItem(legacy)
    expect(result.status).toBe('migrated')
    expect(result.item?.target).toEqual({ type: 'scripture', reference: { translationId: 'KJV', bookId: 'john', startChapter: 51, startVerse: 2, endChapter: 51, endVerse: 2 } })
  })

  it('migrates a legacy verse-range pin (John 51:2-4)', () => {
    const legacy = { id: 'p2', type: 'verse', label: 'John 51:2-4', detail: 'KJV', verseRef: 'John 51:2-4', verseTranslation: 'KJV', verseText: 'combined text' }
    const result = migratePinnedItem(legacy)
    expect(result.status).toBe('migrated')
    expect(result.item?.target).toEqual({ type: 'scripture', reference: { translationId: 'KJV', bookId: 'john', startChapter: 51, startVerse: 2, endChapter: 51, endVerse: 4 } })
  })

  it('migrates a legacy chapter-only pin (Psalm 51)', () => {
    const legacy = { id: 'p3', type: 'verse', label: 'Psalm 51', detail: 'KJV', verseRef: 'Psalm 51', verseTranslation: 'KJV', verseText: 'text' }
    const result = migratePinnedItem(legacy)
    expect(result.status).toBe('migrated')
    expect(result.item?.target).toMatchObject({ type: 'scripture', reference: { bookId: 'psalm', startChapter: 51, startVerse: 1 } })
  })

  it('migrates a legacy numbered-book pin (1 Corinthians 51:4-7)', () => {
    const legacy = { id: 'p4', type: 'verse', label: '1 Corinthians 51:4-7', detail: 'KJV', verseRef: '1 Corinthians 51:4-7', verseTranslation: 'KJV', verseText: 'text' }
    const result = migratePinnedItem(legacy)
    expect(result.status).toBe('migrated')
    expect(result.item?.target).toEqual({ type: 'scripture', reference: { translationId: 'KJV', bookId: '1corinthians', startChapter: 51, startVerse: 4, endChapter: 51, endVerse: 7 } })
  })

  it('migrates a legacy abbreviation-form pin (1 Cor 51:4)', () => {
    const legacy = { id: 'p5', type: 'verse', label: '1 Cor 51:4', detail: 'KJV', verseRef: '1 Cor 51:4', verseTranslation: 'KJV', verseText: 'text' }
    const result = migratePinnedItem(legacy)
    expect(result.status).toBe('migrated')
    expect(result.item?.target).toMatchObject({ type: 'scripture', reference: { bookId: '1corinthians', startChapter: 51, startVerse: 4 } })
  })
})

describe('migratePinnedItem — malformed legacy data (Section 16)', () => {
  it('a malformed/unparseable legacy reference fails safely without throwing', () => {
    const legacy = { id: 'bad1', type: 'verse', label: 'Not A Real Reference At All', detail: 'KJV', verseRef: 'Not A Real Reference At All', verseTranslation: 'KJV', verseText: 'text' }
    expect(() => migratePinnedItem(legacy)).not.toThrow()
    const result = migratePinnedItem(legacy)
    expect(result.status).toBe('failed')
    expect(result.item).toBeNull()
    expect(result.reason).toBeDefined()
  })

  it('a legacy verse pin missing verseRef fails safely', () => {
    const legacy = { id: 'bad2', type: 'verse', label: 'Broken', verseTranslation: 'KJV' }
    const result = migratePinnedItem(legacy)
    expect(result.status).toBe('failed')
  })

  it('completely unrecognized data fails safely', () => {
    expect(migratePinnedItem(null).status).toBe('failed')
    expect(migratePinnedItem(undefined).status).toBe('failed')
    expect(migratePinnedItem('a string').status).toBe('failed')
    expect(migratePinnedItem(42).status).toBe('failed')
  })
})

describe('migratePinnedItem — already-current data', () => {
  it('a pin already in the new shape passes through unchanged', () => {
    const current = { id: 'c1', label: 'John 3:16', detail: 'KJV', createdAt: 123, target: { type: 'scripture' as const, reference: { translationId: 'KJV', bookId: 'john', startChapter: 3, startVerse: 16, endChapter: 3, endVerse: 16 } } }
    const result = migratePinnedItem(current)
    expect(result.status).toBe('current')
    expect(result.item).toEqual(current)
  })
})

describe('migratePinnedItems — batch behavior (Section 16, 27.15/16/17)', () => {
  it('one malformed pin does not prevent other valid pins from migrating', () => {
    const raw = [
      { id: 'ok1', type: 'verse', verseRef: 'John 51:1', verseTranslation: 'KJV', verseText: 'x', label: 'John 51:1' },
      { id: 'bad', type: 'verse', verseRef: 'Nonsense Reference', verseTranslation: 'KJV', verseText: 'x', label: 'Bad' },
      { id: 'ok2', type: 'verse', verseRef: 'John 51:3', verseTranslation: 'KJV', verseText: 'x', label: 'John 51:3' },
    ]
    const { items, report } = migratePinnedItems(raw)
    expect(items.length).toBe(2)
    expect(items.map((i) => i.id)).toEqual(['ok1', 'ok2'])
    expect(report.migrated).toBe(2)
    expect(report.failed.length).toBe(1)
    expect(report.failed[0].id).toBe('bad')
  })

  it('migration is idempotent -- running it twice on the same (now-migrated) data yields the same result', () => {
    const raw = [{ id: 'ok1', type: 'verse', verseRef: 'John 51:1', verseTranslation: 'KJV', verseText: 'x', label: 'John 51:1' }]
    const firstPass = migratePinnedItems(raw)
    const secondPass = migratePinnedItems(firstPass.items)
    expect(secondPass.items).toEqual(firstPass.items)
    expect(secondPass.report.alreadyCurrent).toBe(1)
    expect(secondPass.report.migrated).toBe(0)
  })

  it('non-Scripture legacy pins (song/slide/timer/up-next) also migrate correctly in the same batch', () => {
    const raw = [
      { id: 's1', type: 'song', label: 'Song A', songTitle: 'Song A', songArtist: 'Artist', songLines: ['line one'] },
      { id: 's2', type: 'slide', label: 'Slide 1', slideText: 'slide text' },
      { id: 's3', type: 'timer', label: '5 min timer', timerMinutes: 5 },
      { id: 's4', type: 'up-next', label: 'Testimony', upNextStyleId: 'gold-wipe' },
    ]
    const { items, report } = migratePinnedItems(raw)
    expect(items.length).toBe(4)
    expect(report.failed.length).toBe(0)
    expect(items[0].target).toEqual({ type: 'song', songTitle: 'Song A', songArtist: 'Artist', songLines: ['line one'] })
    expect(items[1].target).toEqual({ type: 'slide', slideText: 'slide text' })
    expect(items[2].target).toEqual({ type: 'timer', minutes: 5 })
    expect(items[3].target).toEqual({ type: 'up-next', styleId: 'gold-wipe' })
  })
})
