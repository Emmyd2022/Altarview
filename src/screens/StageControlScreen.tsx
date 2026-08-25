import { useState } from 'react'
import type { StageTimerState } from '../hooks/useStageTimer'
import type { TimerDisplayContent } from './OutputStage'

// ALT-018/019/021: this is where the operator actually drives the Stage
// output from -- Start/Pause/Next/Previous/Stop, timer adjustment, and
// sending a note to the stage all live here, NOT on the Stage output
// itself (see StageScreen.tsx).
export default function StageControlScreen({
  state,
  onOpenStageOutput,
  onPushToLive,
  hasStageContent,
  onClearStage,
  onNextFoldback,
  onPreviousFoldback,
}: {
  state: StageTimerState
  onOpenStageOutput?: () => void
  onPushToLive?: (content: TimerDisplayContent) => void
  hasStageContent?: boolean
  onClearStage?: () => void
  // ALT-STAGE3-PART7/9: navigates whatever CONTENT is currently pushed to
  // Foldback (verse/song), independent of Live -- only meaningful while
  // hasStageContent is true; the session timer has its own Next/Previous
  // further down (goToNext/goToPrevious on `state`), which is a
  // completely separate concept per the brief's own Section 18/19.
  onNextFoldback?: () => void
  onPreviousFoldback?: () => void
}) {
  const [messageInput, setMessageInput] = useState('')

  const {
    current,
    next,
    remaining,
    running,
    flashing,
    timesUp,
    message,
    start,
    pause,
    stop,
    goToNext,
    goToPrevious,
    adjust,
    sendMessage,
    clearMessage,
    hasNext,
    hasPrevious,
  } = state

  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60

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
          Stage Control
        </span>
        <StatusPill />
        <div style={{ flex: 1 }} />
        {/* ALT: Send to Stage indicator + clear -- content sent from
            Operator (scripture/song/slide) replaces the timer on Stage
            while shown; this is how the operator brings the timer back. */}
        {hasStageContent && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 4 }}>
            <span style={{ fontSize: 11, color: '#A8702E' }}>Content on Stage</span>
            {/* ALT-STAGE3-PART7/9: navigates the pushed CONTENT, not the
                session timer -- only shown while content is actually on
                Foldback, since "next verse/slide" has no meaning for the
                timer view. */}
            {onPreviousFoldback && (
              <button
                onClick={onPreviousFoldback}
                title="Previous item on Foldback"
                style={{ background: 'transparent', border: '1px solid #2A331F', borderRadius: 6, padding: '4px 8px', fontSize: 11, color: '#8F9885', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                ←
              </button>
            )}
            {onNextFoldback && (
              <button
                onClick={onNextFoldback}
                title="Next item on Foldback"
                style={{ background: 'transparent', border: '1px solid #2A331F', borderRadius: 6, padding: '4px 8px', fontSize: 11, color: '#8F9885', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                →
              </button>
            )}
            {onClearStage && (
              <button
                onClick={onClearStage}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(168,112,46,0.4)',
                  borderRadius: 6,
                  padding: '4px 10px',
                  fontSize: 11,
                  color: '#A8702E',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Clear Stage (show timer)
              </button>
            )}
          </div>
        )}
        {onOpenStageOutput && (
          <button
            onClick={onOpenStageOutput}
            style={{
              background: 'transparent',
              border: '1px solid #2A331F',
              borderRadius: 6,
              padding: '4px 10px',
              fontSize: 11,
              color: '#8F9885',
              cursor: 'pointer',
              fontFamily: 'inherit',
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
            View Stage Output
          </button>
        )}
        {/* ALT-040: push the countdown onto the audience/Live screen on demand
            (e.g. a Sunday School countdown everyone should see), without this
            being a permanent routing rule -- a one-off push, like Preview's
            "Push to Live" action. */}
        {onPushToLive && (
          <button
            onClick={() =>
              onPushToLive({
                type: 'timer',
                sessionTitle: current.title,
                remainingSeconds: remaining,
                totalSeconds: current.durationMinutes * 60,
              })
            }
            style={{
              background: '#A8702E',
              border: 'none',
              borderRadius: 6,
              padding: '4px 10px',
              fontSize: 11,
              fontWeight: 600,
              color: '#10160F',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Push Countdown to Live →
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
        {/* ALT-019: operator's own mirror of the countdown */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#8F9885', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
            {current.title}
          </div>
          <div
            style={{
              fontSize: 56,
              fontWeight: 300,
              color: timesUp || flashing ? '#ff6060' : '#A8702E',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {timesUp ? "Time's Up" : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`}
          </div>
          {next && (
            <div style={{ fontSize: 12, color: '#8F9885', marginTop: 6 }}>Up next: {next.title}</div>
          )}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          <CtrlBtn onClick={goToPrevious} disabled={!hasPrevious}>
            Previous
          </CtrlBtn>
          <CtrlBtn onClick={() => adjust(-1)}>-1 min</CtrlBtn>
          {running ? (
            <CtrlBtn onClick={pause} accent>
              Pause
            </CtrlBtn>
          ) : (
            <CtrlBtn onClick={start} accent>
              Start
            </CtrlBtn>
          )}
          <CtrlBtn onClick={() => adjust(1)}>+1 min</CtrlBtn>
          <CtrlBtn onClick={goToNext} disabled={!hasNext}>
            Next
          </CtrlBtn>
          <CtrlBtn onClick={stop} danger>
            Stop
          </CtrlBtn>
        </div>

        {/* ALT-021: message to stage */}
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ fontSize: 11, color: '#8F9885', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Message to Stage
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && messageInput.trim()) {
                  sendMessage(messageInput)
                  setMessageInput('')
                }
              }}
              placeholder="e.g. 2 more minutes"
              style={{
                flex: 1,
                background: '#1B2318',
                border: '1px solid #2A331F',
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: 13,
                color: '#EDEAE0',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
            <button
              onClick={() => {
                if (messageInput.trim()) {
                  sendMessage(messageInput)
                  setMessageInput('')
                }
              }}
              style={{
                background: '#A8702E',
                border: 'none',
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 12,
                fontWeight: 600,
                color: '#10160F',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Send
            </button>
          </div>
          {message && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <span style={{ fontSize: 11, color: '#8F9885' }}>Currently showing: "{message}"</span>
              <button
                onClick={clearMessage}
                style={{ background: 'transparent', border: 'none', color: '#A8702E', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function CtrlBtn({
  children,
  onClick,
  disabled,
  accent,
  danger,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  accent?: boolean
  danger?: boolean
}) {
  const bg = disabled ? '#1B2318' : accent ? '#A8702E' : danger ? 'transparent' : '#1B2318'
  const border = danger ? '1px solid rgba(255,96,96,0.4)' : accent ? 'none' : '1px solid #2A331F'
  const color = disabled ? '#3A4430' : accent ? '#10160F' : danger ? '#ff6060' : '#EDEAE0'
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: bg,
        border,
        borderRadius: 7,
        padding: '9px 18px',
        fontSize: 12,
        fontWeight: 500,
        color,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit',
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
