// ALT-STAGE4-PART14/15: offline Bible search. Works entirely over
// whatever is currently loaded in bibleModel.ts's in-memory data --
// no network, no external index.

import { getAllLoadedChapters, getAllLoadedVerses } from '../../bibleModel'
import { parseReference } from '../parser/referenceParser'
import { getBook } from '../data/canon'
import type { ScriptureSearchResult, Verse } from '../types'

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,;:!?"'()]/g, '') // strip common punctuation
    .replace(/\s+/g, ' ')
    .trim()
}

function allLoadedVerses(translationId?: string): Verse[] {
  const results: Verse[] = []
  for (const chapter of getAllLoadedChapters()) {
    if (translationId && chapter.translation.toLowerCase() !== translationId.toLowerCase()) continue
    chapter.verses.forEach((text, i) => {
      if (!text) return
      results.push({ translationId: chapter.translation.toLowerCase(), bookId: chapter.book.toLowerCase(), chapter: chapter.chapter, verse: i + 1, text })
    })
  }
  for (const v of getAllLoadedVerses()) {
    if (translationId && v.translation.toLowerCase() !== translationId.toLowerCase()) continue
    results.push({ translationId: v.translation.toLowerCase(), bookId: v.book.toLowerCase(), chapter: v.chapter, verse: v.verse, text: v.text })
  }
  return results
}

// ALT-STAGE4-PART14: de-duplicate -- the same verse can appear from both
// a loaded full chapter AND a standalone cross-reference entry (this
// happens today: John 3:16 exists in both the John 3 chapter data and
// the standalone multi-translation verse list). Keyed by
// translation+book+chapter+verse; first occurrence wins.
function dedupe(verses: Verse[]): Verse[] {
  const seen = new Set<string>()
  const out: Verse[] = []
  for (const v of verses) {
    const key = `${v.translationId}|${v.bookId}|${v.chapter}|${v.verse}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(v)
  }
  return out
}

export interface SearchOptions {
  translationId?: string
  limit?: number
}

// ALT-STAGE4-PART15: reference-first -- if the query parses as a valid
// reference, treat it as reference lookup rather than text search.
export function search(query: string, options: SearchOptions = {}): ScriptureSearchResult[] {
  const trimmed = query.trim()
  if (!trimmed) return []

  const parsedRef = parseReference(trimmed)
  if (parsedRef) {
    return referenceSearch(parsedRef, options)
  }
  return textSearch(trimmed, options)
}

function referenceSearch(parsed: ReturnType<typeof parseReference>, options: SearchOptions): ScriptureSearchResult[] {
  if (!parsed) return []
  const book = getBook(parsed.bookId)
  if (!book) return []
  const candidates = allLoadedVerses(options.translationId).filter(
    (v) => v.bookId === parsed.bookId && v.chapter === parsed.chapter && v.verse >= parsed.startVerse && (parsed.endVerse === -1 || v.verse <= parsed.endVerse),
  )
  const deduped = dedupe(candidates).sort((a, b) => a.verse - b.verse)
  const limited = options.limit ? deduped.slice(0, options.limit) : deduped
  return limited.map((v) => ({
    verse: v,
    reference: { translationId: v.translationId, bookId: v.bookId, chapter: v.chapter, verse: v.verse },
    translation: v.translationId,
    matchedTerms: [],
    relevance: 1,
  }))
}

function textSearch(query: string, options: SearchOptions): ScriptureSearchResult[] {
  const normalizedQuery = normalize(query)
  const terms = normalizedQuery.split(' ').filter(Boolean)
  if (terms.length === 0) return []

  const all = dedupe(allLoadedVerses(options.translationId))
  const results: ScriptureSearchResult[] = []

  for (const v of all) {
    const normalizedText = normalize(v.text)
    // ALT-STAGE4-PART14: exact-phrase match (all terms in order,
    // adjacent) scores highest; a verse containing all terms in any
    // order scores next; anything else is not a match at all.
    const isExactPhrase = normalizedText.includes(normalizedQuery)
    const matchedTerms = terms.filter((t) => normalizedText.includes(t))
    const matchesAllTerms = matchedTerms.length === terms.length

    if (!isExactPhrase && !matchesAllTerms) continue

    const relevance = isExactPhrase ? 2 : matchedTerms.length / terms.length
    results.push({
      verse: v,
      reference: { translationId: v.translationId, bookId: v.bookId, chapter: v.chapter, verse: v.verse },
      translation: v.translationId,
      matchedTerms,
      relevance,
    })
  }

  // ALT-STAGE4-PART14: higher relevance first; ties broken by canonical
  // order (book, then chapter, then verse) for predictable results.
  results.sort((a, b) => {
    if (b.relevance !== a.relevance) return b.relevance - a.relevance
    const bookA = getBook(a.verse.bookId)?.order ?? 999
    const bookB = getBook(b.verse.bookId)?.order ?? 999
    if (bookA !== bookB) return bookA - bookB
    if (a.verse.chapter !== b.verse.chapter) return a.verse.chapter - b.verse.chapter
    return a.verse.verse - b.verse.verse
  })

  return options.limit ? results.slice(0, options.limit) : results
}

// ALT-STAGE4-PART36/38: candidate-lookup boundary for a future AI layer.
// Deliberately simple today -- just delegates to the same search() used
// by the operator's manual search box -- but gives the future AI
// Detection Engine a stable entry point that doesn't require knowing how
// Bible storage works. Sophisticated matching (fuzzy, semantic, spoken-
// number parsing like "john three sixteen") is explicitly future work,
// not built here.
export function findReferenceCandidates(transcriptFragment: string, options: SearchOptions = {}): ScriptureSearchResult[] {
  return search(transcriptFragment, options)
}
