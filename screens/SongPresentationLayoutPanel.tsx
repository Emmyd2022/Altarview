// ALT-STAGE5-2-1: the new Song Presentation Layout panel. Self-contained
// so it can be mounted into the existing opened-song view with minimal
// risk to that large, already-tested file (Section 33's "do not
// redesign the entire Song screen" -- this is an additional contextual
// panel, not a replacement). Built directly on the real Stage 5.2
// engine (generateSongPresentationPages, useSongPageNavigation,
// useManualPageBreaks, useSongAutoSend, resolveSongLyricPositionPin) --
// not the old buildSlides() compatibility path -- since destination-
// specific capacities and manual breaks genuinely require the new,
// richer page model.

import { useMemo, useState } from 'react'
import type { Song, SongArrangement } from '../songModel'
import type { DisplayContent } from './OutputStage'
import type { PinnedItem } from '../pinModel'
import { generateSongPresentationPages } from '../song/presentation/pagination'
import { useSongPageNavigation } from '../song/presentation/useSongPageNavigation'
import { useManualPageBreaks } from '../song/presentation/useManualPageBreaks'
import type { SongAutoSend } from '../song/presentation/useSongAutoSend'
import type { SongPresentationPage } from '../song/presentation/types'

function pageToContent(song: Song, page: SongPresentationPage): DisplayContent {
  return { type: 'song', title: song.title, artist: song.artist, lines: page.lines, songId: song.id, slideIndex: page.pageIndexWithinSection }
}

function countOccurrences(pages: SongPresentationPage[], sectionId: string): number {
  return new Set(pages.filter((p) => p.sectionId === sectionId).map((p) => p.sectionOccurrence)).size
}
function countPagesInOccurrence(pages: SongPresentationPage[], sectionId: string, occurrence: number): number {
  return pages.filter((p) => p.sectionId === sectionId && p.sectionOccurrence === occurrence).length
}

const navBtnStyle: React.CSSProperties = { background: 'transparent', border: '1px solid #2A331F', borderRadius: 6, padding: '5px 12px', fontSize: 11, color: '#8F9885', cursor: 'pointer', fontFamily: 'inherit' }
const pinBtnStyle: React.CSSProperties = { background: 'transparent', border: '1px solid #2A331F', borderRadius: 5, padding: '4px 10px', fontSize: 10, color: '#8F9885', cursor: 'pointer', fontFamily: 'inherit' }

