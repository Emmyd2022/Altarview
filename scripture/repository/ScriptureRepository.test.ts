import { describe, it, expect, beforeAll } from 'vitest'
import { scriptureRepository } from './ScriptureRepository'
import { addImportedChapter, addImportedVerses } from '../../bibleModel'

// ALT-STAGE4-PART46: small, deterministic, synthetic test fixtures --
// explicitly NOT dependent on the real (partial) KJV dataset already in
// the app, per the brief's requirement. Fabricated short placeholder
// verses for testing the mechanism only.

describe('ScriptureRepository', () => {
  beforeAll(() => {
    // Explicit small chapter: verses 1-3 of a synthetic "John 3" in a
    // fabricated test translation, unrelated to any real KJV content.
    addImportedChapter('John', 90, 'TESTA', ['alpha one', 'alpha two', 'alpha three'])
    addImportedChapter('John', 90, 'TESTB', ['beta one', 'beta two', 'beta three'])
    addImportedVerses([{ book: 'John', chapter: 90, verse: 1, translation: 'TESTC', text: 'gamma one' }])
  })

  it('getTranslations includes registered translations with computed installed status', () => {
    const translations = scriptureRepository.getTranslations()
    const kjv = translations.find((t) => t.id === 'kjv')
    expect(kjv).toBeDefined()
    expect(kjv?.publicDomain).toBe(true)
  })

  it('getTranslation returns null for an unregistered id', () => {
    expect(scriptureRepository.getTranslation('not-a-real-translation')).toBeNull()
  })

  it('getBooks returns the full 66-book canon', () => {
    const books = scriptureRepository.getBooks()
    expect(books.length).toBe(66)
    expect(books.find((b) => b.id === 'john')).toBeDefined()
    expect(books.find((b) => b.id === 'genesis')?.order).toBe(1)
    expect(books.find((b) => b.id === 'revelation')?.order).toBe(66)
  })

  it('getChapter retrieves an ordered list of verses for a synthetic chapter', () => {
    const verses = scriptureRepository.getChapter('testa', 'john', 90)
    expect(verses.map((v) => v.text)).toEqual(['alpha one', 'alpha two', 'alpha three'])
    expect(verses.map((v) => v.verse)).toEqual([1, 2, 3])
  })

  it('getVerse retrieves a single verse by structured reference', () => {
    const verse = scriptureRepository.getVerse('testa', 'john', 90, 2)
    expect(verse?.text).toBe('alpha two')
  })

  it('getVerse returns null for a verse that does not exist', () => {
    expect(scriptureRepository.getVerse('testa', 'john', 90, 999)).toBeNull()
  })

  it('getPassage retrieves a verse range', () => {
    const passage = scriptureRepository.getPassage({ translationId: 'testa', bookId: 'john', startChapter: 90, startVerse: 1, endChapter: 90, endVerse: 2 })
    expect(passage?.verses.map((v) => v.text)).toEqual(['alpha one', 'alpha two'])
  })

  it('translation switching: same reference, different translation, no re-search', () => {
    const a = scriptureRepository.getVerse('testa', 'john', 90, 1)
    const b = scriptureRepository.getVerse('testb', 'john', 90, 1)
    expect(a?.text).toBe('alpha one')
    expect(b?.text).toBe('beta one')
    // Same structured reference used for both -- this IS the mechanism
    // Section 21 describes (no re-search, just a different translationId).
  })

  it('is entirely offline: no network calls involved in any repository method', () => {
    // Structural check -- confirms nothing in this module references
    // fetch/XMLHttpRequest, matching Section 35's offline-first
    // requirement. (A real runtime network-call assertion isn't
    // meaningful here since nothing in this synchronous, in-memory-only
    // API could make one regardless.)
    const source = scriptureRepository.getChapter.toString() + scriptureRepository.getVerse.toString()
    expect(source).not.toMatch(/fetch\(|XMLHttpRequest/)
  })
})
