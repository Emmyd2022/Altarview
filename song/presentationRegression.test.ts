import { describe, it, expect } from 'vitest'
import { buildSlides, type Song } from '../songModel'

// ALT-STAGE5-PART14/38: buildSlides() itself was NOT modified this
// stage -- confirms the existing lines-per-slide presentation logic
// still works correctly against the extended Song type, and remains
// purely DERIVED from sections/linesPerSlide (never mutates them).
const SONG: Song = {
  id: 'regression-song',
  title: 'Regression Test Song',
  artist: 'Test Artist',
  source: 'Imported',
  isHymn: false,
  linesPerSlide: 2,
  sections: [
    { id: 'sec1', label: 'Verse 1', lines: ['line 1', 'line 2', 'line 3', 'line 4', 'line 5'] },
    { id: 'sec2', label: 'Chorus', lines: ['chorus a', 'chorus b'] },
  ],
  arrangements: [{ id: 'arr1', name: 'Default', sectionIds: ['sec1', 'sec2'] }],
  defaultArrangementId: 'arr1',
  metadata: { createdAt: 1, updatedAt: 1 },
}

describe('buildSlides regression (Section 56.38, unchanged logic)', () => {
  it('splits a 5-line section at 2 lines/slide into [2, 2, 1] -- never bleeding into the next section', () => {
    const slides = buildSlides(SONG)
    const verse1Slides = slides.filter((s) => s.sectionLabel === 'Verse 1')
    expect(verse1Slides.map((s) => s.lines.length)).toEqual([2, 2, 1])
    expect(verse1Slides[2].lines).toEqual(['line 5']) // the orphan line, alone -- not merged with Chorus
  })

  it('does not mutate the original section lines', () => {
    const before = JSON.stringify(SONG.sections)
    buildSlides(SONG)
    expect(JSON.stringify(SONG.sections)).toBe(before)
  })

  it('every slide carries the correct stable songId (Section 42/43: presentation position vs. content identity)', () => {
    const slides = buildSlides(SONG)
    expect(slides.every((s) => s.songId === 'regression-song')).toBe(true)
  })
})
