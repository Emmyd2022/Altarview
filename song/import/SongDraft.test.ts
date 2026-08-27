import { describe, it, expect } from 'vitest'
import {
  createEmptyDraft,
  draftFromParsedSections,
  relabelSection,
  editSectionLyrics,
  reorderSections,
  splitSection,
  mergeSections,
  addSection,
  removeSection,
  validateDraft,
  commitDraft,
  type SongDraft,
} from './SongDraft'
import { parseSongText } from './SongTextParser'

// ALT-STAGE5-1: fabricated placeholder fixtures throughout, never real lyrics.

describe('Draft creation (Section 60.9, 15, 20)', () => {
  it('createEmptyDraft starts with no title, no sections -- a valid pre-save state', () => {
    const draft = createEmptyDraft()
    expect(draft.title).toBe('')
    expect(draft.sections).toEqual([])
  })

  it('draftFromParsedSections wraps parser output without persisting anything', () => {
    const parsed = parseSongText('[Verse 1]\nplaceholder line')
    const draft = draftFromParsedSections(parsed, 'clipboard-paste', 'Suggested Title')
    expect(draft.title).toBe('Suggested Title')
    expect(draft.sections).toEqual(parsed)
    expect(draft.source).toBe('clipboard-paste')
  })
})

describe('Section editor operations (Section 60.21-29)', () => {
  const baseSections = parseSongText('[Verse 1]\nverse line a\nverse line b\n\n[Chorus]\nchorus line a')

  it('relabeling a section does not modify its lyrics (Section 14)', () => {
    const result = relabelSection(baseSections, 0, 'Bridge')
    expect(result[0].suggestedLabel).toBe('Bridge')
    expect(result[0].lines).toEqual(baseSections[0].lines)
  })

  it('a custom (non-standard) label works with no restriction', () => {
    const result = relabelSection(baseSections, 0, 'Minister')
    expect(result[0].suggestedLabel).toBe('Minister')
  })

  it('editing lyrics preserves line breaks as separate lines', () => {
    const result = editSectionLyrics(baseSections, 0, ['new line one', 'new line two', 'new line three'])
    expect(result[0].lines).toEqual(['new line one', 'new line two', 'new line three'])
  })

  it('reordering moves a section to a new position', () => {
    const result = reorderSections(baseSections, 1, 0) // move Chorus before Verse 1
    expect(result.map((s) => s.suggestedLabel)).toEqual(['Chorus', 'Verse 1'])
  })

  it('splitting a section at a line index creates two independent sections', () => {
    const sections = parseSongText('[Verse 1]\nline 1\nline 2\nline 3\nline 4\nline 5\nline 6')
    const result = splitSection(sections, 0, 3, 'Verse 2')
    expect(result.length).toBe(2)
    expect(result[0].lines).toEqual(['line 1', 'line 2', 'line 3'])
    expect(result[1].lines).toEqual(['line 4', 'line 5', 'line 6'])
    expect(result[1].suggestedLabel).toBe('Verse 2')
  })

  it('merging two adjacent sections combines lines without duplication', () => {
    const result = mergeSections(baseSections, 0)
    expect(result.length).toBe(1)
    expect(result[0].lines).toEqual(['verse line a', 'verse line b', 'chorus line a'])
    // No line appears twice.
    expect(new Set(result[0].lines).size).toBe(result[0].lines.length)
  })

  it('merging allows choosing a custom resulting label', () => {
    const result = mergeSections(baseSections, 0, 'Combined Section')
    expect(result[0].suggestedLabel).toBe('Combined Section')
  })

  it('adding a section appends a new, empty, operator-labeled section', () => {
    const result = addSection(baseSections, 'Bridge')
    expect(result.length).toBe(baseSections.length + 1)
    expect(result[result.length - 1]).toEqual({ suggestedLabel: 'Bridge', lines: [], detectionReason: 'explicit-marker' })
  })

  it('removing a section deletes only that section, preserving the rest in order', () => {
    const result = removeSection(baseSections, 0)
    expect(result.length).toBe(1)
    expect(result[0].suggestedLabel).toBe('Chorus')
  })
})

