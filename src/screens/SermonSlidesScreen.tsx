import { useState } from 'react'
import type { DisplayContent } from './OutputStage'
import type { PinnedItem } from '../pinModel'

interface Slide {
  id: number
  text: string
}

// ALT-028: a saved deck is a named snapshot of a full slide set, stored
// persistently in the library so a deck built once can be reused in a
// future service instead of being lost when the app closes.
interface SavedDeck {
  id: string
  name: string
  savedAt: string
  slides: Slide[]
}

const INITIAL_SLIDES: Slide[] = [
  { id: 1, text: 'Welcome to Sunday Service\nRCCG CAYC — August 2026' },
  { id: 2, text: '"For God so loved the world…"\nJohn 3:16' },
  { id: 3, text: 'Community Announcements\n\n• Youth camp: Aug 24\n• Prayer night: Aug 28' },
  { id: 4, text: 'Thank you for joining us today.\nGod bless you.' },
]

const INITIAL_SAVED_DECKS: SavedDeck[] = [
  {
    id: 'deck-1',
    name: 'Sunday Welcome Template',
    savedAt: 'Aug 3, 2026',
    slides: [
      { id: 1, text: 'Welcome to Sunday Service' },
      { id: 2, text: 'Thank you for joining us today.\nGod bless you.' },
    ],
  },
]

