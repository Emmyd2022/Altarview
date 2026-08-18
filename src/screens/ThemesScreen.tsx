import { useState } from 'react'
import {
  CATEGORIES,
  DEFAULT_THEMES,
  cloneTheme,
  newBlankTheme,
  newLayer,
  type Category,
  type Layer,
  type ThemeDef,
} from '../themeModel'

const SAMPLE_VERSE = 'The LORD is my shepherd; I shall not want.'
const SAMPLE_CITATION = 'Psalm 23:1 · KJV'
const SAMPLE_CITATION_2 = 'Psalm 23:1 · NIV'

const FONT_OPTIONS = [
  'Lora, Georgia, serif',
  'Georgia, serif',
  '"Playfair Display", serif',
  'Inter, Segoe UI, sans-serif',
  '"Open Sans", sans-serif',
]

export default function ThemesScreen() {
  const [category, setCategory] = useState<Category>('Lower Third')
  const [themes, setThemes] = useState<ThemeDef[]>(DEFAULT_THEMES)
  const [selectedId, setSelectedId] = useState(
    DEFAULT_THEMES.find((t) => t.category === 'Lower Third')!.id,
  )
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null)

  const inCategory = themes.filter((t) => t.category === category)
  const theme = themes.find((t) => t.id === selectedId) ?? inCategory[0]
  const layer = theme?.layers.find((l) => l.id === selectedLayerId) ?? null

  function updateTheme(patch: Partial<ThemeDef>) {
    setThemes((prev) => prev.map((t) => (t.id === theme.id ? { ...t, ...patch } : t)))
  }

  function updateLayer(layerId: string, patch: Partial<Layer>) {
    setThemes((prev) =>
      prev.map((t) =>
        t.id === theme.id
          ? { ...t, layers: t.layers.map((l) => (l.id === layerId ? { ...l, ...patch } : l)) }
          : t,
      ),
    )
  }

  function selectCategory(c: Category) {
    setCategory(c)
    const first = themes.find((t) => t.category === c)
    if (first) setSelectedId(first.id)
    setSelectedLayerId(null)
  }

  function addLayer() {
    const l = newLayer('Custom Field')
    updateTheme({ layers: [...theme.layers, l] })
    setSelectedLayerId(l.id)
  }

  function removeLayer(layerId: string) {
    updateTheme({ layers: theme.layers.filter((l) => l.id !== layerId) })
    if (selectedLayerId === layerId) setSelectedLayerId(null)
  }

  function saveAsNew() {
    const copy = cloneTheme(theme, true)
    copy.name = `${theme.name} Copy`
    setThemes((prev) => [...prev, copy])
    setSelectedId(copy.id)
  }

  function buildFromScratch() {
    const t = newBlankTheme(category)
    setThemes((prev) => [...prev, t])
    setSelectedId(t.id)
    setSelectedLayerId(null)
  }

  function deleteCustomTheme() {
    if (!theme.isCustom) return
    setThemes((prev) => prev.filter((t) => t.id !== theme.id))
    const remaining = themes.filter((t) => t.category === category && t.id !== theme.id)
    if (remaining[0]) setSelectedId(remaining[0].id)
  }

  const previewBg =
    theme.backgroundType === 'transparent'
      ? 'repeating-conic-gradient(#2A2A2A 0% 25%, #1A1A1A 0% 50%) 50% / 16px 16px'
      : theme.backgroundType === 'gradient'
        ? `linear-gradient(135deg, ${theme.backgroundColor}, ${theme.backgroundColor2})`
        : theme.backgroundColor

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Theme browser sidebar */}
      <div style={{ width: 220, flexShrink: 0, borderRight: '1px solid #2A331F', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ height: 48, borderBottom: '1px solid #2A331F', display: 'flex', alignItems: 'center', padding: '0 16px', flexShrink: 0 }}>
          <span style={{ fontWeight: 600, fontSize: 13, color: '#EDEAE0' }}>Themes</span>
        </div>
        <div style={{ padding: 12, overflowY: 'auto', flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.07em', color: '#8F9885', textTransform: 'uppercase', marginBottom: 6 }}>
            Category
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => selectCategory(c)}
                style={{
                  textAlign: 'left',
                  background: category === c ? 'rgba(168,112,46,0.14)' : 'transparent',
                  border: category === c ? '1px solid rgba(168,112,46,0.4)' : '1px solid transparent',
                  borderRadius: 6,
                  padding: '6px 10px',
                  fontSize: 12,
                  fontWeight: category === c ? 600 : 400,
                  color: category === c ? '#A8702E' : '#8F9885',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {c}
              </button>
            ))}
          </div>

          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.07em', color: '#8F9885', textTransform: 'uppercase', marginBottom: 6 }}>
            Themes in this category
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
            {inCategory.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setSelectedId(t.id)
                  setSelectedLayerId(null)
                }}
                style={{
                  textAlign: 'left',
                  background: t.id === theme.id ? '#1B2318' : 'transparent',
                  border: t.id === theme.id ? '1px solid rgba(168,112,46,0.4)' : '1px solid #2A331F',
                  borderRadius: 6,
                  padding: '7px 10px',
                  fontSize: 12,
                  color: t.id === theme.id ? '#EDEAE0' : '#8F9885',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                {t.name}
                {t.isCustom && (
                  <span style={{ fontSize: 9, color: '#3A4430', border: '1px solid #2A331F', borderRadius: 4, padding: '0 4px' }}>
                    custom
                  </span>
                )}
              </button>
            ))}
          </div>
          <button
            onClick={buildFromScratch}
            style={{
              width: '100%',
              background: 'transparent',
              border: '1px dashed rgba(168,112,46,0.4)',
              borderRadius: 6,
              padding: '8px 10px',
              fontSize: 11,
              fontWeight: 600,
              color: '#A8702E',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            + Build from scratch
          </button>
        </div>
      </div>

      {/* Editor */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ height: 48, borderBottom: '1px solid #2A331F', display: 'flex', alignItems: 'center', padding: '0 20px', gap: 10, flexShrink: 0 }}>
          <input
            value={theme.name}
            onChange={(e) => updateTheme({ name: e.target.value })}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: 13,
              fontWeight: 600,
              color: '#EDEAE0',
              outline: 'none',
              fontFamily: 'inherit',
              flex: 1,
              minWidth: 0,
            }}
          />
          <button onClick={saveAsNew} style={ghostBtn}>Save as New</button>
          {theme.isCustom && (
            <button onClick={deleteCustomTheme} style={{ ...ghostBtn, color: '#ff6060', borderColor: 'rgba(255,96,96,0.3)' }}>
              Delete
            </button>
          )}
        </div>

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Canvas preview with positioned layers */}
          <div style={{ flex: 1, padding: 20, overflow: 'auto' }}>
            <div
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '16/9',
                background: previewBg,
                borderRadius: 8,
                border: '1px solid #2A331F',
                overflow: 'hidden',
              }}
            >
              {theme.layers.filter((l) => l.visible).map((l) => (
                <div
                  key={l.id}
                  onClick={() => setSelectedLayerId(l.id)}
                  style={{
                    position: 'absolute',
                    left: `${l.x}%`,
                    top: `${l.y}%`,
                    width: `${l.width}%`,
                    height: `${l.height}%`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: l.align === 'left' ? 'flex-start' : l.align === 'right' ? 'flex-end' : 'center',
                    padding: '4px 8px',
                    background: l.fill,
                    border: l.stroke !== 'transparent' ? `${l.strokeWidth}px solid ${l.stroke}` : 'none',
                    borderRadius: l.feather ? Math.min(l.feather, 24) : 4,
                    boxShadow: l.feather ? `0 0 ${l.feather}px ${l.fill !== 'transparent' ? l.fill : 'rgba(0,0,0,0.4)'}` : 'none',
                    cursor: 'pointer',
                    outline: selectedLayerId === l.id ? '2px solid #A8702E' : 'none',
                    outlineOffset: 2,
                    overflow: 'hidden',
                  }}
                >
                  <span
                    style={{
                      fontFamily: l.fontFamily,
                      fontSize: `${l.fontSize * 0.5}%`,
                      fontWeight: l.fontWeight,
                      color: l.color,
                      letterSpacing: `${l.letterSpacing}px`,
                      textAlign: l.align,
                      WebkitTextStroke: l.outlineWidth ? `${l.outlineWidth}px ${l.outlineColor}` : undefined,
                      textShadow: l.shadowBlur ? `0 2px ${l.shadowBlur}px ${l.shadowColor}` : undefined,
                      lineHeight: 1.3,
                    }}
                  >
                    {resolveContent(l.content, theme.dualTranslation)}
                  </span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 11, color: '#3A4430', marginTop: 10 }}>
              Click a layer on the canvas, or in the list on the right, to edit its style and position.
            </p>
          </div>

          {/* Right panel: background, layers, dual translation, layer properties */}
          <div style={{ width: 300, flexShrink: 0, borderLeft: '1px solid #2A331F', overflowY: 'auto', padding: 16 }}>
            <SectionLabel>Background</SectionLabel>
            <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
              {(['solid', 'gradient', 'transparent'] as const).map((bt) => (
                <button
                  key={bt}
                  onClick={() => updateTheme({ backgroundType: bt })}
                  style={{
                    flex: 1,
                    background: theme.backgroundType === bt ? 'rgba(168,112,46,0.14)' : '#1B2318',
                    border: theme.backgroundType === bt ? '1px solid rgba(168,112,46,0.4)' : '1px solid #2A331F',
                    borderRadius: 5,
                    padding: '5px 0',
                    fontSize: 10,
                    color: theme.backgroundType === bt ? '#A8702E' : '#8F9885',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    textTransform: 'capitalize',
                  }}
                >
                  {bt}
                </button>
              ))}
            </div>
            {theme.backgroundType !== 'transparent' && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <ColorField label="Color" value={theme.backgroundColor} onChange={(v) => updateTheme({ backgroundColor: v })} />
                {theme.backgroundType === 'gradient' && (
                  <ColorField label="Color 2" value={theme.backgroundColor2} onChange={(v) => updateTheme({ backgroundColor2: v })} />
                )}
              </div>
            )}

            <SectionLabel>Parallel Translation</SectionLabel>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontSize: 11, color: '#8F9885', maxWidth: 200 }}>
                Show a primary and secondary translation together (EasyVerse-style parallel display).
              </span>
              <Toggle value={theme.dualTranslation} onChange={(v) => updateTheme({ dualTranslation: v })} />
            </div>

            <SectionLabel>Layers ({theme.layers.length}/8)</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
              {theme.layers.map((l) => (
                <div
                  key={l.id}
                  onClick={() => setSelectedLayerId(l.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: selectedLayerId === l.id ? 'rgba(168,112,46,0.12)' : '#1B2318',
                    border: selectedLayerId === l.id ? '1px solid rgba(168,112,46,0.4)' : '1px solid #2A331F',
                    borderRadius: 6,
                    padding: '6px 8px',
                    cursor: 'pointer',
                  }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      updateLayer(l.id, { visible: !l.visible })
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, opacity: l.visible ? 1 : 0.35 }}
                    title={l.visible ? 'Hide layer' : 'Show layer'}
                  >
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <path d="M1 6.5S3 2.5 6.5 2.5 12 6.5 12 6.5 10 10.5 6.5 10.5 1 6.5 1 6.5Z" stroke="#8F9885" strokeWidth="1.1" />
                      <circle cx="6.5" cy="6.5" r="1.7" stroke="#8F9885" strokeWidth="1.1" />
                    </svg>
                  </button>
                  <span style={{ fontSize: 11, color: '#EDEAE0', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {l.label}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeLayer(l.id)
                    }}
                    style={{ background: 'none', border: 'none', color: '#8F9885', cursor: 'pointer', fontSize: 13, padding: '0 2px' }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addLayer}
              disabled={theme.layers.length >= 8}
              style={{
                width: '100%',
                background: 'transparent',
                border: '1px dashed #2A331F',
                borderRadius: 6,
                padding: '7px 0',
                fontSize: 11,
                color: theme.layers.length >= 8 ? '#3A4430' : '#8F9885',
                cursor: theme.layers.length >= 8 ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                marginBottom: 16,
              }}
            >
              + Add Layer
            </button>

            {layer && <LayerProperties layer={layer} onChange={(patch) => updateLayer(layer.id, patch)} />}
          </div>
        </div>
      </div>
    </div>
  )
}

