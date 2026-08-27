// ALT-STAGE4-2: generic Pin architecture. Replaces the old
// one-giant-optional-field PinnedItem (verseRef?, songTitle?, slideText?,
// timerMinutes?, upNextStyleId? all flat on one interface) with a proper
// discriminated union -- adding a new pinnable content type (media,
// future song sections, etc.) means adding one new PinTarget variant,
// not touching every existing call site.
//
// IDENTITY vs DISPLAY: a target stores the stable domain identity needed
// to RESOLVE the content later (for Scripture: a structured
// PassageReference, never a display string). `label`/`detail` on
// PinnedItem itself are for display only and are never used as identity
// anywhere in this file or its consumers.

import type { PassageReference } from './scripture/types'

// ALT-STAGE4-2-PART6: Scripture pins now store the actual Stage 4
// PassageReference -- the same canonical type ScriptureEngine/
// ScriptureRepository use everywhere else -- instead of a `verseRef`
// display string. This is the concrete migration this stage exists for.
export interface ScripturePinTarget {
  type: 'scripture'
  reference: PassageReference
}

// ALT-STAGE4-2-PART12B: Song pins are preserved close to their current
// shape (title/artist/lines) -- Stage 5's Song Engine will introduce a
// stable songId; this stage does not invent that model early, per the
// brief's explicit instruction not to build it here.
export interface SongPinTarget {
  type: 'song'
  songTitle: string
  songArtist?: string
  songLines: string[]
}

// ALT-STAGE4-2-PART12C/13: `slideText` remains the identity for now (no
// deck/slide domain engine exists yet). `deckId`/`slideId` are optional
// so a future Slide Engine can populate them without another type
// migration -- this is the "don't implement the engine, but don't box
// the type in so narrowly it becomes impossible later" requirement.
export interface SlidePinTarget {
  type: 'slide'
  slideText: string
  deckId?: string
  slideId?: string
}

export interface TimerPinTarget {
  type: 'timer'
  minutes: number
}

export interface UpNextPinTarget {
  type: 'up-next'
  styleId?: string
}

// ALT-STAGE4-2-PART12D/31: no Media Engine exists yet -- this variant
// exists purely so the type system can represent a future media pin
// without a later breaking change, per Section 31's explicit
// "architecturally ready, not implemented" requirement.
export interface MediaPinTarget {
  type: 'media'
  mediaId: string
}

export type PinTarget = ScripturePinTarget | SongPinTarget | SlidePinTarget | TimerPinTarget | UpNextPinTarget | MediaPinTarget

export interface PinnedItem {
  id: string
  label: string
  detail?: string
  createdAt: number
  target: PinTarget
}

let counter = 0
export function newPinId() {
  counter += 1
  return `pin-${counter}`
}
