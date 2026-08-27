import { useState } from 'react'

interface Recording {
  id: string
  date: string
  preacher: string
  title: string
  topic: string
  duration: string
  hasText: boolean
  hasAudio: boolean
  hasVideo: boolean
  // ALT-014: AI-generated outputs, saved externally the same way the
  // transcript already is.
  hasSummary: boolean
  hasNotes: boolean
  hasTranslation: boolean
}

const RECORDINGS: Recording[] = [
  {
    id: 'r1',
    date: 'Aug 10, 2026',
    preacher: 'Pastor John Adeyemi',
    title: 'Walking in the Spirit',
    topic: 'Holy Spirit',
    duration: '52:14',
    hasText: true,
    hasAudio: true,
    hasVideo: true,
    hasSummary: true,
    hasNotes: true,
    hasTranslation: false,
  },
  {
    id: 'r2',
    date: 'Aug 3, 2026',
    preacher: 'Deacon Samuel Okafor',
    title: 'The Power of Prayer',
    topic: 'Prayer',
    duration: '38:47',
    hasText: true,
    hasAudio: true,
    hasVideo: false,
    hasSummary: true,
    hasNotes: false,
    hasTranslation: false,
  },
  {
    id: 'r3',
    date: 'Jul 27, 2026',
    preacher: 'Pastor John Adeyemi',
    title: 'Faith That Moves Mountains',
    topic: 'Faith',
    duration: '1:04:32',
    hasText: false,
    hasAudio: true,
    hasVideo: true,
    hasSummary: false,
    hasNotes: false,
    hasTranslation: false,
  },
  {
    id: 'r4',
    date: 'Jul 20, 2026',
    preacher: 'Rev. Grace Eze',
    title: 'Grace Sufficient',
    topic: 'Grace',
    duration: '45:09',
    hasText: true,
    hasAudio: true,
    hasVideo: false,
    hasSummary: true,
    hasNotes: true,
    hasTranslation: true,
  },
  {
    id: 'r5',
    date: 'Jul 13, 2026',
    preacher: 'Pastor John Adeyemi',
    title: "God's Provision",
    topic: 'Provision',
    duration: '57:22',
    hasText: true,
    hasAudio: true,
    hasVideo: true,
    hasSummary: true,
    hasNotes: false,
    hasTranslation: false,
  },
]

const PREACHERS = ['All preachers', 'Pastor John Adeyemi', 'Deacon Samuel Okafor', 'Rev. Grace Eze']
const TOPICS = ['All topics', 'Holy Spirit', 'Prayer', 'Faith', 'Grace', 'Provision']

