# Altarview — Verification Stage V1: Claim vs. Reality

## How This Report Was Produced

Given a hard, confirmed environment constraint (see Section 19 below), this audit combines:
- **Direct source code inspection** — tracing actual import/render chains, not assuming a completion report was accurate.
- **The existing Vitest/React Testing Library suite** (319 tests, all independently re-run this stage) — which, unlike a pure unit test, several of these already render real components together (e.g., `OperatorScreen.tsx`, `SongLyricsScreen.tsx`) rather than isolated pieces.
- **Newly written Playwright E2E test files** — real, type-checked, ready to run, but **not executed** in this sandbox.

This report does not treat a prior completion report's claim as true merely because it was written confidently. Every claim below was re-traced from source.

---

## Stage-by-Stage Summary

### Stage 3 — Presentation Engine
**Claimed:** Preview/Live/Foldback independent state, owned solely by `PresentationEngine`.
**Found:** Confirmed by direct inspection — `PresentationEngine.ts` is the only file with `useState<DisplayContent>`. 28 Vitest tests cover every command and independence guarantee.
**Browser reachable:** Written E2E test exists, not executed.
**Status:** PASS (L1-L3), NOT VERIFIED at L4/L5.

### Stage 4 / 4.1 / 4.2 — Scripture Engine, Integration, Pin Architecture
**Claimed:** Full Scripture domain layer, genuinely wired into `OperatorScreen`, generic `PinTarget` architecture.
**Found:** Confirmed by inspection — `OperatorScreen.tsx` imports and calls `scriptureEngine`/`useScripturePresentationState` directly (not left unused), verified by real-component RTL tests that render the actual screen and click through search → open → navigate → pin flows.
**Browser reachable:** Written E2E test exists, not executed.
**Persistence:** All Stage 2+ persistence testing to date has used an in-memory `StorageProvider` test double, never real IndexedDB in an actual browser. This has been disclosed in every prior stage's report as a known limitation — this stage confirms it remains genuinely unverified, not newly discovered.
**Status:** PASS (L1-L3), PARTIAL on persistence (unverified, not failed — simply never tested at that level).

### Stage 5 / 5.1 — Song Domain, Song Input
**Claimed:** Stable Song IDs, structured sections/arrangements, Quick Text Entry, real TXT parsing with review-before-save.
**Found:** Confirmed by inspection — `crypto.randomUUID()` genuinely used, `buildSlides()`'s rewrite genuinely delegates to the new engine (not a parallel unused implementation). TXT import genuinely reads file content (`file.text()`) and routes through the same review panel as Quick Text Entry — a real fix over an earlier version that only used the filename.
**Browser reachable:** Written E2E test exists, not executed.
**Status:** PASS (L1-L3), PARTIAL on persistence.

### Stage 5.2 — Song Presentation Layout Engine
**Claimed:** Section-safe pagination, arrangement-driven occurrence tracking, semantic lyric-position pinning, Auto-Send foundation.
**Found:** Confirmed by inspection and by the pagination test suite's structural design — `paginateLines()`'s signature only ever receives one section's `string[]`, making cross-section bleed structurally impossible, not merely tested-against. `buildSlides()` genuinely delegates to this engine now.
**Browser reachable:** Written E2E test exists, not executed.
**Status:** PASS (L1-L3).

### Stage 5.2.1 — Song Presentation UI Completion
**Claimed:** A visible "Presentation Layout" panel with Audience/Foldback capacity, manual breaks, granular pinning, Auto-Send, repeated-section navigation.
**Found:** See the dedicated investigation below — **this is the specific claim the user reported as discrepant.**
**Status:** See Section below. NOT VERIFIED at L4/L5 (browser confirmation genuinely unavailable in this environment); code inspection alone shows correct wiring.

---

## THE Stage 5.2.1 Discrepancy Investigation (Section 25/45)

**The report's claim:** `SongPresentationLayoutPanel` is mounted in the opened-song view with Audience/Foldback capacity, manual breaks, and granular pin controls.

**What was actually found by tracing the render chain, file by file:**

```
src/App.tsx
  imports and renders  →  OperatorScreen  (confirmed: line 449)
src/screens/OperatorScreen.tsx
  imports and renders  →  SongLyricsScreen, when page === 'songs'  (confirmed: line 6, line 861)
src/screens/SongLyricsScreen.tsx
  imports and renders  →  SongPresentationLayoutPanel, inside the `openedSong` conditional  (confirmed: line 5, line 990)
```

