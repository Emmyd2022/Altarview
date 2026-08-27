import { describe, it, expect, beforeAll } from 'vitest'
import { resolveScripturePin } from './scripturePins'
import { scriptureEngine } from './ScriptureEngine'
import { addImportedChapter } from '../../bibleModel'

beforeAll(() => {
  addImportedChapter('Titus', 2, 'PINTEST', ['pin test verse one', 'pin test verse two', 'pin test verse three'])
})

describe('resolveScripturePin', () => {
  it('resolves a valid pinned reference to a passage', () => {
    // KJV is always installed (built-in, public domain) -- use a book/
    // chapter we know is NOT loaded for KJV to force the "unavailable in
    // translation" path in a separate test below, and use our synthetic
    // PINTEST translation here for the success path.
    const result = resolveScripturePin({ translationId: 'pintest', bookId: 'titus', startChapter: 2, startVerse: 1, endChapter: 2, endVerse: 2 })
    expect(result.ok).toBe(true)
    expect(result.passage?.verses.map((v) => v.text)).toEqual(['pin test verse one', 'pin test verse two'])
  })

  it('returns a clear error for an unregistered translation', () => {
    const result = resolveScripturePin({ translationId: 'not-a-real-translation', bookId: 'titus', startChapter: 2, startVerse: 1, endChapter: 2, endVerse: 1 })
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/Unknown translation/)
  })

  it('returns a clear error when the passage is not available in an otherwise-known translation', () => {
    // KJV is registered/installed, but this specific chapter was never
    // loaded for it.
    const result = resolveScripturePin({ translationId: 'kjv', bookId: 'titus', startChapter: 2, startVerse: 1, endChapter: 2, endVerse: 1 })
    expect(result.ok).toBe(false)
    expect(result.error).toBeDefined()
  })
})

describe('Compare Two Translations (Section 23)', () => {
  beforeAll(() => {
    addImportedChapter('Titus', 3, 'COMPAREA', ['compare A verse one'])
    addImportedChapter('Titus', 3, 'COMPAREB', ['compare B verse one'])
  })

  it('retrieves the same reference from two translations using structured references, not a new search', () => {
    const ref = { translationId: 'comparea', bookId: 'titus', chapter: 3, verse: 1 }
    const a = scriptureEngine.getVerse(ref.translationId, ref.bookId, ref.chapter, ref.verse)
    const b = scriptureEngine.switchTranslation(ref, 'compareb')
    expect(a?.text).toBe('compare A verse one')
    expect(b?.text).toBe('compare B verse one')
    // Both retrieved via the exact same structured reference (bookId/
    // chapter/verse) -- only translationId differs, per Section 23's
    // explicit "do not perform a new textual search" requirement.
  })
})
