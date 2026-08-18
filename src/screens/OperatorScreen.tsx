import { useState, type ReactNode } from 'react'
import type { DisplayContent } from './OutputStage'
import { useT } from '../i18n'

const TRANSLATIONS = ['NKJV', 'KJV', 'NIV', 'ESV', 'AMP', 'ERV', 'MSG', 'NLT', 'Pidgin']

interface Verse {
  ref: string
  translation: string
  text: string
}

const SAMPLE_VERSES: Verse[] = [
  {
    ref: 'John 3:16',
    translation: 'KJV',
    text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.',
  },
  {
    ref: 'Psalm 23:1',
    translation: 'KJV',
    text: 'The LORD is my shepherd; I shall not want.',
  },
  {
    ref: 'Romans 8:28',
    translation: 'NIV',
    text: 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.',
  },
  {
    ref: 'Philippians 4:13',
    translation: 'NASB',
    text: 'I can do all things through Him who strengthens me.',
  },
  {
    ref: 'Isaiah 40:31',
    translation: 'ESV',
    text: 'But they who wait for the LORD shall renew their strength; they shall mount up with wings like eagles; they shall run and not be weary; they shall walk and not faint.',
  },
  {
    ref: 'Proverbs 3:5–6',
    translation: 'NIV',
    text: 'Trust in the LORD with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.',
  },
]

const UP_NEXT = [
  { type: 'song', label: 'Amazing Grace' },
  { type: 'scripture', label: 'Romans 8:28 (NIV)' },
  { type: 'slides', label: 'Announcement Slides' },
]

const TYPE_ICON: Record<string, ReactNode> = {
  song: (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
      <path d="M5 9V3.5l5-1.5V8" stroke="#8F9885" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="3.5" cy="9" r="1.5" stroke="#8F9885" strokeWidth="1.2" />
      <circle cx="8.5" cy="7.5" r="1.5" stroke="#8F9885" strokeWidth="1.2" />
    </svg>
  ),
  scripture: (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
      <circle cx="5" cy="5" r="3" stroke="#8F9885" strokeWidth="1.2" />
      <path d="M7.5 7.5L10 10" stroke="#8F9885" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  ),
  slides: (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
      <rect x="1" y="2" width="10" height="8" rx="1.5" stroke="#8F9885" strokeWidth="1.2" />
      <path d="M3 5h6M3 7h4" stroke="#8F9885" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  ),
}

function verseToContent(v: Verse): DisplayContent {
  return { type: 'verse', ref: v.ref, translation: v.translation, text: v.text }
}

