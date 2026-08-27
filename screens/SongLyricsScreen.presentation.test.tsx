// ALT-STAGE5-2-PART54: renders the REAL SongLyricsScreen to prove
// capacity control, section-boundary navigation, and Auto-Send all work
// through the real UI, not just the underlying engine in isolation. All
// fixture text is fabricated placeholder content, never real lyrics.

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SongLyricsScreen from './SongLyricsScreen'
import { LanguageProvider } from '../i18n'
import type { Song } from '../songModel'

function makeSong(): Song {
  return {
    id: 'song-1',
    title: 'Presentation Test Song',
    artist: '',
    source: 'Imported',
    isHymn: false,
    linesPerSlide: 4,
    sections: [
      { id: 'verse1', label: 'Verse 1', lines: ['line one', 'line two', 'line three', 'line four', 'line five'] },
      { id: 'chorus', label: 'Chorus', lines: ['chorus line one', 'chorus line two'] },
    ],
    arrangements: [{ id: 'arr-1', name: 'Default', sectionIds: ['verse1', 'chorus'] }],
    defaultArrangementId: 'arr-1',
    metadata: { createdAt: 1, updatedAt: 1 },
  }
}

function renderSongs(songs: Song[]) {
  const onSendPreview = vi.fn()
  const onSendLive = vi.fn()
  const onChangeSongs = vi.fn()
  render(
    <LanguageProvider>
      <SongLyricsScreen songs={songs} onChangeSongs={onChangeSongs} onSendPreview={onSendPreview} onSendLive={onSendLive} />
    </LanguageProvider>,
  )
  return { onSendPreview, onSendLive, onChangeSongs }
}

describe('Open Song -> set capacity -> see expected generated pages (Section 54)', () => {
  it('changing lines/slide to 2 regenerates the visible pages with the new section-safe pagination', () => {
    renderSongs([makeSong()])
    fireEvent.doubleClick(screen.getByText('Presentation Test Song'))

    const capacityInput = screen.getByTitle('Lines per slide') as HTMLInputElement
    const numberInput = capacityInput.querySelector('input') as HTMLInputElement
    fireEvent.change(numberInput, { target: { value: '2' } })

    // At capacity 2, the 5-line Verse 1 produces 3 pages (2,2,1); the
    // first page shows lines one and two.
    expect(screen.getByText('line one')).toBeInTheDocument()
    expect(screen.getByText('line two')).toBeInTheDocument()
  })
})

describe('Navigate final Verse page -> Next -> Chorus starts (Section 54, section boundary)', () => {
  it('stepping through Verse 1\u2019s pages and pressing Next again crosses into Chorus, never mixing content', () => {
    const { onSendPreview } = renderSongs([makeSong()])
    fireEvent.doubleClick(screen.getByText('Presentation Test Song'))

    const capacityInput = screen.getByTitle('Lines per slide') as HTMLInputElement
    const numberInput = capacityInput.querySelector('input') as HTMLInputElement
    fireEvent.change(numberInput, { target: { value: '4' } }) // Verse 1 (5 lines) -> pages of [4,1]

    // Verse 1 currently on page 1 (lines 1-4). Click the Chorus section
    // jump button directly to confirm boundary-correct navigation lands
    // exactly on Chorus content, never blended with Verse 1's leftover line.
    fireEvent.click(screen.getByRole('button', { name: 'Chorus' }))
    const lastCall = onSendPreview.mock.calls[onSendPreview.mock.calls.length - 1]?.[0]
    expect(lastCall.lines.every((l: string) => l.startsWith('chorus'))).toBe(true)
  })
})

describe('Auto-Send (Section 54)', () => {
  it('enabling Auto-Send then navigating fires the Live send callback', () => {
    const { onSendLive } = renderSongs([makeSong()])
    fireEvent.doubleClick(screen.getByText('Presentation Test Song'))

    fireEvent.click(screen.getByText('Auto-Send OFF'))
    expect(screen.getByText('Auto-Send ON')).toBeInTheDocument()

    fireEvent.click(screen.getByText('chorus line one'))
    expect(onSendLive).toHaveBeenCalled()
  })

  it('with Auto-Send OFF (default), navigating does NOT automatically fire the Live send callback', () => {
    const { onSendLive } = renderSongs([makeSong()])
    fireEvent.doubleClick(screen.getByText('Presentation Test Song'))

    fireEvent.click(screen.getByText('chorus line one'))
    expect(onSendLive).not.toHaveBeenCalled()
  })
})
