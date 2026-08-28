# Altarview — V2 Full Baseline Verification Gate Report

## 1. Executive Summary

This gate combines the concrete fixes requested in V1.1 with the fuller V2 scope. This sandbox still cannot download a real Chromium binary (confirmed again this stage — same `cdn.playwright.dev` allowlist block documented in V1). All Playwright results below therefore come from **your own prior local run** (18/22, reported in the V1.1 brief) plus **code-level fixes and tracing** performed here — never fabricated execution. Unit/integration tests, TypeScript, and production build were all run for real in this sandbox.

## 2. GO / NO-GO Recommendation

**CONDITIONAL GO** — no critical blocker was found via code inspection or the available L1-L3 evidence. Final GO confirmation requires you to rerun `npm run test:e2e` locally with the fixes in this delivery; that run is the authoritative L4 result per this gate's own explicit rule (Section AP).

## 3. Files Changed This Stage

- `src/App.tsx` — added `aria-label={item.label}` to every sidebar `NavButton` (Scripture, Songs, Slides, Timer, Up Next, Stage Output, Stage Control, Themes, Media, Plugins, Recording, Remote, Settings).
- `src/screens/SongLyricsScreen.tsx` — added `aria-label={\`More options for ${song.title}\`}` to the song overflow ("···") button.
- `e2e/settings.spec.ts` — Settings navigation now uses `getByRole('button', { name: /settings/i })`.
- `e2e/presentation.spec.ts` — Stage Control test rewritten: no longer skips; uses the new accessible name; adds real Start/Stop/restart-from-full-duration assertions.
- `e2e/songs-library.spec.ts` — Duplicate test uses `getByRole('button', { name: 'Duplicate', exact: true })` and the new overflow-button accessible name.
- `e2e/songs-send-autosend.spec.ts` — new file, Send/Auto-Send behavioral tests reflecting the code-traced actual behavior (see Section 25-26).

## 4. Unit / Integration Result

`npm run test -- --run`: **319 passed, 0 failed, 0 skipped** (34 test files). Identical to the pre-stage baseline — zero regressions from this stage's changes.

## 5. Playwright Result

**Not executed in this sandbox** (network constraint, confirmed empirically in V1 and unchanged). Your last real local run: 22 total, 18 passed, 3 failed, 1 skipped, 0 flaky. The 3 failures and 1 skip are addressed by this stage's selector/accessibility fixes (Section 7-8) — running `npm run test:e2e` locally against this updated code is required to confirm they now pass.

## 6. Build Result

`npm run build`: **succeeded**. 74 modules, 441.65 kB / gzip 117.77 kB. The `__dirname`/`configLoader: 'native'` warning remains present but is non-blocking, as previously documented.

## 7. Original 3 Failed Tests — Final Classification

**Settings import (valid) & Settings import (invalid):** **TEST DEFECT.** Both failed at the exact same line — `page.getByText(/settings/i).first()` — before ever reaching the import workflow. Settings is an icon-only sidebar button with no visible "Settings" text; the selector could never have matched. Confirmed by direct inspection of `App.tsx`'s `NavButton` component. Fixed by adding `aria-label`.

**Song Duplicate:** **TEST DEFECT.** `getByText('Duplicate')` matched two elements ("Merge Duplicates (1)" and "Duplicate") because Playwright's text matching is substring-based by default, and "Merge Duplicates (1)" contains "Duplicate" as a substring. The application itself correctly renders both as distinct menu items. Fixed with `{ name: 'Duplicate', exact: true }`.

**No product defect found in any of the three.**

## 8. Original Skipped Foldback Test — Final Result

Previously skipped because the selector (`getByText(/stage control/i)`) never matched anything — same icon-only-button root cause as Settings. Fixed with the new accessible name. The rewritten test also adds genuine behavioral assertions (Start actually counts down, Stop actually halts, Start-after-Stop restarts from the full duration rather than resuming) rather than only checking visibility, per this gate's explicit test-quality rule. **Execution still pending your local run** — code fix is complete; L4 confirmation is not yet in hand.

## 9. Application Startup & Navigation

Unaffected by this stage's changes. Every sidebar item now carries a real accessible name in addition to its existing `title` tooltip — this improves testability without changing any visible behavior.

## 10. PresentationEngine / Destination Independence

Unchanged this stage. 28 Vitest tests continue to pass, unchanged; no product code in this domain was touched.

## 11. Scripture

Unchanged this stage.

## 12. Scripture Import

Navigation to Settings is now fixed (see Section 7). The import workflow itself (valid/invalid JSON handling) was not modified — Stage 4's validated pipeline remains as previously verified at L1-L3. L4 confirmation now depends only on rerunning locally with the corrected selector.

## 13. Scripture Persistence

Unchanged. Your prior local run already confirmed a pinned Scripture item survives a real page reload — this is a genuine, already-obtained L4 result, not fabricated, and this stage did not touch persistence code (per the explicit instruction not to alter it without a genuine defect).

