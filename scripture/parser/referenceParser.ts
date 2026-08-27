// ALT-STAGE4-PART10: dedicated reference parser, independent of any UI
// formatting. Returns structured data (bookId + chapter + verse range),
// never relies on display strings as identity.

import { findBookIdByName, getBook } from '../data/canon'

export interface ParsedReference {
  bookId: string
  chapter: number
  startVerse: number
  endVerse: number
  // ALT-STAGE4-PART10: "16,18" (non-contiguous verses) is represented as
  // an explicit verse list alongside the start/end range, since
  // PassageReference's start/end can't express a gap on its own. When
  // absent, the reference is a normal contiguous range.
  verseList?: number[]
}

// Matches: optional leading number (1/2/3) + book name/abbreviation,
// then a chapter, optionally a verse or verse range/list.
// Examples matched: "John 3:16", "1 John 4:8", "1Cor 13:4-7", "John 3",
// "John 3:16,18"
const REFERENCE_PATTERN = /^([1-3]?\s?[A-Za-z][A-Za-z\s]*?)\.?\s+(\d+)(?:[:\s](\d+(?:\s*[-,]\s*\d+)*))?$/

export function parseReference(input: string): ParsedReference | null {
  const cleaned = input.trim().replace(/\s+/g, ' ')
  const match = cleaned.match(REFERENCE_PATTERN)
  if (!match) return null

  const [, rawBook, chapterStr, versePart] = match
  const bookId = findBookIdByName(rawBook.trim())
  if (!bookId) return null

  const chapter = parseInt(chapterStr, 10)
  if (!chapter || chapter < 1) return null

  if (!versePart) {
    // "John 3" -- chapter-only reference, whole chapter implied.
    return { bookId, chapter, startVerse: 1, endVerse: -1 } // -1 = "to end of chapter", resolved by the repository
  }

  if (versePart.includes(',')) {
    const verseList = versePart
      .split(',')
      .map((v) => parseInt(v.trim(), 10))
      .filter((v) => !isNaN(v) && v > 0)
      .sort((a, b) => a - b)
    if (verseList.length === 0) return null
    return { bookId, chapter, startVerse: verseList[0], endVerse: verseList[verseList.length - 1], verseList }
  }

  if (versePart.includes('-')) {
    const [startStr, endStr] = versePart.split('-').map((s) => s.trim())
    const startVerse = parseInt(startStr, 10)
    const endVerse = parseInt(endStr, 10)
    if (!startVerse || !endVerse || endVerse < startVerse) return null
    return { bookId, chapter, startVerse, endVerse }
  }

  const verse = parseInt(versePart, 10)
  if (!verse || verse < 1) return null
  return { bookId, chapter, startVerse: verse, endVerse: verse }
}

// ALT-STAGE4-PART11: validation against the canon (chapter count) and,
// where a chapter-retrieval function is supplied, against actual verse
// counts too -- returns a clear reason rather than throwing.
export function validateReference(
  ref: ParsedReference,
  getVerseCount?: (bookId: string, chapter: number) => number,
): { valid: boolean; reason?: string } {
  const book = getBook(ref.bookId)
  if (!book) return { valid: false, reason: `Unknown book "${ref.bookId}"` }
  if (book.expectedChapters && ref.chapter > book.expectedChapters) {
    return { valid: false, reason: `${book.name} only has ${book.expectedChapters} chapters` }
  }
  if (ref.chapter < 1) return { valid: false, reason: 'Chapter must be 1 or greater' }
  if (getVerseCount && ref.endVerse > 0) {
    const count = getVerseCount(ref.bookId, ref.chapter)
    if (count > 0 && ref.endVerse > count) {
      return { valid: false, reason: `${book.name} ${ref.chapter} only has ${count} verses` }
    }
  }
  return { valid: true }
}
