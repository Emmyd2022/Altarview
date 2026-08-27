# Altarview — Stage 5.1: Song Input, Import, Section Editing & Library Workflow

## Input Workflows

Three input paths all converge on the same domain machinery:

```
Quick Text Entry (paste)  ──┐
TXT / Notepad import      ──┼──▶ SongTextParser ──▶ SongDraft (review) ──▶ commitDraft() ──▶ real Song
```

Per Section 59's explicit requirement, there is only **one** parsing implementation (`src/song/import/SongTextParser.ts`) — Quick Text Entry and TXT import both feed it, rather than maintaining two separate parsers.

## Parser Architecture

`parseSongText(rawText)` (`SongTextParser.ts`):
- **Line endings**: Windows CRLF and old Mac CR are both normalized to LF before parsing, so a file saved on Windows Notepad parses identically to one saved on Linux/macOS.
- **Structured markers**: `[Section Name]` brackets are recognized, matched free-text (no closed enum) — `[Call and Response]`, `[Vamp]`, any custom marker works.
- **Unstructured fallback**: with no markers, blank-line-separated blocks become section candidates, labeled `Verse 1`, `Verse 2`, etc. This is a deliberate, documented interpretation of an inherent ambiguity (a blank line *could* just be intentional spacing) — always operator-correctable in review, never silently final.
- **Unicode-safe**: no assumption of Latin script or English; only whitespace/bracket structure drives detection, so lyrics in Igbo, Yoruba, Hausa, French, Spanish, Arabic, Hebrew, or any other language pass through unaltered.
- **Original text preserved**: only leading/trailing whitespace of each full line is trimmed; internal spacing and all visible content are left exactly as written.

`suggestTitleFromFilename(filename)`: strips the file extension only. Deliberately does **not** attempt to infer a title from the first line of content — Section 28 explicitly permits leaving content untouched when confidence is uncertain, and there's no reliable way to distinguish "this line is a title" from "this line is the first lyric." The filename suggestion is always editable before save.

## Draft / Review Model

`SongDraft` (`src/song/import/SongDraft.ts`) is the temporary state between "text was pasted/imported" and "operator clicked Save" — deliberately **not** the same type as the persisted `Song`. No Section IDs exist in a draft; they're minted only by `commitDraft()`, so a cancelled draft never leaves orphaned IDs or partial data behind. This directly enables Section 29/30's "no auto-save on import/paste" rule and Section 31's "a cancelled draft should not appear in the Song Library" — verified end-to-end by a real component test (`SongLyricsScreen.import.test.tsx`) that imports a TXT file and confirms `onChangeSongs` was never called until Save is explicitly clicked.

`validateDraft()` enforces the permanent-Song minimum (non-blank title, at least one non-empty section) only at commit time — a draft with a blank title is a completely normal in-progress state before that point, per Section 22.

## Section Editing

All operations in `SongDraft.ts` are pure functions operating on `DetectedSection[]`:

