# Altarview — Feature Verification Matrix (Verification Stage V1)

**Verification Level Key:**
- **L1 Code Exists** — the claimed implementation is present in the source tree.
- **L2 Unit/Domain** — a Vitest test proves the underlying logic in isolation.
- **L3 Integration** — a real React Testing Library test renders the actual component(s) and proves the wiring works together.
- **L4 Browser E2E** — a Playwright test proves a real browser user can reach and operate the feature.
- **L5 Manual Visual** — an actual human manually verified the interface.

**Environment note governing every row below:** this sandbox cannot download the Chromium binary Playwright requires (`cdn.playwright.dev` is not in the network egress allowlist — confirmed by direct attempt, see `docs/V1_CLAIM_VS_REALITY.md`). L4 test *files* were written for every row marked "Written" below, but **none were executed here**. L5 was not performed by anyone in this stage. Every L4/L5 column in this table reflects that constraint honestly, not a guess.

| Feature | Origin Stage | L1 Code | L2 Unit | L3 Integration | L4 E2E | L5 Visual | Persistence | Status |
|---|---|---|---|---|---|---|---|---|
| Preview/Live/Foldback independent state | 3 | Yes | Yes (28 tests) | Yes | Written, not run | No | N/A | **PASS** (L1-L3) |
| Foldback timer Start/Stop/Next/Previous | 3 | Yes | Yes (11 tests) | Yes | Written, not run | No | N/A | **PASS** (L1-L3) |
| Foldback message independent from Live | 3 | Yes | Yes | Yes | Written, not run | No | N/A | **PASS** (L1-L3) |
| Scripture search (reference + keyword) | 4 | Yes | Yes (9 tests) | Yes | Written, not run | No | N/A | **PASS** (L1-L3) |
| Scripture Group vs. Active Verse independence | 4/4.1 | Yes | Yes (10 tests) | Yes (real OperatorScreen render) | Written, not run | No | N/A | **PASS** (L1-L3) |
| Scripture translation switching | 4 | Yes | Yes | Yes | No | No | N/A | **PASS** (L1-L3) |
| Scripture import (Zefania XML / JSON), validated | 4 | Yes | Yes (13 tests) | Yes (real SettingsScreen render) | Written, not run | No | Not verified via real IndexedDB (in-memory double only) | **PARTIAL** |
| Scripture pin (structured PassageReference) | 4.2 | Yes | Yes | Yes (real OperatorScreen render) | Written, not run | No | Not verified via real IndexedDB | **PARTIAL** |
| Generic Pin architecture (discriminated union) | 4.2 | Yes | Yes | Yes | No | No | Not verified via real IndexedDB | **PARTIAL** |
| Song stable IDs (crypto.randomUUID) | 5 | Yes | Yes (14 tests) | Yes | No | No | Not verified via real IndexedDB | **PARTIAL** |
| Song arrangements (occurrence-safe) | 5 | Yes | Yes | Yes | No | No | Not verified via real IndexedDB | **PARTIAL** |
| Song pin → stable songId | 5 | Yes | Yes (7 tests) | Yes | No | No | Not verified | **PARTIAL** |
| Quick Text Entry (paste → review → save) | 5.1 | Yes | Yes | Yes (real SongLyricsScreen render) | Written, not run | No | Not verified | **PARTIAL** |
| TXT import (real file parsing, review, cancel-safe) | 5.1 | Yes | Yes | Yes (real SongLyricsScreen render) | Written, not run | No | Not verified | **PARTIAL** |
| Song section editor (relabel/split/merge/reorder) | 5.1 | Yes | Yes (20 tests) | Partial (draft-only; not exercised via a full save-flow RTL render of every operation) | No | No | N/A (draft state) | **PARTIAL** |
| Section-safe pagination (never crosses boundary) | 5.2 | Yes | Yes (21 tests) | Yes (real SongLyricsScreen render) | Written, not run | No | N/A (derived) | **PASS** (L1-L3) |
| buildSlides() compatibility wrapper | 5.2 | Yes | Yes | Yes | No | No | N/A | **PASS** (L1-L3) |
| Destination-specific Song layout (Audience ≠ Foldback) | 5.2/5.2.1 | Yes | Yes | Yes (real component test) | Written, not run | No | N/A | **PASS** (L1-L3) |
| Repeated-section next-occurrence jump | 5.2.1 | Yes | Yes (13 tests) | Yes (real component test) | Written, not run | No | N/A | **PASS** (L1-L3) |
| Manual page break UI | 5.2.1 | Yes | Yes (7 tests) | Yes (real component test) | Written, not run | No | Session-only (documented, not a bug) | **PASS** (L1-L3, persistence intentionally out of scope) |
| **Song Presentation Layout panel visible in real Songs UI** | 5.2.1 | Yes | Yes | Yes (real `SongLyricsScreen` render, mounted via `OperatorScreen`) | Written, not run — **THE critical unresolved item; see Section 20 of V1_CLAIM_VS_REALITY.md** | No | N/A | **NOT VERIFIED AT L4/L5** — code inspection shows correct wiring; browser-level confirmation could not be performed in this environment |
| Granular Song pinning (Song/Section/Current Slide) | 5.2.1 | Yes | Yes (8 tests) | Yes (real component test) | Written, not run | No | Not verified | **PARTIAL** |
| Song Auto-Send (shared toggle, no duplication) | 5.2.1 | Yes | Yes (12 tests) | Yes (real component test) | Written, not run | No | N/A | **PASS** (L1-L3) |
| Real IndexedDB persistence (Songs, Pins, Scripture imports) | 2, throughout | Yes (architecture) | Domain-only (in-memory double used everywhere) | Domain-only | Written, not run | No | **NOT VERIFIED — no test in this project's history has exercised real browser IndexedDB** | **NOT VERIFIED** |

## Summary Totals

- PASS (L1-L3, E2E written but unexecuted): 16
- PARTIAL (real persistence unverified, or partial coverage): 9
- NOT VERIFIED (E2E/visual required, genuinely unavailable in this environment): 2
- FAIL: 0
- SIMULATED: 0 (see `docs/V1_CLAIM_VS_REALITY.md` for the AI/online-lyrics simulation inventory, which are pre-existing, already-disclosed simulations, not new findings)
- DOMAIN ONLY: covered within the PARTIAL rows above (persistence)
- REAL BUT NOT WIRED: 0 found — see Section 16 of `V1_CLAIM_VS_REALITY.md` for the reachability audit that produced this finding

## What This Table Does NOT Claim

No row in this table claims Level 4 or Level 5 was achieved. Every "Written, not run" entry is a real Playwright test file that exists in `e2e/`, type-checks cleanly against the actual Playwright API, and is ready to run — but has not been executed against a real browser in this sandboxed environment. Running `npm run test:e2e` locally is the only way to convert these into genuine L4 results.
