# Altarview — Stage 5.2.1: Song Presentation UI Completion

## New Component

`src/screens/SongPresentationLayoutPanel.tsx` — mounted into the existing opened-song view (`SongLyricsScreen.tsx`), additive rather than a redesign. Built directly on the real Stage 5.2 engine (`generateSongPresentationPages`, `useSongPageNavigation`, `useManualPageBreaks`, `resolveSongLyricPositionPin`), not the old `buildSlides()` compatibility path — destination-specific capacities and manual breaks genuinely require the richer page model the old path can't express.

## Manual Page Break UI

Between adjacent lyric lines, a compact "+ Page Break" control toggles to "Page Break (click to remove)" when active. Changes feed directly into `generateSongPresentationPages()`'s `manualBreaks` option — pages regenerate immediately, with **no save step required** for previewing the layout change. Breaks are stored via `useManualPageBreaks`, purely session/UI state, never written into `Song.sections`.

## Destination-Specific Line Capacity

Audience and Foldback each have their own capacity input in the panel, driving two independently-generated `SongPresentationPage[]` arrays (`audiencePages`/`foldbackPages`), each with its own `useSongPageNavigation` instance. Verified by test: changing one never touches the other's page count or position.

## Theme Default / Override Precedence

Unchanged from Stage 5.2 — `resolveLayoutCapacity(themeDefault, songOverride)`. The panel's Audience/Foldback inputs are the "song/destination override" layer in that precedence; a reset-to-theme-default action was not added this stage (see Known Limitations).

## Granular Pinning

Three buttons: **Pin Song** (`songId` only), **Pin Section** (`songId` + `sectionId` + `sectionOccurrence`, no line position), **Pin Current Slide** (`songId` + `sectionId` + `sectionOccurrence` + `lineIndexInSection` — the exact starting line of the current page). All three construct `SongPinTarget` with structured identity — never a page number, never title/label-only. Opening a section or lyric-position pin does not automatically send to Live; only navigates/selects, matching Section 18's explicit requirement.

## Layout-Change Pin Resolution

Unchanged mechanism from Stage 5.2 (`resolveSongLyricPositionPin`), now genuinely exercised by real UI-created pins: a pin taken under one capacity resolves to the same lyrics under a different capacity, verified by test comparing resolution at two different `maxLinesPerPage` values.

## Repeated-Section Navigation — Resolved Ambiguity

Stage 5.2's report flagged this as unresolved. Now explicit: `jumpToSection(sectionId)` moves to the **next occurrence relative to the current position** in the arrangement sequence, wrapping to the first occurrence if none is later. Verified against the brief's exact worked example (arrangement `Verse1, Chorus, Verse2, Chorus, Bridge, Chorus`):

| Current position | Press "Chorus" → |
|---|---|
| Verse 1 | Chorus occurrence 1 |
| Verse 2 | Chorus occurrence 2 |
| Bridge | Chorus occurrence 3 |
| Chorus occurrence 3 | wraps to Chorus occurrence 1 |

A separate `jumpToSectionOccurrence(sectionId, occurrence)` remains for callers needing a *specific* occurrence (e.g. pin resolution), rather than "next relative to current."

## Next/Previous After a Section Jump

Continues from whichever occurrence was jumped to, in arrangement order — verified by test (jumping to Chorus occurrence 2, then Next, lands on Bridge; jumping to Bridge, then Previous, lands back on Chorus occurrence 2).

## Auto-Send

The panel **reuses the existing Stage 5.2 Auto-Send toggle** (passed in as a prop) rather than introducing a second, duplicate control — a real bug caught during integration (the panel initially had its own separate `useSongAutoSend` instance, producing two independent "Auto-Send OFF" buttons on screen simultaneously). Section jump now participates in the same Auto-Send semantics as ordinary navigation: OFF means no automatic Live update; ON means the newly-selected page is sent automatically. Foldback has no Auto-Send instance of its own in this stage — Audience Auto-Send never forces it.

## Preview / Live / Foldback Independence

Unaffected — the panel calls `onSendPreview`/`onSendLive` exactly as any other Song-sending code path already did, through the same props `App.tsx` routes to `PresentationEngine`. No new output-state ownership was introduced (confirmed by audit below).

## Presentation Config Persistence Scope

Manual breaks and destination capacities introduced this stage are **session/UI state only** — they reset when the Song is closed and reopened, or on page reload. No architecture change was made to persist them with the Song, a service, or a preset, consistent with the brief's explicit "do not invent a full service override system" and "implement only the currently supportable scopes." A future stage introducing session/service-level presentation preferences can add a persistence layer without redesigning this panel's data flow — it already reads capacity/breaks as plain inputs into `generateSongPresentationPages()`.

## Section Boundary Invariant

Unchanged and re-verified: the underlying `generateSongPresentationPages()` (Stage 5.2, untouched this stage) still enforces the invariant by construction. All 21 original pagination tests, plus new tests specifically exercising manual breaks through the panel's UI, continue to pass.

## Known Limitations

- No "reset to theme default" action was added for Audience/Foldback capacity — the operator can type the theme's default value manually, but there's no one-click reset button.
- Manual breaks and destination capacities are session-only; nothing persists them across a reload (see Persistence Scope above — intentional, not an oversight, per explicit instruction not to build a full override-scope system this stage).
- Foldback has no independent Auto-Send toggle in the UI — only Audience's exists, matching Section 28's UI-polish guidance ("does not force Foldback to follow Audience") but also meaning Foldback navigation from this panel never auto-sends anywhere on its own.
