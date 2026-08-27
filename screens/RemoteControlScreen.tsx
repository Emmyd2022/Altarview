import { useState } from 'react'

// ALT-016: this whole screen is a local browser page (QR/URL join), not a
// native iOS/Android app -- no app-store build or separate mobile
// codebase is needed. It's the "control" counterpart to Settings'
// Browser Presentation Link, which is the "display" counterpart.

const VERSES = [
  { ref: 'John 3:16', translation: 'KJV', text: 'For God so loved the world…' },
  { ref: 'Psalm 23:1', translation: 'KJV', text: 'The LORD is my shepherd…' },
  { ref: 'Romans 8:28', translation: 'NIV', text: 'And we know that in all things…' },
]

export default function RemoteControlScreen() {
  const [view, setView] = useState<'control' | 'qr'>('qr')
  const [nowShowing, setNowShowing] = useState<(typeof VERSES)[0] | null>(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Top bar */}
      <div
        style={{
          height: 48,
          borderBottom: '1px solid #2A331F',
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 20,
          paddingRight: 20,
          gap: 12,
          flexShrink: 0,
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 13, color: '#EDEAE0', letterSpacing: '0.02em' }}>
          Remote Control
        </span>
        <StatusPill />
        <div style={{ flex: 1 }} />
        <div
          style={{
            display: 'flex',
            background: '#1B2318',
            border: '1px solid #2A331F',
            borderRadius: 7,
            padding: 2,
          }}
        >
          {(['control', 'qr'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                background: view === v ? 'rgba(168,112,46,0.12)' : 'transparent',
                border: 'none',
                borderRadius: 5,
                padding: '4px 12px',
                fontSize: 11,
                fontWeight: view === v ? 600 : 400,
                color: view === v ? '#A8702E' : '#8F9885',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {v === 'control' ? 'Controller' : 'Join (QR)'}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: 40,
        }}
      >
        {view === 'qr' ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 24,
              maxWidth: 360,
              width: '100%',
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 600, color: '#EDEAE0' }}>
              Scan to join this service
            </div>
            {/* QR placeholder */}
            <div
              style={{
                width: 200,
                height: 200,
                background: '#fff',
                borderRadius: 10,
                padding: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <QRPlaceholder />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#8F9885', marginBottom: 6 }}>
                Or open this URL on your phone:
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: '#A8702E',
                  background: '#1B2318',
                  border: '1px solid #2A331F',
                  borderRadius: 6,
                  padding: '6px 14px',
                  fontFamily: 'monospace',
                }}
              >
                local.cayc-media.net/join
              </div>
            </div>
            <div
              style={{
                background: '#1B2318',
                border: '1px solid #2A331F',
                borderRadius: 8,
                padding: '10px 16px',
                fontSize: 11,
                color: '#8F9885',
                textAlign: 'center',
                lineHeight: 1.6,
              }}
            >
              Worship leaders and co-operators can scan to control slides from a phone or tablet without
              needing access to this machine.
            </div>
          </div>
        ) : (
          /* Mobile controller mockup */
          <div
            style={{
              width: 320,
              background: '#1B2318',
              border: '1px solid #2A331F',
              borderRadius: 24,
              overflow: 'hidden',
              boxShadow: '0 0 0 8px #10160F, 0 0 0 9px #2A331F',
            }}
          >
            {/* Phone status bar */}
            <div
              style={{
                height: 36,
                background: '#10160F',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 20px',
                borderBottom: '1px solid #2A331F',
              }}
            >
              <span style={{ fontSize: 10, color: '#8F9885' }}>9:41</span>
              <span style={{ fontSize: 10, color: '#8F9885' }}>CAYC Media Remote</span>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#6FC98A' }} />
                <span style={{ fontSize: 10, color: '#8F9885' }}>Live</span>
              </div>
            </div>

            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Now showing card */}
              <div
                style={{
                  background: '#000',
                  borderRadius: 10,
                  padding: 14,
                  border: '1px solid #2A331F',
                }}
              >
                <div style={{ fontSize: 10, color: '#8F9885', marginBottom: 8, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                  Now showing
                </div>
                {nowShowing ? (
                  <>
                    <div style={{ fontFamily: 'Lora, Georgia, serif', fontSize: 13, color: '#fff', lineHeight: 1.5, marginBottom: 6 }}>
                      {nowShowing.text}
                    </div>
                    <div style={{ fontSize: 11, color: '#A8702E' }}>
                      {nowShowing.ref} ({nowShowing.translation})
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: 12, color: '#3A4430', fontFamily: 'Lora, Georgia, serif' }}>
                    RCCG CAYC Media
                  </div>
                )}
              </div>

              {/* Search */}
              <div style={{ position: 'relative' }}>
                <input
                  placeholder="Search a verse…"
                  style={{
                    width: '100%',
                    background: '#10160F',
                    border: '1px solid #2A331F',
                    borderRadius: 8,
                    padding: '10px 14px',
                    fontSize: 14,
                    color: '#EDEAE0',
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              {/* Verse list — large touch targets */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {VERSES.map((verse) => (
                  <div
                    key={verse.ref}
                    style={{
                      background: '#10160F',
                      border: `1px solid ${nowShowing?.ref === verse.ref ? 'rgba(168,112,46,0.4)' : '#2A331F'}`,
                      borderRadius: 8,
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#A8702E', marginBottom: 3 }}>
                        {verse.ref} <span style={{ color: '#8F9885', fontWeight: 400 }}>({verse.translation})</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#8F9885' }}>{verse.text}</div>
                    </div>
                    <button
                      onClick={() => setNowShowing(verse)}
                      style={{
                        background: nowShowing?.ref === verse.ref ? 'rgba(168,112,46,0.12)' : '#A8702E',
                        border: nowShowing?.ref === verse.ref ? '1px solid rgba(168,112,46,0.3)' : 'none',
                        borderRadius: 7,
                        padding: '8px 12px',
                        fontSize: 11,
                        fontWeight: 700,
                        color: nowShowing?.ref === verse.ref ? '#A8702E' : '#10160F',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                    >
                      {nowShowing?.ref === verse.ref ? 'Live' : 'Send'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function QRPlaceholder() {
  const size = 168
  const cell = 7
  const cols = Math.floor(size / cell)
  const seed = 42
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {Array.from({ length: cols }, (_, row) =>
        Array.from({ length: cols }, (_, col) => {
          const val = Math.sin(seed + row * 13 + col * 7) > 0.1
          if (!val) return null
          return (
            <rect
              key={`${row}-${col}`}
              x={col * cell}
              y={row * cell}
              width={cell - 1}
              height={cell - 1}
              rx={1}
              fill="#10160F"
            />
          )
        }),
      )}
      {/* Finder squares */}
      {[[0, 0], [cols - 7, 0], [0, cols - 7]].map(([c, r], i) => (
        <g key={i}>
          <rect x={c * cell} y={r * cell} width={7 * cell} height={7 * cell} rx={2} fill="#10160F" />
          <rect x={c * cell + cell} y={r * cell + cell} width={5 * cell} height={5 * cell} rx={1} fill="#fff" />
          <rect x={c * cell + 2 * cell} y={r * cell + 2 * cell} width={3 * cell} height={3 * cell} rx={1} fill="#10160F" />
        </g>
      ))}
    </svg>
  )
}

function StatusPill() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: '#10160F',
        border: '1px solid #2A331F',
        borderRadius: 20,
        padding: '3px 10px',
      }}
    >
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#A8702E', boxShadow: '0 0 4px rgba(168,112,46,0.7)' }} />
      <span style={{ fontSize: 11, color: '#8F9885' }}>Prototype build</span>
    </div>
  )
}
