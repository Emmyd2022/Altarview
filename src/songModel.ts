// ALT-044: real song data model with structured lyrics, and the
// lines-per-slide splitting logic: given a section's lines and a
// lines-per-slide count, produce slides that never cross a section
// boundary. Example from spec: a 5-line verse at 2 lines/slide produces
// slides of [2, 2, 1] lines -- not [2, 2, 2] bleeding into the next
// section's first line.

import { newSongId, newSectionId, newArrangementId } from './song/id'

// ALT-STAGE5-PART11: each section now has its own stable identity,
// independent of its label -- two sections can share a label (or a
// label can be renamed) without breaking anything that references the
// section by ID (arrangements, future pinning, future AI tracking).
export interface LyricSection {
  id: string
  label: string
  lines: string[]
}

// ALT-STAGE5-PART16/17: an arrangement is a PERFORMANCE ORDER over a
// song's sections -- it references section IDs, never copies lyrics,
// even when a section (e.g. a chorus) repeats multiple times in the
// arrangement. A song's existing section order becomes its initial
// default arrangement during migration (see src/song/migration/).
export interface SongArrangement {
  id: string
  name: string
  sectionIds: string[]
}

export type SongSourceType = 'manual' | 'clipboard-paste' | 'txt-import' | 'structured-import' | 'online-lyrics' | 'ai-discovery' | 'migrated-prototype-data'

// ALT-STAGE5-PART20/21: automatically-maintained provenance/timestamps.
// Fields that aren't safely inferable are left undefined rather than
// fabricated.
export interface SongMetadata {
  createdAt: number
  updatedAt: number
  source?: SongSourceType
  externalSourceId?: string
  copyright?: string
  license?: string
}

export interface Song {
  id: string
  title: string
  artist: string
  source: 'Imported' | 'Online'
  isHymn: boolean
  // ALT-STAGE5-PART4/14/15: NOT canonical domain data. This is a
  // temporary compatibility field the EXISTING buildSlides()/
  // presentation code below still reads -- purely derived presentation
  // state, kept only so the current Operator UI keeps working unchanged.
  // Stage 5.2's Presentation Layout Engine will replace this with real
  // layout logic (max lines, phrase boundaries, orphan-line avoidance,
  // etc.) driven by sections/arrangements, not this flat number. Do not
  // build new features that treat this field as authoritative.
  linesPerSlide: number
  sections: LyricSection[]
  // ALT-STAGE5-PART16/17: always present after migration -- every song
  // has at least a "Default" arrangement, initially matching its
  // section order.
  arrangements: SongArrangement[]
  defaultArrangementId: string
  metadata: SongMetadata
}

export interface SongSlide {
  songId: string
  sectionLabel: string
  sectionIndex: number
  slideIndexInSection: number
  totalSlidesInSection: number
  lines: string[]
}

// The core algorithm: chunk each section's lines into groups of
// `linesPerSlide`, never spilling into the next section. A 5-line
// section at 2 lines/slide -> [[l1,l2],[l3,l4],[l5]].
export function buildSlides(song: Song): SongSlide[] {
  const slides: SongSlide[] = []
  song.sections.forEach((section, sectionIndex) => {
    const chunks: string[][] = []
    for (let i = 0; i < section.lines.length; i += song.linesPerSlide) {
      chunks.push(section.lines.slice(i, i + song.linesPerSlide))
    }
    chunks.forEach((chunk, slideIndexInSection) => {
      slides.push({
        songId: song.id,
        sectionLabel: section.label,
        sectionIndex,
        slideIndexInSection,
        totalSlidesInSection: chunks.length,
        lines: chunk,
      })
    })
  })
  return slides
}

