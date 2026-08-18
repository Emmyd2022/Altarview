import { useState, useEffect, useRef } from 'react'
import { DEFAULT_SESSIONS, type ServiceSession } from '../sessionModel'

const FLASH_CYCLES = 5

export function useStageTimer(items: ServiceSession[] = DEFAULT_SESSIONS) {
  const safeItems = items.length > 0 ? items : DEFAULT_SESSIONS
  const [index, setIndex] = useState(0)
  const [remaining, setRemaining] = useState(safeItems[0].durationMinutes * 60)
  const [running, setRunning] = useState(false)
  // ALT-020: "TIME UP" flash state, then auto-advance unless paused mid-flash.
  const [flashing, setFlashing] = useState(false)
  const [flashCount, setFlashCount] = useState(0)
  const [timesUp, setTimesUp] = useState(false)
  // ALT-021: operator-to-stage note, independent of the timer/session display.
  const [message, setMessage] = useState<string | null>(null)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const flashRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const current = safeItems[index]
  const next = safeItems[index + 1]

  useEffect(() => {
    if (running && !flashing) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            setRunning(false)
            setFlashing(true)
            setFlashCount(0)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [running, flashing])

  // ALT-020: flash "TIME UP" 5 times, then auto-advance -- unless the
  // operator pauses during the flash (handled by pause() clearing flashing).
  useEffect(() => {
    if (!flashing) return
    flashRef.current = setInterval(() => {
      setFlashCount((prev) => {
        const next = prev + 1
        if (next >= FLASH_CYCLES * 2) {
          setFlashing(false)
          goToNext()
          return 0
        }
        return next
      })
    }, 500)
    return () => {
      if (flashRef.current) clearInterval(flashRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flashing])

  function goTo(idx: number) {
    if (idx < 0 || idx >= safeItems.length) return
    setIndex(idx)
    setRemaining(safeItems[idx].durationMinutes * 60)
    setRunning(false)
    setFlashing(false)
    setTimesUp(false)
  }

  function goToNext() {
    if (index < safeItems.length - 1) goTo(index + 1)
    else {
      setRunning(false)
      setFlashing(false)
    }
  }

  function start() {
    setTimesUp(false)
    setRunning(true)
  }

  function pause() {
    setRunning(false)
    setFlashing(false) // ALT-020: pausing mid-flash cancels the auto-advance
  }

  function stop() {
    // ALT-020: Stop/End shows a "Time's Up" state rather than just halting.
    setRunning(false)
    setFlashing(false)
    setTimesUp(true)
  }

  function adjust(deltaMinutes: number) {
    setRemaining((prev) => Math.max(0, prev + deltaMinutes * 60))
  }

  function sendMessage(text: string) {
    setMessage(text.trim() || null)
  }

  function clearMessage() {
    setMessage(null)
  }

  return {
    items,
    current,
    next,
    remaining,
    running,
    flashing,
    flashCount,
    timesUp,
    message,
    start,
    pause,
    stop,
    goToNext,
    goToPrevious: () => goTo(index - 1),
    adjust,
    sendMessage,
    clearMessage,
    hasNext: !!next,
    hasPrevious: index > 0,
  }
}

export type StageTimerState = ReturnType<typeof useStageTimer>