// ALT-003: Preview and Live are now independent outputs, lifted to App.tsx
// so the Operator screen and the two output screens share the same state
// instead of Operator only ever driving one hardcoded output.
export default function OperatorScreen({
  previewContent,
  liveContent,
  onSendPreview,
  onSendLive,
  onPushToLive,
  onClearPreview,
  onClearLive,
  onOpenPreview,
  onOpenLive,
}: {
  previewContent: DisplayContent | null
  liveContent: DisplayContent | null
  onSendPreview: (v: Verse) => void
  onSendLive: (v: Verse) => void
  onPushToLive: () => void
  onClearPreview: () => void
  onClearLive: () => void
  onOpenPreview?: () => void
  onOpenLive?: () => void
}) {
  const t = useT()
  const [query, setQuery] = useState('')
  const [translation, setTranslation] = useState('KJV')
  // ALT-004: detection (is the mic being analyzed) and auto-send (does a
  // confirmed match push straight to Live) are independent toggles.
  const [aiDetect, setAiDetect] = useState(false)
  const [autoSend, setAutoSend] = useState(false)
  // ALT-024: pinned/anchored scriptures for fast recall mid-service, when
  // a preacher asks for something out of the planned order.
  const [pinned, setPinned] = useState<Verse[]>([])
  const [dragPinIdx, setDragPinIdx] = useState<number | null>(null)
  const [dragOverPinIdx, setDragOverPinIdx] = useState<number | null>(null)

  function isPinned(v: Verse) {
    return pinned.some((p) => p.ref === v.ref && p.translation === v.translation)
  }

  function togglePin(v: Verse) {
    setPinned((prev) =>
      isPinned(v) ? prev.filter((p) => !(p.ref === v.ref && p.translation === v.translation)) : [...prev, v],
    )
  }

  function reorderPinned(targetIdx: number) {
    if (dragPinIdx === null || dragPinIdx === targetIdx) {
      setDragPinIdx(null)
      setDragOverPinIdx(null)
      return
    }
    setPinned((prev) => {
      const next = [...prev]
      const [moved] = next.splice(dragPinIdx, 1)
      next.splice(targetIdx, 0, moved)
      return next
    })
    setDragPinIdx(null)
    setDragOverPinIdx(null)
  }

  const filtered = query.trim()
    ? SAMPLE_VERSES.filter(
        (v) =>
          v.ref.toLowerCase().includes(query.toLowerCase()) ||
          v.text.toLowerCase().includes(query.toLowerCase()),
      )
    : SAMPLE_VERSES

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Main panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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
            {t.operator}
          </span>
          <StatusPill />
          <div style={{ flex: 1 }} />
          {onOpenPreview && <TopBarLinkBtn onClick={onOpenPreview} label={t.viewPreview} />}
          {onOpenLive && <TopBarLinkBtn onClick={onOpenLive} label={t.viewLive} />}
        </div>

        {/* Search + controls */}
        <div style={{ padding: '14px 20px 0 20px', display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, position: 'relative' }}>
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
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M10 10L14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </div>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                style={{
                  width: '100%',
                  background: '#1B2318',
                  border: '1px solid #2A331F',
                  borderRadius: 8,
                  padding: '8px 12px 8px 32px',
                  fontSize: 13,
                  color: '#EDEAE0',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(168,112,46,0.45)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#2A331F')}
              />
            </div>
            <select
              value={translation}
              onChange={(e) => setTranslation(e.target.value)}
              style={{
                background: '#1B2318',
                border: '1px solid #2A331F',
                borderRadius: 8,
                padding: '8px 10px',
                fontSize: 12,
                color: '#EDEAE0',
                outline: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                minWidth: 80,
              }}
            >
              {TRANSLATIONS.map((t) => (
                <option key={t} value={t} style={{ background: '#1B2318' }}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* ALT-004: AI detection + auto-send, two independent toggles */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              padding: '6px 0',
              borderBottom: '1px solid #2A331F',
            }}
          >
            <ToggleRow
              label={t.aiDetection}
              checked={aiDetect}
              onChange={setAiDetect}
            />
            <ToggleRow
              label={t.autoSend}
              checked={autoSend}
              onChange={setAutoSend}
              disabled={!aiDetect}
              hint={!aiDetect ? t.autoSendRequires : undefined}
            />
            <div style={{ fontSize: 11, color: '#8F9885', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              {aiDetect ? (
                <>
                  <PulsingDot />
                  {t.listening}
                </>
              ) : (
                t.detectionOff
              )}
            </div>
            <div style={{ fontSize: 10, color: '#3A4430' }}>
              {t.confirmedOnly}
            </div>
          </div>
        </div>

        {/* Verse list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 20px 20px 20px' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#8F9885', fontSize: 13 }}>
              No verses found for "{query}"
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.map((verse, i) => (
                <VerseCard
                  key={i}
                  verse={verse}
                  isPreview={previewContent?.type === 'verse' && previewContent.ref === verse.ref && previewContent.translation === verse.translation}
                  isLive={liveContent?.type === 'verse' && liveContent.ref === verse.ref && liveContent.translation === verse.translation}
                  isPinned={isPinned(verse)}
                  onSendPreview={() => onSendPreview(verse)}
                  onSendLive={() => onSendLive(verse)}
                  onTogglePin={() => togglePin(verse)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right sidebar */}
      <div
        style={{
          width: 260,
          flexShrink: 0,
          borderLeft: '1px solid #2A331F',
          background: '#1B2318',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            height: 48,
            borderBottom: '1px solid #2A331F',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: '#8F9885', textTransform: 'uppercase' }}>
            {t.nowOnScreen}
          </span>
        </div>

        <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* PREVIEW box */}
          <OutputBox
            label={t.preview}
            labelColor="#A8702E"
            content={previewContent}
            onClear={onClearPreview}
            extraAction={
              previewContent
                ? { label: t.pushToLive, onClick: onPushToLive }
                : undefined
            }
          />

          {/* LIVE box */}
          <OutputBox label={t.live} labelColor="#6FC98A" content={liveContent} onClear={onClearLive} />
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: '#2A331F', margin: '0 14px' }} />

        {/* ALT-024: Pin/anchor fast-reference panel */}
        <div style={{ padding: '12px 14px' }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.08em',
              color: '#8F9885',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            {t.pinned} ({pinned.length})
          </div>
          {pinned.length === 0 ? (
            <div style={{ fontSize: 11, color: '#3A4430' }}>
              {t.pinHint}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {pinned.map((v, i) => (
                <div
                  key={`${v.ref}-${v.translation}`}
                  draggable
                  onDragStart={() => setDragPinIdx(i)}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragOverPinIdx(i)
                  }}
                  onDrop={() => reorderPinned(i)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 8px',
                    background: '#10160F',
                    border: dragOverPinIdx === i ? '1px solid rgba(168,112,46,0.5)' : '1px solid #2A331F',
                    borderRadius: 6,
                    opacity: dragPinIdx === i ? 0.5 : 1,
                    cursor: 'grab',
                  }}
                >
                  <span style={{ fontSize: 11, color: '#EDEAE0', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {v.ref} <span style={{ color: '#3A4430' }}>({v.translation})</span>
                  </span>
                  <button
                    onClick={() => onSendLive(v)}
                    title="Send to Live"
                    style={{ background: 'none', border: 'none', color: '#A8702E', cursor: 'pointer', fontSize: 10, padding: '0 3px', fontFamily: 'inherit' }}
                  >
                    Send
                  </button>
                  <button
                    onClick={() => togglePin(v)}
                    title="Unpin"
                    style={{ background: 'none', border: 'none', color: '#8F9885', cursor: 'pointer', fontSize: 13, padding: '0 2px' }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: '#2A331F', margin: '0 14px' }} />

        {/* Up Next */}
        <div style={{ padding: '12px 14px' }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.08em',
              color: '#8F9885',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            Up Next
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {UP_NEXT.map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '6px 9px',
                  background: '#10160F',
                  border: '1px solid #2A331F',
                  borderRadius: 6,
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: 9, color: '#3A4430', fontWeight: 600, minWidth: 14 }}>
                  {i + 1}
                </span>
                {TYPE_ICON[item.type]}
                <span style={{ fontSize: 11, color: '#8F9885', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Live indicator */}
        <div style={{ padding: '0 14px 14px 14px' }}>
          <div
            style={{
              background: '#10160F',
              borderRadius: 6,
              border: '1px solid #2A331F',
              padding: '7px 11px',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
            }}
          >
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: liveContent ? '#6FC98A' : '#8F9885',
                boxShadow: liveContent ? '0 0 5px rgba(111,201,138,0.6)' : 'none',
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 11, color: '#8F9885' }}>
              {liveContent ? t.liveActive : t.liveIdle}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function ToggleRow({
  label,
  checked,
  onChange,
  disabled,
  hint,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
  hint?: string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 12, color: disabled ? '#8F9885' : '#EDEAE0', fontWeight: 500 }}>{label}</span>
        {hint && <span style={{ fontSize: 10, color: '#3A4430' }}>{hint}</span>}
      </div>
      <button
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        style={{
          width: 36,
          height: 20,
          borderRadius: 10,
          border: 'none',
          background: checked && !disabled ? '#A8702E' : '#2A331F',
          position: 'relative',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          transition: 'background 0.2s',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: '#EDEAE0',
            position: 'absolute',
            top: 3,
            left: checked ? 19 : 3,
            transition: 'left 0.2s',
          }}
        />
      </button>
    </div>
  )
}

function OutputBox({
  label,
  labelColor,
  content,
  onClear,
  extraAction,
}: {
  label: string
  labelColor: string
  content: DisplayContent | null
  onClear: () => void
  extraAction?: { label: string; onClick: () => void }
}) {
  const t = useT()
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: labelColor, marginBottom: 6 }}>
        {label}
      </div>
      <div
        style={{
          background: '#000',
          borderRadius: 6,
          border: '1px solid #2A331F',
          aspectRatio: '16/9',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 14,
          gap: 8,
        }}
      >
        {content?.type === 'verse' ? (
          <>
            <div style={{ fontFamily: 'Lora, Georgia, serif', fontSize: 9, color: '#fff', textAlign: 'center', lineHeight: 1.55 }}>
              {content.text.length > 130 ? content.text.slice(0, 130) + '…' : content.text}
            </div>
            <div style={{ fontFamily: 'Lora, Georgia, serif', fontSize: 8, color: '#A8702E', textAlign: 'center' }}>
              {content.ref} ({content.translation})
            </div>
          </>
        ) : content?.type === 'timer' ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 8, color: '#8F9885', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
              {content.sessionTitle}
            </div>
            <div style={{ fontFamily: 'Inter, Segoe UI, sans-serif', fontSize: 16, color: '#A8702E', fontVariantNumeric: 'tabular-nums' }}>
              {String(Math.floor(content.remainingSeconds / 60)).padStart(2, '0')}:{String(content.remainingSeconds % 60).padStart(2, '0')}
            </div>
          </div>
        ) : (
          <div
            style={{
              fontFamily: 'Lora, Georgia, serif',
              fontSize: 10,
              color: '#A8702E',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              textAlign: 'center',
              fontVariant: 'small-caps',
            }}
          >
            RCCG CAYC Media
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
        {content && (
          <button
            onClick={onClear}
            style={{
              flex: 1,
              background: 'transparent',
              border: '1px solid #2A331F',
              borderRadius: 5,
              padding: '4px 10px',
              fontSize: 10,
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
            {t.clear} {label.toLowerCase()}
          </button>
        )}
        {extraAction && (
          <button
            onClick={extraAction.onClick}
            style={{
              flex: 1,
              background: '#A8702E',
              border: 'none',
              borderRadius: 5,
              padding: '4px 10px',
              fontSize: 10,
              fontWeight: 600,
              color: '#10160F',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#C08A44')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#A8702E')}
          >
            {extraAction.label}
          </button>
        )}
      </div>
    </div>
  )
}

function TopBarLinkBtn({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'transparent',
        border: '1px solid #2A331F',
        borderRadius: 6,
        padding: '4px 10px',
        fontSize: 11,
        color: '#8F9885',
        cursor: 'pointer',
        fontFamily: 'inherit',
        display: 'flex',
        alignItems: 'center',
        gap: 5,
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
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
        <rect x="1" y="2" width="10" height="7" rx="1" stroke="currentColor" strokeWidth="1.2" />
        <path d="M4 11h4M6 9v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
      {label}
    </button>
  )
}

function StatusPill() {
  const t = useT()
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
      <div
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: '#A8702E',
          boxShadow: '0 0 4px rgba(168,112,46,0.7)',
        }}
      />
      <span style={{ fontSize: 11, color: '#8F9885' }}>{t.prototypeBuild}</span>
    </div>
  )
}

function PulsingDot() {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: '#A8702E',
        animation: 'pulse-gold 1.4s ease-in-out infinite',
      }}
    >
      <style>{`
        @keyframes pulse-gold {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }
      `}</style>
    </span>
  )
}

