// ALT-STAGE5-2-1-PART48: component tests exercising the real new
// Presentation Layout panel UI. All fixture text is fabricated
// placeholder content, never real lyrics.

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SongPresentationLayoutPanel } from './SongPresentationLayoutPanel'
import { useSongAutoSend } from '../song/presentation/useSongAutoSend'
import { renderHook } from '@testing-library/react'
import type { Song } from '../songModel'

function makeSong(): Song {
  return {
    id: 'song-1',
    title: 'Panel Test Song',
    artist: '',
    source: 'Imported',
    isHymn: false,
    linesPerSlide: 2,
    sections: [
      { id: 'verse1', label: 'Verse 1', lines: ['alpha line', 'beta line', 'gamma line', 'delta line'] },
      { id: 'chorus', label: 'Chorus', lines: ['chorus line'] },
    ],
    arrangements: [{ id: 'arr-1', name: 'Default', sectionIds: ['verse1', 'chorus'] }],
    defaultArrangementId: 'arr-1',
    metadata: { createdAt: 1, updatedAt: 1 },
  }
}

function renderPanel(overrides: Partial<Parameters<typeof SongPresentationLayoutPanel>[0]> = {}) {
  const { result: autoSendResult } = renderHook(() => useSongAutoSend(false))
  const onSendPreview = vi.fn()
  const onSendLive = vi.fn()
  const onPin = vi.fn()
  render(<SongPresentationLayoutPanel song={makeSong()} onSendPreview={onSendPreview} onSendLive={onSendLive} onPin={onPin} autoSend={autoSendResult.current} {...overrides} />)
  return { onSendPreview, onSendLive, onPin }
}

describe('Manual page break UI (Section 48)', () => {
  it('adding a manual break via the + Page Break control regenerates the visible page grouping', () => {
    renderPanel()
    // "+ Page Break" appears after each line except the last (3 breaks for a 4-line section).
    const breakButtons = screen.getAllByText('+ Page Break')
    expect(breakButtons.length).toBe(3)
    fireEvent.click(breakButtons[0]) // break after alpha line
    expect(screen.getByText('Page Break (click to remove)')).toBeInTheDocument()
  })

  it('removing a manual break (clicking it again) reverts the control to its inactive state', () => {
    renderPanel()
    const breakButtons = screen.getAllByText('+ Page Break')
    fireEvent.click(breakButtons[0])
    fireEvent.click(screen.getByText('Page Break (click to remove)'))
    expect(screen.getAllByText('+ Page Break').length).toBe(3)
  })
})

describe('Destination capacity UI (Section 48)', () => {
  it('Audience and Foldback capacity inputs exist and are independently editable', () => {
    renderPanel()
    const audienceInput = screen.getByText('Audience lines:').querySelector('input') as HTMLInputElement
    const foldbackInput = screen.getByText('Foldback lines:').querySelector('input') as HTMLInputElement
    expect(audienceInput).toBeTruthy()
    expect(foldbackInput).toBeTruthy()
    fireEvent.change(audienceInput, { target: { value: '1' } })
    expect(foldbackInput.value).toBe('4') // unaffected by the Audience change
  })
})

describe('Granular pinning UI (Section 48)', () => {
  it('Pin Song calls onPin with a whole-song target', () => {
    const { onPin } = renderPanel()
    fireEvent.click(screen.getByText('Pin Song'))
    expect(onPin).toHaveBeenCalledWith(expect.objectContaining({ target: expect.objectContaining({ type: 'song', songId: 'song-1' }) }))
  })

  it('Pin Section calls onPin with a section-level semantic target, not a page number', () => {
    const { onPin } = renderPanel()
    fireEvent.click(screen.getByText('Pin Section'))
    const call = onPin.mock.calls[0][0]
    expect(call.target.lyricPosition).toEqual({ sectionId: 'verse1', sectionOccurrence: 1 })
  })

  it('Pin Current Slide calls onPin with a full semantic lyric position', () => {
    const { onPin } = renderPanel()
    fireEvent.click(screen.getByText('Pin Current Slide'))
    const call = onPin.mock.calls[0][0]
    expect(call.target.lyricPosition).toEqual({ sectionId: 'verse1', sectionOccurrence: 1, lineIndexInSection: 0 })
  })
})

describe('Repeated-section jump UI', () => {
  it('clicking a section-jump button moves the current position and updates the displayed context', () => {
    renderPanel()
    fireEvent.click(screen.getByRole('button', { name: 'Chorus' }))
    // The position-context line reads "Chorus \u00b7 Page X of Y" -- check
    // for that specific text rather than the ambiguous bare "Chorus"
    // (which also appears in the jump button and the break-editor header).
    expect(screen.getByText(/Chorus.*Page \d+ of \d+/)).toBeInTheDocument()
  })
})
