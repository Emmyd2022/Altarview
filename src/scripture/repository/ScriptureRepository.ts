// ALT-STAGE4-PART8: the Bible repository. This wraps the EXISTING
// bibleModel.ts data/functions (unchanged, still the single in-memory
// source of truth) with the stable, canonically-identified API this
// stage requires -- bookId in, bookId out, never a display string as
// identity. bibleModel.ts's internal storage is keyed by book NAME
// (e.g. "John", "1 John"), so this repository resolves bookId -> name
// via the canon before calling into it, and back again on the way out.
//
// Storage decision (documented per Section 8): this stage does NOT
// replace bibleModel's in-memory Map or its IndexedDB-backed persistence
// (src/repositories/BibleRepository.ts, from Stage 2) -- both already
// work, and replacing them would be exactly the kind of unnecessary
// rewrite the brief warns against. This repository is a new READ/QUERY
// layer on top of that existing, working storage.

import {
  getVerseText,
  chapterVerseCount,
  isChapterLoaded,
  availableTranslationsForVerse,
  getVerseRange as bibleModelGetVerseRange,
  nextVerseRef as bibleModelNextVerseRef,
  previousVerseRef as bibleModelPreviousVerseRef,
  listLoadedTranslations,
  addImportedChapter,
  addImportedVerses,
} from '../../bibleModel'
import { CANON, getBook } from '../data/canon'
import type { Book, Translation, Verse, VerseReference, Passage, PassageReference } from '../types'

// ALT-STAGE4-PART5: translation metadata registry. `installed` is
// computed live from bibleModel's loaded-translation list, not stored
// separately, so it can never drift out of sync with what's actually
// queryable.
const TRANSLATION_METADATA: Omit<Translation, 'installed'>[] = [
  { id: 'kjv', name: 'King James Version', abbreviation: 'KJV', language: 'en', publicDomain: true, source: 'Public domain (1611, Authorized Version)' },
  { id: 'nkjv', name: 'New King James Version', abbreviation: 'NKJV', language: 'en', publicDomain: false },
  { id: 'niv', name: 'New International Version', abbreviation: 'NIV', language: 'en', publicDomain: false },
  { id: 'esv', name: 'English Standard Version', abbreviation: 'ESV', language: 'en', publicDomain: false },
  { id: 'nasb', name: 'New American Standard Bible', abbreviation: 'NASB', language: 'en', publicDomain: false },
  { id: 'amp', name: 'Amplified Bible', abbreviation: 'AMP', language: 'en', publicDomain: false },
  { id: 'nlt', name: 'New Living Translation', abbreviation: 'NLT', language: 'en', publicDomain: false },
  { id: 'msg', name: 'The Message', abbreviation: 'MSG', language: 'en', publicDomain: false },
  { id: 'erv', name: 'Easy-to-Read Version', abbreviation: 'ERV', language: 'en', publicDomain: false },
]

function idToAbbreviation(id: string): string {
  const known = TRANSLATION_METADATA.find((t) => t.id.toLowerCase() === id.toLowerCase())
  return known ? known.abbreviation : id.toUpperCase()
}

export class ScriptureRepository {
  // Section 8 API surface: getTranslations, getTranslation, getBooks,
  // getChapter, getVerse, getPassage, search (search lives in
  // ../search/scriptureSearch.ts and calls back into this repository).

  getTranslations(): Translation[] {
    const loaded = new Set(listLoadedTranslations().map((t) => t.toUpperCase()))
    return TRANSLATION_METADATA.map((t) => ({ ...t, installed: loaded.has(t.abbreviation.toUpperCase()) }))
  }

  getTranslation(id: string): Translation | null {
    const meta = TRANSLATION_METADATA.find((t) => t.id.toLowerCase() === id.toLowerCase())
    const loaded = new Set(listLoadedTranslations().map((t) => t.toUpperCase()))
    if (meta) {
      return { ...meta, installed: loaded.has(meta.abbreviation.toUpperCase()) }
    }
    // ALT-STAGE4-PART5 fix: a translation imported under a custom name
    // (e.g. a church's own file, not one of the well-known predefined
    // translations) is still real and installed -- it just isn't in the
    // curated metadata list. Synthesize minimal metadata for it rather
    // than incorrectly reporting "unknown translation" for something
    // that's actually loaded and queryable.
    if (loaded.has(id.toUpperCase())) {
      return { id: id.toLowerCase(), name: id.toUpperCase(), abbreviation: id.toUpperCase(), language: 'en', publicDomain: false, installed: true }
    }
    return null
  }

