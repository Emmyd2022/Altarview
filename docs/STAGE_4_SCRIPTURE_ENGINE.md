# Altarview — Stage 4: Scripture Engine

## Architecture

A new domain layer, `src/scripture/`, sits between the UI and Bible data:

```
UI (OperatorScreen, etc.)
      ↓
ScriptureEngine (services/ScriptureEngine.ts) -- the stable facade
      ↓
ScriptureRepository (repository/ScriptureRepository.ts)
      ↓
bibleModel.ts's existing in-memory data (unchanged)
```

This is an **evolution**, not a replacement, of the existing `bibleModel.ts`/`bibleImport.ts` (built in earlier stages). Those files still own the actual verse data and its mutation functions; the new layer wraps them with a stable, canonically-identified API, per the brief's explicit instruction to preserve existing available data and architecture rather than rewrite it.

## Data Model

`src/scripture/types/index.ts` defines `Translation`, `Book`, `Verse`, `VerseReference`, `PassageReference`, `Passage`, `ScriptureSearchResult`. Identity is always structured (`bookId` + `chapter` + `verse`), never a display string — `"John 3:16"` is derived output, not identity, throughout this layer.

`src/scripture/data/canon.ts` is a new canonical 66-book registry (id, name, abbreviations, testament, canonical order, expected chapter count), shared across every translation. This did not exist before Stage 4 — `bibleModel.ts` matched book names ad hoc with no canonical registry.

## Bible Data / Repository

**Storage decision**: no new storage backend was introduced. `bibleModel.ts`'s existing in-memory `Map` (plus its Stage 2 IndexedDB persistence) remains the actual storage. `ScriptureRepository` is a new read/query layer on top of it, resolving `bookId` ↔ book display name at the boundary (since `bibleModel.ts` internally keys by name, e.g. "John", not "john"). This was the pragmatic, lowest-risk choice — introducing a second storage system would have created exactly the kind of unnecessary migration problem Section 8 warns against.

## Translation System

`ScriptureRepository` maintains a metadata registry (`TRANSLATION_METADATA`) covering the 9 well-known translations (KJV, NKJV, NIV, ESV, NASB, AMP, NLT, MSG, ERV) with `publicDomain`/`language`/etc. `installed` status is computed live from what `bibleModel.ts` actually has loaded — never stored separately, so it can't drift out of sync. A translation imported under a custom name not in this curated list (e.g. a church's own file) is still correctly recognized as installed, with synthesized minimal metadata — this was a real bug found and fixed during this stage's own test-writing (see Known Limitations/testing notes below).

**Only KJV is bundled** (public domain, unchanged from prior stages). No copyrighted translation text was added in this stage.

## Reference Parser

`src/scripture/parser/referenceParser.ts` supports: single verse (`John 3:16`), ranges (`John 3:16-20`), chapter-only (`John 3`), comma-separated verse lists (`John 3:16,18`), numbered books (`1 John 4:8`, `1 Corinthians 13:4-7`), and common abbreviations (`Jn`, `1 Cor`, `1Cor`) via the canon's abbreviation lookup. Returns structured `ParsedReference` data, never relies on UI formatting. `validateReference()` checks a parsed reference against the canon's known chapter counts and, when a verse-counter function is supplied, actual verse counts too — returning a clear reason string rather than throwing.

## Search

`src/scripture/search/scriptureSearch.ts` works entirely offline over whatever is currently loaded in `bibleModel.ts`. A query that parses as a valid reference is treated as reference lookup first; otherwise it's a text search. Text search is case-insensitive, strips common punctuation, normalizes whitespace, and ranks exact-phrase matches above matches containing all query words in any order. Results are de-duplicated (a verse can otherwise appear from both a loaded full chapter and a standalone cross-reference entry) and sorted by relevance, then canonical order for ties.

## Reading View (Group / Active Verse)