describe('Draft validation and Save (Section 60.11-14, 53)', () => {
  it('rejects saving with a blank title', () => {
    const draft: SongDraft = { title: '', artist: '', isHymn: false, sections: [{ suggestedLabel: 'Verse 1', lines: ['x'], detectionReason: 'blank-line-block' }], source: 'manual' }
    expect(validateDraft(draft).valid).toBe(false)
  })

  it('rejects saving with no sections at all', () => {
    const draft: SongDraft = { title: 'Has Title', artist: '', isHymn: false, sections: [], source: 'manual' }
    expect(validateDraft(draft).valid).toBe(false)
  })

  it('rejects saving when every section is empty', () => {
    const draft: SongDraft = { title: 'Has Title', artist: '', isHymn: false, sections: [{ suggestedLabel: 'Verse 1', lines: [], detectionReason: 'blank-line-block' }], source: 'manual' }
    expect(validateDraft(draft).valid).toBe(false)
  })

  it('accepts a valid draft (title + at least one non-empty section)', () => {
    const draft: SongDraft = { title: 'Valid Title', artist: '', isHymn: false, sections: [{ suggestedLabel: 'Verse 1', lines: ['x'], detectionReason: 'blank-line-block' }], source: 'manual' }
    expect(validateDraft(draft).valid).toBe(true)
  })

  it('commitDraft generates a Song ID automatically -- Section 12/24/60.12', () => {
    const draft: SongDraft = { title: 'Committed Song', artist: '', isHymn: false, sections: [{ suggestedLabel: 'Verse 1', lines: ['committed line'], detectionReason: 'blank-line-block' }], source: 'manual' }
    const song = commitDraft(draft)
    expect(song.id).toBeTruthy()
    expect(typeof song.id).toBe('string')
  })

  it('commitDraft generates stable Section IDs -- Section 60.13', () => {
    const draft: SongDraft = { title: 'X', artist: '', isHymn: false, sections: [{ suggestedLabel: 'Verse 1', lines: ['a'], detectionReason: 'blank-line-block' }, { suggestedLabel: 'Chorus', lines: ['b'], detectionReason: 'blank-line-block' }], source: 'manual' }
    const song = commitDraft(draft)
    expect(song.sections.every((s) => !!s.id)).toBe(true)
    expect(new Set(song.sections.map((s) => s.id)).size).toBe(2)
  })

  it('commitDraft records source provenance -- Section 26/60.14', () => {
    const draft: SongDraft = { title: 'X', artist: '', isHymn: false, sections: [{ suggestedLabel: 'V1', lines: ['a'], detectionReason: 'blank-line-block' }], source: 'txt-import' }
    const song = commitDraft(draft)
    expect(song.metadata.source).toBe('txt-import')
  })

  it('commitDraft sets the draft\u2019s section order as the initial default arrangement -- Section 29', () => {
    const draft: SongDraft = { title: 'X', artist: '', isHymn: false, sections: [{ suggestedLabel: 'V1', lines: ['a'], detectionReason: 'blank-line-block' }, { suggestedLabel: 'Chorus', lines: ['b'], detectionReason: 'blank-line-block' }], source: 'manual' }
    const song = commitDraft(draft)
    expect(song.arrangements[0].sectionIds).toEqual(song.sections.map((s) => s.id))
  })

  it('commitDraft leaves artist unset (empty string) rather than fabricating "Unknown Artist" -- Section 23', () => {
    const draft: SongDraft = { title: 'X', artist: '', isHymn: false, sections: [{ suggestedLabel: 'V1', lines: ['a'], detectionReason: 'blank-line-block' }], source: 'manual' }
    const song = commitDraft(draft)
    expect(song.artist).toBe('')
  })
})
