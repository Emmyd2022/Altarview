// ALT-STAGE5-2-PART6/7/35: the smallest clean integration point between
// Theme and Song presentation capacity, per Section 6's explicit "do
// not rewrite the Theme Engine." Rather than adding a lyric-capacity
// field onto the widely-used, actively-tested ThemeDef type (Section
// 6's "without destabilizing Theme"), this module implements the
// override PRECEDENCE purely as data flowing in -- the caller supplies
// whatever theme default it already knows, and this function decides
// which value wins.
//
// Precedence (Section 7): Theme/Layout default -> Song override ->
// Manual page-break override. The most specific valid rule wins.

// ALT-STAGE5-2-PART6: a small, theme-CATEGORY-keyed default map --
// intentionally NOT stored on ThemeDef itself. "Lower Third"-style
// themes default to a tight capacity; general/full-screen themes
// default to more lines. Any theme not covered falls back to a sane
// default. This is presentation config, easily extended later without
// touching Theme's own persisted shape.
const THEME_CATEGORY_DEFAULTS: Record<string, number> = {
  'Lower Third': 2,
  'Full Screen': 4,
  Foldback: 6,
}
const FALLBACK_THEME_DEFAULT = 2

export function themeDefaultCapacity(themeCategory: string | undefined): number {
  if (!themeCategory) return FALLBACK_THEME_DEFAULT
  return THEME_CATEGORY_DEFAULTS[themeCategory] ?? FALLBACK_THEME_DEFAULT
}

export interface ResolvedCapacity {
  maxLinesPerPage: number
  source: 'theme-default' | 'song-override'
}

// ALT-STAGE5-2-PART7/35: resolves the winning capacity BEFORE manual
// breaks are applied (manual breaks are a separate, per-section override
// layer handled by pagination.ts itself -- see ManualPageBreakOverride).
// A song override, when present, always beats the theme default; there
// is no partial/blended behavior.
export function resolveLayoutCapacity(themeDefault: number, songOverride: number | undefined | null): ResolvedCapacity {
  if (songOverride !== undefined && songOverride !== null) {
    return { maxLinesPerPage: songOverride, source: 'song-override' }
  }
  return { maxLinesPerPage: themeDefault, source: 'theme-default' }
}