  getBooks(): Book[] {
    // ALT-STAGE4-PART6: the canon is translation-independent, so this
    // intentionally ignores the translationId parameter the brief's
    // Section 8 sketch implies -- every installed translation shares the
    // same 66-book structure. Kept as a no-arg method for that reason;
    // a translationId param would suggest per-translation book lists,
    // which is not how this data model works.
    return CANON
  }

  getVerse(translationId: string, bookId: string, chapter: number, verse: number): Verse | null {
    const book = getBook(bookId)
    if (!book) return null
    const translationAbbr = idToAbbreviation(translationId)
    const text = getVerseText(book.name, chapter, verse, translationAbbr)
    if (!text) return null
    return { translationId, bookId, chapter, verse, text }
  }

  getChapter(translationId: string, bookId: string, chapter: number): Verse[] {
    const book = getBook(bookId)
    if (!book) return []
    const translationAbbr = idToAbbreviation(translationId)
    const count = chapterVerseCount(book.name, chapter)
    if (count === 0) return []
    const verses: Verse[] = []
    for (let v = 1; v <= count; v++) {
      const text = getVerseText(book.name, chapter, v, translationAbbr)
      if (text) verses.push({ translationId, bookId, chapter, verse: v, text })
    }
    return verses
  }

  isChapterAvailable(bookId: string, chapter: number): boolean {
    const book = getBook(bookId)
    if (!book) return false
    return isChapterLoaded(book.name, chapter)
  }

  chapterVerseCount(bookId: string, chapter: number): number {
    const book = getBook(bookId)
    if (!book) return 0
    return chapterVerseCount(book.name, chapter)
  }

  getPassage(ref: PassageReference): Passage | null {
    const book = getBook(ref.bookId)
    if (!book) return null
    const translationAbbr = idToAbbreviation(ref.translationId)
    // ALT-STAGE4-PART13: endVerse === -1 means "whole chapter" (from a
    // chapter-only reference like "John 3") -- resolve it against the
    // real verse count here, once, rather than leaking that sentinel
    // value further into calling code.
    const endVerse = ref.endVerse === -1 ? chapterVerseCount(book.name, ref.startChapter) : ref.endVerse
    if (endVerse === 0) return null
    const raw = bibleModelGetVerseRange(book.name, ref.startChapter, ref.startVerse, endVerse, translationAbbr)
    if (raw.length === 0) return null
    const verses: Verse[] = raw.map((v) => ({ translationId: ref.translationId, bookId: ref.bookId, chapter: v.chapter, verse: v.verse, text: v.text }))
    return { reference: { ...ref, endVerse }, verses }
  }

  availableTranslationsForVerse(bookId: string, chapter: number, verse: number): string[] {
    const book = getBook(bookId)
    if (!book) return []
    return availableTranslationsForVerse(book.name, chapter, verse)
  }

  nextVerse(ref: VerseReference): VerseReference | null {
    const book = getBook(ref.bookId)
    if (!book) return null
    const next = bibleModelNextVerseRef({ book: book.name, chapter: ref.chapter, verse: ref.verse })
    if (!next) return null
    const nextBookId = findBookIdFromName(next.book)
    if (!nextBookId) return null
    return { translationId: ref.translationId, bookId: nextBookId, chapter: next.chapter, verse: next.verse }
  }

  previousVerse(ref: VerseReference): VerseReference | null {
    const book = getBook(ref.bookId)
    if (!book) return null
    const prev = bibleModelPreviousVerseRef({ book: book.name, chapter: ref.chapter, verse: ref.verse })
    if (!prev) return null
    const prevBookId = findBookIdFromName(prev.book)
    if (!prevBookId) return null
    return { translationId: ref.translationId, bookId: prevBookId, chapter: prev.chapter, verse: prev.verse }
  }

  // ALT-STAGE4-PART31: exposed here so the import pipeline (services/
  // scriptureImport.ts) has a single place to write newly imported data
  // into, keeping bibleModel.ts's mutation functions from being called
  // directly by UI or import code.
  addChapter(book: string, chapter: number, translationAbbr: string, verses: string[]): void {
    addImportedChapter(book, chapter, translationAbbr, verses)
  }

  addVerses(verses: { book: string; chapter: number; verse: number; translation: string; text: string }[]): void {
    addImportedVerses(verses)
  }
}

function findBookIdFromName(name: string): string | null {
  const match = CANON.find((b) => b.name.toLowerCase() === name.toLowerCase())
  return match?.id ?? null
}

export const scriptureRepository = new ScriptureRepository()