function VerseCard({
  verse,
  isPreview,
  isLive,
  isPinned,
  onSendPreview,
  onSendLive,
  onTogglePin,
}: {
  verse: Verse
  isPreview: boolean
  isLive: boolean
  isPinned: boolean
  onSendPreview: () => void
  onSendLive: () => void
  onTogglePin: () => void
}) {
  const t = useT()
  return (
    <div
      style={{
        background: '#1B2318',
        border: `1px solid ${isLive ? 'rgba(111,201,138,0.4)' : isPreview ? 'rgba(168,112,46,0.4)' : '#2A331F'}`,
        borderRadius: 8,
        padding: '12px 14px',
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
      }}
    >
      <button
        onClick={onTogglePin}
        title={isPinned ? 'Unpin' : 'Pin for fast reference'}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          background: isPinned ? 'rgba(168,112,46,0.14)' : 'transparent',
          border: isPinned ? '1px solid rgba(168,112,46,0.4)' : '1px solid #2A331F',
          borderRadius: 6,
          cursor: 'pointer',
          padding: '4px 8px',
          flexShrink: 0,
          color: isPinned ? '#A8702E' : '#8F9885',
          fontSize: 10,
          fontFamily: 'inherit',
        }}
        onMouseEnter={(e) => {
          if (!isPinned) {
            e.currentTarget.style.borderColor = 'rgba(168,112,46,0.4)'
            e.currentTarget.style.color = '#A8702E'
          }
        }}
        onMouseLeave={(e) => {
          if (!isPinned) {
            e.currentTarget.style.borderColor = '#2A331F'
            e.currentTarget.style.color = '#8F9885'
          }
        }}
      >
        <svg width="12" height="12" viewBox="0 0 14 14" fill={isPinned ? 'currentColor' : 'none'}>
          <path d="M7 1.5l1.5 3.5 3.5.5-2.5 2.5.5 3.5L7 9.5 4 11.5l.5-3.5L2 5.5l3.5-.5L7 1.5z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
        </svg>
        {isPinned ? 'Pinned' : 'Pin'}
      </button>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#A8702E', marginBottom: 5 }}>
          {verse.ref}
          <span style={{ marginLeft: 6, fontWeight: 400, fontSize: 11, color: '#8F9885' }}>
            ({verse.translation})
          </span>
          {isLive && (
            <span
              style={{
                marginLeft: 8,
                fontSize: 10,
                color: '#6FC98A',
                background: 'rgba(111,201,138,0.1)',
                border: '1px solid rgba(111,201,138,0.25)',
                borderRadius: 4,
                padding: '1px 6px',
              }}
            >
              Live
            </span>
          )}
          {isPreview && !isLive && (
            <span
              style={{
                marginLeft: 8,
                fontSize: 10,
                color: '#A8702E',
                background: 'rgba(168,112,46,0.1)',
                border: '1px solid rgba(168,112,46,0.25)',
                borderRadius: 4,
                padding: '1px 6px',
              }}
            >
              Preview
            </span>
          )}
        </div>
        <div style={{ fontSize: 12, color: '#EDEAE0', lineHeight: 1.65 }}>{verse.text}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flexShrink: 0 }}>
        <button
          onClick={onSendPreview}
          style={{
            background: isPreview ? 'rgba(168,112,46,0.12)' : 'transparent',
            border: '1px solid rgba(168,112,46,0.4)',
            borderRadius: 6,
            padding: '5px 11px',
            fontSize: 11,
            fontWeight: 600,
            color: '#A8702E',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            fontFamily: 'inherit',
          }}
        >
          {t.sendToPreview}
        </button>
        <button
          onClick={onSendLive}
          style={{
            background: '#A8702E',
            border: 'none',
            borderRadius: 6,
            padding: '5px 11px',
            fontSize: 11,
            fontWeight: 600,
            color: '#10160F',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            fontFamily: 'inherit',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#C08A44')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#A8702E')}
        >
          {t.sendToLive}
        </button>
      </div>
    </div>
  )
}
