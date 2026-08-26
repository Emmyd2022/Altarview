import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useStageTimer } from './useStageTimer'
import type { ServiceSession } from '../sessionModel'

const SESSIONS: ServiceSession[] = [
  { id: 's1', title: 'Opening Prayer', durationMinutes: 5 },
  { id: 's2', title: 'Praise & Worship', durationMinutes: 10 },
  { id: 's3', title: 'Sermon', durationMinutes: 30 },
]

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useStageTimer', () => {
  it('initial state: first session, full duration, not running', () => {
    const { result } = renderHook(() => useStageTimer(SESSIONS))
    expect(result.current.current.title).toBe('Opening Prayer')
    expect(result.current.remaining).toBe(5 * 60)
    expect(result.current.running).toBe(false)
    expect(result.current.timesUp).toBe(false)
  })

  it('Start begins the countdown', () => {
    const { result } = renderHook(() => useStageTimer(SESSIONS))
    act(() => result.current.start())
    expect(result.current.running).toBe(true)
    act(() => vi.advanceTimersByTime(3000))
    expect(result.current.remaining).toBe(5 * 60 - 3)
  })

  // ALT-STAGE3-PART7 regression test -- this is the exact fix Stage 3
  // made and Stage 3.1 asked to be re-verified with a real automated test.
  it('Start after Stop restarts from the full configured duration', () => {
    const { result } = renderHook(() => useStageTimer(SESSIONS))
    act(() => result.current.start())
    act(() => vi.advanceTimersByTime(10000)) // 10s elapsed
    expect(result.current.remaining).toBe(5 * 60 - 10)
    act(() => result.current.stop())
    expect(result.current.timesUp).toBe(true)
    act(() => result.current.start())
    expect(result.current.remaining).toBe(5 * 60) // restarted, not resumed from 290
    expect(result.current.timesUp).toBe(false)
    expect(result.current.running).toBe(true)
  })

  it('a plain pause then Start resumes from where it paused (not a restart)', () => {
    const { result } = renderHook(() => useStageTimer(SESSIONS))
    act(() => result.current.start())
    act(() => vi.advanceTimersByTime(10000))
    act(() => result.current.pause())
    expect(result.current.remaining).toBe(5 * 60 - 10)
    act(() => result.current.start())
    expect(result.current.remaining).toBe(5 * 60 - 10) // resumed, not reset to 300
  })

  it('Stop sets timesUp and stops running', () => {
    const { result } = renderHook(() => useStageTimer(SESSIONS))
    act(() => result.current.start())
    act(() => result.current.stop())
    expect(result.current.running).toBe(false)
    expect(result.current.timesUp).toBe(true)
  })

  it('goToNext advances to the next session with its own full duration', () => {
    const { result } = renderHook(() => useStageTimer(SESSIONS))
    act(() => result.current.goToNext())
    expect(result.current.current.title).toBe('Praise & Worship')
    expect(result.current.remaining).toBe(10 * 60)
    expect(result.current.hasPrevious).toBe(true)
  })

  it('goToPrevious steps back to the previous session', () => {
    const { result } = renderHook(() => useStageTimer(SESSIONS))
    act(() => result.current.goToNext())
    act(() => result.current.goToNext())
    expect(result.current.current.title).toBe('Sermon')
    act(() => result.current.goToPrevious())
    expect(result.current.current.title).toBe('Praise & Worship')
    expect(result.current.remaining).toBe(10 * 60)
  })

  it('goToNext on the last session does not advance past the end', () => {
    const { result } = renderHook(() => useStageTimer(SESSIONS))
    act(() => result.current.goToNext())
    act(() => result.current.goToNext())
    expect(result.current.hasNext).toBe(false)
    act(() => result.current.goToNext())
    expect(result.current.current.title).toBe('Sermon') // unchanged
  })

  it('adjust adds/subtracts minutes without going below zero', () => {
    const { result } = renderHook(() => useStageTimer(SESSIONS))
    act(() => result.current.adjust(1))
    expect(result.current.remaining).toBe(6 * 60)
    act(() => result.current.adjust(-10))
    expect(result.current.remaining).toBe(0) // clamped, not negative
  })

  // Section 6: Foldback-only message
  describe('Foldback-only message', () => {
    it('sendMessage sets message; clearMessage clears it', () => {
      const { result } = renderHook(() => useStageTimer(SESSIONS))
      act(() => result.current.sendMessage('Pastor, please prepare for Scripture'))
      expect(result.current.message).toBe('Pastor, please prepare for Scripture')
      act(() => result.current.clearMessage())
      expect(result.current.message).toBeNull()
    })

    it('setting a message does not affect timer/session state', () => {
      const { result } = renderHook(() => useStageTimer(SESSIONS))
      act(() => result.current.start())
      act(() => result.current.sendMessage('Next song: [title omitted]'))
      expect(result.current.running).toBe(true)
      expect(result.current.current.title).toBe('Opening Prayer')
    })
  })
})