// Jump straight to the first slide of a given section (e.g. "go to
// Chorus" or "go to Verse 2") -- returns the flat slide index.
export function firstSlideIndexForSection(slides: SongSlide[], sectionIndex: number): number {
  const idx = slides.findIndex((s) => s.sectionIndex === sectionIndex)
  return idx === -1 ? 0 : idx
}
// ALT-STAGE5-PART24: seed/default library. IDs below are generated via
// the same robust ID mechanism (crypto.randomUUID()) used for every
// song the operator creates -- called once at module load; if nothing
// is persisted yet (first run), these become the initial library and
// are immediately persisted from then on, exactly like any other song
// (see App.tsx's load effect). If songs are already persisted, this
// array is never used at all.
//
// ALT-STAGE5-COPYRIGHT-FIX: three entries in this list previously
// contained short excerpts from copyrighted contemporary worship songs
// (Way Maker, Oceans, This Is Amazing Grace). This was flagged earlier
// in the project with replacements planned but never applied. Since
// Stage 5 already requires migrating this exact seed data into the new
// domain model, this is the correct place to also complete that
// correction -- all three are now genuinely public-domain 19th-century
// hymns instead.
function defaultArrangementFor(sections: LyricSection[]): SongArrangement {
  return { id: newArrangementId(), name: 'Default', sectionIds: sections.map((s) => s.id) }
}

function makeDefaultSong(input: {
  title: string
  artist: string
  source: 'Imported' | 'Online'
  isHymn: boolean
  sections: { label: string; lines: string[] }[]
}): Song {
  const sections: LyricSection[] = input.sections.map((s) => ({ id: newSectionId(), label: s.label, lines: s.lines }))
  const arrangement = defaultArrangementFor(sections)
  const now = Date.now()
  return {
    id: newSongId(),
    title: input.title,
    artist: input.artist,
    source: input.source,
    isHymn: input.isHymn,
    linesPerSlide: 2,
    sections,
    arrangements: [arrangement],
    defaultArrangementId: arrangement.id,
    metadata: { createdAt: now, updatedAt: now, source: 'migrated-prototype-data' },
  }
}

export const DEFAULT_SONGS: Song[] = [
  makeDefaultSong({
    title: 'Amazing Grace',
    artist: 'John Newton',
    source: 'Imported',
    isHymn: true,
    sections: [
      { label: 'Verse 1', lines: ['Amazing grace, how sweet the sound', 'That saved a wretch like me', 'I once was lost, but now am found', 'Was blind but now I see'] },
      { label: 'Verse 2', lines: ["'Twas grace that taught my heart to fear", 'And grace my fears relieved', 'How precious did that grace appear', 'The hour I first believed'] },
    ],
  }),
  makeDefaultSong({
    title: 'Great Is Thy Faithfulness',
    artist: 'Thomas O. Chisholm',
    source: 'Imported',
    isHymn: true,
    sections: [
      { label: 'Verse 1', lines: ['Great is Thy faithfulness, O God my Father', 'There is no shadow of turning with Thee'] },
      { label: 'Chorus', lines: ['Great is Thy faithfulness!', 'Great is Thy faithfulness!', 'Morning by morning new mercies I see'] },
    ],
  }),
  makeDefaultSong({
    title: 'Blessed Assurance',
    artist: 'Fanny Crosby',
    source: 'Imported',
    isHymn: true,
    sections: [
      { label: 'Verse 1', lines: ['Blessed assurance, Jesus is mine', 'Oh, what a foretaste of glory divine'] },
      { label: 'Chorus', lines: ['This is my story, this is my song', 'Praising my Savior all the day long'] },
    ],
  }),
  makeDefaultSong({
    title: 'Holy, Holy, Holy',
    artist: 'Reginald Heber',
    source: 'Imported',
    isHymn: true,
    sections: [
      { label: 'Verse 1', lines: ['Holy, holy, holy! Lord God Almighty!', 'Early in the morning our song shall rise to Thee', 'Holy, holy, holy! Merciful and mighty!', 'God in three Persons, blessed Trinity!'] },
    ],
  }),
  makeDefaultSong({
    title: 'It Is Well with My Soul',
    artist: 'Horatio Spafford',
    source: 'Imported',
    isHymn: true,
    sections: [
      { label: 'Verse 1', lines: ['When peace, like a river, attendeth my way', 'When sorrows like sea billows roll'] },
      { label: 'Chorus', lines: ['It is well with my soul', 'It is well, it is well with my soul'] },
    ],
  }),
  makeDefaultSong({
    title: 'What a Friend We Have in Jesus',
    artist: 'Joseph M. Scriven',
    source: 'Imported',
    isHymn: true,
    sections: [
      { label: 'Verse 1', lines: ['What a friend we have in Jesus', 'All our sins and griefs to bear'] },
      { label: 'Verse 2', lines: ['Have we trials and temptations?', 'Is there trouble anywhere?'] },
    ],
  }),
]
