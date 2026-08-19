import { useState, useEffect, useRef } from 'react'
import type { PinnedItem } from '../pinModel'

const PRESETS = [
  { label: '2 min', seconds: 120 },
  { label: '5 min', seconds: 300 },
  { label: '10 min', seconds: 600 },
  { label: '15 min', seconds: 900 },
]

export default function TimerScreen({
  onPin,
}: {
  onPin?: (item: Omit<PinnedItem, 'id'>) => void
} = {}) {
  const [totalSeconds, setTotalSeconds] = useState(300)
  const [remaining, setRemaining] = useState(300)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            setRunning(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [running])

  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60
  const progress = totalSeconds > 0 ? remaining / totalSeconds : 0

  const radius = 90
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - progress)

  // ALT-006: minutes input mirrors this, so presets and free entry share
  // one mechanism instead of being two separate systems.
  const [minutesInput, setMinutesInput] = useState('5')

  function setPreset(secs: number) {
    setRunning(false)
    setTotalSeconds(secs)
    setRemaining(secs)
    setMinutesInput(String(secs / 60))
  }

  function applyMinutesInput() {
    const mins = Math.max(1, Math.round(Number(minutesInput) || 1))
    setPreset(mins * 60)
  }

  function handleStart() {
    if (remaining > 0) setRunning(true)
  }

  function handlePause() {
    setRunning(false)
  }

  function handleReset() {
    setRunning(false)
    setRemaining(totalSeconds)
  }

  const finished = remaining === 0

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
          Timer / Countdown
        </span>
        <StatusPill />
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 32,
          padding: 40,
        }}
      >
        {/* Presets */}
        <div style={{ display: 'flex', gap: 8 }}>
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => setPreset(p.seconds)}
              style={{
                background: totalSeconds === p.seconds ? 'rgba(168,112,46,0.12)' : '#1B2318',
                border: totalSeconds === p.seconds ? '1px solid rgba(168,112,46,0.4)' : '1px solid #2A331F',
                borderRadius: 6,
                padding: '5px 14px',
                fontSize: 12,
                fontWeight: totalSeconds === p.seconds ? 600 : 400,
                color: totalSeconds === p.seconds ? '#A8702E' : '#8F9885',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {p.label}
            </button>
          ))}
          {/* ALT-006: free-entry minutes, not limited to the presets above */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="number"
              min={1}
              value={minutesInput}
              onChange={(e) => setMinutesInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyMinutesInput()}
              style={{
                width: 52,
                background: '#1B2318',
                border: '1px solid #2A331F',
                borderRadius: 6,
                padding: '5px 8px',
                fontSize: 12,
                color: '#EDEAE0',
                fontFamily: 'inherit',
                textAlign: 'center',
              }}
            />
            <span style={{ fontSize: 11, color: '#8F9885' }}>min</span>
            <button
              onClick={applyMinutesInput}
              style={{
                background: 'transparent',
                border: '1px solid #2A331F',
                borderRadius: 6,
                padding: '5px 10px',
                fontSize: 11,
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
              Set
            </button>
            {onPin && (
              <button
                onClick={() => onPin({ type: 'timer', label: `${Math.round(totalSeconds / 60)} min timer`, timerMinutes: Math.round(totalSeconds / 60) })}
                title="Pin this duration for quick access"
                style={{ background: 'transparent', border: '1px solid #2A331F', borderRadius: 6, padding: '5px 10px', fontSize: 11, color: '#8F9885', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Pin
              </button>
            )}
          </div>
        </div>

        {/* Ring + numbers */}
        <div style={{ position: 'relative', width: 220, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg
            width="220"
            height="220"
            viewBox="0 0 220 220"
            style={{ position: 'absolute', transform: 'rotate(-90deg)' }}
          >
            {/* Track */}
            <circle
              cx="110"
              cy="110"
              r={radius}
              fill="none"
              stroke="#2A331F"
              strokeWidth="6"
            />
            {/* Progress */}
            <circle
              cx="110"
              cy="110"
              r={radius}
              fill="none"
              stroke={finished ? '#6FC98A' : '#A8702E'}
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
            />
          </svg>
          <div
            style={{
              textAlign: 'center',
              fontFamily: 'Inter, Segoe UI, sans-serif',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <div
              style={{
                fontSize: 54,
                fontWeight: 300,
                color: finished ? '#6FC98A' : '#A8702E',
                lineHeight: 1,
                letterSpacing: '0.02em',
                transition: 'color 0.3s',
              }}
            >
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
            <div style={{ fontSize: 11, color: '#8F9885', marginTop: 6 }}>
              {finished ? 'Time is up' : running ? 'Counting down' : 'Ready'}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 10 }}>
          <ControlBtn
            onClick={handleStart}
            disabled={running || finished}
            gold
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M3 2l8 4.5L3 11V2z" fill="currentColor" />
            </svg>
            Start
          </ControlBtn>
          <ControlBtn onClick={handlePause} disabled={!running}>
            <svg width="12" height="13" viewBox="0 0 12 13" fill="none">
              <rect x="1" y="2" width="4" height="9" rx="1" fill="currentColor" />
              <rect x="7" y="2" width="4" height="9" rx="1" fill="currentColor" />
            </svg>
            Pause
          </ControlBtn>
          <ControlBtn onClick={handleReset}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M2.5 6.5A4 4 0 016.5 2.5a4 4 0 014 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              <path d="M10.5 6.5l1-2-2 .5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Reset
          </ControlBtn>
        </div>

        {/* Projector note */}
        <div
          style={{
            background: '#1B2318',
            border: '1px solid #2A331F',
            borderRadius: 8,
            padding: '10px 16px',
            fontSize: 11,
            color: '#8F9885',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <rect x="1" y="2" width="11" height="8" rx="1.5" stroke="#8F9885" strokeWidth="1.2" />
            <path d="M4 11.5h5M6.5 10v1.5" stroke="#8F9885" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          Timer can be overlaid on the projector output during a countdown
        </div>
      </div>
    </div>
  )
}

function ControlBtn({
  children,
  onClick,
  disabled,
  gold,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  gold?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: gold && !disabled ? '#A8702E' : '#1B2318',
        border: gold && !disabled ? 'none' : '1px solid #2A331F',
        borderRadius: 7,
        padding: '8px 20px',
        fontSize: 12,
        fontWeight: 500,
        color: gold && !disabled ? '#10160F' : disabled ? '#3A4430' : '#EDEAE0',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit',
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        opacity: disabled ? 0.5 : 1,
        transition: 'background 0.15s',
      }}
    >
      {children}
    </button>
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
