// ALT-032/033: theme data model, rebuilt to match the depth of EasyVerse's
// theme editor (per their own changelog: "multi-layout themes", "multi-layer
// overlay projection (up to 8 layers)", "container styles with fill,
// stroke, shadow, feathering", and parallel/dual-translation display).
//
// Each theme is a stack of independently positioned, independently styled
// Layers -- not a single background+text-color pair. This is what makes
// "Lower Third" and "Side" genuinely different layouts instead of the same
// text box in a different tint.

export type Category = 'Song Display' | 'Side' | 'Middle' | 'Lower Third' | 'Transparent Background'

export const CATEGORIES: Category[] = ['Song Display', 'Side', 'Middle', 'Lower Third', 'Transparent Background']

export interface Layer {
  id: string
  label: string
  // What text this layer shows -- a token resolved at render time, or a
  // fixed custom label the operator typed in (e.g. "Minister Title").
  content: '{{verse}}' | '{{citation}}' | '{{citation-secondary}}' | '{{speaker}}' | '{{title}}' | string
  visible: boolean
  // Position/size as percentages of the 16:9 output, so layouts scale to
  // any resolution instead of being pinned to pixels.
  x: number
  y: number
  width: number
  height: number
  // Text style
  fontFamily: string
  fontSize: number
  fontWeight: number
  color: string
  align: 'left' | 'center' | 'right'
  letterSpacing: number
  // Outline & shadow (EasyVerse: "container styles with fill, stroke, shadow, feathering")
  outlineColor: string
  outlineWidth: number
  shadowColor: string
  shadowBlur: number
  // Container behind the text
  fill: string // 'transparent' or a color/rgba string
  stroke: string
  strokeWidth: number
  feather: number // soft-edge blur radius, px
}

export interface ThemeDef {
  id: string
  name: string
  category: Category
  isCustom: boolean // preloaded themes are now editable too (ALT-033), but
                     // stay flagged so "Reset to default" has something to
                     // reset to
  backgroundType: 'solid' | 'gradient' | 'transparent'
  backgroundColor: string
  backgroundColor2: string
  dualTranslation: boolean // EasyVerse: parallel translation display
  layers: Layer[]
}

let counter = 0
function id(prefix: string) {
  counter += 1
  return `${prefix}-${counter}`
}

function textLayer(overrides: Partial<Layer> & Pick<Layer, 'label' | 'content' | 'x' | 'y' | 'width' | 'height'>): Layer {
  return {
    id: id('layer'),
    visible: true,
    fontFamily: 'Lora, Georgia, serif',
    fontSize: 32,
    fontWeight: 400,
    color: '#FFFFFF',
    align: 'center',
    letterSpacing: 0,
    outlineColor: '#000000',
    outlineWidth: 0,
    shadowColor: 'rgba(0,0,0,0.5)',
    shadowBlur: 8,
    fill: 'transparent',
    stroke: 'transparent',
    strokeWidth: 0,
    feather: 0,
    ...overrides,
  }
}

