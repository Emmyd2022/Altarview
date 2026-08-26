// ALT-STAGE4-PART4: canonical Scripture domain types. A verse/passage's
// real identity is this structured data (translationId + bookId +
// chapter + verse), NOT a display string like "John 3:16" -- display
// strings are derived FROM this, never the other way around.

export interface Translation {
  id: string // e.g. "kjv" -- stable, lowercase, never the display abbreviation
  name: string // "King James Version"
  abbreviation: string // "KJV" -- for display only
  language: string // BCP-47-ish, e.g. "en"
  copyright?: string
  license?: string
  source?: string // where this translation file came from (e.g. "Zefania import")
  version?: string
  publicDomain: boolean
  installed: boolean
  bookCount?: number
  verseCount?: number
}

export type Testament = 'OT' | 'NT'

// ALT-STAGE4-PART6: one canonical book identity shared across every
// translation -- a translation never redefines what "john" means.
export interface Book {
  id: string // "john" -- stable, lowercase
  name: string // "John"
  abbreviations: string[] // ["Jn", "Joh"]
  testament: Testament
  order: number // canonical Bible order, 1-66
  expectedChapters?: number // known chapter count, when established
}

export interface Verse {
  translationId: string
  bookId: string
  chapter: number
  verse: number
  text: string
}

export interface VerseReference {
  translationId: string
  bookId: string
  chapter: number
  verse: number
}

// ALT-STAGE4-PART4: a passage is a RANGE. startChapter/endChapter allow
// (in principle) a passage crossing a chapter boundary, though the
// current reference parser (Section 10) only produces single-chapter
// ranges -- the type itself doesn't restrict that for the future.
export interface PassageReference {
  translationId: string
  bookId: string
  startChapter: number
  startVerse: number
  endChapter: number
  endVerse: number
}

export interface Passage {
  reference: PassageReference
  verses: Verse[]
}

export interface ScriptureSearchResult {
  verse: Verse
  reference: VerseReference
  translation: string // translationId, kept alongside `verse.translationId` for convenience
  matchedTerms: string[]
  relevance: number // higher = more relevant; exact scoring documented in search/scriptureSearch.ts
}

// ALT-STAGE4-PART11: validation result shape -- so the UI can explain an
// invalid reference clearly instead of the engine throwing.
export interface ReferenceValidationResult {
  valid: boolean
  reason?: string
}