export default function SermonSlidesScreen({
  onSendLive,
  onPin,
}: {
  onSendLive?: (content: DisplayContent) => void
  onPin?: (item: Omit<PinnedItem, 'id'>) => void
} = {}) {
  const [slides, setSlides] = useState(INITIAL_SLIDES)
  const [activeId, setActiveId] = useState(1)
  // ALT: when broadcasting, selecting any slide immediately sends it to
  // Live -- paging through slides updates the congregation screen live,
  // independent of the service playlist entirely.
  const [broadcasting, setBroadcasting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [align, setAlign] = useState<'left' | 'center' | 'right'>('center')
  const [bold, setBold] = useState(false)
  const [fontSize, setFontSize] = useState(24)
  // ALT-028: persistent deck library.
  const [savedDecks, setSavedDecks] = useState<SavedDeck[]>(INITIAL_SAVED_DECKS)
  const [showLibrary, setShowLibrary] = useState(false)
  const [deckName, setDeckName] = useState('')

  function saveCurrentDeck() {
    const name = deckName.trim() || `Deck — ${new Date().toLocaleDateString()}`
    setSavedDecks((prev) => [
      { id: `deck-${Date.now()}`, name, savedAt: new Date().toLocaleDateString(), slides },
      ...prev,
    ])
    setDeckName('')
  }

  function loadDeck(deck: SavedDeck) {
    setSlides(deck.slides.map((s) => ({ ...s })))
    setActiveId(deck.slides[0]?.id ?? 1)
    setShowLibrary(false)
  }

  function deleteDeck(id: string) {
    setSavedDecks((prev) => prev.filter((d) => d.id !== id))
  }

  const activeSlide = slides.find((s) => s.id === activeId)!

  function updateText(text: string) {
    setSlides((prev) => prev.map((s) => (s.id === activeId ? { ...s, text } : s)))
  }

  function addSlide() {
    const newId = Math.max(...slides.map((s) => s.id)) + 1
    setSlides((prev) => [...prev, { id: newId, text: 'New slide' }])
    setActiveId(newId)
  }

  // ALT-013: import options -- in the real app these parse the uploaded
  // file; here they demonstrate the same end state (a new slide, editable
  // in the same canvas) that a real import would produce.
  function importFrom(source: 'PowerPoint' | 'PDF' | 'Word') {
    const newId = Math.max(...slides.map((s) => s.id)) + 1
    setSlides((prev) => [...prev, { id: newId, text: `Imported from ${source}\n(content would appear here)` }])
    setActiveId(newId)
  }

  function deleteSlide(id: number) {
    if (slides.length === 1) return
    const remaining = slides.filter((s) => s.id !== id)
    setSlides(remaining)
    if (activeId === id) setActiveId(remaining[0].id)
  }

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
          Sermon Notes & Slides
        </span>
        <StatusPill />
        {/* ALT-013: import options */}
        <div style={{ display: 'flex', gap: 4 }}>
          <ImportBtn label="Import PowerPoint" onClick={() => importFrom('PowerPoint')} />
          <ImportBtn label="Import PDF" onClick={() => importFrom('PDF')} />
          <ImportBtn label="Import Word" onClick={() => importFrom('Word')} />
        </div>
        <div style={{ flex: 1 }} />
        {/* ALT: send directly to Live, independent of the service playlist */}
        {onSendLive && (
          <>
            <button
              onClick={() => setBroadcasting((v) => !v)}
              title="When on, selecting any slide sends it to Live immediately"
              style={{
                background: broadcasting ? '#A8702E' : 'transparent',
                border: broadcasting ? 'none' : '1px solid #2A331F',
                borderRadius: 6,
                padding: '4px 10px',
                fontSize: 11,
                fontWeight: broadcasting ? 600 : 400,
                color: broadcasting ? '#10160F' : '#8F9885',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {broadcasting ? '● Live' : 'Go Live'}
            </button>
            {!broadcasting && (
              <button
                onClick={() => onSendLive({ type: 'slide', text: activeSlide.text })}
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
                Send to Live
              </button>
            )}
            {onPin && (
              <button
                onClick={() => onPin({ type: 'slide', label: `Slide ${slides.findIndex((s) => s.id === activeId) + 1}`, detail: activeSlide.text.split('\n')[0].slice(0, 30), slideText: activeSlide.text })}
                title="Pin this slide"
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
              >
                Pin
              </button>
            )}
          </>
        )}
        {/* ALT-028: saved deck library */}
        <button
          onClick={() => setShowLibrary(!showLibrary)}
          style={{
            background: showLibrary ? 'rgba(168,112,46,0.14)' : 'transparent',
            border: showLibrary ? '1px solid rgba(168,112,46,0.4)' : '1px solid #2A331F',
            borderRadius: 6,
            padding: '4px 10px',
            fontSize: 11,
            color: showLibrary ? '#A8702E' : '#8F9885',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Saved Decks ({savedDecks.length})
        </button>
        {/* Formatting toolbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            background: '#1B2318',
            border: '1px solid #2A331F',
            borderRadius: 7,
            padding: '2px',
          }}
        >
          <ToolBtn active={bold} onClick={() => setBold(!bold)} title="Bold">
            <strong style={{ fontSize: 12, fontFamily: 'serif' }}>B</strong>
          </ToolBtn>
          <ToolBtn active={align === 'left'} onClick={() => setAlign('left')} title="Align left">
            <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
              <path d="M0 1h12M0 5h8M0 9h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </ToolBtn>
          <ToolBtn active={align === 'center'} onClick={() => setAlign('center')} title="Align center">
            <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
              <path d="M0 1h12M2 5h8M1 9h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </ToolBtn>
          <ToolBtn active={align === 'right'} onClick={() => setAlign('right')} title="Align right">
            <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
              <path d="M0 1h12M4 5h8M2 9h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </ToolBtn>
        </div>
        <select
          value={fontSize}
          onChange={(e) => setFontSize(Number(e.target.value))}
          style={{
            background: '#1B2318',
            border: '1px solid #2A331F',
            borderRadius: 6,
            padding: '4px 8px',
            fontSize: 12,
            color: '#EDEAE0',
            outline: 'none',
            fontFamily: 'inherit',
            cursor: 'pointer',
          }}
        >
          {[16, 20, 24, 28, 32, 40, 48].map((s) => (
            <option key={s} value={s} style={{ background: '#1B2318' }}>
              {s}px
            </option>
          ))}
        </select>
      </div>

      {/* ALT-028: saved decks library panel */}
      {showLibrary && (
        <div style={{ borderBottom: '1px solid #2A331F', padding: 14, flexShrink: 0 }}>
          <p style={{ fontSize: 11, color: '#8F9885', margin: '0 0 10px', lineHeight: 1.5 }}>
            Save your current slides under a name so you can reuse this exact deck in a future service, instead
            of rebuilding it from scratch. Click "Load" on a saved deck below to bring it back into the editor.
          </p>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            <input
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              placeholder="Name this deck to save it, e.g. Sunday Welcome"
              style={{
                flex: 1,
                background: '#1B2318',
                border: '1px solid #2A331F',
                borderRadius: 6,
                padding: '7px 10px',
                fontSize: 12,
                color: '#EDEAE0',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
            <button
              onClick={saveCurrentDeck}
              style={{
                background: '#A8702E',
                border: 'none',
                borderRadius: 6,
                padding: '7px 14px',
                fontSize: 11,
                fontWeight: 600,
                color: '#10160F',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Save Current Deck
            </button>
          </div>
          {savedDecks.length === 0 ? (
            <div style={{ fontSize: 11, color: '#3A4430' }}>No saved decks yet.</div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {savedDecks.map((deck) => (
                <div
                  key={deck.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: '#1B2318',
                    border: '1px solid #2A331F',
                    borderRadius: 6,
                    padding: '7px 10px',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12, color: '#EDEAE0' }}>{deck.name}</div>
                    <div style={{ fontSize: 10, color: '#3A4430' }}>
                      {deck.slides.length} slides · saved {deck.savedAt}
                    </div>
                  </div>
                  <button
                    onClick={() => loadDeck(deck)}
                    style={{ background: 'transparent', border: '1px solid rgba(168,112,46,0.4)', borderRadius: 5, padding: '4px 9px', fontSize: 10, color: '#A8702E', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    Load
                  </button>
                  <button
                    onClick={() => deleteDeck(deck.id)}
                    style={{ background: 'none', border: 'none', color: '#8F9885', cursor: 'pointer', fontSize: 14 }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Thumbnail strip */}
        <div
          style={{
            width: 140,
            flexShrink: 0,
            borderRight: '1px solid #2A331F',
            background: '#10160F',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            padding: '10px 10px 0 10px',
            gap: 8,
          }}
        >
          {slides.map((slide, i) => (
            <div
              key={slide.id}
              onClick={() => {
                setActiveId(slide.id)
                if (broadcasting && onSendLive) onSendLive({ type: 'slide', text: slide.text })
              }}
              style={{
                cursor: 'pointer',
                position: 'relative',
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  color: '#3A4430',
                  marginBottom: 3,
                  fontWeight: 600,
                }}
              >
                {i + 1}
              </div>
              <div
                style={{
                  background: '#000',
                  border: `1.5px solid ${activeId === slide.id ? '#A8702E' : '#2A331F'}`,
                  borderRadius: 5,
                  aspectRatio: '16/9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 6,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    fontFamily: 'Lora, Georgia, serif',
                    fontSize: 5,
                    color: '#fff',
                    textAlign: 'center',
                    lineHeight: 1.5,
                    overflow: 'hidden',
                    maxHeight: '100%',
                  }}
                >
                  {slide.text.slice(0, 60)}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  deleteSlide(slide.id)
                }}
                style={{
                  position: 'absolute',
                  top: 14,
                  right: -2,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: '#1B2318',
                  border: '1px solid #2A331F',
                  color: '#8F9885',
                  fontSize: 10,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#2A331F'
                  e.currentTarget.style.color = '#EDEAE0'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#1B2318'
                  e.currentTarget.style.color = '#8F9885'
                }}
              >
                ×
              </button>
            </div>
          ))}

          {/* Add Slide */}
          <button
            onClick={addSlide}
            style={{
              background: 'transparent',
              border: '1.5px dashed #2A331F',
              borderRadius: 5,
              padding: '8px 0',
              fontSize: 10,
              color: '#8F9885',
              cursor: 'pointer',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              marginBottom: 10,
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
            + Start from Scratch
          </button>
        </div>

        {/* Canvas */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 32,
            background: '#10160F',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 720,
              aspectRatio: '16/9',
              background: '#000',
              borderRadius: 8,
              border: '1px solid #2A331F',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 40,
              position: 'relative',
            }}
          >
            {editing ? (
              <textarea
                autoFocus
                value={activeSlide.text}
                onChange={(e) => updateText(e.target.value)}
                onBlur={() => setEditing(false)}
                style={{
                  width: '100%',
                  height: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontFamily: 'Lora, Georgia, serif',
                  fontSize,
                  fontWeight: bold ? 700 : 400,
                  color: '#fff',
                  textAlign: align,
                  lineHeight: 1.55,
                  resize: 'none',
                  caretColor: '#A8702E',
                }}
              />
            ) : (
              <div
                onClick={() => setEditing(true)}
                style={{
                  width: '100%',
                  fontFamily: 'Lora, Georgia, serif',
                  fontSize,
                  fontWeight: bold ? 700 : 400,
                  color: '#fff',
                  textAlign: align,
                  lineHeight: 1.55,
                  whiteSpace: 'pre-wrap',
                  cursor: 'text',
                }}
              >
                {activeSlide.text}
              </div>
            )}
            <div
              style={{
                position: 'absolute',
                bottom: 10,
                right: 14,
                fontSize: 10,
                color: 'rgba(255,255,255,0.18)',
                fontFamily: 'Inter, Segoe UI, sans-serif',
              }}
            >
              Click to edit
            </div>
          </div>
          <div style={{ marginTop: 12, fontSize: 11, color: '#3A4430' }}>
            Slide {slides.findIndex((s) => s.id === activeId) + 1} of {slides.length}
          </div>
        </div>
      </div>
    </div>
  )
}

function ImportBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'transparent',
        border: '1px solid #2A331F',
        borderRadius: 6,
        padding: '4px 9px',
        fontSize: 10,
        color: '#8F9885',
        cursor: 'pointer',
        fontFamily: 'inherit',
        whiteSpace: 'nowrap',
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
      {label}
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

function ToolBtn({
  children,
  active,
  onClick,
  title,
}: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
  title?: string
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: active ? 'rgba(168,112,46,0.12)' : 'transparent',
        border: 'none',
        borderRadius: 5,
        padding: '4px 8px',
        color: active ? '#A8702E' : '#8F9885',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 28,
        height: 28,
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.color = '#EDEAE0'
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.color = '#8F9885'
      }}
    >
      {children}
    </button>
  )
}