- `relabelSection` — changes a label without touching lyrics (label and content are distinct data, per Section 14).
- `editSectionLyrics` — edits lyric lines, preserving line breaks.
- `reorderSections` — moves a section to a new position. This only ever operates on **draft** data; for a brand-new song, the final draft order becomes the initial default arrangement on save (Section 16's "for a newly-created Song, reordering may reasonably influence the default arrangement"). It never touches an *existing* saved song's arrangement.
- `splitSection` — splits one section into two at a chosen line index; both halves keep their content, no lyrics lost or duplicated.
- `mergeSections` — combines two **adjacent** sections' lines in order, with an optional custom label for the result; no line ever appears twice.
- `addSection` / `removeSection` — for draft data, removal is simple deletion (no arrangement exists yet to corrupt, per Section 20's explicit allowance for drafts).

## Section Suggestions Are Never a Closed List

The section review UI (existing, extended) accepts any free-text label — "Response", "Minister", "Choir", "All", "Women", "Men", "Spontaneous", "Prayer", "Declaration", or anything else a church uses. Common Western labels (Verse 1–6, Chorus, Bridge, Intro, Outro, Vamp, Interlude, Tag, etc.) are convenient suggestions, never a required schema — this matters specifically for Nigerian/African church worship structures that don't fit a rigid Verse→Chorus→Bridge template.

## TXT Import — Real Fix This Stage

**Before this stage**, "Import Song" did not actually read the selected file at all — it created a song titled from the filename with a single placeholder line ("Lyrics not yet parsed..."), committed directly to the library with no review step, silently violating the "no auto-save on import" rule that was always the intended product behavior.

**Now**: the file is read via `file.text()`, parsed through the shared `SongTextParser`, and opened in the *same* review panel Quick Text Entry uses (with the filename suggesting a title). An empty file is rejected with a clear message and no song is created. A read failure shows a clear error rather than crashing. Nothing is committed until the operator clicks Save. All verified by real component tests.

## Save — Draft Becomes a Real Song

`commitDraft(draft)` is where stable Song and Section IDs are actually generated (`crypto.randomUUID()`, per Stage 5's identity system) — never earlier. The operator never sees or types an ID. Source provenance is recorded per input method: `manual` (Quick Text Entry — this stage's TXT import also currently commits through the shared Quick Text Entry save path, so it's recorded as `manual` too; a distinct `txt-import` provenance value exists in the type for a future direct-commit path that bypasses the shared review panel). Artist stays genuinely optional — an empty string, never a fabricated "Unknown Artist."

## Existing Song Editing

Two real gaps found during Stage 5.1's required inspection and fixed:
1. **Rename** previously updated `title` but never `metadata.updatedAt` — fixed to bump it correctly while leaving `id`/`createdAt` untouched.
2. **Artist had no edit path at all** — a new "Edit Artist" option was added alongside Rename, following the identical identity-preservation pattern.

A full rich section/lyrics editor for an *already-saved* song (inline section reorder/split/merge on committed data, not just drafts) was **not** built this stage — see Known Limitations. The domain operations exist and are tested; only the richer UI surface for saved songs remains a scoped follow-up.

## Duplicate, Hymns, Search, Pinning — Unchanged, Verified

All Stage 5 guarantees (new Song ID + new Section IDs on Duplicate, Hymn status change preserving ID, domain-layer search, `songId`-based pinning surviving rename) were re-verified this stage with the full regression suite — zero regressions.

## Current Slide Logic — Still Not Canonical

`linesPerSlide` remains exactly as marked in Stage 5: legacy, non-canonical compatibility data. Nothing in this stage's new parser/draft/editing code reads or writes it, and no new feature was built to depend on it. Stage 5.2 remains free to replace it entirely without any Song data migration.

## Known Limitations

- No rich inline editor for *already-saved* songs' sections (reorder/split/merge on committed data) — only new-song drafts get the full section-editing toolkit this stage. The underlying domain functions are shared and ready.
- TXT import currently routes through the same save path as Quick Text Entry (provenance recorded as `manual`), rather than a fully distinct TXT-specific commit path — functionally equivalent, but worth noting for future provenance-reporting UI.
- Bulk "Merge Duplicates" duplicate-*detection* heuristics (normalized title/lyric similarity) were not extended this stage — existing Merge Duplicates behavior is preserved unchanged, not enhanced.

## Deferred Features (Confirmed Out of Scope, Not Implemented)

Online lyrics search/preview, AI online discovery, Deepgram, AI Song Detection, Live Lyrics, the final Presentation Layout Engine, and final Auto-Send — none implemented, per explicit instruction. The draft model's clean separation from persistence (Section 54's requirement) means a future online-search result can flow through the exact same `SongDraft` → review → `commitDraft()` (or a future "Use Once" path that never calls `commitDraft()` at all) without requiring another redesign.
