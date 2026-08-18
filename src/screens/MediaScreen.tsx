import { useState, useRef } from 'react'
import type { DisplayContent } from './OutputStage'

type MediaTab = 'files' | 'browser' | 'stream'

// ALT-029/030/031: media playback, in-app browser/YouTube, and inbound
// HQ stream reception. These are architecturally distinct capabilities
// bundled into one screen for now (they all "put something on Live"),
// matching the project document's Media & External Content module.
export default function MediaScreen({
  onSendLive,
}: {
  onSendLive?: (content: DisplayContent) => void
}) {
  const [tab, setTab] = useState<MediaTab>('files')

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
          Media & External Content
        </span>
        <StatusPill />
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', background: '#1B2318', border: '1px solid #2A331F', borderRadius: 7, padding: 2 }}>
          {(['files', 'browser', 'stream'] as MediaTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                background: tab === t ? 'rgba(168,112,46,0.15)' : 'transparent',
                border: 'none',
                borderRadius: 5,
                padding: '5px 14px',
                fontSize: 11,
                fontWeight: 600,
                color: tab === t ? '#A8702E' : '#8F9885',
                cursor: 'pointer',
                fontFamily: 'inherit',
                textTransform: 'capitalize',
              }}
            >
              {t === 'files' ? 'Import & Play' : t === 'browser' ? 'Browser / YouTube' : 'HQ Live Stream'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'hidden' }}>
        {tab === 'files' && <FilesTab />}
        {tab === 'browser' && <BrowserTab />}
        {tab === 'stream' && <StreamTab />}
      </div>
    </div>
  )
}

// ALT-029: import and play song/video media files.
function FilesTab() {
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [fileKind, setFileKind] = useState<'video' | 'audio' | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setFileUrl(url)
    setFileName(file.name)
    setFileKind(file.type.startsWith('audio') ? 'audio' : 'video')
  }

  return (
    <div style={{ padding: 20, height: '100%', overflowY: 'auto' }}>
      <label
        style={{
          display: 'block',
          textAlign: 'center',
          border: '1px dashed #2A331F',
          borderRadius: 10,
          padding: '28px 16px',
          fontSize: 12,
          color: '#8F9885',
          cursor: 'pointer',
          marginBottom: 16,
        }}
      >
        {fileName ? `Loaded: ${fileName}` : 'Click to import a song or video file to play'}
        <input ref={inputRef} type="file" accept="video/*,audio/*" onChange={handleFile} style={{ display: 'none' }} />
      </label>

      {fileUrl && (
        <div style={{ maxWidth: 640 }}>
          {fileKind === 'video' ? (
            <video src={fileUrl} controls style={{ width: '100%', borderRadius: 8, background: '#000' }} />
          ) : (
            <div style={{ background: '#1B2318', border: '1px solid #2A331F', borderRadius: 8, padding: 16 }}>
              <audio src={fileUrl} controls style={{ width: '100%' }} />
            </div>
          )}
        </div>
      )}

      <p style={{ fontSize: 11, color: '#3A4430', marginTop: 16, maxWidth: 480 }}>
        Playback controls (play/pause/seek) are the native browser media controls shown above. In the full
        Electron build this reads from the local filesystem directly rather than a browser file picker.
      </p>
    </div>
  )
}

