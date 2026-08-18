import { useState } from 'react'
import type { ServiceSession } from '../sessionModel'

interface UpNextStyle {
  id: string
  name: string
  accent: string
  bg: string
}

const STYLES: UpNextStyle[] = [
  { id: 'gold-wipe', name: 'Gold Wipe', accent: '#A8702E', bg: '#000000' },
  { id: 'clean-slide', name: 'Clean Slide', accent: '#5A6A5F', bg: '#F8F6F0' },
  { id: 'bold-fade', name: 'Bold Fade', accent: '#7BAFD4', bg: '#0D1B2A' },
]

// ALT-034: "UP NEXT" -> reveals the next program name after a beat.
// Built in-app (this screen), or an imported video file can replace the
// in-app animation entirely (e.g. an After Effects export).
export default function UpNextScreen({ sessions }: { sessions: ServiceSession[] }) {
  const [styleId, setStyleId] = useState(STYLES[0].id)
  const [durationSeconds, setDurationSeconds] = useState(4)
  const [previewSessionId, setPreviewSessionId] = useState(sessions[0]?.id ?? '')
  const [playing, setPlaying] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [importedFile, setImportedFile] = useState<string | null>(null)

  const style = STYLES.find((s) => s.id === styleId)!
  const previewSession = sessions.find((s) => s.id === previewSessionId)

  function play() {
    setPlaying(true)
    setRevealed(false)
    setTimeout(() => setRevealed(true), Math.max(600, durationSeconds * 1000 * 0.4))
    setTimeout(() => {
      setPlaying(false)
      setRevealed(false)
    }, durationSeconds * 1000)
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setImportedFile(file.name)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
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
          Up Next Transitions
        </span>
        <StatusPill />
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Editor panel */}
        <div style={{ width: 300, flexShrink: 0, borderRight: '1px solid #2A331F', padding: 16, overflowY: 'auto' }}>
          <SectionLabel>Style</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
            {STYLES.map((s) => (
              <button
                key={s.id}
                onClick={() => setStyleId(s.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: styleId === s.id ? 'rgba(168,112,46,0.14)' : '#1B2318',
                  border: styleId === s.id ? '1px solid rgba(168,112,46,0.4)' : '1px solid #2A331F',
                  borderRadius: 6,
                  padding: '8px 10px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ width: 20, height: 20, borderRadius: 4, background: s.bg, border: `2px solid ${s.accent}`, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: styleId === s.id ? '#A8702E' : '#EDEAE0' }}>{s.name}</span>
              </button>
            ))}
          </div>

          <SectionLabel>Duration</SectionLabel>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <input
              type="number"
              min={1}
              max={15}
              value={durationSeconds}
              onChange={(e) => setDurationSeconds(Math.max(1, Number(e.target.value)))}
              style={{
                width: 60,
                background: '#1B2318',
                border: '1px solid #2A331F',
                borderRadius: 6,
                padding: '6px 8px',
                fontSize: 12,
                color: '#EDEAE0',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
            <span style={{ fontSize: 11, color: '#8F9885' }}>seconds</span>
          </div>

          <SectionLabel>Preview Next Session</SectionLabel>
          <select
            value={previewSessionId}
            onChange={(e) => setPreviewSessionId(e.target.value)}
            style={{
              width: '100%',
              background: '#1B2318',
              border: '1px solid #2A331F',
              borderRadius: 6,
              padding: '7px 10px',
              fontSize: 12,
              color: '#EDEAE0',
              outline: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              marginBottom: 16,
            }}
          >
            {sessions.map((s) => (
              <option key={s.id} value={s.id} style={{ background: '#1B2318' }}>
                {s.title}
              </option>
            ))}
          </select>
          <p style={{ fontSize: 10, color: '#3A4430', marginTop: -8, marginBottom: 16 }}>
            Session names are pulled live from your Service Playlist.
          </p>

          <SectionLabel>Or Import a Motion Graphic</SectionLabel>
          <label
            style={{
              display: 'block',
              textAlign: 'center',
              border: '1px dashed #2A331F',
              borderRadius: 8,
              padding: '14px 10px',
              fontSize: 11,
              color: '#8F9885',
              cursor: 'pointer',
              marginBottom: 6,
            }}
          >
            {importedFile ? `Using: ${importedFile}` : 'Import a video file (e.g. from Adobe After Effects)'}
            <input type="file" accept="video/*" onChange={handleImport} style={{ display: 'none' }} />
          </label>
          {importedFile && (
            <button
              onClick={() => setImportedFile(null)}
              style={{ background: 'none', border: 'none', color: '#A8702E', fontSize: 10, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Remove and use in-app style instead
            </button>
          )}
        </div>

        {/* Preview */}
        <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          <div
            style={{
              width: '100%',
              maxWidth: 640,
              aspectRatio: '16/9',
              background: importedFile ? '#0b0b0b' : style.bg,
              borderRadius: 10,
              border: '1px solid #2A331F',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {importedFile ? (
              <div style={{ textAlign: 'center', color: '#8F9885', fontSize: 13 }}>
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none" style={{ margin: '0 auto 10px' }}>
                  <rect x="4" y="4" width="28" height="28" rx="4" stroke="#8F9885" strokeWidth="1.5" />
                  <path d="M15 12l10 6-10 6V12z" fill="#8F9885" />
                </svg>
                {playing ? `Playing ${importedFile}...` : `Imported: ${importedFile}`}
              </div>
            ) : (
              <div style={{ textAlign: 'center', transition: 'opacity 0.4s' }}>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    letterSpacing: '0.2em',
                    color: style.accent,
                    opacity: playing && !revealed ? 1 : playing && revealed ? 0 : 0.5,
                    transition: 'opacity 0.4s',
                    fontFamily: 'Inter, Segoe UI, sans-serif',
                  }}
                >
                  UP NEXT
                </div>
                <div
                  style={{
                    fontSize: 32,
                    fontWeight: 700,
                    color: style.bg === '#F8F6F0' ? '#1A1814' : '#FFFFFF',
                    marginTop: 10,
                    opacity: playing && revealed ? 1 : 0,
                    transition: 'opacity 0.4s',
                    fontFamily: 'Inter, Segoe UI, sans-serif',
                    textTransform: 'uppercase',
                  }}
                >
                  {previewSession?.title ?? 'Next Session'}
                </div>
                {!playing && (
                  <div style={{ fontSize: 11, color: style.accent, marginTop: 8, opacity: 0.6 }}>
                    Click Play Preview below
                  </div>
                )}
              </div>
            )}
          </div>
          <button
            onClick={play}
            disabled={playing}
            style={{
              background: playing ? '#1B2318' : '#A8702E',
              border: 'none',
              borderRadius: 7,
              padding: '9px 20px',
              fontSize: 12,
              fontWeight: 600,
              color: playing ? '#3A4430' : '#10160F',
              cursor: playing ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {playing ? 'Playing…' : 'Play Preview'}
          </button>
        </div>
      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.07em', color: '#8F9885', textTransform: 'uppercase', marginBottom: 8 }}>
      {children}
    </div>
  )
}

function StatusPill() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#10160F', border: '1px solid #2A331F', borderRadius: 20, padding: '3px 10px' }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#A8702E', boxShadow: '0 0 4px rgba(168,112,46,0.7)' }} />
      <span style={{ fontSize: 11, color: '#8F9885' }}>Prototype build</span>
    </div>
  )
}
