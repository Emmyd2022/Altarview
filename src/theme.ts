// Altarview design tokens — single source of truth for the app's own
// control-panel UI. Change a value here and it updates everywhere that
// imports it, instead of being copy-pasted per screen.
//
// NOTE: Preview/Live/Stage output screens intentionally do NOT use these
// tokens for their projected content — they stay pure black/white (or
// whatever output theme the operator picks on the Themes screen) for
// projector legibility. These tokens are for the app's own chrome only.

export const theme = {
  bg: '#10160F',
  bgElevated: '#0B0F09',
  bgPanel: '#1B2318',
  border: '#2A331F',
  textPrimary: '#EDEAE0',
  textMuted: '#8F9885',
  textDim: '#3A4430',
  accent: '#A8702E',
  accentHover: '#C08A44',
  accentOn: '#10160F',
  success: '#6FC98A',
  error: '#ff6060',
} as const

export type Theme = typeof theme
