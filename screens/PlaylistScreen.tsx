import { useState } from 'react'
import { newSession, type ServiceSession } from '../sessionModel'

// ALT: simplified per instruction -- Service Playlist is now pure
// time-keeping for the Stage Control countdown. Sending scripture/songs/
// slides happens directly from the unified Operator screen instead
// (including the new Send to Stage option), so sessions no longer hold
// resources or a Timed/Resource mode toggle.
export default function PlaylistScreen({
  sessions,
  onChangeSessions,
  onStartService,
}: {
  sessions: ServiceSession[]
  onChangeSessions: (sessions: ServiceSession[]) => void
  onStartService?: () => void
}) {
  const [serviceStarted, setServiceStarted] = useState(false)
  const [dragSessionId, setDragSessionId] = useState<string | null>(null)
  const [dragOverSessionId, setDragOverSessionId] = useState<string | null>(null)

  function updateSession(id: string, patch: Partial<ServiceSession>) {
    onChangeSessions(sessions.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }

  function addSession() {
    onChangeSessions([...sessions, newSession('New Session', 5)])
  }

  function removeSession(id: string) {
    onChangeSessions(sessions.filter((s) => s.id !== id))
  }

  function handleDrop(targetId: string) {
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

  const totalMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0)

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
          Service Playlist
        </span>
        <StatusPill />
        <div style={{ flex: 1 }} />
        <button
          onClick={() => {
            setServiceStarted((v) => !v)
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

      <div style={{ flex: 1, overflowY: 'auto', padding: 16, maxWidth: 640 }}>
        <div style={{ fontSize: 11, color: '#8F9885', marginBottom: 10, letterSpacing: '0.03em' }}>
          {sessions.length} sessions \u00b7 {totalMinutes} min total \u2192 Stage Control
        </div>
        <p style={{ fontSize: 11, color: '#3A4430', marginTop: 0, marginBottom: 14, lineHeight: 1.5 }}>
          This is pure time-keeping for the Stage countdown. To send scripture, songs, or slides during a
          session, use the Scripture / Songs / Slides pages on the Operator screen.
        </p>

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
              onDrop={() => handleDrop(session.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: '#1B2318',
                border: dragOverSessionId === session.id ? '1px solid rgba(168,112,46,0.5)' : '1px solid #2A331F',
                borderRadius: 8,
                padding: '10px 12px',
                opacity: dragSessionId === session.id ? 0.5 : 1,
                cursor: 'grab',
              }}
            >
              <DragHandle />
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
              <input
                type="number"
                min={1}
                value={session.durationMinutes}
                onChange={(e) => updateSession(session.id, { durationMinutes: Math.max(1, Number(e.target.value)) })}
                style={{
                  width: 50,
                  background: '#10160F',
                  border: '1px solid #2A331F',
                  borderRadius: 5,
                  padding: '4px 6px',
                  fontSize: 12,
                  color: '#EDEAE0',
                  textAlign: 'center',
                  fontFamily: 'inherit',
                }}
              />
              <span style={{ fontSize: 11, color: '#8F9885' }}>min</span>
              <button
                onClick={() => removeSession(session.id)}
                style={{ background: 'none', border: 'none', color: '#8F9885', cursor: 'pointer', fontSize: 15, padding: '0 2px' }}
              >
                \u00d7
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={addSession}
          style={{
            width: '100%',
            marginTop: 8,
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
    </div>
  )
}

function DragHandle() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" style={{ flexShrink: 0, color: '#3A4430' }}>
      <circle cx="4" cy="3" r="1" fill="currentColor" />
      <circle cx="8" cy="3" r="1" fill="currentColor" />
      <circle cx="4" cy="6" r="1" fill="currentColor" />
      <circle cx="8" cy="6" r="1" fill="currentColor" />
      <circle cx="4" cy="9" r="1" fill="currentColor" />
      <circle cx="8" cy="9" r="1" fill="currentColor" />
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