function resolveContent(content: string, dual: boolean): string {
  switch (content) {
    case '{{verse}}':
      return SAMPLE_VERSE
    case '{{citation}}':
      return dual ? `${SAMPLE_CITATION}` : SAMPLE_CITATION
    case '{{citation-secondary}}':
      return SAMPLE_CITATION_2
    case '{{speaker}}':
      return 'Pastor John Adeyemi'
    case '{{title}}':
      return 'Walking in the Spirit'
    default:
      return content
  }
}

function LayerProperties({ layer, onChange }: { layer: Layer; onChange: (patch: Partial<Layer>) => void }) {
  return (
    <div>
      <SectionLabel>Layer: {layer.label}</SectionLabel>

      <FieldRow label="Label">
        <input
          value={layer.label}
          onChange={(e) => onChange({ label: e.target.value })}
          style={inputStyle}
        />
      </FieldRow>

      <FieldRow label="Font">
        <select value={layer.fontFamily} onChange={(e) => onChange({ fontFamily: e.target.value })} style={inputStyle}>
          {FONT_OPTIONS.map((f) => (
            <option key={f} value={f} style={{ background: '#1B2318' }}>
              {f.split(',')[0].replace(/"/g, '')}
            </option>
          ))}
        </select>
      </FieldRow>

      <div style={{ display: 'flex', gap: 8 }}>
        <FieldRow label="Size" narrow>
          <input type="number" value={layer.fontSize} onChange={(e) => onChange({ fontSize: Number(e.target.value) })} style={inputStyle} />
        </FieldRow>
        <FieldRow label="Weight" narrow>
          <select value={layer.fontWeight} onChange={(e) => onChange({ fontWeight: Number(e.target.value) })} style={inputStyle}>
            {[300, 400, 500, 600, 700].map((w) => (
              <option key={w} value={w} style={{ background: '#1B2318' }}>{w}</option>
            ))}
          </select>
        </FieldRow>
        <FieldRow label="Spacing" narrow>
          <input type="number" value={layer.letterSpacing} onChange={(e) => onChange({ letterSpacing: Number(e.target.value) })} style={inputStyle} />
        </FieldRow>
      </div>

      <FieldRow label="Align">
        <div style={{ display: 'flex', gap: 4 }}>
          {(['left', 'center', 'right'] as const).map((a) => (
            <button
              key={a}
              onClick={() => onChange({ align: a })}
              style={{
                flex: 1,
                background: layer.align === a ? 'rgba(168,112,46,0.14)' : '#1B2318',
                border: layer.align === a ? '1px solid rgba(168,112,46,0.4)' : '1px solid #2A331F',
                borderRadius: 5,
                padding: '5px 0',
                fontSize: 10,
                color: layer.align === a ? '#A8702E' : '#8F9885',
                cursor: 'pointer',
                textTransform: 'capitalize',
                fontFamily: 'inherit',
              }}
            >
              {a}
            </button>
          ))}
        </div>
      </FieldRow>

      <div style={{ display: 'flex', gap: 8 }}>
        <ColorField label="Text Color" value={layer.color} onChange={(v) => onChange({ color: v })} />
      </div>

      <SectionLabel small>Outline & Shadow</SectionLabel>
      <div style={{ display: 'flex', gap: 8 }}>
        <ColorField label="Outline" value={layer.outlineColor} onChange={(v) => onChange({ outlineColor: v })} />
        <FieldRow label="Width" narrow>
          <input type="number" min={0} value={layer.outlineWidth} onChange={(e) => onChange({ outlineWidth: Number(e.target.value) })} style={inputStyle} />
        </FieldRow>
      </div>
      <FieldRow label="Shadow blur">
        <input type="number" min={0} value={layer.shadowBlur} onChange={(e) => onChange({ shadowBlur: Number(e.target.value) })} style={inputStyle} />
      </FieldRow>

      <SectionLabel small>Container (fill / stroke / feather)</SectionLabel>
      <div style={{ display: 'flex', gap: 8 }}>
        <ColorField
          label="Fill"
          value={layer.fill}
          onChange={(v) => onChange({ fill: v })}
          allowTransparent
        />
        <ColorField label="Stroke" value={layer.stroke} onChange={(v) => onChange({ stroke: v })} allowTransparent />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <FieldRow label="Stroke width" narrow>
          <input type="number" min={0} value={layer.strokeWidth} onChange={(e) => onChange({ strokeWidth: Number(e.target.value) })} style={inputStyle} />
        </FieldRow>
        <FieldRow label="Feather" narrow>
          <input type="number" min={0} value={layer.feather} onChange={(e) => onChange({ feather: Number(e.target.value) })} style={inputStyle} />
        </FieldRow>
      </div>

      <SectionLabel small>Position & Size (%)</SectionLabel>
      <div style={{ display: 'flex', gap: 8 }}>
        <FieldRow label="X" narrow>
          <input type="number" value={layer.x} onChange={(e) => onChange({ x: Number(e.target.value) })} style={inputStyle} />
        </FieldRow>
        <FieldRow label="Y" narrow>
          <input type="number" value={layer.y} onChange={(e) => onChange({ y: Number(e.target.value) })} style={inputStyle} />
        </FieldRow>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <FieldRow label="Width" narrow>
          <input type="number" value={layer.width} onChange={(e) => onChange({ width: Number(e.target.value) })} style={inputStyle} />
        </FieldRow>
        <FieldRow label="Height" narrow>
          <input type="number" value={layer.height} onChange={(e) => onChange({ height: Number(e.target.value) })} style={inputStyle} />
        </FieldRow>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#10160F',
  border: '1px solid #2A331F',
  borderRadius: 5,
  padding: '5px 8px',
  fontSize: 11,
  color: '#EDEAE0',
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
}

const ghostBtn: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid #2A331F',
  borderRadius: 6,
  padding: '5px 12px',
  fontSize: 11,
  color: '#8F9885',
  cursor: 'pointer',
  fontFamily: 'inherit',
  whiteSpace: 'nowrap',
}

function FieldRow({ label, children, narrow }: { label: string; children: React.ReactNode; narrow?: boolean }) {
  return (
    <div style={{ marginBottom: 8, flex: narrow ? 1 : undefined }}>
      <div style={{ fontSize: 10, color: '#8F9885', marginBottom: 3 }}>{label}</div>
      {children}
    </div>
  )
}

function ColorField({
  label,
  value,
  onChange,
  allowTransparent,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  allowTransparent?: boolean
}) {
  const isTransparent = value === 'transparent'
  return (
    <div style={{ marginBottom: 8, flex: 1 }}>
      <div style={{ fontSize: 10, color: '#8F9885', marginBottom: 3 }}>{label}</div>
      <div style={{ display: 'flex', gap: 4 }}>
        <input
          type="color"
          value={isTransparent ? '#000000' : value.startsWith('rgba') ? '#000000' : value}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: 28, height: 28, padding: 0, border: '1px solid #2A331F', borderRadius: 5, background: 'none', cursor: 'pointer' }}
        />
        {allowTransparent ? (
          <button
            onClick={() => onChange(isTransparent ? '#000000' : 'transparent')}
            style={{
              flex: 1,
              fontSize: 10,
              background: '#10160F',
              border: '1px solid #2A331F',
              borderRadius: 5,
              color: '#8F9885',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {isTransparent ? 'Transparent' : value}
          </button>
        ) : (
          <input value={value} onChange={(e) => onChange(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
        )}
      </div>
    </div>
  )
}

function SectionLabel({ children, small }: { children: React.ReactNode; small?: boolean }) {
  return (
    <div
      style={{
        fontSize: small ? 9 : 10,
        fontWeight: 600,
        letterSpacing: '0.07em',
        color: '#8F9885',
        textTransform: 'uppercase',
        marginTop: small ? 12 : 0,
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  )
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 36,
        height: 20,
        borderRadius: 10,
        border: 'none',
        background: value ? '#A8702E' : '#2A331F',
        position: 'relative',
        cursor: 'pointer',
        flexShrink: 0,
      }}
    >
      <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#EDEAE0', position: 'absolute', top: 3, left: value ? 19 : 3, transition: 'left 0.2s' }} />
    </button>
  )
}
