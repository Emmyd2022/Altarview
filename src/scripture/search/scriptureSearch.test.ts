import { describe, it, expect, beforeAll } from 'vitest'
import { search, findReferenceCandidates } from './scriptureSearch'
import { addImportedChapter } from '../../bibleModel'

// ALT-STAGE4-PART46: synthetic "Test Bible" fixture, per the brief's own
// example shape -- short, fabricated placeholder sentences, not real
// scripture text, used purely to test search mechanics deterministically.
beforeAll(() => {
  addImportedChapter('Mark', 91, 'TESTSEARCH', [
    'the quick fox jumped over the lazy dog',
    'faith hope and love abide here forever',
    'the fox was quick to run away from danger',
    'nothing relevant appears in this fourth line',
  ])
})

describe('search', () => {
  it('finds verses containing an exact phrase, ranked above partial matches', () => {
    const results = search('quick fox', { translationId: 'testsearch' })
    expect(results.length).toBeGreaterThanOrEqual(2)
    expect(results[0].relevance).toBeGreaterThan(results[results.length - 1].relevance)
  })

  it('finds verses containing all individual words regardless of order', () => {
    const results = search('love hope faith', { translationId: 'testsearch' })
    expect(results.some((r) => r.verse.text.includes('faith hope and love'))).toBe(true)
  })

  it('is case-insensitive', () => {
    const lower = search('quick fox', { translationId: 'testsearch' })
    const upper = search('QUICK FOX', { translationId: 'testsearch' })
    expect(lower.length).toBe(upper.length)
  })

  it('returns no results for a query matching nothing', () => {
    const results = search('zzzznonexistentword', { translationId: 'testsearch' })
    expect(results).toEqual([])
  })

  it('returns an empty array for an empty query', () => {
    expect(search('', { translationId: 'testsearch' })).toEqual([])
    expect(search('   ', { translationId: 'testsearch' })).toEqual([])
  })

  it('treats a valid reference as a reference lookup, not a text search', () => {
    addImportedChapter('John', 92, 'TESTSEARCH', ['placeholder verse text for reference lookup'])
    const results = search('John 92:1', { translationId: 'testsearch' })
    expect(results.length).toBe(1)
    expect(results[0].reference).toEqual({ translationId: 'testsearch', bookId: 'john', chapter: 92, verse: 1 })
    expect(results[0].matchedTerms).toEqual([]) // reference lookups don't populate matchedTerms
  })

  it('does not duplicate a verse that exists in more than one loaded source', () => {
    // The same synthetic chapter loaded once should not produce
    // duplicate search hits even though bibleModel stores full chapters
    // and standalone verses in two different internal structures.
    const results = search('quick fox', { translationId: 'testsearch' })
    const keys = results.map((r) => `${r.reference.bookId}|${r.reference.chapter}|${r.reference.verse}`)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('respects a limit option', () => {
    const results = search('the', { translationId: 'testsearch', limit: 1 })
    expect(results.length).toBeLessThanOrEqual(1)
  })
})

describe('findReferenceCandidates (AI boundary)', () => {
  it('is callable with a transcript-shaped string and returns search-result-shaped data', () => {
    const results = findReferenceCandidates('faith hope love', { translationId: 'testsearch' })
    expect(Array.isArray(results)).toBe(true)
    if (results.length > 0) {
      expect(results[0]).toHaveProperty('verse')
      expect(results[0]).toHaveProperty('reference')
      expect(results[0]).toHaveProperty('relevance')
    }
  })
})
