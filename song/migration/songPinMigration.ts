// ALT-STAGE5-PART38/39/40: migrates legacy title-based Song pins toward
// stable Song IDs. A legacy pin only ever had `songTitle`/`songArtist`/
// `songLines` -- no `songId`. This resolves the title against the
// CURRENT song library: if exactly one song matches, the pin is
// upgraded to carry that song's real ID. If zero or multiple songs
// match, the pin is left as a title-only pin (still fully functional --
// Open/Send already fall back to title lookup, see OperatorScreen) and
// the ambiguity is reported rather than silently guessing.

import type { PinnedItem, SongPinTarget } from '../../pinModel'
import type { Song } from '../../songModel'

export interface SongPinMigrationReport {
  resolved: number
  alreadyResolved: number
  ambiguous: { pinId: string; title: string; matchCount: number }[]
  notFound: { pinId: string; title: string }[]
}

export function migrateSongPin(pin: PinnedItem, songs: Song[]): { pin: PinnedItem; outcome: 'resolved' | 'already-resolved' | 'ambiguous' | 'not-found' | 'not-applicable' } {
  if (pin.target.type !== 'song') return { pin, outcome: 'not-applicable' }
  const target = pin.target as SongPinTarget
  if (target.songId) return { pin, outcome: 'already-resolved' }

  const matches = songs.filter((s) => s.title === target.songTitle && (!target.songArtist || s.artist === target.songArtist))

  if (matches.length === 1) {
    return {
      pin: { ...pin, target: { ...target, songId: matches[0].id } },
      outcome: 'resolved',
    }
  }
  if (matches.length === 0) {
    // ALT-STAGE5-PART40: not found -- left as a title-only pin rather
    // than dropped. It remains a valid, functional pin (Open/Send still
    // work via title lookup); it simply hasn't been upgraded to a
    // stable ID yet, and will be retried on a future migration pass if
    // a matching song later exists.
    return { pin, outcome: 'not-found' }
  }
  // ALT-STAGE5-PART40: ambiguous -- more than one song shares this
  // title/artist. Never silently pick one; leave the pin as title-only
  // and report the ambiguity so the operator (or a future UI) can
  // resolve it deliberately.
  return { pin, outcome: 'ambiguous' }
}

export function migrateSongPins(pins: PinnedItem[], songs: Song[]): { pins: PinnedItem[]; report: SongPinMigrationReport } {
  const report: SongPinMigrationReport = { resolved: 0, alreadyResolved: 0, ambiguous: [], notFound: [] }
  const migrated = pins.map((pin) => {
    const result = migrateSongPin(pin, songs)
    if (result.outcome === 'resolved') report.resolved += 1
    else if (result.outcome === 'already-resolved') report.alreadyResolved += 1
    else if (result.outcome === 'ambiguous' && pin.target.type === 'song') {
      report.ambiguous.push({ pinId: pin.id, title: (pin.target as SongPinTarget).songTitle, matchCount: songs.filter((s) => s.title === (pin.target as SongPinTarget).songTitle).length })
    } else if (result.outcome === 'not-found' && pin.target.type === 'song') {
      report.notFound.push({ pinId: pin.id, title: (pin.target as SongPinTarget).songTitle })
    }
    return result.pin
  })
  return { pins: migrated, report }
}
