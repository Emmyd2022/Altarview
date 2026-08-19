// Shared rendering for whatever is currently staged/live — used by both
// PreviewScreen and LiveScreen so their actual verse/content rendering
// stays identical; only the badge and exit behavior differ.
//
// NOTE: colors here are intentionally NOT from theme.ts (see theme.ts's
// own note) — this is the congregation-facing output, styled by whatever
// the operator picks on the Themes screen (defaulting to the "Dark Gold"
// preset's black/white/gold look), not by the app's own control-panel
// palette.

export interface VerseDisplayContent {
  type: 'verse'
  ref: string
  translation: string
  text: string
  // ALT: optional secondary translation for side-by-side comparison
  // display, toggled on by the operator per verse (see Operator's
  // "Compare translations" control).
  secondaryTranslation?: string
  secondaryText?: string
}

// ALT: real Send to Preview/Live for songs -- previously Song Lyrics had
// no way to actually put a song on screen at all.
export interface SongDisplayContent {
  type: 'song'
  title: string
  artist: string
  lines: string[]
}

// ALT-040: lets the operator push the Stage countdown onto the Live
// output on demand (e.g. showing a Sunday School countdown to everyone),
// without that being a permanent routing rule.
export interface TimerDisplayContent {
  type: 'timer'
  sessionTitle: string
  remainingSeconds: number
  totalSeconds: number
}

// ALT: sermon notes/announcement slides sent directly to Live, independent
// of the service playlist -- freeform text, not verse-structured.
export interface SlideDisplayContent {
  type: 'slide'
  text: string
}

export type DisplayContent = VerseDisplayContent | SongDisplayContent | TimerDisplayContent | SlideDisplayContent

import type { ThemeDef, Layer } from '../themeModel'