`src/scripture/state/useScripturePresentationState.ts` formalizes the existing Group/Active-Verse model (previously ad hoc local state in `OperatorScreen.tsx`) into an independently testable hook: `openGroup`, `closeGroup`, `resizeGroup` (Shift+click extension, in either direction, never producing an invalid range), `setActiveVerse`, `nextVerse`/`previousVerse` (crossing chapter boundaries via the repository, which delegates to `bibleModel.ts`'s already-tested boundary-crossing logic). The Group and Active Verse are independently mutable, exactly as Section 18 requires — verified by a dedicated test.

**Note**: this hook exists and is fully tested, but `OperatorScreen.tsx`'s Scripture tab still uses its own original local `openedRange`/`activeVerseNum` state for the reading view (unchanged from Stage 3), not this new hook. See Known Limitations.

## PresentationEngine Integration

The Scripture Engine never manipulates Preview/Live/Foldback state directly. The pattern (verified by `scriptureIntegration.test.ts`): Scripture Engine retrieves a `Verse`/`Passage` → calling code converts it into the existing `DisplayContent` shape → that's handed to `PresentationEngine`'s existing commands (`stageToPreview`, `sendToLive`, `sendToFoldback`). No second presentation state system was introduced, per Section 24's explicit requirement.

## Translation Switching / Compare

Because identity is a structured `VerseReference`/`PassageReference` (not a display string), switching translation is `scriptureEngine.switchTranslation(ref, newTranslationId)` — same reference, different `translationId`, no re-search. Comparing two translations uses the same mechanism twice against the same reference. Both verified by test.

## Pinning and History

`src/scripture/services/scripturePins.ts`: a pinned item stores a `PassageReference` (never rendered text as identity), resolved against the live Scripture Engine at open-time. If the translation is missing or the passage unavailable, a clear error string is returned rather than a crash. `src/scripture/state/useRecentScripture.ts`: a bounded (max 20) in-memory recent-reference list, deduplicating re-opened references by moving them to the front rather than creating repeat entries.

## Import

A new, properly validated two-phase pipeline (`src/scripture/services/scriptureImport.ts`) sits alongside the existing `bibleImport.ts` (left unchanged, still used by the Settings screen's current import card): **stage → validate → commit**, rather than committing chapters as they're parsed. This closes a real risk in the original importer, where a malformed file partway through could leave a partial import committed. Validation checks: book name recognized against the canon, chapter within the book's known range, duplicate chapters, empty chapters. `commitStaged()` refuses (throws) if called on a result that failed validation, rather than silently proceeding.

**Integration note**: this new validated pipeline is not yet wired into the Settings UI — `SettingsScreen.tsx`'s Translation Library still calls the original `bibleImport.ts` functions. Swapping the UI to the new pipeline is a small, low-risk follow-up (same function signatures, better validation) not completed this stage. See Known Limitations.

## AI Readiness

Per Section 36/38, no AI matching is implemented. `ScriptureEngine.findReferenceCandidates(transcriptFragment)` exists as the stable entry point a future Scripture Detection Engine would call — today it simply delegates to the same `search()` the operator's manual search box uses. This is intentionally simple: the point of this stage was establishing the *boundary* (an AI layer calls this one function, never touches `bibleModel.ts` or `ScriptureRepository` directly), not building real detection.

## Offline Behavior

Confirmed by code inspection: no file in `src/scripture/` references `fetch`, `XMLHttpRequest`, or any network API. Everything operates against `bibleModel.ts`'s synchronous, in-memory data. A dedicated test asserts this structurally for the repository's core retrieval methods.

## Known Limitations

1. **`OperatorScreen.tsx`'s reading view is not fully rewired** to the new `useScripturePresentationState` hook or `ScriptureEngine` facade — only the search box was swapped to use the new search engine (a safe, self-contained change: results are adapted back into the existing display shape, and existing click handlers continue to work unchanged since they still call the original `bibleModel.ts` parser on the resulting `ref` string). The Enter-key reference-open path, the chapter-context reading view, and Previous/Next Verse navigation all still use the original Stage 3 implementation. This was a deliberate, conservative choice: those code paths are sensitive and already correct; swapping them for no functional gain (the underlying logic is equivalent either way) was judged higher-risk than value for this stage.
2. **The validated import pipeline is not wired into the Settings UI** — it exists, is tested, and is ready to swap in, but `SettingsScreen.tsx` still calls the original `bibleImport.ts` functions.
3. **Full KJV dataset remains incomplete** — only John 1, 3, 4 plus roughly 15 cross-reference verses across other books are loaded, exactly as in prior stages. Per Section 9's explicit instruction, no additional verses were fabricated to fill this out. A complete public-domain KJV dataset must be supplied/imported (via the Translation Library's import feature) before claiming full offline KJV coverage.
4. Two real bugs were found and fixed while writing this stage's tests (not simulated failures — genuine issues caught by real test runs): a translation-lookup gap for custom-named imports (`getTranslation()` didn't recognize a loaded translation outside the curated metadata list), and a test fixture that exceeded a real book's canonical chapter count (correctly caught by the engine's own validation, not a bug in the engine).

## Future Improvements

- Complete the `OperatorScreen.tsx` rewiring to the new state hook and facade, once there's appetite for touching that sensitive code path.
- Wire the validated import pipeline into the Settings UI, replacing the original committing-as-it-parses importer.
- Expand loaded KJV coverage via real import (not fabrication).
- Build the real AI Scripture Detection Engine on top of `findReferenceCandidates()`, once Deepgram integration begins in a later stage.