No duplicate or legacy Song screen exists that could shadow this (`find src -iname "*song*"` returns only `songModel.ts`, `repositories/SongRepository.ts`, `SongLyricsScreen.tsx`, and `SongPresentationLayoutPanel.tsx` itself — no second competing "Songs" UI file).

**Conclusion from code inspection: the wiring is genuinely correct.** The panel is not dead code, not orphaned, not behind an unreachable condition, and not a component that merely exists in isolation with tests but no real mount point. This rules out "REAL BUT NOT WIRED" as the explanation.

**Given the wiring is correct, the most likely explanations for what the user actually observed are (in order of likelihood, based on available evidence — not confirmed, since browser-level reproduction was not possible here):**

1. **Single-click vs. double-click.** `SongLyricsScreen.tsx`'s song-open handler is attached to `onDoubleClick`, not `onClick` (a single click only highlights the row — confirmed by direct inspection, and independently rediscovered during this project's own Stage 5.2/5.2.1 component-test debugging, where a single-click test initially failed for the identical reason). If the user single-clicked a song in the library, `openedSong` would remain `null`, and the entire opened-song view — including the panel, which only renders inside that conditional — would correctly show nothing. This would look exactly like "the panel doesn't exist," when the actual song was simply never opened.
2. **Stale project sync.** Each stage in this project has been delivered as a downloadable zip intended to be extracted over the user's existing StackBlitz project. If the Stage 5.2.1 zip was not fully extracted/synced before the user inspected the UI, they would have been looking at the Stage 5.2 (or earlier) build, which did not yet contain `SongPresentationLayoutPanel` at all.
3. **Stale dev server / HMR state**, if files were updated but the running Vite dev server in StackBlitz wasn't restarted.

**This report does not claim certainty about which of these occurred** — only that code inspection rules out a wiring defect, and identifies double-click as the most likely single behavioral explanation given it was independently confirmed as a real, easy-to-miss UX detail elsewhere in this exact project.

**No correction was made during this audit**, per the explicit instruction to record findings only.

---

## UI-Unreachable Features (Section 16)

A targeted reachability audit (tracing imports of every major Stage 4/5 component) found:
- `SongPresentationLayoutPanel` — reachable (see above).
- `PresentationTestMode` — reachable, imported in `App.tsx` and its own screen file.
- `ScriptureEngine` usage — reachable via `OperatorScreen.tsx`.

**No component representing a "major requirement" was found imported nowhere or rendered nowhere.** This audit was not exhaustive of every small helper function, but covered every component-level feature this project's stage briefs treated as a headline deliverable.

## Domain-Only Features

- Real browser IndexedDB persistence remains domain/integration-tested only (in-memory `StorageProvider` double), never genuinely verified in an actual browser, for every persisted entity: Songs, Pins, imported Scripture translations. This is the single most significant "domain only" gap across the whole project, present since Stage 2 and never closed.

## Simulated Features (Section 37 — pre-existing, already disclosed, not new findings)

- AI Bible/Song detection ("simulated" labels already present in the UI itself, e.g. "AI auto-detect (simulated)").
- Online lyrics search/discovery — not implemented at all yet (explicitly deferred to Stage 5.3+).
- Deepgram/streaming — not implemented, explicitly deferred.

## Console / Runtime Errors

Not captured — requires a real browser session, which could not be run in this environment. `e2e/app.spec.ts` includes an assertion checking for unexpected console errors on load; running it locally will produce this data.

---

## Section 19: The Hard Environment Constraint (Full Detail)

This sandbox's outbound network access is restricted to an explicit domain allowlist for package installation (npm registry, GitHub, PyPI, etc.). `cdn.playwright.dev` — the host Playwright's browser-binary installer downloads Chromium from — is not on that list. This was verified empirically, not assumed:

```
$ npx playwright install chromium
Error: Download failed: server returned code 403 body 'Host not in allowlist: cdn.playwright.dev.
Add this host to your network egress settings to allow access.'
```

Every Playwright test file in `e2e/` was therefore written but genuinely could not be executed here. This is not a workaround-able limitation within this conversation — it requires either network allowlist changes to this sandbox, or (the practical path) running `npm run test:e2e` on the user's own machine or in an environment with full internet access (including StackBlitz, if it permits Playwright's browser download — untested).
