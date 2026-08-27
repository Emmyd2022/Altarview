import { describe, it, expect } from 'vitest'
import { parseSongText, suggestTitleFromFilename } from './SongTextParser'

// ALT-STAGE5-1: all fixture text below is fabricated placeholder
// content, never real song lyrics -- consistent with every prior test
// file in this project.

describe('parseSongText — structured markers (Section 60.1-3)', () => {
  it('parses a [Verse 1] marker correctly', () => {
    const result = parseSongText('[Verse 1]\nfirst placeholder line\nsecond placeholder line')
    expect(result).toEqual([{ suggestedLabel: 'Verse 1', lines: ['first placeholder line', 'second placeholder line'], detectionReason: 'explicit-marker' }])
  })

  it('parses a [Chorus] marker correctly', () => {
    const result = parseSongText('[Chorus]\nchorus placeholder line')
    expect(result[0].suggestedLabel).toBe('Chorus')
  })

  it('parses a custom marker (not in any built-in list) correctly', () => {
    const result = parseSongText('[Call and Response]\nresponse placeholder line')
    expect(result[0].suggestedLabel).toBe('Call and Response')
  })

  it('parses multiple sections in sequence', () => {
    const result = parseSongText('[Verse 1]\nline a\n\n[Chorus]\nline b\n\n[Verse 2]\nline c')
    expect(result.map((s) => s.suggestedLabel)).toEqual(['Verse 1', 'Chorus', 'Verse 2'])
  })
})

describe('parseSongText — unstructured text (Section 60.4)', () => {
  it('treats blank-line-separated blocks as section candidates', () => {
    const result = parseSongText('block one line a\nblock one line b\n\nblock two line a\n\nblock three line a')
    expect(result.length).toBe(3)
    expect(result.map((s) => s.suggestedLabel)).toEqual(['Verse 1', 'Verse 2', 'Verse 3'])
    expect(result.every((s) => s.detectionReason === 'blank-line-block')).toBe(true)
  })

  it('a single block with no blank lines becomes one "Verse 1" section', () => {
    const result = parseSongText('only one block\nwith two lines')
    expect(result.length).toBe(1)
    expect(result[0].suggestedLabel).toBe('Verse 1')
  })
})

describe('parseSongText — line endings (Section 60.5-6)', () => {
  it('parses Windows CRLF text correctly', () => {
    const result = parseSongText('[Verse 1]\r\nline one\r\nline two\r\n\r\n[Chorus]\r\nline three')
    expect(result.map((s) => s.suggestedLabel)).toEqual(['Verse 1', 'Chorus'])
    expect(result[0].lines).toEqual(['line one', 'line two'])
  })

  it('parses Unix LF text correctly (baseline)', () => {
    const result = parseSongText('[Verse 1]\nline one\nline two')
    expect(result[0].lines).toEqual(['line one', 'line two'])
  })

  it('produces identical results for the same content in CRLF vs LF', () => {
    const lf = parseSongText('[Verse 1]\nline one\n\n[Chorus]\nline two')
    const crlf = parseSongText('[Verse 1]\r\nline one\r\n\r\n[Chorus]\r\nline two')
    expect(lf).toEqual(crlf)
  })
})

describe('parseSongText — Unicode (Section 60.7-8, 55-56)', () => {
  it('preserves non-Latin Unicode lyrics unaltered', () => {
    const result = parseSongText('[Verse 1]\n\u00c9glise et gr\u00e2ce\n\u4f60\u597d\u4e16\u754c')
    expect(result[0].lines).toEqual(['\u00c9glise et gr\u00e2ce', '\u4f60\u597d\u4e16\u754c'])
  })

  it('does not incorrectly normalize/rewrite original lyric text (Section 8/60.8)', () => {
    const original = '  Extra   Spacing   Preserved  '
    const result = parseSongText(`[Verse 1]\n${original}`)
    // Only leading/trailing whitespace of the WHOLE line is trimmed;
    // internal spacing is left exactly as the operator wrote it.
    expect(result[0].lines[0]).toBe('Extra   Spacing   Preserved')
  })

  it('returns an empty array for empty/whitespace-only input', () => {
    expect(parseSongText('')).toEqual([])
    expect(parseSongText('   \n\n  ')).toEqual([])
  })
})

describe('suggestTitleFromFilename (Section 60.16-17)', () => {
  it('strips the file extension', () => {
    expect(suggestTitleFromFilename('Placeholder Song Title.txt')).toBe('Placeholder Song Title')
  })

  it('handles a filename with no extension gracefully', () => {
    expect(suggestTitleFromFilename('NoExtension')).toBe('NoExtension')
  })

  it('handles a filename with multiple dots by only stripping the last extension', () => {
    expect(suggestTitleFromFilename('My.Song.Title.txt')).toBe('My.Song.Title')
  })
})
