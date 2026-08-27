// ALT-STAGE5-1-PART11/59: the shared Song text parser. Previously this
// logic (parseQuickEntry) lived directly inside SongLyricsScreen.tsx --
// a React component. Extracted here so both Quick Text Entry (paste)
// and TXT import feed the SAME parser, per Section 59's explicit "do
// not implement two unrelated parsing algorithms."
//
// This module has zero dependency on PresentationEngine, Deepgram,
// online search, or React -- pure text-in, structured-data-out.

// ALT-STAGE5-1-PART12: a DetectedSection is a TEMPORARY review model,
// deliberately NOT the same as the committed Song domain's LyricSection
// -- no persistent Section ID is generated here. IDs are only minted
// when a draft is actually converted/saved into a real Song (see
// SongDraft.ts), so an abandoned/cancelled draft never leaves orphaned
// IDs behind.
export interface DetectedSection {
  suggestedLabel: string
  lines: string[]
  detectionReason: 'explicit-marker' | 'blank-line-block'
}

// ALT-STAGE5-1-PART7: Windows CRLF and old Mac CR are both normalized to
// LF before parsing, so line-ending differences never affect section/
// line detection.
function normalizeLineEndings(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
}

// ALT-STAGE5-1-PART8/10: structured [Section] markers take priority when
// present; markers are free text (no closed enum) -- "[Call and
// Response]", "[Vamp]", anything the operator or source file uses is
// recognized. Falls back to blank-line-separated blocks as section
// candidates when no markers exist (Section 10). Unicode-safe throughout
// -- no assumption of English/Latin script (Section 55/56); only
// whitespace/bracket structure is used to detect boundaries, never
// language-specific rules.
export function parseSongText(rawText: string): DetectedSection[] {
  const text = normalizeLineEndings(rawText)
  if (!text.trim()) return []

  const hasBracketMarkers = /\[[^\]]+\]/.test(text)
  if (hasBracketMarkers) {
    const parts = text.split(/\[([^\]]+)\]/).filter((s) => s.trim() !== '')
    const result: DetectedSection[] = []
    for (let i = 0; i < parts.length; i += 2) {
      const label = parts[i]?.trim()
      const body = parts[i + 1]?.trim()
      if (label && body) {
        result.push({
          suggestedLabel: label,
          lines: body.split('\n').map((l) => l.trim()).filter(Boolean),
          detectionReason: 'explicit-marker',
        })
      }
    }
    return result
  }

  // ALT-STAGE5-1-PART10/54: blank lines are treated as section
  // boundaries -- the one deliberate structural interpretation this
  // parser makes. A single blank line or a run of several are both
  // treated identically (one boundary), so accidental extra blank lines
  // don't create empty phantom sections. This is a genuine ambiguity
  // (a blank line could also just be intentional spacing within a
  // section) -- documented here and in docs/STAGE_5_1_SONG_INPUT.md as
  // the chosen behavior, always operator-correctable in the review step.
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
  return paragraphs.map((p, i) => ({
    suggestedLabel: paragraphs.length > 1 ? `Verse ${i + 1}` : 'Verse 1',
    lines: p.split('\n').map((l) => l.trim()).filter(Boolean),
    detectionReason: 'blank-line-block' as const,
  }))
}

// ALT-STAGE5-1-PART27: filename-based title suggestion only -- safe,
// deterministic (strip the extension). Deliberately does NOT attempt
// first-line-of-content title inference (Section 28's "be conservative
// ... if confidence is uncertain, leave content intact"): distinguishing
// "this line is a title" from "this line is the first lyric" has no
// reliable heuristic, and Section 28 explicitly permits leaving content
// untouched rather than risking an incorrect guess that deletes a real
// lyric line. The suggestion is always editable before save regardless.
export function suggestTitleFromFilename(filename: string): string {
  const dotIndex = filename.lastIndexOf('.')
  return dotIndex > 0 ? filename.slice(0, dotIndex) : filename
}
