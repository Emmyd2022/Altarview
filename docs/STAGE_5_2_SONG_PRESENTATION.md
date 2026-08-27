# Altarview — Stage 5.2: Song Presentation Layout Engine

## Architecture

```
Song content (sections, lyrics)
      ↓
Arrangement (performance order, references section IDs)
      ↓
SongPresentationLayoutConfig (maxLinesPerPage, layout id)
      ↓
generateSongPresentationPages()  -- pure, testable
      ↓
SongPresentationPage[]  -- structured, derived, never persisted long-term
      ↓
DisplayContent  -- existing conversion (in OperatorScreen/SongLyricsScreen)
      ↓
PresentationEngine  -- unchanged, still the sole output authority
```

`linesPerSlide` (a flat number on `Song`) is no longer where "how many lines at once" lives conceptually. It survives only as a legacy default-value input into the new engine's theme/song override precedence — see "Legacy linesPerSlide" below.

## Line Capacity: Theme Default → Song Override → Manual Break

Precedence (`src/song/presentation/themeLayoutDefaults.ts`, `pagination.ts`):
1. **Theme default** — `themeDefaultCapacity(category)`: Lower Third → 2, Full Screen → 4, Foldback → 6, unrecognized → 2. Deliberately *not* added to `ThemeDef` itself (Section 6's "smallest clean integration point... without destabilizing Theme") — a small, separate lookup, easily extended later.
2. **Song override** — `resolveLayoutCapacity(themeDefault, songOverride)`: when present, always wins outright, no blending.
3. **Manual page break** — scoped per-section (and optionally per-occurrence) in `pagination.ts`; wins over both when present for that specific section.

## The Section Boundary Invariant

**A presentation page can never contain lines from two different Song sections.** This is enforced by construction, not just by testing: `generateSongPresentationPages()` processes each arrangement entry's section lines in complete isolation — `paginateLines()`'s signature is just `string[]`, so it structurally cannot see any other section's data. 21 dedicated tests cover this, including the exact two examples from the brief (5 lines/capacity 2 → 2,2,1; 7 lines/capacity 3 → 3,3,1) and an explicit test proving manual breaks can never merge two sections onto one page.

## Arrangements & Repeated Sections

The generated page sequence follows the arrangement's `sectionIds` order exactly, including repeats. A repeated section (e.g. Chorus appearing 3 times) reuses the *same* `sectionId` — never duplicating lyrics — while each appearance gets its own `sectionOccurrence` (1, 2, 3...), tracked via a running per-section counter during generation.

## Presentation Page Model

```typescript
interface SongPresentationPage {
  songId, arrangementId, sectionId, sectionLabel,
  sectionOccurrence,       // 1-based repetition count
  pageIndexWithinSection,  // 0-based, within this occurrence
  startLineIndex, endLineIndex,  // into the section's own lines
  lines,
  layoutConfigId,
}
```

Never uses displayed lyric text or a bare array index as identity — every field is a structured value a future AI mapping, pin, or navigation action can reconstruct.

## Manual Breaks

`ManualPageBreakOverride { sectionId, sectionOccurrence?, afterLineIndexes[] }` — stored as presentation configuration, never written into canonical lyrics. A stale break index (pointing past a section shortened by later editing) is silently ignored, falling back to automatic chunking, rather than producing a broken page.

## Theme Integration

Deliberately minimal, per explicit instruction not to rewrite the Theme Engine this stage. `themeDefaultCapacity()` is a standalone lookup keyed by theme category, not a new field on `ThemeDef`. This keeps Theme's existing, actively-tested type completely untouched while still giving Songs a sensible default per presentation style.

## Destination Independence

`useSongPageNavigation()` is destination-*agnostic* — it tracks position within one generated page array. Independence across Preview/Live/Foldback comes from using it once per destination, each potentially fed a *different* `SongPresentationPage[]` (since Audience and Foldback can use different layout configs), never from the hook managing multiple destinations itself. This is the identical pattern already proven for Scripture's Group/Active-Verse independence in Stage 4 — verified by a dedicated test showing Live and Foldback can hold genuinely different page counts for the same song simultaneously.

## Navigation

`next()`/`previous()` move within a section's pages, then cross into the next section's first page automatically, never blending content (verified by real component test). `jumpToSection(sectionId, occurrence?)` defaults to occurrence 1 when unspecified — the documented rule for a section-jump control that doesn't otherwise know which repetition the operator means.

## Pinning

Whole-song pins (`songId` only) are unchanged. `SongPinTarget.lyricPosition` adds section- and lyric-position-level pinning: `{ sectionId, sectionOccurrence, lineIndexInSection? }`. Critically, this is a **semantic** position, never a stored page number — `resolveSongLyricPositionPin()` regenerates pages fresh against whatever layout is currently active and finds which page that semantic position now falls on. A pin taken under a 2-line layout still resolves to the correct lyrics if the layout later becomes 4 lines (verified by a dedicated test comparing resolution under two different capacities).

## Auto-Send

`useSongAutoSend(initialEnabled)` — a simple per-destination ON/OFF toggle wired into `SongLyricsScreen`'s opened-song toolbar (visible, obvious-when-enabled, no Settings trip required). When ON, clicking a slide also sends it to Live automatically, matching Scripture Auto-Send's existing UX. Explicitly **not** connected to Deepgram/AI in any way. A failed/null page generation never clears existing Live output — it reports an error instead (verified by test).

## Legacy `linesPerSlide` — Classification of Every Remaining Use

Per the required audit, every remaining occurrence is one of:
- **Legacy compatibility (field definition & defaults)**: `songModel.ts`'s `Song.linesPerSlide` field itself, and every place a new `Song` is constructed with a default value (`SongDomainRepository.create()`, `SongDraft.commitDraft()`, `DEFAULT_SONGS`, `songMigration.ts`'s preserve-existing-value fallback).
- **Migration fallback / song-override input**: `buildSlides()`'s single read of `song.linesPerSlide`, passed as the `songOverride` argument into `resolveLayoutCapacity()` — this is the field's *only* remaining functional role: feeding the new engine's precedence system, never itself the source of truth.
- **Deprecated display support**: `SongLyricsScreen.tsx`'s visible capacity input, which still reads/writes this field — the same operator-facing "lines per slide" control from before Stage 5.2, preserved exactly per Section 33's explicit "do not delete the functionality," with ownership now correctly flowing into the new layout engine underneath.

