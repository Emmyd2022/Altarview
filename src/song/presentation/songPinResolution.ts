// ALT-STAGE5-2-PART27/28: resolves a Song pin target into either a
// whole-song reference, a section reference, or -- most importantly --
// a semantic lyric-position pin RESOLVED against the CURRENTLY ACTIVE
// layout/arrangement, never against a stale, previously-generated page
// number. This is what makes a pin survive a layout change unbroken.

import type { Song, SongArrangement } from '../../songModel'
import type { SongPresentationLayoutConfig, SongPresentationPage } from './types'
import { generateSongPresentationPages } from './pagination'

export interface SongPinResolution {
  ok: boolean
  song?: Song
  page?: SongPresentationPage // the page the pinned position currently falls on, under the ACTIVE layout
  error?: string
}

export function resolveSongLyricPositionPin(
  song: Song | null,
  arrangement: SongArrangement | null,
  layoutConfig: SongPresentationLayoutConfig,
  position: { sectionId: string; sectionOccurrence: number; lineIndexInSection?: number },
): SongPinResolution {
  if (!song) return { ok: false, error: 'The pinned song no longer exists.' }
  if (!arrangement) return { ok: false, error: 'The song no longer has a usable arrangement.' }

  const section = song.sections.find((s) => s.id === position.sectionId)
  if (!section) {
    // ALT-STAGE5-2-PART46/51: the referenced section was deleted/
    // changed since the pin was created -- fails safely with a clear
    // reason rather than resolving to the wrong content.
    return { ok: false, error: `The pinned section no longer exists in "${song.title}".` }
  }

  // ALT-STAGE5-2-PART28: regenerate pages fresh, against the CURRENT
  // layout -- this is the entire point. A pin taken under a 2-line
  // layout still resolves correctly if the layout later becomes 4
  // lines, because we never stored "page 3", only the semantic
  // position.
  const pages = generateSongPresentationPages(song, arrangement, layoutConfig)
  const lineIndex = position.lineIndexInSection ?? 0
  const page = pages.find(
    (p) => p.sectionId === position.sectionId && p.sectionOccurrence === position.sectionOccurrence && lineIndex >= p.startLineIndex && lineIndex <= p.endLineIndex,
  )

  if (!page) {
    // The exact occurrence/line may no longer exist (e.g. the
    // arrangement changed) -- fall back to the first page of that
    // section, or fail clearly if the section isn't in the arrangement
    // at all.
    const fallback = pages.find((p) => p.sectionId === position.sectionId)
    if (fallback) return { ok: true, song, page: fallback }
    return { ok: false, error: `"${section.label}" is not part of the song's current arrangement.` }
  }

  return { ok: true, song, page }
}