export function SongPresentationLayoutPanel({
  song,
  onSendPreview,
  onSendLive,
  onPin,
  autoSend,
}: {
  song: Song
  onSendPreview?: (content: DisplayContent) => void
  onSendLive?: (content: DisplayContent) => void
  onPin?: (item: Omit<PinnedItem, 'id'>) => void
  // ALT-STAGE5-2-1: shares the SAME Auto-Send state as the existing
  // Stage 5.2 toolbar toggle -- one control, not a duplicate second one.
  autoSend: SongAutoSend
}) {
  const arrangement = (song.arrangements.find((a) => a.id === song.defaultArrangementId) ?? song.arrangements[0]) as SongArrangement | undefined

  // ALT-STAGE5-2-1-PART10-15: Audience and Foldback each get their own
  // capacity state -- genuinely independent, matching Section 39's
  // required regression: changing one never touches the other.
  const [audienceCapacity, setAudienceCapacity] = useState(2)
  const [foldbackCapacity, setFoldbackCapacity] = useState(4)

  const manualBreaks = useManualPageBreaks()

  const audiencePages = useMemo(
    () => (arrangement ? generateSongPresentationPages(song, arrangement, { id: 'audience', maxLinesPerPage: audienceCapacity }, { manualBreaks: manualBreaks.breaks }) : []),
    [song, arrangement, audienceCapacity, manualBreaks.breaks],
  )
  const foldbackPages = useMemo(
    () => (arrangement ? generateSongPresentationPages(song, arrangement, { id: 'foldback', maxLinesPerPage: foldbackCapacity }, { manualBreaks: manualBreaks.breaks }) : []),
    [song, arrangement, foldbackCapacity, manualBreaks.breaks],
  )

  const audienceNav = useSongPageNavigation(audiencePages)
  const foldbackNav = useSongPageNavigation(foldbackPages)

  if (!arrangement) return null

  // ALT-STAGE5-2-1-PART30: compact current-position context.
  const currentPage = audienceNav.currentPage
  const occCount = currentPage ? countOccurrences(audiencePages, currentPage.sectionId) : 0
  const positionLabel = currentPage
    ? `${currentPage.sectionLabel}${occCount > 1 ? ` \u00b7 Occurrence ${currentPage.sectionOccurrence} of ${occCount}` : ''} \u00b7 Page ${currentPage.pageIndexWithinSection + 1} of ${countPagesInOccurrence(audiencePages, currentPage.sectionId, currentPage.sectionOccurrence)}`
    : 'No pages generated'

  function sendAudiencePage(page: SongPresentationPage | null) {
    if (!page) return
    const content = pageToContent(song, page)
    onSendPreview?.(content)
    const outcome = autoSend.afterNavigate(page, (p) => onSendLive?.(pageToContent(song, p)))
    if (outcome.error) {
      // eslint-disable-next-line no-console
      console.warn('[Altarview] Auto-Send:', outcome.error)
    }
  }

  const uniqueSectionLabels = Array.from(new Map(arrangement.sectionIds.map((id) => [id, song.sections.find((s) => s.id === id)?.label ?? id])).entries())

  return (
    <div style={{ background: '#1B2318', border: '1px solid #2A331F', borderRadius: 8, padding: 14, marginBottom: 16 }}>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: '#8F9885', textTransform: 'uppercase', marginBottom: 10 }}>Presentation Layout</div>

      {/* Objective B: destination-specific capacity */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#8F9885' }}>
          Audience lines:
          <input
            type="number"
            min={1}
            value={audienceCapacity}
            onChange={(e) => setAudienceCapacity(Math.max(1, Number(e.target.value) || 1))}
            style={{ width: 40, background: '#10160F', border: '1px solid #2A331F', borderRadius: 5, padding: '3px 5px', fontSize: 11, color: '#EDEAE0', textAlign: 'center', fontFamily: 'inherit' }}
          />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#8F9885' }}>
          Foldback lines:
          <input
            type="number"
            min={1}
            value={foldbackCapacity}
            onChange={(e) => setFoldbackCapacity(Math.max(1, Number(e.target.value) || 1))}
            style={{ width: 40, background: '#10160F', border: '1px solid #2A331F', borderRadius: 5, padding: '3px 5px', fontSize: 11, color: '#EDEAE0', textAlign: 'center', fontFamily: 'inherit' }}
          />
        </label>
      </div>

      {/* Objective D: repeated-section-aware jump */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
        {uniqueSectionLabels.map(([sectionId, label]) => (
          <button
            key={sectionId}
            onClick={() => {
              audienceNav.jumpToSection(sectionId)
              foldbackNav.jumpToSection(sectionId)
            }}
            style={{ background: '#10160F', border: '1px solid #2A331F', borderRadius: 5, padding: '4px 10px', fontSize: 11, color: '#8F9885', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Section 30: current position context */}
      <div style={{ fontSize: 11, color: '#EDEAE0', marginBottom: 10 }}>{positionLabel}</div>

      {/* Navigation + send */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button
          onClick={() => {
            audienceNav.previous()
          }}
          disabled={!audienceNav.hasPrevious}
          style={navBtnStyle}
        >
          {'\u2190'} Previous
        </button>
        <button
          onClick={() => {
            audienceNav.next()
          }}
          disabled={!audienceNav.hasNext}
          style={navBtnStyle}
        >
          Next {'\u2192'}
        </button>
        <button onClick={() => sendAudiencePage(audienceNav.currentPage)} style={{ ...navBtnStyle, background: '#A8702E', color: '#10160F', fontWeight: 600, borderColor: 'transparent' }}>
          Send
        </button>
      </div>

      {/* Objective A: manual page break editor -- simple, contextual */}
      {currentPage && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: '#3A4430', marginBottom: 6 }}>{currentPage.sectionLabel} \u2014 click between lines to add/remove a page break</div>
          {song.sections
            .find((s) => s.id === currentPage.sectionId)
            ?.lines.map((line, i, allLines) => (
              <div key={i}>
                <div style={{ fontSize: 12, color: '#EDEAE0', padding: '2px 0' }}>{line}</div>
                {i < allLines.length - 1 && (
                  <button
                    onClick={() => manualBreaks.toggleBreak(currentPage.sectionId, i, currentPage.sectionOccurrence)}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'center',
                      background: 'transparent',
                      border: 'none',
                      borderTop: manualBreaks.hasBreakAfter(currentPage.sectionId, i, currentPage.sectionOccurrence) ? '1px dashed #A8702E' : '1px dashed transparent',
                      padding: '3px 0',
                      fontSize: 9,
                      color: manualBreaks.hasBreakAfter(currentPage.sectionId, i, currentPage.sectionOccurrence) ? '#A8702E' : '#3A4430',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    {manualBreaks.hasBreakAfter(currentPage.sectionId, i, currentPage.sectionOccurrence) ? 'Page Break (click to remove)' : '+ Page Break'}
                  </button>
                )}
              </div>
            ))}
        </div>
      )}

      {/* Objective C: granular pinning */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button
          onClick={() => onPin?.({ label: song.title, createdAt: Date.now(), target: { type: 'song', songId: song.id, songTitle: song.title, songArtist: song.artist, songLines: [] } })}
          style={pinBtnStyle}
        >
          Pin Song
        </button>
        {currentPage && (
          <button
            onClick={() =>
              onPin?.({
                label: `${song.title} \u2014 ${currentPage.sectionLabel}`,
                createdAt: Date.now(),
                target: { type: 'song', songId: song.id, songTitle: song.title, songArtist: song.artist, songLines: [], lyricPosition: { sectionId: currentPage.sectionId, sectionOccurrence: currentPage.sectionOccurrence } },
              })
            }
            style={pinBtnStyle}
          >
            Pin Section
          </button>
        )}
        {currentPage && (
          <button
            onClick={() =>
              onPin?.({
                label: `${song.title} \u2014 ${currentPage.sectionLabel} p.${currentPage.pageIndexWithinSection + 1}`,
                createdAt: Date.now(),
                target: {
                  type: 'song',
                  songId: song.id,
                  songTitle: song.title,
                  songArtist: song.artist,
                  songLines: currentPage.lines,
                  lyricPosition: { sectionId: currentPage.sectionId, sectionOccurrence: currentPage.sectionOccurrence, lineIndexInSection: currentPage.startLineIndex },
                },
              })
            }
            style={pinBtnStyle}
          >
            Pin Current Slide
          </button>
        )}
      </div>
    </div>
  )
}
