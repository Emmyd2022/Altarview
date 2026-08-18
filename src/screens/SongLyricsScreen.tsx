import { useState } from 'react'

interface Song {
  id: string
  title: string
  artist: string
  source: 'Imported' | 'Online'
  isHymn: boolean
  linesPerSlide: number
}

const SONGS: Song[] = [
  { id: '1', title: 'Amazing Grace', artist: 'John Newton', source: 'Imported', isHymn: true, linesPerSlide: 2 },
  { id: '2', title: 'Great Is Thy Faithfulness', artist: 'Thomas O. Chisholm', source: 'Imported', isHymn: true, linesPerSlide: 2 },
  { id: '3', title: 'Way Maker', artist: 'Sinach', source: 'Online', isHymn: false, linesPerSlide: 2 },
  { id: '4', title: 'Holy, Holy, Holy', artist: 'Reginald Heber', source: 'Imported', isHymn: true, linesPerSlide: 2 },
  { id: '5', title: 'Oceans (Where Feet May Fail)', artist: 'Hillsong UNITED', source: 'Online', isHymn: false, linesPerSlide: 2 },
  { id: '6', title: 'This Is Amazing Grace', artist: 'Phil Wickham', source: 'Online', isHymn: false, linesPerSlide: 2 },
]

// ALT-011: sample duplicate-detection result -- in the real app this
// would be computed by comparing titles/lyrics across the library.
// ALT-027: merge candidates now carry full lyrics, split into lines, so
// the review panel can compare actual content -- not just title/artist --
// since duplicates are often the same song by a different artist, or an
// incomplete version against a complete one.
interface MergeCandidate {
  id: string
  a: { title: string; artist: string; lyrics: string[] }
  b: { title: string; artist: string; lyrics: string[] }
}

const MERGE_CANDIDATES: MergeCandidate[] = [
  {
    id: 'm1',
    a: {
      title: 'Amazing Grace',
      artist: 'John Newton',
      lyrics: [
        'Amazing grace, how sweet the sound',
        'That saved a wretch like me',
        'I once was lost, but now am found',
        'Was blind but now I see',
      ],
    },
    b: {
      title: 'Amazing Grace (My Chains Are Gone)',
      artist: 'Chris Tomlin',
      lyrics: [
        'Amazing grace, how sweet the sound',
        'That saved a wretch like me',
        'I once was lost, but now am found',
        'Was blind but now I see',
        "'Twas grace that taught my heart to fear",
        'And grace my fears relieved',
        'My chains are gone, I\'ve been set free',
      ],
    },
  },
]

// ALT-009: quick text entry parsing -- splits on [Section] markers.
function parseQuickEntry(text: string): { section: string; lines: string[] }[] {
  const parts = text.split(/\[([^\]]+)\]/).filter((s) => s.trim() !== '')
  const result: { section: string; lines: string[] }[] = []
  for (let i = 0; i < parts.length; i += 2) {
    const section = parts[i]?.trim()
    const body = parts[i + 1]?.trim()
    if (section && body) {
      result.push({ section, lines: body.split('\n').map((l) => l.trim()).filter(Boolean) })
    }
  }
  return result
}

type LibraryTab = 'All Songs' | 'Hymns'

