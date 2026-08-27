# Altarview — Pin Architecture

## Overview

Pinning is a cross-application capability, not a Scripture-only feature. `PinnedItem` (in `src/pinModel.ts`) stores a stable domain identity (a `PinTarget`) plus display metadata — never the other way around. A pin is a reference/shortcut, not ownership of the underlying content: deleting a pin never deletes the content it points to.

```typescript
interface PinnedItem {
  id: string
  label: string       // display only
  detail?: string      // display only
  createdAt: number
  target: PinTarget    // the actual stable identity
}
```

`PinTarget` is a discriminated union — `target.type === 'scripture'` narrows to a `ScripturePinTarget` at compile time, with no unsafe casting anywhere in the codebase (verified by a dedicated test in `src/core/pinPersistence.test.tsx`).

## Real Now vs. Architecturally Ready

| Type | Status | Identity stored |
|---|---|---|
| Scripture | **Real** | `PassageReference` (the Stage 4 canonical type — `translationId`/`bookId`/`startChapter`/`startVerse`/`endChapter`/`endVerse`) |
| Song | Real (preserved from before) | `songTitle`/`songArtist`/`songLines` — a future Song Engine will introduce a stable `songId`; not built here |
| Slide | Real (preserved from before) | `slideText`, with optional `deckId`/`slideId` already in the type for a future Slide Engine to populate |
| Timer | Real (preserved from before) | `minutes` |
| Up Next | Real (preserved from before) | `styleId` |
| Media | **Architecturally ready only** | `mediaId` — the type exists so a future Media Engine doesn't require another pin-model migration; no media engine exists yet, and this variant is not currently reachable from any UI |

## How a Future Domain Adds a New Pinnable Content Type

1. **Define the `PinTarget` variant** in `src/pinModel.ts` — a new interface with `type: 'yourType'` plus whatever stable identity fields that domain needs (an ID, never rendered text).
2. **Add it to the `PinTarget` union.**
3. **Implement resolution** — given the target, how does the domain look up the actual content? (For Scripture: `scriptureEngine.getPassage(reference)`.)
4. **Implement Open behavior** in `OperatorScreen.openPinnedItem()` — switch to the relevant page and reconstruct the UI state from the target's stable identity, never from a cached display string.
5. **Implement Send behavior** in `OperatorScreen.sendPinnedItem()`, if the content is presentable — resolve the target to `DisplayContent`, then call the existing `onSendPreviewContent`/`onSendLiveContent`/`onSendStageContent` props. **Never** introduce a new output-state setter; these props are already routed through `PresentationEngine`.
6. **Add persistence tests** — round-trip through `PinnedRepository`, confirm the new target shape serializes/deserializes correctly.
7. **Add stale-target handling** — if the underlying content can be deleted independently of the pin (e.g. a media file), decide what `openPinnedItem`/`sendPinnedItem` should do when resolution fails (a graceful "target unavailable" state, not a crash). No generic stale-target UI exists yet; each domain currently handles this narrowly (e.g. Scripture's resolution returns `null` for an unavailable passage, and calling code checks for that).

## Migration (Legacy Data)

`src/core/pinMigration.ts` converts pre-Stage-4.2 flat-shape pins (`verseRef: string`, etc.) into the current `target`-based shape, using the same canonical reference parser as everywhere else in the Scripture domain. It runs once, automatically, on app load (`App.tsx`), and is idempotent — running it again on already-migrated data is a safe no-op. A pin that can't be migrated (malformed legacy data) is dropped with a console warning; it never crashes the load or drops other valid pins in the same collection.

New pins are **never** created via the legacy path — `openPinnedItem`/`togglePin`/every `onPin` call site across the app constructs the current `target` shape directly, from creation onward.
