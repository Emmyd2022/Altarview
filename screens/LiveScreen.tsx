import { useState } from 'react'
import { OutputStage, type DisplayContent } from './OutputStage'
import { availableTranslationsFor } from '../verseData'
import type { ThemeDef } from '../themeModel'
import type { Song } from '../songModel'
import { buildSlides } from '../songModel'

// ALT-025: translation switcher lives only on Live (not Preview, per the
// spec) -- changing it re-renders the currently-live verse in the new
// translation immediately, without needing to re-search or re-send.
//
// ALT: song navigation -- when a song is showing, the operator can jump
// to any verse/chorus or step to the next one directly from Live, not
// just from the Operator screen.
export default function LiveScreen({
  content,
  onExit,
  onChangeTranslation,
  theme,
  songs,
  onNavigateSong,
}: {
  content: DisplayContent | null
  onExit?: () => void
  onChangeTranslation?: (translation: string, text: string) => void
  theme?: ThemeDef | null
  songs?: Song[]
  onNavigateSong?: (content: DisplayContent) => void
}) {
  const [open, setOpen] = useState(false)
  const [sectionMenuOpen, setSectionMenuOpen] = useState(false)
  const isVerse = content?.type === 'verse'
  const variants = isVerse ? availableTranslationsFor(content.ref) : []

  const isSong = content?.type === 'song'
  const linkedSong: Song | undefined = isSong && content.songId ? songs?.find((s) => s.id === content.songId) : undefined
  const slides = linkedSong ? buildSlides(linkedSong) : []
  const currentSlideIndex = isSong ? content.slideIndex ?? 0 : 0
  const currentSlide = slides[currentSlideIndex]

  function goToSlide(idx: number) {
    if (!linkedSong || !onNavigateSong) return
    const s = slides[idx]
    if (!s) return
    onNavigateSong({ type: 'song', title: linkedSong.title, artist: linkedSong.artist, lines: s.lines, songId: linkedSong.id, slideIndex: idx })
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <OutputStage content={content} badgeLabel="LIVE" badgeColor="#6FC98A" onExit={onExit} theme={theme} />

      {isVerse && variants.length > 0 && onChangeTranslation && (
        <div style={{ position: 'absolute', bottom: 28, left: 36, zIndex: 5 }}>
          <button
            onClick={() => setOpen((v) => !v)}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 6,
              padding: '6px 12px',
              fontSize: 11,
              color: 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
              fontFamily: 'Inter, Segoe UI, sans-serif',
            }}
          >
            Translation: {content.translation || variants[0].translation} ▾
          </button>
          {open && (
            <div
              style={{
                position: 'absolute',
                bottom: '110%',
                left: 0,
                background: '#1B2318',
                border: '1px solid #2A331F',
                borderRadius: 8,
                overflow: 'hidden',
                minWidth: 90,
              }}
            >
              {variants.map((v) => (
                <button
                  key={v.translation}
                  onClick={() => {
                    onChangeTranslation(v.translation, v.text)
                    setOpen(false)
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    background: v.translation === content.translation ? 'rgba(168,112,46,0.15)' : 'transparent',
                    border: 'none',
                    padding: '7px 12px',
                    fontSize: 12,
                    color: v.translation === content.translation ? '#A8702E' : '#EDEAE0',
                    cursor: 'pointer',
                    fontFamily: 'Inter, Segoe UI, sans-serif',
                  }}
                >
                  {v.translation}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ALT: song navigation controls, bottom-left, same unobtrusive
          style as the translation switcher above. */}
      {isSong && linkedSong && onNavigateSong && (
        <div style={{ position: 'absolute', bottom: 28, left: 36, zIndex: 5, display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => goToSlide(currentSlideIndex - 1)}
            disabled={currentSlideIndex === 0}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 6,
              padding: '6px 10px',
              fontSize: 11,
              color: currentSlideIndex === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.7)',
              cursor: currentSlideIndex === 0 ? 'not-allowed' : 'pointer',
              fontFamily: 'Inter, Segoe UI, sans-serif',
            }}
          >
            ← Prev
          </button>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setSectionMenuOpen((v) => !v)}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 6,
                padding: '6px 12px',
                fontSize: 11,
                color: 'rgba(255,255,255,0.7)',
                cursor: 'pointer',
                fontFamily: 'Inter, Segoe UI, sans-serif',
              }}
            >
              {currentSlide?.sectionLabel ?? 'Jump'} ▾
            </button>
            {sectionMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '110%',
                  left: 0,
                  background: '#1B2318',
                  border: '1px solid #2A331F',
                  borderRadius: 8,
                  overflow: 'hidden',
                  minWidth: 130,
                }}
              >
                {linkedSong.sections.map((sec, idx) => {
                  const firstSlideIdx = slides.findIndex((s) => s.sectionIndex === idx)
                  const active = currentSlide?.sectionIndex === idx
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        goToSlide(firstSlideIdx === -1 ? 0 : firstSlideIdx)
                        setSectionMenuOpen(false)
                      }}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        background: active ? 'rgba(168,112,46,0.15)' : 'transparent',
                        border: 'none',
                        padding: '7px 12px',
                        fontSize: 12,
                        color: active ? '#A8702E' : '#EDEAE0',
                        cursor: 'pointer',
                        fontFamily: 'Inter, Segoe UI, sans-serif',
                      }}
                    >
                      {sec.label}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
          <button
            onClick={() => goToSlide(currentSlideIndex + 1)}
            disabled={currentSlideIndex >= slides.length - 1}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 6,
              padding: '6px 10px',
              fontSize: 11,
              color: currentSlideIndex >= slides.length - 1 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.7)',
              cursor: currentSlideIndex >= slides.length - 1 ? 'not-allowed' : 'pointer',
              fontFamily: 'Inter, Segoe UI, sans-serif',
            }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
