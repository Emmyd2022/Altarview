// ALT-STAGE4-1: these tests render the REAL OperatorScreen component,
// not just the underlying hooks in isolation -- per Section 26's
// explicit warning that a hook/service existing in src/scripture/ is
// NOT "integrated" unless the actual UI genuinely uses it. Covers
// Section 18 items A-I.

import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import OperatorScreen from './OperatorScreen'
import { addImportedChapter } from '../bibleModel'
import { scriptureEngine } from '../scripture/services/ScriptureEngine'
import { LanguageProvider } from '../i18n'

beforeAll(() => {
  addImportedChapter('Mark', 41, 'KJV', [
    'operator test verse one',
    'operator test verse two',
    'operator test verse three',
    'operator test verse four',
    'operator test verse five',
  ])
})

function renderOperator(overrides: Partial<Parameters<typeof OperatorScreen>[0]> = {}) {
  const onSendPreview = vi.fn()
  const onSendLive = vi.fn()
  const onSendPreviewContent = vi.fn()
  const onSendLiveContent = vi.fn()
  const onSendStageContent = vi.fn()
  const utils = render(
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
        pinned={[]}
        onChangePinned={vi.fn()}
        {...overrides}
      />
    </LanguageProvider>,
  )
  return { ...utils, onSendPreview, onSendLive, onSendPreviewContent, onSendLiveContent, onSendStageContent }
}

function openReferenceViaSearchBox() {
  const input = screen.getByPlaceholderText(/search a verse/i)
  fireEvent.change(input, { target: { value: 'Mark 41:2-4' } })
  fireEvent.keyDown(input, { key: 'Enter' })
}

describe('OperatorScreen Scripture integration (real component, not just the hook)', () => {
  // A. OperatorScreen uses the new Scripture presentation state.
  // B. Opening a reference produces the correct Group and Active Verse.
  it('opening a reference via the search box shows the Group range and highlights it', () => {
    renderOperator()
    openReferenceViaSearchBox()
    // The opened-passage label should reflect the Group (2-4), and the
    // "Back to Search" control (only rendered once a group is open)
    // confirms the reading view is actually showing.
    expect(screen.getByText('← Back to Search')).toBeInTheDocument()
    expect(screen.getByText(/Mark 41:2-4/)).toBeInTheDocument()
  })

  // C. Clicking a verse updates Active Verse correctly (proven via what
  // gets sent -- clicking verse 5, outside the original 2-4 group,
  // sends verse 5's content to Preview).
  it('clicking a verse in the chapter view stages that verse to Preview via the real onSendPreviewContent prop', () => {
    const { onSendPreviewContent } = renderOperator()
    openReferenceViaSearchBox()
    fireEvent.click(screen.getByText('operator test verse five'))
    expect(onSendPreviewContent).toHaveBeenCalledWith(expect.objectContaining({ type: 'verse', verse: 5 }))
  })

  // I. Scripture actions call PresentationEngine-routed props (onSend*),
  // never a local output-state setter -- double-click sends to all three.
  it('double-clicking a verse sends to Preview, Live, and Stage via the real props', () => {
    const { onSendPreviewContent, onSendLiveContent, onSendStageContent } = renderOperator()
    openReferenceViaSearchBox()
    fireEvent.doubleClick(screen.getByText('operator test verse one'))
    expect(onSendPreviewContent).toHaveBeenCalledWith(expect.objectContaining({ verse: 1 }))
    expect(onSendLiveContent).toHaveBeenCalledWith(expect.objectContaining({ verse: 1 }))
    expect(onSendStageContent).toHaveBeenCalledWith(expect.objectContaining({ verse: 1 }))
  })

  // D. Next Verse changes Active Verse without changing Group.
  it('Next Verse advances and sends the new verse, while the Group label stays the same', () => {
    const { onSendLiveContent } = renderOperator()
    openReferenceViaSearchBox()
    fireEvent.click(screen.getByText('Next Verse →'))
    // Group label (2-4) must still be showing -- proves the Group itself
    // did not change as a side effect of navigation (this was the real
    // bug Stage 4.1 fixes vs. the old Stage 3 implementation).
    expect(screen.getByText(/Mark 41:2-4/)).toBeInTheDocument()
    // Active Verse defaults to the Group's start (2) when opened, so one
    // step forward lands on 3.
    expect(onSendLiveContent).toHaveBeenCalledWith(expect.objectContaining({ verse: 3 }))
  })

  // E. Previous Verse changes Active Verse without changing Group.
  it('Previous Verse steps back and sends the new verse, Group unchanged', () => {
    const { onSendLiveContent } = renderOperator()
    openReferenceViaSearchBox()
    fireEvent.click(screen.getByText('← Previous Verse'))
    expect(screen.getByText(/Mark 41:2-4/)).toBeInTheDocument()
    expect(onSendLiveContent).toHaveBeenCalledWith(expect.objectContaining({ verse: 1 }))
  })

  // F. Shift+click group expansion updates Group correctly.
  it('Shift+click extends the Group to include the clicked verse', () => {
    renderOperator()
    openReferenceViaSearchBox()
    fireEvent.click(screen.getByText('operator test verse five'), { shiftKey: true })
    expect(screen.getByText(/Mark 41:2-5/)).toBeInTheDocument()
  })

  // Search box itself uses the Stage 4 search engine (Section 13) --
  // verified indirectly: a keyword query none of the SAMPLE_VERSES fixture
  // contains, but which DOES match our seeded synthetic chapter, must
  // surface a result -- proving the live search engine is genuinely wired
  // in, not the old flat SAMPLE_VERSES-only filter.
  it('keyword search surfaces results from imported Scripture Engine data, not just the old hardcoded sample list', () => {
    renderOperator()
    const input = screen.getByPlaceholderText(/search a verse/i)
    fireEvent.change(input, { target: { value: 'operator test verse three' } })
    expect(screen.getByText(/operator test verse three/)).toBeInTheDocument()
  })
})

describe('Translation switching retains the structured reference (Section 8/G/H)', () => {
  beforeAll(() => {
    addImportedChapter('Mark', 42, 'KJV', ['switch test kjv verse'])
    addImportedChapter('Mark', 42, 'NIV', ['switch test niv verse'])
  })

  it('switchTranslation on the same VerseReference retrieves the other translation without a new search', () => {
    const kjv = scriptureEngine.getVerse('kjv', 'mark', 42, 1)
    const niv = scriptureEngine.switchTranslation({ translationId: 'kjv', bookId: 'mark', chapter: 42, verse: 1 }, 'niv')
    expect(kjv?.text).toBe('switch test kjv verse')
    expect(niv?.text).toBe('switch test niv verse')
  })
})
