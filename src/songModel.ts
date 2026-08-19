// ALT-044: real song data model with structured lyrics, and the
// lines-per-slide splitting logic: given a section's lines and a
// lines-per-slide count, produce slides that never cross a section
// boundary. Example from spec: a 5-line verse at 2 lines/slide produces
// slides of [2, 2, 1] lines -- not [2, 2, 2] bleeding into the next
// section's first line.

export interface LyricSection {
  label: string
  lines: string[]
}

export interface Song {
  id: string
  title: string
  artist: string
  source: 'Imported' | 'Online'
  isHymn: boolean
  linesPerSlide: number
  sections: LyricSection[]
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
export const DEFAULT_SONGS: Song[] = [
  {
    id: '1',
    title: 'Amazing Grace',
    artist: 'John Newton',
    source: 'Imported',
    isHymn: true,
    linesPerSlide: 2,
    sections: [
      { label: 'Verse 1', lines: ['Amazing grace, how sweet the sound', 'That saved a wretch like me', 'I once was lost, but now am found', 'Was blind but now I see'] },
      { label: 'Verse 2', lines: ["'Twas grace that taught my heart to fear", 'And grace my fears relieved', 'How precious did that grace appear', 'The hour I first believed'] },
    ],
  },
  {
    id: '2',
    title: 'Great Is Thy Faithfulness',
    artist: 'Thomas O. Chisholm',
    source: 'Imported',
    isHymn: true,
    linesPerSlide: 2,
    sections: [
      { label: 'Verse 1', lines: ['Great is Thy faithfulness, O God my Father', 'There is no shadow of turning with Thee'] },
      { label: 'Chorus', lines: ['Great is Thy faithfulness!', 'Great is Thy faithfulness!', 'Morning by morning new mercies I see'] },
    ],
  },
  {
    id: '3',
    title: 'Way Maker',
    artist: 'Sinach',
    source: 'Online',
    isHymn: false,
    linesPerSlide: 2,
    sections: [
      { label: 'Verse', lines: ['You are here, moving in our midst', 'I worship You, I worship You'] },
      { label: 'Chorus', lines: ['Way maker, miracle worker', 'Promise keeper, light in the darkness', 'My God, that is who You are'] },
    ],
  },
  {
    id: '4',
    title: 'Holy, Holy, Holy',
    artist: 'Reginald Heber',
    source: 'Imported',
    isHymn: true,
    linesPerSlide: 2,
    sections: [
      { label: 'Verse 1', lines: ['Holy, holy, holy! Lord God Almighty!', 'Early in the morning our song shall rise to Thee', 'Holy, holy, holy! Merciful and mighty!', 'God in three Persons, blessed Trinity!'] },
    ],
  },
  {
    id: '5',
    title: 'Oceans (Where Feet May Fail)',
    artist: 'Hillsong UNITED',
    source: 'Online',
    isHymn: false,
    linesPerSlide: 2,
    sections: [
      { label: 'Verse 1', lines: ['You call me out upon the waters', 'The great unknown where feet may fail'] },
      { label: 'Chorus', lines: ['Spirit lead me where my trust is without borders', 'Let me walk upon the waters', 'Wherever You would call me'] },
    ],
  },
  {
    id: '6',
    title: 'This Is Amazing Grace',
    artist: 'Phil Wickham',
    source: 'Online',
    isHymn: false,
    linesPerSlide: 2,
    sections: [
      { label: 'Verse 1', lines: ['Who breaks the power of sin and darkness', 'Whose love is mighty and so much stronger'] },
      { label: 'Chorus', lines: ['This is amazing grace', 'This is unfailing love', 'That You would take my place'] },
    ],
  },
]