// ALT-027: side-by-side lyrics comparison for the merge review, with a
// simple line-level diff (lines only in A, only in B, or shared) so the
// operator can judge completeness/accuracy before merging -- e.g. an
// incomplete version vs. a complete one, or the same song by a different
// artist with slightly different wording.
function MergeCandidateRow({
  candidate,
  onMerge,
  onIgnore,
}: {
  candidate: MergeCandidate
  onMerge: () => void
  onIgnore: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const { a, b } = candidate
  const setA = new Set(a.lyrics)
  const setB = new Set(b.lyrics)

  return (
    <div style={{ background: '#10160F', border: '1px solid #2A331F', borderRadius: 6, marginBottom: 8, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px' }}>
        <div style={{ flex: 1, fontSize: 12, color: '#EDEAE0' }}>
          {a.title} <span style={{ color: '#8F9885' }}>({a.artist})</span>
          <span style={{ color: '#3A4430', marginLeft: 6 }}>· {a.lyrics.length} lines</span>
        </div>
        <span style={{ color: '#3A4430' }}>↔</span>
        <div style={{ flex: 1, fontSize: 12, color: '#EDEAE0' }}>
          {b.title} <span style={{ color: '#8F9885' }}>({b.artist})</span>
          <span style={{ color: '#3A4430', marginLeft: 6 }}>· {b.lyrics.length} lines</span>
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          style={{ background: 'transparent', border: '1px solid #2A331F', borderRadius: 5, padding: '4px 10px', fontSize: 11, color: '#8F9885', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          {expanded ? 'Hide lyrics' : 'Compare lyrics'}
        </button>
        <button
          onClick={onMerge}
          style={{ background: '#A8702E', border: 'none', borderRadius: 5, padding: '4px 10px', fontSize: 11, fontWeight: 600, color: '#10160F', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Merge
        </button>
        <button
          onClick={onIgnore}
          style={{ background: 'transparent', border: '1px solid #2A331F', borderRadius: 5, padding: '4px 10px', fontSize: 11, color: '#8F9885', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Ignore
        </button>
      </div>

      {expanded && (
        <div style={{ display: 'flex', gap: 1, borderTop: '1px solid #2A331F' }}>
          <div style={{ flex: 1, padding: '10px 12px', background: '#0d0f0a' }}>
            <div style={{ fontSize: 10, color: '#8F9885', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{a.title}</div>
            {a.lyrics.map((line, i) => (
              <div
                key={i}
                style={{
                  fontSize: 12,
                  lineHeight: 1.7,
                  color: setB.has(line) ? '#EDEAE0' : '#6FC98A',
                  background: setB.has(line) ? 'transparent' : 'rgba(111,201,138,0.08)',
                  padding: '1px 4px',
                  borderRadius: 3,
                }}
              >
                {line}
              </div>
            ))}
          </div>
          <div style={{ flex: 1, padding: '10px 12px', background: '#0d0f0a', borderLeft: '1px solid #2A331F' }}>
            <div style={{ fontSize: 10, color: '#8F9885', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{b.title}</div>
            {b.lyrics.map((line, i) => (
              <div
                key={i}
                style={{
                  fontSize: 12,
                  lineHeight: 1.7,
                  color: setA.has(line) ? '#EDEAE0' : '#A8702E',
                  background: setA.has(line) ? 'transparent' : 'rgba(168,112,46,0.08)',
                  padding: '1px 4px',
                  borderRadius: 3,
                }}
              >
                {line}
              </div>
            ))}
          </div>
        </div>
      )}
      {expanded && (
        <div style={{ padding: '6px 12px 10px', fontSize: 10, color: '#3A4430', borderTop: '1px solid #2A331F' }}>
          <span style={{ color: '#6FC98A' }}>■</span> only in {a.title} &nbsp;&nbsp;
          <span style={{ color: '#A8702E' }}>■</span> only in {b.title}
        </div>
      )}
    </div>
  )
}

export default function SongLyricsScreen() {
  const [query, setQuery] = useState('')
  const [bulkSelect, setBulkSelect] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [songs, setSongs] = useState(SONGS)
  const [tab, setTab] = useState<LibraryTab>('All Songs')
  const [showQuickEntry, setShowQuickEntry] = useState(false)
  const [quickEntryText, setQuickEntryText] = useState('')
  const [quickEntryTitle, setQuickEntryTitle] = useState('')
  const [showMerge, setShowMerge] = useState(false)
  const [mergeCandidates, setMergeCandidates] = useState(MERGE_CANDIDATES)

  const byTab = tab === 'Hymns' ? songs.filter((s) => s.isHymn) : songs
  const filtered = query.trim()
    ? byTab.filter(
        (s) =>
          s.title.toLowerCase().includes(query.toLowerCase()) ||
          s.artist.toLowerCase().includes(query.toLowerCase()),
      )
    : byTab

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function updateLinesPerSlide(id: string, lines: number) {
    setSongs((prev) => prev.map((s) => (s.id === id ? { ...s, linesPerSlide: Math.max(1, lines) } : s)))
  }

  function saveQuickEntry() {
    if (!quickEntryTitle.trim()) return
    setSongs((prev) => [
      ...prev,
      {
        id: `qe-${Date.now()}`,
        title: quickEntryTitle.trim(),
        artist: 'Quick entry',
        source: 'Imported',
        isHymn: false,
        linesPerSlide: 2,
      },
    ])
    setQuickEntryTitle('')
    setQuickEntryText('')
    setShowQuickEntry(false)
  }

  const parsedPreview = parseQuickEntry(quickEntryText)

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
          gap: 10,
          flexShrink: 0,
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 13, color: '#EDEAE0', letterSpacing: '0.02em' }}>
          Song Lyrics
        </span>
        <StatusPill />
        <div style={{ flex: 1 }} />
        {bulkSelect && selected.size > 0 && (
          <span style={{ fontSize: 11, color: '#8F9885' }}>{selected.size} selected</span>
        )}
        <button
          onClick={() => {
            setBulkSelect(!bulkSelect)
            setSelected(new Set())
          }}
          title="Select multiple songs for bulk actions (rename, delete, add to playlist)"
          style={{
            background: 'transparent',
            border: '1px solid #2A331F',
            borderRadius: 6,
            padding: '4px 10px',
            fontSize: 11,
            color: bulkSelect ? '#A8702E' : '#8F9885',
            cursor: 'pointer',
            fontFamily: 'inherit',
            borderColor: bulkSelect ? 'rgba(168,112,46,0.4)' : '#2A331F',
          }}
        >
          {bulkSelect ? 'Cancel' : 'Select Multiple'}
        </button>
        <button
          onClick={() => setShowMerge(!showMerge)}
          style={{
            background: 'transparent',
            border: mergeCandidates.length ? '1px solid rgba(168,112,46,0.4)' : '1px solid #2A331F',
            borderRadius: 6,
            padding: '4px 10px',
            fontSize: 11,
            color: mergeCandidates.length ? '#A8702E' : '#8F9885',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Merge Duplicates{mergeCandidates.length ? ` (${mergeCandidates.length})` : ''}
        </button>
        <button
          onClick={() => setShowQuickEntry(!showQuickEntry)}
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
          Quick Text Entry
        </button>
        <button
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
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M8 8L11 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          Search online lyrics
        </button>
        <button
          style={{
            background: '#A8702E',
            border: 'none',
            borderRadius: 6,
            padding: '5px 13px',
            fontSize: 11,
            fontWeight: 600,
            color: '#10160F',
            cursor: 'pointer',
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#C08A44')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#A8702E')}
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Import Song
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        {/* ALT-012: Hymns grouped separately but one tab away */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {(['All Songs', 'Hymns'] as LibraryTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                background: tab === t ? 'rgba(168,112,46,0.14)' : 'transparent',
                border: tab === t ? '1px solid rgba(168,112,46,0.4)' : '1px solid #2A331F',
                borderRadius: 6,
                padding: '5px 12px',
                fontSize: 11,
                fontWeight: tab === t ? 600 : 400,
                color: tab === t ? '#A8702E' : '#8F9885',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ALT-011: Merge Duplicates review panel */}
        {showMerge && (
          <div
            style={{
              background: '#1B2318',
              border: '1px solid rgba(168,112,46,0.3)',
              borderRadius: 8,
              padding: 14,
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 600, color: '#EDEAE0', marginBottom: 10 }}>
              Possible duplicate songs
            </div>
            {mergeCandidates.length === 0 ? (
              <div style={{ fontSize: 12, color: '#8F9885' }}>No duplicates left to review.</div>
            ) : (
              mergeCandidates.map((c) => (
                <MergeCandidateRow
                  key={c.id}
                  candidate={c}
                  onMerge={() => setMergeCandidates((prev) => prev.filter((x) => x.id !== c.id))}
                  onIgnore={() => setMergeCandidates((prev) => prev.filter((x) => x.id !== c.id))}
                />
              ))
            )}
          </div>
        )}

        {/* ALT-009: Quick text entry */}
        {showQuickEntry && (
          <div
            style={{
              background: '#1B2318',
              border: '1px solid rgba(168,112,46,0.3)',
              borderRadius: 8,
              padding: 14,
              marginBottom: 16,
              display: 'flex',
              gap: 14,
            }}
          >
            <div style={{ flex: 1 }}>
              <input
                value={quickEntryTitle}
                onChange={(e) => setQuickEntryTitle(e.target.value)}
                placeholder="Song title"
                style={{
                  width: '100%',
                  background: '#10160F',
                  border: '1px solid #2A331F',
                  borderRadius: 6,
                  padding: '6px 10px',
                  fontSize: 12,
                  color: '#EDEAE0',
                  outline: 'none',
                  fontFamily: 'inherit',
                  marginBottom: 8,
                }}
              />
              <textarea
                value={quickEntryText}
                onChange={(e) => setQuickEntryText(e.target.value)}
                placeholder={'[Verse 1]\nAmazing grace how sweet the sound\n\n[Chorus]\nPraise God from whom all blessings flow'}
                rows={8}
                style={{
                  width: '100%',
                  background: '#10160F',
                  border: '1px solid #2A331F',
                  borderRadius: 6,
                  padding: 10,
                  fontSize: 12,
                  color: '#EDEAE0',
                  outline: 'none',
                  fontFamily: 'monospace',
                  resize: 'vertical',
                }}
              />
              <button
                onClick={saveQuickEntry}
                style={{
                  marginTop: 8,
                  background: '#A8702E',
                  border: 'none',
                  borderRadius: 6,
                  padding: '6px 14px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#10160F',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Save Song
              </button>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: '#8F9885', textTransform: 'uppercase', marginBottom: 8 }}>
                Parsed preview
              </div>
              {parsedPreview.length === 0 ? (
                <div style={{ fontSize: 11, color: '#3A4430' }}>
                  Mark sections with [Verse 1], [Chorus], etc.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {parsedPreview.map((sec, i) => (
                    <div key={i} style={{ background: '#10160F', border: '1px solid #2A331F', borderRadius: 6, padding: '8px 10px' }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#A8702E', marginBottom: 4 }}>{sec.section}</div>
                      {sec.lines.map((line, j) => (
                        <div key={j} style={{ fontSize: 11, color: '#EDEAE0', lineHeight: 1.6 }}>{line}</div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Search bar */}
        <div style={{ position: 'relative', marginBottom: 16 }}>
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
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.3" />
              <path d="M9 9L13 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter song library…"
            style={{
              width: '100%',
              background: '#1B2318',
              border: '1px solid #2A331F',
              borderRadius: 8,
              padding: '7px 12px 7px 30px',
              fontSize: 13,
              color: '#EDEAE0',
              outline: 'none',
              fontFamily: 'inherit',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(168,112,46,0.4)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#2A331F')}
          />
        </div>

        {/* Song list */}
        <div
          style={{
            background: '#1B2318',
            border: '1px solid #2A331F',
            borderRadius: 8,
            overflow: 'hidden',
            marginBottom: 16,
          }}
        >
          {filtered.map((song, i) => (
            <div
              key={song.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '11px 14px',
                borderBottom: i < filtered.length - 1 ? '1px solid #2A331F' : 'none',
                gap: 10,
                background: selected.has(song.id) ? 'rgba(168,112,46,0.06)' : 'transparent',
                cursor: bulkSelect ? 'pointer' : 'default',
              }}
              onClick={() => bulkSelect && toggleSelect(song.id)}
            >
              {bulkSelect && (
                <div
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 4,
                    border: selected.has(song.id) ? '1.5px solid #A8702E' : '1.5px solid #2A331F',
                    background: selected.has(song.id) ? '#A8702E' : 'transparent',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {selected.has(song.id) && (
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                      <path d="M1.5 4.5l2.5 2.5 4-4" stroke="#10160F" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              )}
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 6,
                  background: '#10160F',
                  border: '1px solid #2A331F',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M5 10.5V4l7-2v7" stroke="#8F9885" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="3.5" cy="10.5" r="1.5" stroke="#8F9885" strokeWidth="1.2" />
                  <circle cx="10.5" cy="9" r="1.5" stroke="#8F9885" strokeWidth="1.2" />
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#EDEAE0', marginBottom: 2 }}>
                  {song.title}
                  {song.isHymn && (
                    <span style={{ marginLeft: 6, fontSize: 9, color: '#8F9885', border: '1px solid #2A331F', borderRadius: 4, padding: '1px 5px' }}>
                      HYMN
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: '#8F9885' }}>{song.artist}</div>
              </div>
              {/* ALT-010: lines-per-slide control */}
              {!bulkSelect && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }} title="Lines per slide">
                  <input
                    type="number"
                    min={1}
                    value={song.linesPerSlide}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => updateLinesPerSlide(song.id, Number(e.target.value))}
                    style={{
                      width: 32,
                      background: '#10160F',
                      border: '1px solid #2A331F',
                      borderRadius: 5,
                      padding: '3px 4px',
                      fontSize: 10,
                      color: '#EDEAE0',
                      textAlign: 'center',
                      fontFamily: 'inherit',
                    }}
                  />
                  <span style={{ fontSize: 9, color: '#8F9885' }}>lines/slide</span>
                </div>
              )}
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  padding: '2px 8px',
                  borderRadius: 20,
                  background: song.source === 'Online' ? 'rgba(168,112,46,0.1)' : '#10160F',
                  border: song.source === 'Online' ? '1px solid rgba(168,112,46,0.25)' : '1px solid #2A331F',
                  color: song.source === 'Online' ? '#A8702E' : '#8F9885',
                  flexShrink: 0,
                }}
              >
                {song.source}
              </span>
              {!bulkSelect && (
                <button
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#8F9885',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: 5,
                    display: 'flex',
                    fontSize: 16,
                    lineHeight: 1,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#EDEAE0')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#8F9885')}
                  title="More options"
                >
                  ···
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Drop zone */}
        <div
          style={{
            border: '1.5px dashed #2A331F',
            borderRadius: 8,
            padding: '28px 20px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(168,112,46,0.35)')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#2A331F')}
        >
          <div style={{ color: '#3A4430' }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M14 4v14M8 12l6-8 6 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4 20v2a2 2 0 002 2h16a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </div>
          <div style={{ fontSize: 13, color: '#8F9885', lineHeight: 1.6 }}>
            Drag a file here or click to import
          </div>
          <div style={{ fontSize: 11, color: '#3A4430' }}>
            Supports PDF and other document formats
          </div>
        </div>
      </div>
    </div>
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