**No violation remains** — nothing treats `linesPerSlide` as canonical presentation truth independent of the new engine.

## `buildSlides()` — One Authoritative Pagination Path

Per Section 56 (Option A, "least disruptive"), `buildSlides()` is now a thin compatibility wrapper: it resolves the song's default arrangement, calls `generateSongPresentationPages()`, and converts the result back into the existing `SongSlide[]` shape (`sectionIndex` mapped from `sectionId` via each section's position in `song.sections`, preserving the exact semantic the existing section-jump UI already depends on). Every pre-existing call site — click/double-click navigation, Preview/Live/Stage sends, keyboard shortcuts, section jump — works completely unchanged. There is now exactly one authoritative pagination algorithm in the codebase.

## Future AI Readiness

A future Song Matching Engine identifies `songId` + `sectionId` + a lyric line position — never a page number. `resolveSongLyricPositionPin()`'s pattern (already built and tested) is exactly the mapping a future AI integration would reuse: semantic position in, current-layout-appropriate page out. No AI matching logic exists yet; only this resolution boundary.

## Existing Song Input Compatibility (Stage 5.1)

Quick Text Entry, TXT import, section review/editing, draft-before-save — all unaffected. None of Stage 5.1's workflow touches presentation/pagination; the full regression suite (39 Stage 5.1 tests) still passes unchanged.

## Known Limitations

- No UI yet exposes manual page-break editing directly (the domain layer fully supports it and is tested; only the operator-facing editor for choosing break points wasn't built this stage, consistent with "do not overcomplicate Stage 5.2").
- Foldback does not yet have its own visible layout-capacity control in the UI (the *architecture* fully supports a different Foldback layout, verified by test — only the UI surface for configuring it wasn't added this stage).
- Section/lyric-position pinning exists in the type and resolution logic; the pin-*creation* UI (choosing to pin a specific section or lyric position rather than the whole song) wasn't added to `SongLyricsScreen` this stage.
