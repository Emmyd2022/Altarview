import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import StageControlScreen from './StageControlScreen'
import type { StageTimerState } from '../hooks/useStageTimer'

function mockState(overrides: Partial<StageTimerState> = {}): StageTimerState {
  return {
    items: [],
    current: { id: 's1', title: 'Opening Prayer', durationMinutes: 5 },
    next: { id: 's2', title: 'Praise & Worship', durationMinutes: 10 },
    remaining: 300,
    running: false,
    flashing: false,
    flashCount: 0,
    timesUp: false,
    message: null,
    start: vi.fn(),
    startFromBeginning: vi.fn(),
    pause: vi.fn(),
    stop: vi.fn(),
    goToNext: vi.fn(),
    goToPrevious: vi.fn(),
    adjust: vi.fn(),
    sendMessage: vi.fn(),
    clearMessage: vi.fn(),
    hasNext: true,
    hasPrevious: false,
    ...overrides,
  }
}

describe('StageControlScreen', () => {
  it('does not show Foldback content Next/Previous buttons when nothing is pushed to Foldback', () => {
    render(<StageControlScreen state={mockState()} hasStageContent={false} />)
    expect(screen.queryByTitle('Next item on Foldback')).not.toBeInTheDocument()
    expect(screen.queryByTitle('Previous item on Foldback')).not.toBeInTheDocument()
  })

  it('shows Foldback content controls when content is pushed to Foldback', () => {
    render(<StageControlScreen state={mockState()} hasStageContent={true} onNextFoldback={vi.fn()} onPreviousFoldback={vi.fn()} onClearStage={vi.fn()} />)
    expect(screen.getByTitle('Next item on Foldback')).toBeInTheDocument()
    expect(screen.getByTitle('Previous item on Foldback')).toBeInTheDocument()
    expect(screen.getByText('Clear Stage (show timer)')).toBeInTheDocument()
  })

  it('clicking Foldback Next calls onNextFoldback, not any Live-related callback', () => {
    const onNextFoldback = vi.fn()
    const onPushToLive = vi.fn()
    render(<StageControlScreen state={mockState()} hasStageContent={true} onNextFoldback={onNextFoldback} onPushToLive={onPushToLive} />)
    fireEvent.click(screen.getByTitle('Next item on Foldback'))
    expect(onNextFoldback).toHaveBeenCalledTimes(1)
    expect(onPushToLive).not.toHaveBeenCalled()
  })

  it('clicking Foldback Previous calls onPreviousFoldback', () => {
    const onPreviousFoldback = vi.fn()
    render(<StageControlScreen state={mockState()} hasStageContent={true} onPreviousFoldback={onPreviousFoldback} />)
    fireEvent.click(screen.getByTitle('Previous item on Foldback'))
    expect(onPreviousFoldback).toHaveBeenCalledTimes(1)
  })

  it('clicking Clear Stage calls onClearStage', () => {
    const onClearStage = vi.fn()
    render(<StageControlScreen state={mockState()} hasStageContent={true} onClearStage={onClearStage} />)
    fireEvent.click(screen.getByText('Clear Stage (show timer)'))
    expect(onClearStage).toHaveBeenCalledTimes(1)
  })

  // Section 5/12: Start restart behavior, verified at the component level
  // (the underlying restart logic itself is covered in useStageTimer.test.ts).
  it('Start button calls state.start()', () => {
    const start = vi.fn()
    render(<StageControlScreen state={mockState({ start })} />)
    fireEvent.click(screen.getByText('Start'))
    expect(start).toHaveBeenCalledTimes(1)
  })

  it('Foldback message input sends via sendMessage and does not touch Live', () => {
    const sendMessage = vi.fn()
    const onPushToLive = vi.fn()
    render(<StageControlScreen state={mockState({ sendMessage })} onPushToLive={onPushToLive} />)
    const input = screen.getByPlaceholderText('e.g. 2 more minutes')
    fireEvent.change(input, { target: { value: 'Microphone 2 is ready' } })
    fireEvent.click(screen.getByText('Send'))
    expect(sendMessage).toHaveBeenCalledWith('Microphone 2 is ready')
    expect(onPushToLive).not.toHaveBeenCalled()
  })
})
