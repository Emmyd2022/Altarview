import { describe, it, expect } from 'vitest'
import { parseReference, validateReference } from './referenceParser'

describe('parseReference', () => {
  it('parses a single verse reference', () => {
    expect(parseReference('John 3:16')).toEqual({ bookId: 'john', chapter: 3, startVerse: 16, endVerse: 16 })
  })

  it('parses a verse range', () => {
    expect(parseReference('John 3:16-20')).toEqual({ bookId: 'john', chapter: 3, startVerse: 16, endVerse: 20 })
  })

  it('parses a chapter-only reference', () => {
    expect(parseReference('John 3')).toEqual({ bookId: 'john', chapter: 3, startVerse: 1, endVerse: -1 })
  })

  it('parses a comma-separated verse list', () => {
    const result = parseReference('John 3:16,18')
    expect(result?.bookId).toBe('john')
    expect(result?.chapter).toBe(3)
    expect(result?.verseList).toEqual([16, 18])
    expect(result?.startVerse).toBe(16)
    expect(result?.endVerse).toBe(18)
  })

  it('parses a numbered book (1 John)', () => {
    expect(parseReference('1 John 4:8')).toEqual({ bookId: '1john', chapter: 4, startVerse: 8, endVerse: 8 })
  })

  it('parses a numbered book range (1 Corinthians)', () => {
    expect(parseReference('1 Corinthians 13:4-7')).toEqual({ bookId: '1corinthians', chapter: 13, startVerse: 4, endVerse: 7 })
  })

  it('parses common abbreviations', () => {
    expect(parseReference('Jn 3:16')?.bookId).toBe('john')
    expect(parseReference('1 Cor 13:4')?.bookId).toBe('1corinthians')
    expect(parseReference('1Cor 13:4')?.bookId).toBe('1corinthians')
  })

  it('returns null for an unrecognized book name', () => {
    expect(parseReference('Frogisms 3:16')).toBeNull()
  })

  it('returns null for a plain keyword search (not a reference)', () => {
    expect(parseReference('love')).toBeNull()
    expect(parseReference('God so loved the world')).toBeNull()
  })

  it('returns null for a malformed range (end before start)', () => {
    expect(parseReference('John 3:20-16')).toBeNull()
  })

  it('returns null for chapter zero', () => {
    expect(parseReference('John 0:1')).toBeNull()
  })
})

describe('validateReference', () => {
  it('accepts a chapter within the known chapter count', () => {
    const ref = parseReference('John 3:16')!
    expect(validateReference(ref).valid).toBe(true)
  })

  it('rejects a chapter beyond the book\'s known chapter count', () => {
    const ref = parseReference('John 999:1')!
    const result = validateReference(ref)
    expect(result.valid).toBe(false)
    expect(result.reason).toMatch(/chapters/)
  })

  it('rejects a verse beyond the actual verse count when a counter is supplied', () => {
    const ref = parseReference('John 3:999')!
    const result = validateReference(ref, () => 36) // pretend John 3 has 36 verses
    expect(result.valid).toBe(false)
    expect(result.reason).toMatch(/verses/)
  })

  it('accepts a chapter-only reference (endVerse -1 sentinel) without a verse-count check', () => {
    const ref = parseReference('John 3')!
    expect(validateReference(ref).valid).toBe(true)
  })
})