// ALT-030: in-app browser / YouTube playback for guest messages etc.
function BrowserTab() {
  const [url, setUrl] = useState('')
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null)

  function toEmbedUrl(raw: string): string {
    try {
      const u = new URL(raw)
      if (u.hostname.includes('youtube.com') && u.searchParams.get('v')) {
        return `https://www.youtube.com/embed/${u.searchParams.get('v')}`
      }
      if (u.hostname === 'youtu.be') {
        return `https://www.youtube.com/embed${u.pathname}`
      }
      return raw
    } catch {
      return raw
    }
  }

  function navigate() {
    if (!url.trim()) return
    setLoadedUrl(toEmbedUrl(url.trim()))
  }

  return (
    <div style={{ padding: 20, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexShrink: 0 }}>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && navigate()}
          placeholder="Paste a YouTube link or any webpage URL"
          style={{
            flex: 1,
            background: '#1B2318',
            border: '1px solid #2A331F',
            borderRadius: 8,
            padding: '9px 12px',
            fontSize: 13,
            color: '#EDEAE0',
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />
        <button
          onClick={navigate}
          style={{
            background: '#A8702E',
            border: 'none',
            borderRadius: 8,
            padding: '9px 18px',
            fontSize: 12,
            fontWeight: 600,
            color: '#10160F',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Go
        </button>
      </div>

      <div
        style={{
          flex: 1,
          background: '#000',
          borderRadius: 8,
          border: '1px solid #2A331F',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {loadedUrl ? (
          <iframe
            src={loadedUrl}
            title="Browser content"
            style={{ width: '100%', height: '100%', border: 'none' }}
            allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <span style={{ fontSize: 12, color: '#3A4430' }}>Nothing loaded yet</span>
        )}
      </div>
      <p style={{ fontSize: 10, color: '#3A4430', marginTop: 10, flexShrink: 0 }}>
        Note: not every website allows being embedded this way (some block it). YouTube links work reliably.
        "Send to Live" for browser content would mirror this frame to the projector output in the full build.
      </p>
    </div>
  )
}

// ALT-031: inbound live-stream reception/relay from headquarters --
// distinct from the app's own OBS output integration (see Settings).
// This is a UI-only shell, matching how the OBS/Deepgram connection
// status cards are represented elsewhere -- actual protocol handling
// (RTMP/HLS ingest) is backend work outside this prototype's scope, and
// flagged as a research spike in the project backlog (ALT-031).
function StreamTab() {
  const [connected, setConnected] = useState(false)
  const [streamUrl, setStreamUrl] = useState('rtmp://hq.rccg-cayc.org/live/main')
  const [connecting, setConnecting] = useState(false)

  function toggleConnect() {
    if (connected) {
      setConnected(false)
      return
    }
    setConnecting(true)
    setTimeout(() => {
      setConnecting(false)
      setConnected(true)
    }, 1200)
  }

  return (
    <div style={{ padding: 20, maxWidth: 520 }}>
      <div style={{ background: '#1B2318', border: '1px solid #2A331F', borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid #2A331F', fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', color: '#8F9885', textTransform: 'uppercase' }}>
          Headquarters Stream
        </div>
        <div style={{ padding: 14 }}>
          <div style={{ fontSize: 10, color: '#8F9885', marginBottom: 4 }}>Stream URL (RTMP / HLS)</div>
          <input
            value={streamUrl}
            onChange={(e) => setStreamUrl(e.target.value)}
            disabled={connected}
            style={{
              width: '100%',
              background: '#10160F',
              border: '1px solid #2A331F',
              borderRadius: 6,
              padding: '7px 10px',
              fontSize: 12,
              color: '#EDEAE0',
              outline: 'none',
              fontFamily: 'monospace',
              marginBottom: 12,
              boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: connected ? '#6FC98A' : '#8F9885',
                  boxShadow: connected ? '0 0 4px rgba(111,201,138,0.6)' : 'none',
                }}
              />
              <span style={{ fontSize: 11, color: connected ? '#6FC98A' : '#8F9885' }}>
                {connecting ? 'Connecting…' : connected ? 'Receiving stream' : 'Not connected'}
              </span>
            </div>
            <button
              onClick={toggleConnect}
              disabled={connecting}
              style={{
                background: connected ? 'transparent' : '#A8702E',
                border: connected ? '1px solid #2A331F' : 'none',
                borderRadius: 6,
                padding: '6px 14px',
                fontSize: 11,
                fontWeight: 600,
                color: connected ? '#8F9885' : '#10160F',
                cursor: connecting ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {connected ? 'Disconnect' : connecting ? 'Connecting…' : 'Connect'}
            </button>
          </div>
        </div>
      </div>

      <div
        style={{
          background: '#000',
          borderRadius: 8,
          border: '1px solid #2A331F',
          aspectRatio: '16/9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ fontSize: 12, color: connected ? '#6FC98A' : '#3A4430' }}>
          {connected ? 'HQ stream preview (live)' : 'No incoming stream'}
        </span>
      </div>
      <p style={{ fontSize: 10, color: '#3A4430', marginTop: 10 }}>
        This is distinct from the app's own outbound OBS integration (see Settings & Integrations) — this
        receives a stream rather than sending one.
      </p>
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
