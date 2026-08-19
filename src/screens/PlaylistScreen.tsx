import { useState } from 'react'
import {
  RESOURCE_LIBRARY,
  newResourceId,
  newSession,
  type ResourceType,
  type ServiceSession,
  type SessionResource,
} from '../sessionModel'
import type { DisplayContent } from './OutputStage'
import { buildSlides, firstSlideIndexForSection, type Song } from '../songModel'

type PlaylistMode = 'timed' | 'resource'

const TYPE_COLORS: Record<ResourceType, string> = {
  scripture: '#A8702E',
  song: '#7BAFD4',
  slide: '#8F9885',
  media: '#9A7AC9',
  combined: '#C08A44',
  'up-next': '#6FC98A',
}

// ALT-022: Sessions are the top-level organizing unit; each session holds
// multiple resources plus an allocated duration. This replaces the old
// flat playlist-item list.
export default function PlaylistScreen({
  sessions,
  onChangeSessions,
  onSendLive,
  onStartService,
  songs,
}: {
  sessions: ServiceSession[]
  onChangeSessions: (sessions: ServiceSession[]) => void
  onSendLive?: (content: DisplayContent) => void
  onStartService?: () => void
  songs?: Song[]
}) {
  // ALT: inline resource control -- when a song resource is active, the
  // operator can select verse 1, verse 2, chorus, etc. directly from this
  // screen, without switching to Song Lyrics.
  const [activeResourceId, setActiveResourceId] = useState<string | null>(null)
  const [resourceSlideIndex, setResourceSlideIndex] = useState(0)

  function findSongByTitle(title: string): Song | undefined {
    return songs?.find((s) => s.title === title)
  }
  const [mode, setMode] = useState<PlaylistMode>('timed')
  const [expandedId, setExpandedId] = useState<string | null>(sessions[0]?.id ?? null)
  const [addTargetId, setAddTargetId] = useState<string | null>(sessions[0]?.id ?? null)
  const [activeTab, setActiveTab] = useState<keyof typeof RESOURCE_LIBRARY>('scripture')
  const [serviceStarted, setServiceStarted] = useState(false)

  // Drag state -- separate tracking for session-level vs resource-level
  // drags so the two levels of reordering don't interfere with each other.
  const [dragSessionId, setDragSessionId] = useState<string | null>(null)
  const [dragOverSessionId, setDragOverSessionId] = useState<string | null>(null)
  const [dragResource, setDragResource] = useState<{ sessionId: string; resourceId: string } | null>(null)
  const [dragOverResource, setDragOverResource] = useState<{ sessionId: string; resourceId: string } | null>(null)

  function updateSession(id: string, patch: Partial<ServiceSession>) {
    onChangeSessions(sessions.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }

  function addSession() {
    const s = newSession('New Session', 5)
    onChangeSessions([...sessions, s])
    setExpandedId(s.id)
    setAddTargetId(s.id)
  }

  function removeSession(id: string) {
    onChangeSessions(sessions.filter((s) => s.id !== id))
  }

  function addResource(sessionId: string, resource: SessionResource) {
    onChangeSessions(
      sessions.map((s) => (s.id === sessionId ? { ...s, resources: [...s.resources, resource] } : s)),
    )
  }

  function removeResource(sessionId: string, resourceId: string) {
    onChangeSessions(
      sessions.map((s) =>
        s.id === sessionId ? { ...s, resources: s.resources.filter((r) => r.id !== resourceId) } : s,
      ),
    )
  }

  // --- Session-level drag-and-drop reorder ---
  function handleSessionDrop(targetId: string) {
    if (!dragSessionId || dragSessionId === targetId) {
      setDragSessionId(null)
      setDragOverSessionId(null)
      return
    }
    const fromIdx = sessions.findIndex((s) => s.id === dragSessionId)
    const toIdx = sessions.findIndex((s) => s.id === targetId)
    const next = [...sessions]
    const [moved] = next.splice(fromIdx, 1)
    next.splice(toIdx, 0, moved)
    onChangeSessions(next)
    setDragSessionId(null)
    setDragOverSessionId(null)
  }

  // --- Resource-level drag-and-drop reorder, scoped to one session ---
  function handleResourceDrop(sessionId: string, targetResourceId: string) {
    if (!dragResource || dragResource.sessionId !== sessionId || dragResource.resourceId === targetResourceId) {
      setDragResource(null)
      setDragOverResource(null)
      return
    }
    onChangeSessions(
      sessions.map((s) => {
        if (s.id !== sessionId) return s
        const fromIdx = s.resources.findIndex((r) => r.id === dragResource.resourceId)
        const toIdx = s.resources.findIndex((r) => r.id === targetResourceId)
        const next = [...s.resources]
        const [moved] = next.splice(fromIdx, 1)
        next.splice(toIdx, 0, moved)
        return { ...s, resources: next }
      }),
    )
    setDragResource(null)
    setDragOverResource(null)
  }

  function sendResourceToLive(r: SessionResource) {
    if (!onSendLive) return
    // ALT-022: click-to-project a resource on request. Prototype scope --
    // constructs a display payload from what the session data has, rather
    // than doing a full verse-text lookup (that's the Operator search's job).
    onSendLive({
      type: 'verse',
      ref: r.scriptureRef ?? r.songRef ?? r.title,
      translation: '',
      text: r.detail ?? r.title,
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
        {/* Main panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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
              Service Playlist
            </span>
            <StatusPill />
            <div style={{ flex: 1 }} />
            <div style={{ display: 'flex', background: '#1B2318', border: '1px solid #2A331F', borderRadius: 7, padding: 2 }}>
              {(['timed', 'resource'] as PlaylistMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  style={{
                    background: mode === m ? 'rgba(168,112,46,0.15)' : 'transparent',
                    border: 'none',
                    borderRadius: 5,
                    padding: '5px 12px',
                    fontSize: 11,
                    fontWeight: 600,
                    color: mode === m ? '#A8702E' : '#8F9885',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {m === 'timed' ? 'Timed Playlist' : 'Resource Playlist'}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setServiceStarted(true)
                onStartService?.()
              }}
              style={{
                background: serviceStarted ? 'transparent' : '#A8702E',
                border: serviceStarted ? '1px solid #2A331F' : 'none',
                borderRadius: 7,
                padding: '7px 16px',
                fontSize: 12,
                fontWeight: 600,
                color: serviceStarted ? '#8F9885' : '#10160F',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {serviceStarted ? 'Service Running' : 'Start Service'}
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
            <div style={{ fontSize: 11, color: '#8F9885', marginBottom: 10, letterSpacing: '0.03em' }}>
              {mode === 'timed'
                ? `${sessions.length} sessions \u2192 Stage Screen`
                : `${sessions.length} sessions \u2192 Live (untimed, same resources as Timed view)`}
            </div>

            {(
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    draggable
                    onDragStart={() => setDragSessionId(session.id)}
                    onDragOver={(e) => {
                      e.preventDefault()
                      setDragOverSessionId(session.id)
                    }}
                    onDrop={() => handleSessionDrop(session.id)}
                    style={{
                      background: '#1B2318',
                      border: dragOverSessionId === session.id ? '1px solid rgba(168,112,46,0.5)' : '1px solid #2A331F',
                      borderRadius: 8,
                      overflow: 'hidden',
                      opacity: dragSessionId === session.id ? 0.5 : 1,
                    }}
                  >
                    {/* Session header */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '10px 12px',
                        cursor: 'grab',
                      }}
                    >
                      <DragHandle />
                      <button
                        onClick={() => setExpandedId(expandedId === session.id ? null : session.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#8F9885' }}
                      >
                        <svg width="10" height="10" viewBox="0 0 10 10" style={{ transform: expandedId === session.id ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>
                          <path d="M3 1l4 4-4 4" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      <input
                        value={session.title}
                        onChange={(e) => updateSession(session.id, { title: e.target.value })}
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
                      <span style={{ fontSize: 10, color: '#3A4430' }}>
                        {session.resources.length} resource{session.resources.length === 1 ? '' : 's'}
                      </span>
                      {/* ALT-039: duration only matters in Timed mode; Resource mode shows the same
                          session grouping but without any timer fields */}
                      {mode === 'timed' && (
                        <>
                          <input
                            type="number"
                            min={1}
                            value={session.durationMinutes}
                            onChange={(e) => updateSession(session.id, { durationMinutes: Math.max(1, Number(e.target.value)) })}
                            style={{
                              width: 44,
                              background: '#10160F',
                              border: '1px solid #2A331F',
                              borderRadius: 5,
                              padding: '3px 5px',
                              fontSize: 11,
                              color: '#EDEAE0',
                              textAlign: 'center',
                              fontFamily: 'inherit',
                            }}
                          />
                          <span style={{ fontSize: 10, color: '#8F9885' }}>min</span>
                        </>
                      )}
                      <button
                        onClick={() => setAddTargetId(session.id)}
                        title="Set as add-target for the resource picker"
                        style={{
                          fontSize: 10,
                          padding: '3px 8px',
                          borderRadius: 5,
                          background: addTargetId === session.id ? 'rgba(168,112,46,0.15)' : 'transparent',
                          border: addTargetId === session.id ? '1px solid rgba(168,112,46,0.4)' : '1px solid #2A331F',
                          color: addTargetId === session.id ? '#A8702E' : '#8F9885',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}
                      >
                        {addTargetId === session.id ? 'Adding here' : 'Add here'}
                      </button>
                      <button
                        onClick={() => removeSession(session.id)}
                        style={{ background: 'none', border: 'none', color: '#8F9885', cursor: 'pointer', fontSize: 15, padding: '0 2px' }}
                      >
                        ×
                      </button>
                    </div>

                    {/* Resources within this session */}
                    {expandedId === session.id && (
                      <div style={{ padding: '0 12px 10px 32px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {session.resources.length === 0 ? (
                          <div style={{ fontSize: 11, color: '#3A4430', padding: '6px 0' }}>
                            No resources yet -- use the picker on the right.
                          </div>
                        ) : (
                          session.resources.map((r) => (
                            <div
                              key={`wrap-${r.id}`}
                            >
                            <div
                              draggable
                              onDragStart={() => setDragResource({ sessionId: session.id, resourceId: r.id })}
                              onDragOver={(e) => {
                                e.preventDefault()
                                setDragOverResource({ sessionId: session.id, resourceId: r.id })
                              }}
                              onDrop={() => handleResourceDrop(session.id, r.id)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                background: '#10160F',
                                border:
                                  dragOverResource?.sessionId === session.id && dragOverResource.resourceId === r.id
                                    ? '1px solid rgba(168,112,46,0.5)'
                                    : '1px solid #2A331F',
                                borderRadius: 6,
                                padding: '7px 10px',
                                opacity: dragResource?.resourceId === r.id ? 0.5 : 1,
                                cursor: 'grab',
                              }}
                            >
                              <DragHandle small />
                              <TypeIcon type={r.type} color={TYPE_COLORS[r.type]} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <span style={{ fontSize: 12, color: '#EDEAE0' }}>{r.title}</span>
                                {r.type === 'combined' ? (
                                  <span style={{ fontSize: 10, color: '#8F9885', marginLeft: 6 }}>
                                    — {r.songRef} + {r.scriptureRef}
                                  </span>
                                ) : (
                                  (r.detail || r.scriptureRef || r.songRef) && (
                                    <span style={{ fontSize: 10, color: '#8F9885', marginLeft: 6 }}>
                                      — {r.detail ?? r.scriptureRef ?? r.songRef}
                                    </span>
                                  )
                                )}
                              </div>
                              {onSendLive && (() => {
                                const linkedSong = (r.type === 'song' || r.type === 'combined') && r.songRef ? findSongByTitle(r.songRef) : undefined
                                if (linkedSong) {
                                  const isActive = activeResourceId === r.id
                                  return (
                                    <button
                                      onClick={() => {
                                        setActiveResourceId(r.id)
                                        setResourceSlideIndex(0)
                                        const s = buildSlides(linkedSong)[0]
                                        if (s) onSendLive({ type: 'song', title: linkedSong.title, artist: linkedSong.artist, lines: s.lines })
                                      }}
                                      style={{
                                        fontSize: 10,
                                        padding: '3px 9px',
                                        borderRadius: 5,
                                        background: isActive ? '#A8702E' : 'transparent',
                                        border: isActive ? 'none' : '1px solid rgba(168,112,46,0.4)',
                                        color: isActive ? '#10160F' : '#A8702E',
                                        fontWeight: isActive ? 600 : 400,
                                        cursor: 'pointer',
                                        fontFamily: 'inherit',
                                        flexShrink: 0,
                                      }}
                                    >
                                      {isActive ? 'Active' : 'Play'}
                                    </button>
                                  )
                                }
                                return (
                                  <button
                                    onClick={() => sendResourceToLive(r)}
                                    style={{
                                      fontSize: 10,
                                      padding: '3px 9px',
                                      borderRadius: 5,
                                      background: 'transparent',
                                      border: '1px solid rgba(168,112,46,0.4)',
                                      color: '#A8702E',
                                      cursor: 'pointer',
                                      fontFamily: 'inherit',
                                      flexShrink: 0,
                                    }}
                                  >
                                    Send to Live
                                  </button>
                                )
                              })()}
                              <button
                                onClick={() => removeResource(session.id, r.id)}
                                style={{ background: 'none', border: 'none', color: '#8F9885', cursor: 'pointer', fontSize: 13, flexShrink: 0 }}
                              >
                                ×
                              </button>
                            </div>
                            {/* ALT: inline verse/chorus navigation when this song resource is active */}
                            {activeResourceId === r.id && (r.type === 'song' || r.type === 'combined') && r.songRef && findSongByTitle(r.songRef) && (() => {
                              const linkedSong = findSongByTitle(r.songRef)!
                              const slides = buildSlides(linkedSong)
                              const slide = slides[resourceSlideIndex]
                              if (!slide) return null
                              return (
                                <div style={{ marginLeft: 20, marginTop: 4, marginBottom: 4, padding: 8, background: '#10160F', border: '1px solid #2A331F', borderRadius: 6 }}>
                                  <div style={{ fontSize: 10, color: '#8F9885', marginBottom: 6 }}>{slide.sectionLabel}</div>
                                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
                                    {linkedSong.sections.map((sec, idx) => (
                                      <button
                                        key={idx}
                                        onClick={() => {
                                          const newIdx = firstSlideIndexForSection(slides, idx)
                                          setResourceSlideIndex(newIdx)
                                          const s = slides[newIdx]
                                          if (s) onSendLive?.({ type: 'song', title: linkedSong.title, artist: linkedSong.artist, lines: s.lines })
                                        }}
                                        style={{
                                          fontSize: 9,
                                          padding: '2px 7px',
                                          borderRadius: 4,
                                          background: slide.sectionIndex === idx ? 'rgba(168,112,46,0.15)' : '#1B2318',
                                          border: slide.sectionIndex === idx ? '1px solid rgba(168,112,46,0.4)' : '1px solid #2A331F',
                                          color: slide.sectionIndex === idx ? '#A8702E' : '#8F9885',
                                          cursor: 'pointer',
                                          fontFamily: 'inherit',
                                        }}
                                      >
                                        {sec.label}
                                      </button>
                                    ))}
                                  </div>
                                  <div style={{ display: 'flex', gap: 6 }}>
                                    <button
                                      onClick={() => {
                                        if (resourceSlideIndex > 0) {
                                          const newIdx = resourceSlideIndex - 1
                                          setResourceSlideIndex(newIdx)
                                          const s = slides[newIdx]
                                          if (s) onSendLive?.({ type: 'song', title: linkedSong.title, artist: linkedSong.artist, lines: s.lines })
                                        }
                                      }}
                                      disabled={resourceSlideIndex === 0}
                                      style={{ fontSize: 9, padding: '3px 8px', borderRadius: 4, background: 'transparent', border: '1px solid #2A331F', color: resourceSlideIndex === 0 ? '#3A4430' : '#8F9885', cursor: resourceSlideIndex === 0 ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
                                    >
                                      ← Prev
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (resourceSlideIndex < slides.length - 1) {
                                          const newIdx = resourceSlideIndex + 1
                                          setResourceSlideIndex(newIdx)
                                          const s = slides[newIdx]
                                          if (s) onSendLive?.({ type: 'song', title: linkedSong.title, artist: linkedSong.artist, lines: s.lines })
                                        }
                                      }}
                                      disabled={resourceSlideIndex === slides.length - 1}
                                      style={{ fontSize: 9, padding: '3px 8px', borderRadius: 4, background: 'transparent', border: '1px solid #2A331F', color: resourceSlideIndex === slides.length - 1 ? '#3A4430' : '#8F9885', cursor: resourceSlideIndex === slides.length - 1 ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
                                    >
                                      Next →
                                    </button>
                                  </div>
                                </div>
                              )
                            })()}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ))}

                <button
                  onClick={addSession}
                  style={{
                    background: 'transparent',
                    border: '1px dashed #2A331F',
                    borderRadius: 8,
                    padding: '10px 0',
                    fontSize: 12,
                    color: '#8F9885',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(168,112,46,0.4)'
                    e.currentTarget.style.color = '#A8702E'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#2A331F'
                    e.currentTarget.style.color = '#8F9885'
                  }}
                >
                  + New Session
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Add-to-session picker */}
        <div style={{ width: 240, flexShrink: 0, borderLeft: '1px solid #2A331F', display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: 48, borderBottom: '1px solid #2A331F', display: 'flex', alignItems: 'center', padding: '0 14px', flexShrink: 0 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#8F9885', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Add to Session
            </span>
          </div>
          <div style={{ padding: 12, fontSize: 10, color: addTargetId ? '#8F9885' : '#ff6060' }}>
            {addTargetId
              ? `Adding to: ${sessions.find((s) => s.id === addTargetId)?.title ?? '—'}`
              : 'Select a session first ("Add here")'}
          </div>
          <div style={{ display: 'flex', gap: 3, padding: '0 10px 10px', flexWrap: 'wrap' }}>
            {(Object.keys(RESOURCE_LIBRARY) as (keyof typeof RESOURCE_LIBRARY)[]).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                style={{
                  background: activeTab === t ? 'rgba(168,112,46,0.14)' : '#1B2318',
                  border: activeTab === t ? '1px solid rgba(168,112,46,0.4)' : '1px solid #2A331F',
                  borderRadius: 5,
                  padding: '4px 9px',
                  fontSize: 10,
                  color: activeTab === t ? '#A8702E' : '#8F9885',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  textTransform: 'capitalize',
                }}
              >
                {t}
              </button>
            ))}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {RESOURCE_LIBRARY[activeTab].map((entry, i) => (
              <button
                key={i}
                disabled={!addTargetId}
                onClick={() =>
                  addTargetId &&
                  addResource(addTargetId, {
                    id: newResourceId(),
                    type: activeTab,
                    title: entry.label,
                    detail: entry.detail,
                    scriptureRef: entry.scriptureRef,
                    songRef: entry.songRef,
                  })
                }
                style={{
                  textAlign: 'left',
                  background: '#1B2318',
                  border: '1px solid #2A331F',
                  borderRadius: 6,
                  padding: '7px 10px',
                  fontSize: 11,
                  color: addTargetId ? '#EDEAE0' : '#3A4430',
                  cursor: addTargetId ? 'pointer' : 'not-allowed',
                  fontFamily: 'inherit',
                }}
              >
                + {entry.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function DragHandle({ small }: { small?: boolean }) {
  const s = small ? 10 : 12
  return (
    <svg width={s} height={s} viewBox="0 0 12 12" style={{ flexShrink: 0, color: '#3A4430' }}>
      <circle cx="4" cy="3" r="1" fill="currentColor" />
      <circle cx="8" cy="3" r="1" fill="currentColor" />
      <circle cx="4" cy="6" r="1" fill="currentColor" />
      <circle cx="8" cy="6" r="1" fill="currentColor" />
      <circle cx="4" cy="9" r="1" fill="currentColor" />
      <circle cx="8" cy="9" r="1" fill="currentColor" />
    </svg>
  )
}

function ScriptureGlyph({ color, size = 13 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 13 13" fill="none">
      <circle cx="5.5" cy="5.5" r="3.5" stroke={color} strokeWidth="1.2" />
      <path d="M8 8L12 12" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function SongGlyph({ color, size = 13 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 13 13" fill="none">
      <path d="M4 9.5V4l7-2v6" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="2.5" cy="9.5" r="1.5" stroke={color} strokeWidth="1.1" />
      <circle cx="9.5" cy="8" r="1.5" stroke={color} strokeWidth="1.1" />
    </svg>
  )
}

function TypeIcon({ type, color }: { type: ResourceType; color: string }) {
  if (type === 'combined') {
    return (
      <div style={{ display: 'flex', gap: 1, alignItems: 'center', flexShrink: 0 }}>
        <SongGlyph color={color} size={10} />
        <ScriptureGlyph color={color} size={10} />
      </div>
    )
  }
  const icons: Record<Exclude<ResourceType, 'combined'>, React.ReactNode> = {
    scripture: <ScriptureGlyph color={color} />,
    song: <SongGlyph color={color} />,
    slide: (
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <rect x="1" y="2" width="11" height="9" rx="1.5" stroke={color} strokeWidth="1.2" />
        <path d="M3.5 5.5h6M3.5 7.5h4" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
    media: (
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <rect x="1" y="2.5" width="11" height="8" rx="1.5" stroke={color} strokeWidth="1.2" />
        <path d="M5 5.5l4 2-4 2V5.5z" fill={color} />
      </svg>
    ),
    'up-next': (
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <path d="M2.5 3l5 3.5-5 3.5V3z" fill={color} />
        <path d="M9 3v7" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  }
  return <span style={{ flexShrink: 0 }}>{icons[type as Exclude<ResourceType, 'combined'>]}</span>
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