export default function RecordingScreen() {
  const [search, setSearch] = useState('')
  const [preacher, setPreacher] = useState('All preachers')
  const [topic, setTopic] = useState('All topics')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  // ALT-014: recordings save outside the app's own internal storage.
  const [storagePath, setStoragePath] = useState('/Volumes/CAYC-Archive/altarview-recordings')
  const [editingPath, setEditingPath] = useState(false)

  const filtered = RECORDINGS.filter((r) => {
    const matchSearch =
      !search.trim() ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.preacher.toLowerCase().includes(search.toLowerCase())
    const matchPreacher = preacher === 'All preachers' || r.preacher === preacher
    const matchTopic = topic === 'All topics' || r.topic === topic
    return matchSearch && matchPreacher && matchTopic
  })

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
          Recording & Archive
        </span>
        <StatusPill />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        {/* ALT-014: storage location -- recordings save outside the app's own internal storage */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: '#1B2318',
            border: '1px solid #2A331F',
            borderRadius: 8,
            padding: '10px 14px',
            marginBottom: 16,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
            <path d="M2 4.5a1.5 1.5 0 011.5-1.5h2.5l1.2 1.5h3.3A1.5 1.5 0 0112 6v4.5A1.5 1.5 0 0110.5 12h-7A1.5 1.5 0 012 10.5v-6z" stroke="#8F9885" strokeWidth="1.2" />
          </svg>
          <span style={{ fontSize: 11, color: '#8F9885', flexShrink: 0 }}>Storage location:</span>
          {editingPath ? (
            <input
              value={storagePath}
              onChange={(e) => setStoragePath(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setEditingPath(false)}
              onBlur={() => setEditingPath(false)}
              autoFocus
              style={{
                flex: 1,
                background: '#10160F',
                border: '1px solid rgba(168,112,46,0.4)',
                borderRadius: 5,
                padding: '3px 8px',
                fontSize: 11,
                color: '#EDEAE0',
                fontFamily: 'monospace',
                outline: 'none',
              }}
            />
          ) : (
            <span style={{ flex: 1, fontSize: 11, color: '#EDEAE0', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {storagePath}
            </span>
          )}
          <button
            onClick={() => setEditingPath(true)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#A8702E',
              fontSize: 11,
              cursor: 'pointer',
              fontFamily: 'inherit',
              flexShrink: 0,
            }}
          >
            Change
          </button>
        </div>

        {/* Filter row */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <div
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#8F9885',
                pointerEvents: 'none',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.3" />
                <path d="M8.5 8.5L12 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search recordings…"
              style={{
                width: '100%',
                background: '#1B2318',
                border: '1px solid #2A331F',
                borderRadius: 8,
                padding: '7px 12px 7px 30px',
                fontSize: 12,
                color: '#EDEAE0',
                outline: 'none',
                fontFamily: 'inherit',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(168,112,46,0.4)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#2A331F')}
            />
          </div>
          <FilterSelect value={preacher} onChange={setPreacher} options={PREACHERS} />
          <FilterSelect value={topic} onChange={setTopic} options={TOPICS} />
        </div>

        {/* Recordings list */}
        <div
          style={{
            background: '#1B2318',
            border: '1px solid #2A331F',
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          {filtered.map((rec, i) => {
            const expanded = expandedId === rec.id
            return (
              <div key={rec.id}>
                <div
                  onClick={() => setExpandedId(expanded ? null : rec.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderBottom: i < filtered.length - 1 || expanded ? '1px solid #2A331F' : 'none',
                    gap: 14,
                    cursor: 'pointer',
                    background: expanded ? 'rgba(168,112,46,0.04)' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                >
                  <div style={{ width: 80, flexShrink: 0 }}>
                    <div style={{ fontSize: 11, color: '#EDEAE0', fontWeight: 500 }}>{rec.date}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#EDEAE0', marginBottom: 2 }}>
                      {rec.title}
                    </div>
                    <div style={{ fontSize: 11, color: '#8F9885' }}>{rec.preacher}</div>
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      padding: '2px 8px',
                      borderRadius: 20,
                      background: '#10160F',
                      border: '1px solid #2A331F',
                      color: '#8F9885',
                      flexShrink: 0,
                    }}
                  >
                    {rec.topic}
                  </span>
                  {/* Media icons */}
                  <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                    {rec.hasText && <MediaIcon title="Transcript" icon="T" />}
                    {rec.hasAudio && <MediaIcon title="Audio" icon="A" />}
                    {rec.hasVideo && <MediaIcon title="Video" icon="V" />}
                  </div>
                  {/* ALT-014: AI-generated outputs, saved externally like the transcript */}
                  {(rec.hasSummary || rec.hasNotes || rec.hasTranslation) && (
                    <div style={{ display: 'flex', gap: 5, flexShrink: 0, paddingLeft: 5, borderLeft: '1px solid #2A331F' }}>
                      {rec.hasSummary && <MediaIcon title="AI Summary" icon="S" accent />}
                      {rec.hasNotes && <MediaIcon title="AI Notes" icon="N" accent />}
                      {rec.hasTranslation && <MediaIcon title="AI Translation" icon="Tr" accent />}
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: '#8F9885', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                    {rec.duration}
                  </div>
                  <div style={{ color: '#8F9885', transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'none' }}>
                    <svg width="11" height="7" viewBox="0 0 11 7" fill="none">
                      <path d="M1 1l4.5 4.5L10 1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>

                {/* Expanded player */}
                {expanded && (
                  <div
                    style={{
                      padding: '14px 16px',
                      background: '#10160F',
                      borderBottom: i < filtered.length - 1 ? '1px solid #2A331F' : 'none',
                      display: 'flex',
                      gap: 16,
                      alignItems: 'center',
                    }}
                  >
                    {/* Play button */}
                    <button
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: '#A8702E',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    >
                      <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
                        <path d="M2 1.5l9 5-9 5V1.5z" fill="#10160F" />
                      </svg>
                    </button>
                    {/* Waveform */}
                    <div style={{ flex: 1, height: 36, display: 'flex', alignItems: 'center', gap: 2 }}>
                      {Array.from({ length: 60 }, (_, i) => (
                        <div
                          key={i}
                          style={{
                            width: 2,
                            height: `${12 + Math.abs(Math.sin(i * 0.4) * 18 + Math.cos(i * 0.9) * 8)}px`,
                            borderRadius: 1,
                            background: i < 20 ? '#A8702E' : '#2A331F',
                            flexShrink: 0,
                          }}
                        />
                      ))}
                    </div>
                    <div style={{ fontSize: 11, color: '#8F9885', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                      {rec.duration}
                    </div>
                    {rec.hasText && (
                      <button
                        style={{
                          background: 'transparent',
                          border: '1px solid #2A331F',
                          borderRadius: 6,
                          padding: '5px 12px',
                          fontSize: 11,
                          color: '#8F9885',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          flexShrink: 0,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#A8702E'
                          e.currentTarget.style.color = '#A8702E'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#2A331F'
                          e.currentTarget.style.color = '#8F9885'
                        }}
                      >
                        View transcript
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function MediaIcon({ title, icon, accent }: { title: string; icon: string; accent?: boolean }) {
  return (
    <span
      title={title}
      style={{
        minWidth: 18,
        height: 18,
        padding: '0 3px',
        borderRadius: 4,
        background: accent ? 'rgba(168,112,46,0.12)' : '#10160F',
        border: accent ? '1px solid rgba(168,112,46,0.3)' : '1px solid #2A331F',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 9,
        fontWeight: 700,
        color: accent ? '#A8702E' : '#8F9885',
      }}
    >
      {icon}
    </span>
  )
}

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        background: '#1B2318',
        border: '1px solid #2A331F',
        borderRadius: 8,
        padding: '7px 10px',
        fontSize: 12,
        color: '#EDEAE0',
        outline: 'none',
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      {options.map((o) => (
        <option key={o} value={o} style={{ background: '#1B2318' }}>
          {o}
        </option>
      ))}
    </select>
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
