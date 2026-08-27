# Altarview — Song Domain Engine

## Architecture

```
Song UI (SongLyricsScreen, OperatorScreen)
      ↓
SongService (src/song/services/SongService.ts) -- the stable facade
      ↓
SongDomainRepository (src/song/repository/SongDomainRepository.ts)
      ↓
Persistence SongRepository (src/repositories/SongRepository.ts, from Stage 2, unchanged)
      ↓
StorageProvider (IndexedDB today)
```

This is an **evolution** of the existing `songModel.ts` (extended in place, not replaced), consistent with how every prior domain in this project (Bible/Scripture in Stage 4) was built.

## Song Identity

Every `Song.id` is generated via `crypto.randomUUID()` (`src/song/id.ts`) — a standard Web Crypto API, platform-safe in both the current browser prototype and a future Electron build, with no external dependency. The operator never sees or types a Song ID.

**Stability guarantees, all verified by test:** rename, lyric edits, artist changes, and hymn-status changes never regenerate the ID (they're just field updates via `SongService.update()`/`SongDomainRepository.save()`, which never touch `id`). Duplicate Song *always* generates a genuinely new ID — and, fixing a real pre-existing bug found during this stage's inspection, also generates new section and arrangement IDs, so an edit to a duplicate can never leak into the original.

## Section Identity

Each `LyricSection` now has its own `id` (`src/song/id.ts`'s `newSectionId()`), independent of its `label`. Two sections can share a label, or a label can be renamed, without breaking anything that references the section by ID. Section labels are **free text** — no closed enum — so custom structures (common in Nigerian/African church music that doesn't fit a Verse→Chorus→Bridge template) are fully supported.

## Song Model

```typescript
interface Song {
  id: string
  title: string
  artist: string
  source: 'Imported' | 'Online'
  isHymn: boolean
  linesPerSlide: number      // NOT canonical -- see "Lines-Per-Slide" below
  sections: LyricSection[]    // { id, label, lines[] }
  arrangements: SongArrangement[]  // { id, name, sectionIds[] }
  defaultArrangementId: string
  metadata: SongMetadata      // createdAt, updatedAt, source, copyright, etc.
}
```

## Arrangements

A song's **sections** (its semantic content) and its **arrangement** (performance order) are separate concepts. An arrangement is `{ id, name, sectionIds: string[] }` — an ordered list of section ID *references*. A section that repeats in performance (e.g. a chorus sung three times) appears three times in `sectionIds`, but the section's lyrics exist exactly once in `Song.sections`. Every migrated/created song gets an initial "Default" arrangement matching its existing section order — the operator sees no change from before arrangements existed internally. The model supports multiple arrangements per song (e.g. "Sunday Service" vs. "Acoustic"); Stage 5 does not build a UI for managing multiple arrangements, only the domain support for it.

**Song Version vs. Arrangement** (documented per Section 19, not built): a *version* is a different song entity with materially different lyrics (e.g. an original vs. a translated adaptation) — that's two separate `Song` objects. An *arrangement* is just a different performance order over the *same* lyrics. Stage 5 does not build version management.

## Repository & Persistence

`SongDomainRepository` wraps the existing Stage 2 `SongRepository` (pure `IndexedDB`-backed persistence, unchanged) with domain operations: `create`, `get`, `duplicate`, `save`, `delete`. The React UI never touches `StorageProvider` or the Stage 2 repository directly.

## Legacy Song Migration

`src/song/migration/songMigration.ts` backfills whatever a pre-Stage-5 song is missing (section IDs, arrangements, `defaultArrangementId`, metadata) without touching title/artist/lyrics/hymn-status. It's idempotent at the field level: a song already fully current passes through unchanged, and a song migrated once keeps the *same* generated ID on every subsequent pass (verified by a dedicated idempotency test) — the migration never re-mints a fresh ID for something that already has one.

**A genuine correction made during this stage**: `DEFAULT_SONGS` (the seed library) previously still contained short excerpts of copyrighted contemporary worship songs, flagged in an earlier session with replacements planned but never applied. Since this stage required migrating that exact seed data into the new model anyway, the three affected entries were replaced with genuinely public-domain 19th-century hymn text as part of that work.

## Search

`src/song/search/songSearch.ts` searches title, artist, and lyrics with Unicode-safe (NFKC) normalization — case, punctuation, whitespace, and apostrophe-variant insensitive. Normalization is purely derived/rebuildable; original lyric text is never altered. Manual search and future AI matching are deliberately *not* forced into one function (Section 26) — this module only implements the former.

## Pin Migration

`SongPinTarget` gained `songId` as the canonical identity (Stage 4.2 deliberately deferred this). `src/song/migration/songPinMigration.ts` resolves legacy title-only pins against the live song library: exactly one match → resolved to that `songId`; zero or multiple matches → left as a still-functional title-only pin, with the ambiguity/absence reported rather than guessed at. `OperatorScreen`'s Open/Send both prefer `songId` when present, falling back to title lookup only for an unresolved legacy pin.

## Current Slide Logic — NOT Canonical

`buildSlides()` (`songModel.ts`, unmodified this stage) still reads `Song.sections`/`Song.linesPerSlide` to derive presentation slides, exactly as before. `linesPerSlide` is explicitly documented in the type itself as **not canonical domain data** — a compatibility field the current UI still reads, which Stage 5.2's Presentation Layout Engine will replace with real layout logic (max lines, phrase boundaries, orphan-line avoidance, manual overrides) driven by sections/arrangements. Because `buildSlides()` was never touched and lyrics/sections/arrangements are stored independently of it, Stage 5.2 can replace it without any Song data migration.

## Future AI Matching Boundary

`SongMatchCandidate` (`src/song/services/SongService.ts`) — `{ songId, confidence, sectionId?, lyricPosition? }` — exists purely as the future integration boundary a Song Matching Engine would hand back. No confidence algorithm, no matching logic, nothing produces this type today.

```
                     MICROPHONE
                         │
                         ▼
                      DEEPGRAM
                         │
                         ▼
                     TRANSCRIPT
                         │
                         ▼
                 SONG MATCHING ENGINE
                         │
                ┌────────┴────────┐
                │                 │
                ▼                 ▼
           LOCAL LIBRARY    OPTIONAL ONLINE
                │              DISCOVERY
                │                 │
                └────────┬────────┘
                         ▼
                     SONG MATCH
                         │
                         ▼
                LYRIC POSITION
                         │
                         ▼
               PRESENTATION LAYOUT
                         │
                         ▼
                 PRESENTATIONENGINE
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
           PREVIEW      LIVE     FOLDBACK
```

If no match exists: `TRANSCRIPT → LIVE LYRICS STABILIZATION → optional temporary presentation`, while matching continues in the background. None of this is implemented in Stage 5 — the Song domain is simply structured so a future match result (or a temporary, never-permanently-saved discovered song, per the future "Use Once" requirement) can be handed to it without another redesign.

**Separation of responsibilities, unchanged from the rest of this project**: the Song domain knows about songs. A future AI layer interprets speech. `PresentationEngine` controls where the result goes. `SongDomainRepository` never manipulates `Preview`/`Live`/`Foldback` — confirmed by the Stage 5 output-state audit finding zero new violations.