export function OutputStage({
  content,
  badgeLabel,
  badgeColor,
  onExit,
  theme,
}: {
  content: DisplayContent | null
  badgeLabel: string
  badgeColor: string
  onExit?: () => void
  theme?: ThemeDef | null
}) {
  // ALT-043: when an active theme is set and the current content is a
  // verse, render using the theme's layers instead of the hardcoded
  // style below -- this is the actual connection between the Theme
  // Editor and what the congregation sees, which didn't exist before.
  if (theme && content?.type === 'verse') {
    return <ThemedVerseOutput content={content} theme={theme} badgeLabel={badgeLabel} badgeColor={badgeColor} onExit={onExit} />
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 120px',
        position: 'relative',
      }}
    >
      {/* Church name watermark */}
      <div
        style={{
          position: 'absolute',
          top: 28,
          left: 36,
          fontSize: 11,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'rgba(201,163,74,0.3)',
          fontFamily: 'Inter, Segoe UI, sans-serif',
        }}
      >
        RCCG CAYC Media
      </div>

      {/* Status badge (PREVIEW or LIVE) */}
      <div
        style={{
          position: 'absolute',
          top: 28,
          right: 36,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <div
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: badgeColor,
            boxShadow: `0 0 6px ${badgeColor}`,
          }}
        />
        <span
          style={{
            fontSize: 11,
            color: 'rgba(255,255,255,0.35)',
            fontFamily: 'Inter, Segoe UI, sans-serif',
            letterSpacing: '0.06em',
            fontWeight: 600,
          }}
        >
          {badgeLabel}
        </span>
      </div>

      {/* Content */}
      {content?.type === 'verse' ? (
        <div
          style={{
            maxWidth: 800,
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 32,
          }}
        >
          <div style={{ width: 48, height: 1, background: 'rgba(201,163,74,0.3)' }} />

          <blockquote
            style={{
              margin: 0,
              fontFamily: 'Lora, Georgia, "Times New Roman", serif',
              fontSize: content.secondaryText ? 30 : 40,
              fontWeight: 400,
              color: '#FFFFFF',
              lineHeight: 1.6,
              letterSpacing: '0.01em',
            }}
          >
            "{content.text}"
          </blockquote>

          <div
            style={{
              fontFamily: 'Lora, Georgia, serif',
              fontSize: 18,
              fontWeight: 500,
              color: '#C9A34A',
              letterSpacing: '0.06em',
            }}
          >
            {content.ref} &nbsp;·&nbsp; {content.translation}
          </div>

          {/* ALT: side-by-side (stacked) translation comparison, toggled
              on by the operator per verse -- both versions shown at once
              for when the preacher wants the congregation to see both. */}
          {content.secondaryText && (
            <>
              <div style={{ width: 30, height: 1, background: 'rgba(255,255,255,0.15)' }} />
              <blockquote
                style={{
                  margin: 0,
                  fontFamily: 'Lora, Georgia, "Times New Roman", serif',
                  fontSize: 26,
                  fontWeight: 400,
                  color: 'rgba(255,255,255,0.75)',
                  lineHeight: 1.55,
                  letterSpacing: '0.01em',
                }}
              >
                "{content.secondaryText}"
              </blockquote>
              <div
                style={{
                  fontFamily: 'Lora, Georgia, serif',
                  fontSize: 15,
                  fontWeight: 500,
                  color: 'rgba(201,163,74,0.75)',
                  letterSpacing: '0.06em',
                }}
              >
                {content.ref} &nbsp;·&nbsp; {content.secondaryTranslation}
              </div>
            </>
          )}

          <div style={{ width: 48, height: 1, background: 'rgba(201,163,74,0.3)' }} />
        </div>
      ) : content?.type === 'song' ? (
        <div style={{ maxWidth: 760, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          {content.lines.map((line, i) => (
            <div
              key={i}
              style={{
                fontFamily: 'Inter, Segoe UI, sans-serif',
                fontSize: 34,
                fontWeight: 600,
                color: '#FFFFFF',
                lineHeight: 1.5,
              }}
            >
              {line}
            </div>
          ))}
          <div style={{ fontFamily: 'Inter, Segoe UI, sans-serif', fontSize: 14, color: '#C9A34A', letterSpacing: '0.06em', marginTop: 8 }}>
            {content.title} &nbsp;·&nbsp; {content.artist}
          </div>
        </div>
      ) : content?.type === 'slide' ? (
        <div
          style={{
            maxWidth: 900,
            textAlign: 'center',
            fontFamily: 'Inter, Segoe UI, sans-serif',
            fontSize: 32,
            fontWeight: 500,
            color: '#FFFFFF',
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
          }}
        >
          {content.text}
        </div>
      ) : content?.type === 'timer' ? (
        <TimerDisplay content={content} />
      ) : (
        <div
          style={{
            fontSize: 13,
            color: 'rgba(255,255,255,0.25)',
            fontFamily: 'Inter, Segoe UI, sans-serif',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Nothing on {badgeLabel.toLowerCase()}
        </div>
      )}

      {onExit && (
        <button
          onClick={onExit}
          style={{
            position: 'absolute',
            bottom: 28,
            right: 36,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6,
            padding: '5px 12px',
            fontSize: 11,
            color: 'rgba(255,255,255,0.4)',
            cursor: 'pointer',
            fontFamily: 'Inter, Segoe UI, sans-serif',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'rgba(255,255,255,0.7)'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'rgba(255,255,255,0.4)'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
          }}
        >
          ← Back to operator
        </button>
      )}

      <div
        style={{
          position: 'absolute',
          bottom: 28,
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 10,
          color: 'rgba(255,255,255,0.12)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          fontFamily: 'Inter, Segoe UI, sans-serif',
        }}
      >
        {badgeLabel} output — 1920 × 1080
      </div>
    </div>
  )
}

// ALT-043: renders a verse using an active theme's layer definitions --
// each layer independently positioned/styled, resolving {{verse}} and
// {{citation}} tokens against the real content instead of sample text.
function ThemedVerseOutput({
  content,
  theme,
  badgeLabel,
  badgeColor,
  onExit,
}: {
  content: VerseDisplayContent
  theme: ThemeDef
  badgeLabel: string
  badgeColor: string
  onExit?: () => void
}) {
  const background =
    theme.backgroundType === 'transparent'
      ? 'repeating-conic-gradient(#2A2A2A 0% 25%, #1A1A1A 0% 50%) 50% / 16px 16px'
      : theme.backgroundType === 'gradient'
        ? `linear-gradient(135deg, ${theme.backgroundColor}, ${theme.backgroundColor2})`
        : theme.backgroundColor

  function resolveText(layer: Layer): string {
    switch (layer.content) {
      case '{{verse}}':
        return content.text
      case '{{citation}}':
        return `${content.ref} · ${content.translation}`
      case '{{citation-secondary}}':
        return content.secondaryText && content.secondaryTranslation
          ? `${content.secondaryText} — ${content.ref} · ${content.secondaryTranslation}`
          : ''
      default:
        return layer.content
    }
  }

  return (
    <div style={{ width: '100%', height: '100%', background, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 28, right: 36, display: 'flex', alignItems: 'center', gap: 6, zIndex: 10 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: badgeColor, boxShadow: `0 0 6px ${badgeColor}` }} />
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: 'Inter, Segoe UI, sans-serif', letterSpacing: '0.06em', fontWeight: 600 }}>
          {badgeLabel}
        </span>
      </div>

      {theme.layers
        .filter((l) => l.visible)
        .map((l) => {
          const text = resolveText(l)
          if (!text) return null
          return (
            <div
              key={l.id}
              style={{
                position: 'absolute',
                left: `${l.x}%`,
                top: `${l.y}%`,
                width: `${l.width}%`,
                height: `${l.height}%`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: l.align === 'left' ? 'flex-start' : l.align === 'right' ? 'flex-end' : 'center',
                padding: '1% 1.5%',
                background: l.fill,
                border: l.stroke !== 'transparent' ? `${l.strokeWidth}px solid ${l.stroke}` : 'none',
                borderRadius: l.feather ? Math.min(l.feather, 24) : 4,
                boxShadow: l.feather ? `0 0 ${l.feather}px ${l.fill !== 'transparent' ? l.fill : 'rgba(0,0,0,0.4)'}` : 'none',
              }}
            >
              <span
                style={{
                  fontFamily: l.fontFamily,
                  fontSize: `${l.fontSize / 10.8}vw`,
                  fontWeight: l.fontWeight,
                  color: l.color,
                  letterSpacing: `${l.letterSpacing}px`,
                  textAlign: l.align,
                  WebkitTextStroke: l.outlineWidth ? `${l.outlineWidth}px ${l.outlineColor}` : undefined,
                  textShadow: l.shadowBlur ? `0 2px ${l.shadowBlur}px ${l.shadowColor}` : undefined,
                  lineHeight: 1.4,
                }}
              >
                {text}
              </span>
            </div>
          )
        })}

      {onExit && (
        <button
          onClick={onExit}
          style={{
            position: 'absolute',
            bottom: 28,
            right: 36,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6,
            padding: '5px 12px',
            fontSize: 11,
            color: 'rgba(255,255,255,0.4)',
            cursor: 'pointer',
            fontFamily: 'Inter, Segoe UI, sans-serif',
            zIndex: 10,
          }}
        >
          ← Back to operator
        </button>
      )}
    </div>
  )
}

