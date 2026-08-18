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

export type DisplayContent = VerseDisplayContent | TimerDisplayContent

export function OutputStage({
  content,
  badgeLabel,
  badgeColor,
  onExit,
}: {
  content: DisplayContent | null
  badgeLabel: string
  badgeColor: string
  onExit?: () => void
}) {
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
              fontSize: 40,
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

          <div style={{ width: 48, height: 1, background: 'rgba(201,163,74,0.3)' }} />
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
