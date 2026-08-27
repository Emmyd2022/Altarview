import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { OutputStage } from './OutputStage'
import type { DisplayContent } from './OutputStage'

describe('OutputStage', () => {
  it('renders nothing content-wise when content is null', () => {
    render(<OutputStage content={null} badgeLabel="LIVE" badgeColor="#6FC98A" />)
    expect(screen.getByText('LIVE')).toBeInTheDocument()
  })

  it('renders verse reference and text when content is a verse', () => {
    const content: DisplayContent = {
      type: 'verse',
      ref: 'John 3:16',
      translation: 'KJV',
      text: 'placeholder verse text',
      book: 'John',
      chapter: 3,
      verse: 16,
    }
    const { container } = render(<OutputStage content={content} badgeLabel="LIVE" badgeColor="#6FC98A" />)
    // Substring check on combined text content rather than an exact DOM
    // match -- more robust against incidental markup/whitespace changes,
    // per Section 16's guidance to avoid brittle DOM-structure-dependent
    // tests and focus on observable output instead.
    expect(container.textContent).toContain('John 3:16')
    expect(container.textContent).toContain('KJV')
    expect(container.textContent).toContain('placeholder verse text')
  })

  it('renders song title and lines when content is a song', () => {
    const content: DisplayContent = {
      type: 'song',
      title: 'Song A',
      artist: 'Test Artist',
      lines: ['line one', 'line two'],
      songId: 'song-a',
      slideIndex: 0,
    }
    const { container } = render(<OutputStage content={content} badgeLabel="LIVE" badgeColor="#6FC98A" />)
    expect(container.textContent).toContain('line one')
    expect(container.textContent).toContain('line two')
  })

  it('renders the same content identically regardless of badge label (Preview vs Live use one renderer)', () => {
    const content: DisplayContent = {
      type: 'verse',
      ref: 'John 3:16',
      translation: 'KJV',
      text: 'placeholder verse text',
      book: 'John',
      chapter: 3,
      verse: 16,
    }
    const { container: liveContainer } = render(<OutputStage content={content} badgeLabel="LIVE" badgeColor="#6FC98A" />)
    const { container: previewContainer } = render(<OutputStage content={content} badgeLabel="PREVIEW" badgeColor="#A8702E" />)
    // Strip the badge text itself (appears twice: the exit overlay and the
    // footer's "<LABEL> output — 1920 × 1080" line), then confirm the
    // actual content markup (the part that matters for "is this the same
    // renderer") matches. Global regex so every occurrence is stripped.
    expect(liveContainer.textContent?.replace(/LIVE/g, '')).toBe(previewContainer.textContent?.replace(/PREVIEW/g, ''))
  })
})
