// ALT-STAGE4-PART3/36: the Scripture Engine -- the single facade UI code
// (and, later, an AI layer) consumes. Nothing outside this file and its
// direct dependencies knows about bibleModel.ts's internal storage
// shape; that's the whole point of this layer existing.

import { scriptureRepository } from '../repository/ScriptureRepository'
import { parseReference, validateReference, type ParsedReference } from '../parser/referenceParser'
import { search, findReferenceCandidates, type SearchOptions } from '../search/scriptureSearch'
import { getBook, CANON } from '../data/canon'
import type { Passage, PassageReference, Translation, Verse, VerseReference, ScriptureSearchResult, ReferenceValidationResult } from '../types'

export class ScriptureEngine {
  // ---- Translations ----
  getTranslations(): Translation[] {
    return scriptureRepository.getTranslations()
  }

  getTranslation(id: string): Translation | null {
    return scriptureRepository.getTranslation(id)
  }

  // ---- Books ----
  getBooks() {
    return CANON
  }

  getBook(bookId: string) {
    return getBook(bookId)
  }

  // ---- Reference parsing & validation ----
  parseReference(input: string): ParsedReference | null {
    return parseReference(input)
  }

  validateReference(ref: ParsedReference): ReferenceValidationResult {
    return validateReference(ref, (bookId, chapter) => scriptureRepository.chapterVerseCount(bookId, chapter))
  }

  // ---- Retrieval ----
  getVerse(translationId: string, bookId: string, chapter: number, verse: number): Verse | null {
    return scriptureRepository.getVerse(translationId, bookId, chapter, verse)
  }

  getChapter(translationId: string, bookId: string, chapter: number): Verse[] {
    return scriptureRepository.getChapter(translationId, bookId, chapter)
  }

  getPassage(ref: PassageReference): Passage | null {
    return scriptureRepository.getPassage(ref)
  }

  // ALT-STAGE4-PART13: convenience -- resolves a raw reference string
  // straight to a Passage, doing parse + validate + retrieve in one
  // call, which is what the Operator search bar actually needs.
  getPassageFromReference(translationId: string, input: string): { passage: Passage | null; error?: string } {
    const parsed = parseReference(input)
    if (!parsed) return { passage: null, error: `Could not parse "${input}" as a Bible reference` }
    const validation = this.validateReference(parsed)
    if (!validation.valid) return { passage: null, error: validation.reason }
    const passage = scriptureRepository.getPassage({
      translationId,
      bookId: parsed.bookId,
      startChapter: parsed.chapter,
      startVerse: parsed.startVerse,
      endChapter: parsed.chapter,
      endVerse: parsed.endVerse,
    })
    if (!passage) return { passage: null, error: `${input} is not available in the selected translation` }
    return { passage }
  }

  // ---- Navigation ----
  nextVerse(ref: VerseReference): VerseReference | null {
    return scriptureRepository.nextVerse(ref)
  }

  previousVerse(ref: VerseReference): VerseReference | null {
    return scriptureRepository.previousVerse(ref)
  }

  // ---- Translation switching (Section 21/22) ----
  // Same reference, different translationId -- no re-search involved,
  // this is exactly why VerseReference/PassageReference carry a
  // translationId field rather than baking translation into a display
  // string.
  switchTranslation(ref: VerseReference, newTranslationId: string): Verse | null {
    return this.getVerse(newTranslationId, ref.bookId, ref.chapter, ref.verse)
  }

  switchPassageTranslation(ref: PassageReference, newTranslationId: string): Passage | null {
    return this.getPassage({ ...ref, translationId: newTranslationId })
  }

  availableTranslationsForVerse(bookId: string, chapter: number, verse: number): string[] {
    return scriptureRepository.availableTranslationsForVerse(bookId, chapter, verse)
  }

  // ---- Search ----
  search(query: string, options?: SearchOptions): ScriptureSearchResult[] {
    return search(query, options)
  }

  // ALT-STAGE4-PART36/38: AI-ready boundary, per Section 36. No AI
  // matching implemented -- this simply gives a future Scripture
  // Detection Engine a stable entry point that doesn't require it to
  // know how Bible storage works.
  findReferenceCandidates(transcriptFragment: string, options?: SearchOptions): ScriptureSearchResult[] {
    return findReferenceCandidates(transcriptFragment, options)
  }
}

export const scriptureEngine = new ScriptureEngine()
