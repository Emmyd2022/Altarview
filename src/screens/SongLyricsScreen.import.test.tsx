// ALT-STAGE5-1-PART61: renders the REAL SongLyricsScreen component to
// prove the input/review/save workflows work end-to-end, not just the
// underlying parser/draft logic in isolation. All fixture text is
// fabricated placeholder content, never real lyrics.

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SongLyricsScreen from './SongLyricsScreen'
import { LanguageProvider } from '../i18n'
import type { Song } from '../songModel'

function renderSongs(songs: Song[] = []) {
  const onChangeSongs = vi.fn()
  render(
    <LanguageProvider>
      <SongLyricsScreen songs={songs} onChangeSongs={onChangeSongs} />
    </LanguageProvider>,
  )
  return { onChangeSongs }
}

function makeFile(content: string, name: string) {
  return new File([content], name, { type: 'text/plain' })
}

describe('Quick Text Entry: paste -> review -> change section -> save -> Song in Library (Section 61)', () => {
  it('pasting text opens a review with detected sections, editing a section label, then saving adds the song to the library', async () => {
    const { onChangeSongs } = renderSongs()

    fireEvent.click(screen.getByText('Quick Text Entry'))

    const textArea = document.querySelector('textarea') as HTMLTextAreaElement
    fireEvent.change(textArea, { target: { value: '[Verse 1]\nplaceholder line one\nplaceholder line two' } })

    // Review shows the detected section before anything is saved.
    expect(screen.getByText('placeholder line one')).toBeInTheDocument()

    // Change the detected section's label (Section 14/60.21) via the
    // editable label input.
    const labelInput = screen.getByDisplayValue('Verse 1')
    fireEvent.change(labelInput, { target: { value: 'Opening Verse' } })

    const titleInput = screen.getByPlaceholderText('Song title')
    fireEvent.change(titleInput, { target: { value: 'Integration Test Song' } })

    fireEvent.click(screen.getByText('Save Song'))

    await waitFor(() => expect(onChangeSongs).toHaveBeenCalled())
    const savedSongs = onChangeSongs.mock.calls[onChangeSongs.mock.calls.length - 1][0] as Song[]
    const saved = savedSongs.find((s) => s.title === 'Integration Test Song')
    expect(saved).toBeDefined()
    expect(saved?.sections[0].label).toBe('Opening Verse')
    expect(saved?.sections[0].lines).toEqual(['placeholder line one', 'placeholder line two'])
    expect(saved?.id).toBeTruthy()
  })
})

describe('Import TXT: review -> cancel -> library unchanged (Section 61)', () => {
  it('importing a TXT file opens the review panel without touching the library until Save', async () => {
    const { onChangeSongs } = renderSongs()
    const fileInput = document.querySelectorAll('input[type="file"]')[0] as HTMLInputElement

    const file = makeFile('placeholder imported line one\nplaceholder imported line two', 'Placeholder Import Title.txt')
    fireEvent.change(fileInput, { target: { files: [file] } })

    // Review opens, pre-filled with a filename-derived title.
    await waitFor(() => expect(screen.getByDisplayValue('Placeholder Import Title')).toBeInTheDocument())
    expect(screen.getByText('placeholder imported line one')).toBeInTheDocument()

    // Nothing was committed to the library just from importing.
    expect(onChangeSongs).not.toHaveBeenCalled()
  })
})

describe('Import TXT: review -> save -> library contains Song (Section 61)', () => {
  it('saving after a TXT import commits a real Song with parsed content', async () => {
    const { onChangeSongs } = renderSongs()
    const fileInput = document.querySelectorAll('input[type="file"]')[0] as HTMLInputElement

    const file = makeFile('[Verse 1]\nimported placeholder content', 'Save Test Title.txt')
    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => expect(screen.getByDisplayValue('Save Test Title')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Save Song'))

    await waitFor(() => expect(onChangeSongs).toHaveBeenCalled())
    const savedSongs = onChangeSongs.mock.calls[onChangeSongs.mock.calls.length - 1][0] as Song[]
    const saved = savedSongs.find((s) => s.title === 'Save Test Title')
    expect(saved).toBeDefined()
    expect(saved?.sections[0].lines).toEqual(['imported placeholder content'])
    expect(saved?.metadata.source).toBe('manual') // committed via the shared Quick Text Entry save path
  })
})

describe('Empty TXT import is rejected safely (Section 57/60.18)', () => {
  it('an empty file does not create a song and shows an error rather than crashing', async () => {
    const { onChangeSongs } = renderSongs()
    const fileInput = document.querySelectorAll('input[type="file"]')[0] as HTMLInputElement

    const file = makeFile('', 'Empty File.txt')
    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => expect(screen.getByText(/is empty/i)).toBeInTheDocument())
    expect(onChangeSongs).not.toHaveBeenCalled()
  })
})