// Default layer layouts per category -- this is what makes each category
// an actually different composition, not just a recolored copy.
function defaultLayersFor(category: Category, accent: string, textColor: string): Layer[] {
  switch (category) {
    case 'Lower Third':
      return [
        textLayer({
          label: 'Verse Text', content: '{{verse}}', x: 6, y: 72, width: 88, height: 16,
          fontSize: 26, color: textColor, align: 'left', fill: 'rgba(0,0,0,0.55)', feather: 12,
        }),
        textLayer({
          label: 'Citation', content: '{{citation}}', x: 6, y: 88, width: 60, height: 8,
          fontSize: 15, color: accent, align: 'left', fontFamily: 'Inter, Segoe UI, sans-serif',
        }),
      ]
    case 'Side':
      return [
        textLayer({
          label: 'Verse Text', content: '{{verse}}', x: 4, y: 20, width: 34, height: 55,
          fontSize: 22, color: textColor, align: 'left', fill: 'rgba(0,0,0,0.4)', feather: 16,
        }),
        textLayer({
          label: 'Citation', content: '{{citation}}', x: 4, y: 77, width: 34, height: 8,
          fontSize: 14, color: accent, align: 'left', fontFamily: 'Inter, Segoe UI, sans-serif',
        }),
      ]
    case 'Middle':
      return [
        textLayer({
          label: 'Verse Text', content: '{{verse}}', x: 12, y: 36, width: 76, height: 32,
          fontSize: 34, color: textColor, align: 'center',
        }),
        textLayer({
          label: 'Citation', content: '{{citation}}', x: 12, y: 70, width: 76, height: 8,
          fontSize: 16, color: accent, align: 'center', fontFamily: 'Inter, Segoe UI, sans-serif',
        }),
      ]
    case 'Song Display':
      return [
        textLayer({
          label: 'Song Line', content: '{{verse}}', x: 8, y: 30, width: 84, height: 40,
          fontSize: 36, fontWeight: 600, color: textColor, align: 'center', fontFamily: 'Inter, Segoe UI, sans-serif',
        }),
        textLayer({
          label: 'Song / Section', content: '{{citation}}', x: 8, y: 84, width: 84, height: 8,
          fontSize: 14, color: accent, align: 'center', fontFamily: 'Inter, Segoe UI, sans-serif',
        }),
      ]
    case 'Transparent Background':
      return [
        textLayer({
          label: 'Verse Text', content: '{{verse}}', x: 10, y: 40, width: 80, height: 24,
          fontSize: 28, color: textColor, align: 'center', shadowBlur: 14, shadowColor: 'rgba(0,0,0,0.8)',
        }),
        textLayer({
          label: 'Citation', content: '{{citation}}', x: 10, y: 68, width: 80, height: 8,
          fontSize: 14, color: accent, align: 'center', shadowBlur: 10,
        }),
      ]
  }
}

function buildPreset(namePrefix: string, category: Category, bg: string, text: string, accent: string, isTransparentBg = false): ThemeDef {
  return {
    id: id('theme'),
    name: `${namePrefix}`,
    category,
    isCustom: false,
    backgroundType: isTransparentBg ? 'transparent' : 'solid',
    backgroundColor: bg,
    backgroundColor2: bg,
    dualTranslation: false,
    layers: defaultLayersFor(category, accent, text),
  }
}

// Three presets x five categories = 15 preloaded themes, all directly
// editable (ALT-033), matching "multi-layout themes" from EasyVerse.
export const DEFAULT_THEMES: ThemeDef[] = CATEGORIES.flatMap((cat) => [
  buildPreset('Dark Gold', cat, '#000000', '#FFFFFF', '#C9A34A', cat === 'Transparent Background'),
  buildPreset('Clean Light', cat, '#F8F6F0', '#1A1814', '#5A6A5F', cat === 'Transparent Background'),
  buildPreset('Bold Blue', cat, '#0D1B2A', '#E8F0FE', '#7BAFD4', cat === 'Transparent Background'),
])

export function cloneTheme(theme: ThemeDef, asCustom = true): ThemeDef {
  return {
    ...theme,
    id: id('theme'),
    isCustom: asCustom,
    layers: theme.layers.map((l) => ({ ...l, id: id('layer') })),
  }
}

export function newBlankTheme(category: Category): ThemeDef {
  return {
    id: id('theme'),
    name: 'Untitled Theme',
    category,
    isCustom: true,
    backgroundType: 'solid',
    backgroundColor: '#10160F',
    backgroundColor2: '#10160F',
    dualTranslation: false,
    layers: [
      textLayer({ label: 'Verse Text', content: '{{verse}}', x: 10, y: 40, width: 80, height: 24, color: '#EDEAE0' }),
      textLayer({ label: 'Citation', content: '{{citation}}', x: 10, y: 68, width: 80, height: 8, fontSize: 14, color: '#A8702E' }),
    ],
  }
}

export function newLayer(label: string): Layer {
  return textLayer({ label, content: label, x: 20, y: 45, width: 60, height: 12, fontSize: 20 })
}