## 14. Song Library

Unaffected except for the overflow-button accessibility fix.

## 15. Quick Text Entry

Unchanged this stage.

## 16. TXT Import

Unchanged this stage.

## 17. Song Duplication

Selector fixed (Section 7). Underlying `SongDomainRepository.duplicate()` behavior (new song ID, new independent section IDs, editing the copy never touches the original) remains verified at L1-L3 by 7 existing Vitest tests, unchanged this stage.

## 18. Song ID Stability

Unchanged. `crypto.randomUUID()`-based generation confirmed by code inspection; rename/edit operations verified not to regenerate IDs (14 existing tests).

## 19. Stage 5.2 / 5.2.1 Presentation Layout

Panel confirmed genuinely mounted via the full `App.tsx → OperatorScreen → SongLyricsScreen → SongPresentationLayoutPanel` render chain (re-confirmed this stage, unchanged from V1's finding). See Section 30 for the important duplicated-controls finding.

## 20. Pagination Rules

Unchanged this stage — the section-boundary invariant is enforced by construction in `pagination.ts` (verified by 21 existing Vitest tests plus the type-level guarantee that `paginateLines()` only ever receives one section's line array).

## 21. Section Boundaries

Same as above — no code touched this stage, invariant holds by construction.

## 22. Audience vs. Foldback Capacity

Unchanged. Independent state confirmed by existing component tests (`SongPresentationLayoutPanel.test.tsx`).

## 23. Manual Breaks

Unchanged this stage.

## 24. Repeated Section Occurrences

Unchanged. `jumpToSection`'s next-occurrence-relative-to-current semantics (resolved in Stage 5.2.1) remain verified by 13 existing Vitest tests against the brief's own worked example. **Browser-level confirmation of the exact multi-Chorus arrangement scenario remains pending your local run** — classified honestly as **REAL + WIRED, BROWSER VERIFICATION PENDING**, not fabricated as passed.

## 25. Song Send Behavior

**Traced precisely from source, not assumed.** `sendAudiencePage()` (the function behind the panel's "Send" button):
1. Always calls `onSendPreview(content)`.
2. Then calls `autoSend.afterNavigate(page, sendToLive)` — which only actually calls `onSendLive` if Auto-Send is currently ON.

So the exact behavior is: **Send → Preview, always. Send → Live, only if Auto-Send is ON.** There is no separate "Push to Live" button in the new panel — pushing Preview to Live currently happens only via enabling Auto-Send before clicking Send, or (in the old slide-list UI) is implicit in every click. **UX finding:** the single "Send" label doing two different things depending on an easily-missed toggle state elsewhere in the toolbar is genuinely ambiguous. "Send to Preview" (always) plus a separate explicit "Push to Live" action would be clearer — **not implemented this stage**, per the explicit instruction against broad redesign; recorded as a UX finding only.

## 26. Auto-Send Behavior

**Traced precisely from source.** Auto-Send's *state* (`useSongAutoSend`) is a single shared toggle (fixed from an earlier duplication bug in Stage 5.2.1). But its *trigger condition* differs completely between the two coexisting navigation systems:

- **New Presentation Layout panel:** Next/Previous call only `audienceNav.next()`/`.previous()` — they do **not** call `sendAudiencePage()`. Auto-Send has **zero effect** on these buttons. Only the explicit **Send** button triggers `afterNavigate()`, which is where Auto-Send's ON/OFF actually matters.
- **Old slide list** (`SongLyricsScreen.tsx`'s `singleClickSlide`): **every single click** on a slide immediately calls `onSendPreview`, and — if Auto-Send is ON — also `onSendLive`, automatically, with no separate Send step.

**This means the same Auto-Send toggle produces materially different live-service behavior depending on which set of controls the operator happens to use.** This is not a data-corruption risk (destination independence itself still holds correctly in both paths — Foldback is never touched by either), but it is a genuine, non-trivial operational inconsistency for a tool intended for live church use. Classified as **MAJOR NON-BLOCKER**, not a critical blocker, per Section AK's own criteria (architecture and data integrity are intact; the issue is behavioral consistency between two coexisting UIs for the same feature).

## 27. Semantic Song Pins

Unchanged this stage. Existing 8 Vitest tests plus real-component tests continue to verify structured `songId`/`sectionId`/`lineIndexInSection` identity, and that layout changes don't break resolution. **Reload-then-reopen-pin L4 confirmation remains pending your local run.**

## 28. Foldback

Selector fixed (Section 8). Timer behavior itself was not modified — Stage 3's `useStageTimer` restart-from-full-duration logic remains as previously verified (11 existing Vitest tests), unchanged.

## 29. Timer

Same as Foldback above — this is the same underlying timer.

## 30. Duplicated Song Control Audit

**This stage's most significant finding**, precisely traced (Section 26 above): two independent, coexisting UI systems for Song presentation share the Auto-Send *toggle state* but not its *trigger behavior*. Additionally, the two systems track **separate navigation position state** entirely (`activeSlideKey` in `SongLyricsScreen.tsx` vs. `audienceNav.currentPage` inside `SongPresentationLayoutPanel.tsx`) — clicking a slide in the old list does not move the new panel's position, and vice versa. **Classification: two separate state systems that can genuinely disagree about "what is currently selected," while safely sharing only the Auto-Send toggle.** Neither system corrupts data or violates destination independence; the risk is operator confusion, not data integrity. **Recommendation: consolidate to one navigation system in a future stage** — explicitly not attempted here, per the instruction against broad redesign in a verification gate.

## 31. Themes

Not modified or re-audited this stage — outside this stage's fix scope; no evidence of regression.

## 32. Slides

Not modified or re-audited this stage.

## 33. Up Next

Not modified or re-audited this stage.

## 34. Other Screens

Not modified or re-audited this stage (Media, Recording, Remote Control, Plugins, Playlist, Presentation Test Mode) — no changes made, no new evidence gathered.

## 35. Persistence Matrix

| Item | L4 Status |
|---|---|
| Created Song survives reload | Previously confirmed real (your local run) |
| Pinned Scripture survives reload | Previously confirmed real (your local run) |
| Song pins, Settings, Theme settings, manual breaks | Not yet L4-tested |

## 36. Deferred / Simulated Features

AI detection, Deepgram, online lyrics providers, Broadcast/NDI output — all pre-existing, already disclosed, unchanged this stage. None of these block this gate's GO/NO-GO per Section AO's own explicit allowance.

## 37. Genuine Defects Found

**None** classified as CRITICAL BLOCKER. One MAJOR NON-BLOCKER (Section 30/26: duplicated-controls Auto-Send inconsistency).

## 38. Test Defects Found

Three (Settings import ×2, Song Duplicate) plus one skip-root-cause (Stage Control) — all fixed this stage (Sections 7-8), pending your local rerun to confirm.

## 39. UX Findings

- "Send" is ambiguous given it silently means different things depending on Auto-Send state (Section 25).
- Two independent Song presentation UIs coexist with no visible indication to the operator which one is "authoritative" (Section 30).

## 40. Accessibility Findings

Every icon-only sidebar control and the song overflow button previously relied only on a `title` tooltip (a weak, inconsistent fallback for accessible-name computation) — all now have explicit `aria-label`s. No other accessibility gaps were audited this stage beyond what blocked the specific failing/skipped tests.

## 41. Remaining Unverified Items

All L4 (Playwright) and L5 (manual visual) verification for every feature in this report remains **pending your local run** — this sandbox cannot execute a real browser. This includes confirming the 3 selector fixes actually resolve the original failures, the previously-skipped Foldback test now runs and passes its new behavioral assertions, and the new Send/Auto-Send behavioral tests in `songs-send-autosend.spec.ts`.

## 42. Verification Matrix

See `docs/FEATURE_VERIFICATION_MATRIX.md` (from V1) — unchanged in structure; this stage's fixes move several rows from "Written, not run" toward being ready for a real local pass, but do not themselves change any row's status until you rerun `npm run test:e2e`.

## 43. Manual 10–15 Minute Smoke Test Checklist

1. Open Altarview — confirm the Operator screen loads with no red console errors.
2. Search Scripture (e.g. "John 3:16") → confirm the reading view opens.
3. Click a verse to stage it to Preview.
4. Push Preview to Live → confirm the congregation-facing output updates.
5. Open Songs → double-click a song (**not** a single click).
6. In the Presentation Layout panel, click Next/Previous a few times — note that nothing is sent automatically (this is expected, current behavior — see Section 25).
7. Click Send → confirm Preview updates.
8. Toggle Auto-Send ON, click Send again → confirm Live now also updates.
9. Change Audience lines to 2, then Foldback lines to 4 — confirm each is independent (changing one doesn't touch the other's number).
10. Add a manual page break between two lines — confirm the page count changes; remove it — confirm it reverts.
11. Click Pin Song, then Pin Section, then Pin Current Slide — check the Pinned panel for three new entries.
12. Navigate to Stage Control (sidebar icon) → Start the timer, watch it count down, Stop it, Start again — confirm it restarts from the full duration, not from where it stopped.
13. Reload the whole browser page → confirm the song, pins, and Scripture pin from earlier steps all survived.

## 44. Final Recommendation

**CONDITIONAL GO FOR STAGE 5.3** — pending your local `npm run test:e2e` confirming: (a) the 3 previously-failing tests now pass, (b) the previously-skipped Foldback test now runs and passes its new behavioral assertions, (c) production build and unit tests remain green (already confirmed: 319/319, build succeeds). The one MAJOR NON-BLOCKER finding (Auto-Send/duplicated-controls inconsistency) does not, on its own, warrant a NO-GO per this gate's own stated criteria — it is recorded as a priority item for a future consolidation stage, not a blocker to continued development.
