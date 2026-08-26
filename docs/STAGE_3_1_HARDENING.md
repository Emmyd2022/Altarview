# Altarview — Stage 3.1: Presentation Engine Hardening + Automated Testing

## Testing Stack

- **Vitest** (test runner, integrates natively with the existing Vite build)
- **@testing-library/react** + **@testing-library/jest-dom** (component testing)
- **@testing-library/user-event** (installed, available for future interaction-heavy tests)
- **jsdom** (browser-like test environment)
- **@vitest/coverage-v8** (coverage reporting)

No Jest was introduced, per the brief's preference — Vitest shares Vite's config and transform pipeline directly, so no separate build step or babel config was needed.

## How to Run Tests

```
npm run test           # run once, exit (used for verification in this stage)
npm run test:watch     # watch mode, re-runs on file save
npm run test:coverage  # run once with a coverage report
```

Configuration lives in `vite.config.ts`'s `test` block. Note: `defineConfig` is imported from `vitest/config` rather than plain `vite` — this was a real fix made during this stage (see Corrections Made below), required for `tsc --noEmit` to recognize the `test` config field's types.

## Architecture Findings (Section 2 Audit)

A full search was run across `src/` for every pattern the brief specified: `setLive`, `setPreview`, `setFoldback`, `setStageContent`, direct output-state setters, duplicated output state, local React state representing Live/Foldback/Preview, and shared-mutable-object risk in `sendToBoth`.

**Result: zero violations found.** The only three `useState<DisplayContent>` declarations in the entire codebase are the three inside `PresentationEngine.ts` (`preview`, `live`, `foldback`) — exactly as the architecture requires. No screen, hook, or component manipulates output state directly; every send/clear/navigate action goes through the engine's command API.

Two incidental matches were investigated and confirmed to be unrelated:
- `App.tsx`'s `onSetLiveSecondary={(t, x) => engine.setLiveSecondaryTranslation(...)}` — a legitimate call *into* the engine, not a violation.
- `UpNextScreen.tsx`'s `setPreviewSessionId` — controls which session is shown in the Up Next preview dropdown; unrelated to the Presentation Engine's Preview destination despite the naming coincidence.

## Corrections Made

1. **`vite.config.ts`**: changed `import { defineConfig } from 'vite'` to `import { defineConfig } from 'vitest/config'`. Vitest's `test` config field isn't recognized by plain Vite's config types; this is the standard, documented fix. No other config values changed.

No corrections were required to `PresentationEngine.ts` itself, `useStageTimer.ts`, `StageControlScreen.tsx`, or `OutputStage.tsx` — Stage 3's implementation held up under the automated tests written this stage without needing changes.

## PresentationEngine Guarantees (Verified by Automated Test, Not Just Code Reading)

- `sendToBoth()` does share an initial object reference between `live` and `foldback`, but `navigateContent()` never mutates in place — it always returns a new object literal — so the shared reference is safe. This was the single most important thing to verify with a *real* running test rather than just reasoning about the code, and it holds: see `PresentationEngine.test.ts`'s "Live/Foldback independence" describe block, in particular the "after Send to Both, destinations navigate independently in both directions" test, which reproduces Section 8's exact example sequence and passes.
- Every `clear*()` command nulls exactly one destination; the other two are asserted unchanged in the same test.
- The command log correctly distinguishes per-command destination (`sendToBoth` has no single destination, by design) and caps at 50 entries.
- `navigateContent()` does not mutate the object passed to it (explicit immutability test included).

## Known Limitations

- **Slide deck navigation remains unconnected** to `PresentationEngine`, exactly as Stage 3's own audit found. `SlideDisplayContent.deckId`/`slideIndex` fields exist in the type; `navigateContent()` returns slide content unchanged (a documented no-op), since no shared deck data structure exists yet to navigate against. This is confirmed both by code inspection and by an explicit test (`navigateContent` "returns the same content unchanged for a slide with no deck info").
- **Component test coverage is intentionally partial**, per Section 15/16's own instruction not to test every pixel. `StageControlScreen` and `OutputStage` are covered; `OperatorScreen` (the largest, most complex screen) was not given a full render-based test suite this stage — its Scripture/Songs navigation logic is exercised indirectly through `PresentationEngine.test.ts`, since that's where the actual navigation logic lives (`navigateContent`), not in `OperatorScreen` itself.
- **AI, Electron, and streaming integration remain unbuilt**, as explicitly instructed. The engine's public API (`sendToLive(content)`, etc.) is plain function calls with no DOM/window/document coupling — verified by inspection of `PresentationEngine.ts`'s imports (only `react`, `../songModel`, `../bibleModel`, and its own types; nothing browser-specific).

## Recommendations for Stage 4

- The Presentation Engine's independence guarantees are now real, automated, and re-runnable on every future change — Stage 4 (Scripture Engine, per this brief's own framing) can build on top of it with confidence that a future change breaking Live/Foldback independence will be caught immediately by `npm run test`, not discovered later in manual testing.
- If Stage 4 touches slide decks, this is the natural moment to also close the slide-navigation gap in `navigateContent()`, since a real deck data structure will need to exist anyway.
- Consider wiring `npm run test` into a CI step (e.g. GitHub Actions) at the start of Stage 4, so this regression protection applies automatically on every push, not only when manually run.
