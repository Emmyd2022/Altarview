// ALT-STAGE4-2: renders the REAL OperatorScreen to prove pin behavior
// end-to-end, not just the underlying migration/model logic in
// isolation. Covers Section 27 items 6-11.

import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import OperatorScreen from './OperatorScreen'
import { addImportedChapter } from '../bibleModel'
import { LanguageProvider } from '../i18n'
import type { PinnedItem } from '../pinModel'

beforeAll(() => {
  addImportedChapter('Mark', 61, 'KJV', [
    'pin test verse one',
    'pin test verse two',
    'pin test verse three',
    'pin test verse four',
    'pin test verse five',
    'pin test verse six',
  ])
})

function renderOperator(pinned: PinnedItem[] = [], overrides: Partial<Parameters<typeof OperatorScreen>[0]> = {}) {
  const onSendPreview = vi.fn()
  const onSendLive = vi.fn()
  const onSendPreviewContent = vi.fn()
  const onSendLiveContent = vi.fn()
  const onSendStageContent = vi.fn()
  const onChangePinned = vi.fn()
  render(
    <LanguageProvider>
      <OperatorScreen
        page="scripture"
        onChangePage={vi.fn()}
        previewContent={null}
        liveContent={null}
        onSendPreview={onSendPreview}
        onSendLive={onSendLive}
        onPushToLive={vi.fn()}
        onClearPreview={vi.fn()}
        onClearLive={vi.fn()}
        onSendPreviewContent={onSendPreviewContent}
        onSendLiveContent={onSendLiveContent}
        onSendStageContent={onSendStageContent}
        songs={[]}
        sessions={[]}
        pinned={pinned}
        onChangePinned={onChangePinned}
        {...overrides}
      />
    </LanguageProvider>,
  )
  return { onSendPreview, onSendLive, onSendPreviewContent, onSendLiveContent, onSendStageContent, onChangePinned }
}

function openReference(query: string) {
  const input = screen.getByPlaceholderText(/search a verse/i)
  fireEvent.change(input, { target: { value: query } })
  fireEvent.keyDown(input, { key: 'Enter' })
}

describe('OperatorScreen pin behavior — Group vs. Active Verse (Section 27.6-8)', () => {
  // 6. Navigating Active Verse does not alter what subsequently gets pinned.
  it('pinning after navigating Active Verse still pins the original Group, not the Active Verse position', () => {
    const { onChangePinned } = renderOperator()
    openReference('Mark 61:2-4')
    fireEvent.click(screen.getByText('Next Verse →')) // active verse: 2 -> 3
    fireEvent.click(screen.getByTitle('Pin this passage'))
    expect(onChangePinned).toHaveBeenCalledWith([
      expect.objectContaining({ target: { type: 'scripture', reference: { translationId: 'KJV', bookId: 'mark', startChapter: 61, startVerse: 2, endChapter: 61, endVerse: 4 } } }),
    ])
  })

  // 7. Crossing a chapter boundary does not alter the pinned Group.
  it('pinning after Active Verse crosses a chapter boundary still pins the original Group', () => {
    const { onChangePinned } = renderOperator()
    openReference('Mark 61:5-6') // active verse starts at 5
    fireEvent.click(screen.getByText('Next Verse →')) // 5 -> 6
    fireEvent.click(screen.getByText('Next Verse →')) // 6 -> crosses to Mark 62:1 (unloaded, but Group must still be unaffected)
    fireEvent.click(screen.getByTitle('Pin this passage'))
    expect(onChangePinned).toHaveBeenCalledWith([
      expect.objectContaining({ target: { type: 'scripture', reference: { translationId: 'KJV', bookId: 'mark', startChapter: 61, startVerse: 5, endChapter: 61, endVerse: 6 } } }),
    ])
  })

  // 8. Shift+click Group resize changes what subsequently gets pinned.
  it('Shift+click resizing the Group changes what gets pinned', () => {
    const { onChangePinned } = renderOperator()
    openReference('Mark 61:2-3')
    fireEvent.click(screen.getByText('pin test verse five'), { shiftKey: true }) // extends Group to 2-5
    fireEvent.click(screen.getByTitle('Pin this passage'))
    expect(onChangePinned).toHaveBeenCalledWith([
      expect.objectContaining({ target: { type: 'scripture', reference: { translationId: 'KJV', bookId: 'mark', startChapter: 61, startVerse: 2, endChapter: 61, endVerse: 5 } } }),
    ])
  })
})

describe('OperatorScreen pin behavior — Open/Send (Section 27.9-11)', () => {
  const scripturePin: PinnedItem = {
    id: 'pin-1',
    label: 'Mark 61:2-4',
    detail: 'KJV',
    createdAt: Date.now(),
    target: { type: 'scripture', reference: { translationId: 'KJV', bookId: 'mark', startChapter: 61, startVerse: 2, endChapter: 61, endVerse: 4 } },
  }

  // 9. Opening a structured Scripture pin reconstructs the correct passage.
  it('clicking Open on a structured Scripture pin reconstructs the reading view with the correct Group', () => {
    renderOperator([scripturePin])
    fireEvent.click(screen.getByText('Open'))
    // "Mark 61:2-4" appears twice once opened (the pin's own label in the
    // sidebar list, and the reading view's own Group label) -- checking
    // for the reading-view-specific "Back to Search" control plus the
    // actual verse text is the unambiguous way to confirm the reading
    // view itself opened with the right content.
    expect(screen.getByText('← Back to Search')).toBeInTheDocument()
    expect(screen.getByText('pin test verse two')).toBeInTheDocument()
  })

  // 10 & 11. Sending a structured pin resolves correctly and ultimately
  // calls the real PresentationEngine-routed props, not a direct setter.
  it('clicking Send resolves the pin through ScriptureEngine and calls the real onSend* props', () => {
    const { onSendPreviewContent, onSendLiveContent, onSendStageContent } = renderOperator([scripturePin])
    fireEvent.click(screen.getByText('Send'))
    const expectedContent = expect.objectContaining({ type: 'verse', book: 'Mark', chapter: 61, verse: 2, text: 'pin test verse two' })
    expect(onSendPreviewContent).toHaveBeenCalledWith(expectedContent)
    expect(onSendLiveContent).toHaveBeenCalledWith(expectedContent)
    expect(onSendStageContent).toHaveBeenCalledWith(expectedContent)
  })
})
