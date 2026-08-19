// ALT: expanded Pinned section -- supports pinning any resource type
// (verse, song slide, sermon slide, timer preset, Up Next transition),
// not just scriptures. Each type carries the data it needs to be
// re-sent (or re-launched) later with one click.

export type PinnedItemType = 'verse' | 'song' | 'slide' | 'timer' | 'up-next'

export interface PinnedItem {
  id: string
  type: PinnedItemType
  label: string
  detail?: string

  // verse
  verseRef?: string
  verseTranslation?: string
  verseText?: string

  // song (a specific slide within a song)
  songTitle?: string
  songArtist?: string
  songLines?: string[]

  // sermon slide
  slideText?: string

  // timer preset
  timerMinutes?: number

  // Up Next transition
  upNextStyleId?: string
}

let counter = 0
export function newPinId() {
  counter += 1
  return `pin-${counter}`
}
