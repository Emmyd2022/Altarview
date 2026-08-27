// ALT-STAGE5-PART26/27/28: domain-level Song search. Supports title,
// artist, and lyrics search over whatever songs are in the operator's
// own library -- this module never contains any lyric text itself, it
// only operates on data passed in. Normalization is a derived,
// rebuildable representation used purely for matching; original lyrics
// are never altered or replaced by it.

import type { Song } from '../../songModel'

// ALT-STAGE5-PART27: case/punctuation/whitespace/apostrophe
// normalization, Unicode-safe (NFKC) -- reused by both manual search
// here and, later, by AI matching, without forcing them into one
// function (Section 26's explicit "not necessarily the same algorithm").
export function normalizeText(text: string): string {
  return text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/['’‘]/g, "'")
    .replace(/[.,;:!?"“”()]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export interface SongSearchResult {
  song: Song
  matchedIn: ('title' | 'artist' | 'lyrics')[]
  relevance: number
}

export function searchSongs(songs: Song[], query: string): SongSearchResult[] {
  const normalizedQuery = normalizeText(query)
  if (!normalizedQuery) return []

  const results: SongSearchResult[] = []
  for (const song of songs) {
    const matchedIn: SongSearchResult['matchedIn'] = []
    let relevance = 0

    if (normalizeText(song.title).includes(normalizedQuery)) {
      matchedIn.push('title')
      relevance += 3
    }
    if (song.artist && normalizeText(song.artist).includes(normalizedQuery)) {
      matchedIn.push('artist')
      relevance += 2
    }
    const allLyrics = song.sections.map((s) => s.lines.join(' ')).join(' ')
    if (normalizeText(allLyrics).includes(normalizedQuery)) {
      matchedIn.push('lyrics')
      relevance += 1
    }

    if (matchedIn.length > 0) results.push({ song, matchedIn, relevance })
  }

  // Highest relevance first; alphabetical by title as a stable tiebreaker.
  results.sort((a, b) => (b.relevance !== a.relevance ? b.relevance - a.relevance : a.song.title.localeCompare(b.song.title)))
  return results
}
