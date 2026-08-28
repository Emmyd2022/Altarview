import { useEffect } from 'react'
import type { StageTimerState } from '../hooks/useStageTimer'
import type { DisplayContent } from './OutputStage'

// ALT-018: this is the OUTPUT the person on stage actually sees. It shows
// only the session name (header) and a large timer -- no Start/Pause/
// Next/Previous/Stop controls render here. Those live on the operator's
// StageControlScreen instead, which drives this via shared state.
//
// ALT-017: there's no visible "exit" button (that would violate ALT-018),
// but pressing Escape returns to the operator -- invisible to whoever is
// reading this screen from the stage, but always available to whoever is
// actually running the app.
//
// ALT: "Send to Stage" -- scripture/songs/slides can be pushed here from
// the Operator panel, entirely replacing the timer view while shown. The
// timer automatically comes back once Stage content is cleared.
export default function StageScreen({
  state,
  onExit,
  content,
}: {
  state: StageTimerState
  onExit: () => void
  content?: DisplayContent | null
}) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onExit()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onExit])

  const { current, remaining, timesUp, flashing, flashCount, message } = state

  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60
  const total = current.durationMinutes * 60
  const progress = total > 0 ? remaining / total : 0
  const radius = 130
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - progress)

  // ALT-020: flash "TIME UP" on/off every 500ms while flashing is active.
  const showFlashText = flashing && flashCount % 2 === 0

  // ALT: when something has been sent to Stage, it takes over the whole
  // screen -- the timer view returns automatically once cleared.
  if (content) {
    return (
      <div
        role="region"
        aria-label="FOLDBACK output"
        style={{
          width: '100%',
          height: '100%',
          background: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6vw',
          overflow: 'hidden',
        }}
      >
        {content.type === 'verse' && (
          <div style={{ maxWidth: 900, textAlign: 'center' }}>
            <div style={{ fontFamily: 'Lora, Georgia, serif', fontSize: '3.2vw', color: '#fff', lineHeight: 1.5 }}>
              "{content.text}"
            </div>
            <div style={{ fontFamily: 'Lora, Georgia, serif', fontSize: '1.4vw', color: '#A8702E', marginTop: 24 }}>
              {content.ref} · {content.translation}
            </div>
          </div>
        )}
        {content.type === 'song' && (
          <div style={{ maxWidth: 900, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {content.lines.map((line, i) => (
              <div key={i} style={{ fontFamily: 'Inter, Segoe UI, sans-serif', fontSize: '2.8vw', fontWeight: 600, color: '#fff' }}>
                {line}
              </div>
            ))}
            <div style={{ fontFamily: 'Inter, Segoe UI, sans-serif', fontSize: '1.2vw', color: '#A8702E', marginTop: 8 }}>
              {content.title}
            </div>
          </div>
        )}
        {content.type === 'slide' && (
          <div style={{ maxWidth: 900, textAlign: 'center', fontFamily: 'Inter, Segoe UI, sans-serif', fontSize: '2.6vw', fontWeight: 500, color: '#fff', whiteSpace: 'pre-wrap' }}>
            {content.text}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      role="region"
      aria-label="FOLDBACK output"
      style={{
        width: '100%',
        height: '100%',
        background: '#000',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Session name header -- top of screen, per ALT-018 */}
      <div
        style={{
          padding: '32px 40px 20px',
          textAlign: 'center',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontSize: 22,
            fontWeight: 500,
            color: 'rgba(255,255,255,0.55)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            fontFamily: 'Inter, Segoe UI, sans-serif',
          }}
        >
          {current.title}
        </div>
      </div>

      {/* Timer fills the rest of the screen -- much larger than the header, per ALT-018 */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        {timesUp || (flashing && showFlashText) ? (
          <div
            style={{
              fontSize: 'min(18vw, 220px)',
              fontWeight: 700,
              color: '#ff6060',
              letterSpacing: '0.05em',
              fontFamily: 'Inter, Segoe UI, sans-serif',
            }}
          >
            TIME UP
          </div>
        ) : (
          <div style={{ position: 'relative', width: 'min(60vw, 60vh)', height: 'min(60vw, 60vh)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="100%" height="100%" viewBox="0 0 280 280" style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
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
            <div
              style={{
                fontSize: 'min(14vw, 140px)',
                fontWeight: 300,
                color: '#A8702E',
                fontVariantNumeric: 'tabular-nums',
                fontFamily: 'Inter, Segoe UI, sans-serif',
              }}
            >
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
          </div>
        )}
      </div>

      {/* Operator-to-stage message (ALT-021), never a control -- just informational */}
      {message && (
        <div
          style={{
            padding: '20px 40px 40px',
            textAlign: 'center',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: 'inline-block',
              background: 'rgba(168,112,46,0.14)',
              border: '1px solid rgba(168,112,46,0.35)',
              borderRadius: 10,
              padding: '10px 24px',
              fontSize: 18,
              color: '#fff',
              fontFamily: 'Inter, Segoe UI, sans-serif',
            }}
          >
            {message}
          </div>
        </div>
      )}
    </div>
  )
}