// ALT-040: renders the pushed Stage countdown when Live is showing the
// timer instead of a verse -- same visual language (ring, big numerals)
// as the Stage screen itself, so it reads consistently to the congregation.
function TimerDisplay({ content }: { content: TimerDisplayContent }) {
  const minutes = Math.floor(content.remainingSeconds / 60)
  const seconds = content.remainingSeconds % 60
  const progress = content.totalSeconds > 0 ? content.remainingSeconds / content.totalSeconds : 0
  const radius = 130
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - progress)

  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          fontSize: 22,
          fontWeight: 500,
          color: 'rgba(255,255,255,0.55)',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          fontFamily: 'Inter, Segoe UI, sans-serif',
          marginBottom: 24,
        }}
      >
        {content.sessionTitle}
      </div>
      <div style={{ position: 'relative', width: 260, height: 260, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="260" height="260" viewBox="0 0 280 280" style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
          <circle cx="140" cy="140" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
          <circle
            cx="140"
            cy="140"
            r={radius}
            fill="none"
            stroke="#A8702E"
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <div style={{ fontSize: 56, fontWeight: 300, color: '#A8702E', fontVariantNumeric: 'tabular-nums', fontFamily: 'Inter, Segoe UI, sans-serif' }}>
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
      </div>
    </div>
  )
}
