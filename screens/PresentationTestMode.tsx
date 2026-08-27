// ALT-STAGE3-PART23: Presentation Test Mode. A manual, interactive test
// harness (not an automated test suite -- Stage 1 found none exists yet,
// and introducing a testing framework isn't this stage's job) covering
// the 10 scenarios Section 23 lists. Meant for whoever is developing
// Altarview to click through and visually confirm the engine behaves
// correctly, especially the independence guarantees that are easy to
// silently break with a careless future change.

import { useState } from 'react'
import type { PresentationEngine } from '../core/PresentationEngine'
import type { StageTimerState } from '../hooks/useStageTimer'
import type { DisplayContent } from './OutputStage'

const SAMPLE_A: DisplayContent = {
  type: 'verse',
  ref: 'John 3:16',
  translation: 'KJV',
  text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.',
  book: 'John',
  chapter: 3,
  verse: 16,
}

const SAMPLE_B: DisplayContent = {
  type: 'verse',
  ref: 'John 3:17',
  translation: 'KJV',
  text: 'For God sent not his Son into the world to condemn the world; but that the world through him might be saved.',
  book: 'John',
  chapter: 3,
  verse: 17,
}

interface TestResult {
  label: string
  pass: boolean | null // null = not yet run
  detail: string
}

export default function PresentationTestMode({
  engine,
  stageTimer,
}: {
  engine: PresentationEngine
  stageTimer: StageTimerState
}) {
  const [results, setResults] = useState<Record<string, TestResult>>({})

  function record(key: string, label: string, pass: boolean, detail: string) {
    setResults((prev) => ({ ...prev, [key]: { label, pass, detail } }))
  }

  const tests: { key: string; label: string; run: () => void }[] = [
    {
      key: 'stagePreview',
      label: '1. Stage content to Preview',
      run: () => {
        engine.stageToPreview(SAMPLE_A)
        setTimeout(() => {
          const ok = engine.preview?.type === 'verse' && engine.preview.ref === 'John 3:16'
          record('stagePreview', '1. Stage content to Preview', !!ok, ok ? 'Preview now holds John 3:16' : 'Preview did not update as expected')
        }, 0)
      },
    },
    {
      key: 'previewToLive',
      label: '2. Send Preview to Live',
      run: () => {
        engine.stageToPreview(SAMPLE_A)
        engine.pushPreviewToLive()
        setTimeout(() => {
          const ok = engine.live?.type === 'verse' && engine.live.ref === 'John 3:16'
          record('previewToLive', '2. Send Preview to Live', !!ok, ok ? 'Live now holds what Preview had' : 'Live did not receive Preview content')
        }, 0)
      },
    },
    {
      key: 'sendFoldback',
      label: '3. Send content directly to Foldback',
      run: () => {
        engine.sendToFoldback(SAMPLE_B)
        setTimeout(() => {
          const ok = engine.foldback?.type === 'verse' && engine.foldback.ref === 'John 3:17'
          record('sendFoldback', '3. Send content directly to Foldback', !!ok, ok ? 'Foldback now holds John 3:17' : 'Foldback did not update')
        }, 0)
      },
    },
    {
      key: 'sendBoth',
      label: '4. Send same content to Live + Foldback',
      run: () => {
        engine.sendToBoth(SAMPLE_A)
        setTimeout(() => {
          const liveOk = engine.live?.type === 'verse' && engine.live.ref === 'John 3:16'
          const foldbackOk = engine.foldback?.type === 'verse' && engine.foldback.ref === 'John 3:16'
          const ok = liveOk && foldbackOk
          record('sendBoth', '4. Send same content to Live + Foldback', ok, ok ? 'Both destinations hold John 3:16' : 'Live/Foldback did not both update')
        }, 0)
      },
    },
    {
      key: 'independence',
      label: '5+6+9(part). Live and Foldback independence -- the critical test',
      run: () => {
        engine.sendToLive(SAMPLE_A)
        engine.sendToFoldback(SAMPLE_B)
        engine.nextFoldback()
        setTimeout(() => {
          const liveUnchanged = engine.live?.type === 'verse' && engine.live.ref === 'John 3:16'
          const foldbackAdvanced = engine.foldback?.type === 'verse' && engine.foldback.verse === 18
          const ok = liveUnchanged && foldbackAdvanced
          record(
            'independence',
            '5+6+9(part). Live/Foldback independence',
            ok,
            ok
              ? 'Foldback advanced to v18 while Live stayed on v16 -- independence confirmed'
              : `FAILED: Live=${engine.live?.type === 'verse' ? engine.live.ref : engine.live?.type}, Foldback=${engine.foldback?.type === 'verse' ? engine.foldback.ref : engine.foldback?.type}`,
          )
        }, 0)
      },
    },
    {
      key: 'clearLive',
      label: '7. Clear Live independently',
      run: () => {
        engine.sendToLive(SAMPLE_A)
        engine.sendToFoldback(SAMPLE_B)
        engine.clearLive()
        setTimeout(() => {
          const ok = engine.live === null && engine.foldback?.type === 'verse' && engine.foldback.ref === 'John 3:17'
          record('clearLive', '7. Clear Live independently', !!ok, ok ? 'Live cleared, Foldback untouched' : 'Clearing Live affected Foldback')
        }, 0)
      },
    },
    {
      key: 'clearFoldback',
      label: '8. Clear Foldback independently',
      run: () => {
        engine.sendToLive(SAMPLE_A)
        engine.sendToFoldback(SAMPLE_B)
        engine.clearFoldback()
        setTimeout(() => {
          const ok = engine.foldback === null && engine.live?.type === 'verse' && engine.live.ref === 'John 3:16'
          record('clearFoldback', '8. Clear Foldback independently', !!ok, ok ? 'Foldback cleared, Live untouched' : 'Clearing Foldback affected Live')
        }, 0)
      },
    },
    {
      key: 'message',
      label: '9. Foldback message stays off Live',
      run: () => {
        stageTimer.sendMessage('Test message -- Foldback only')
        setTimeout(() => {
          const ok = stageTimer.message === 'Test message -- Foldback only'
          record('message', '9. Foldback message stays off Live', ok, ok ? 'Message set on the timer/Foldback state, not on liveContent' : 'Message did not set')
        }, 0)
      },
    },
    {
      key: 'timerRestart',
      label: '10. Start restarts a stopped timer from the beginning',
      run: () => {
        stageTimer.stop()
        setTimeout(() => {
          stageTimer.start()
          setTimeout(() => {
            const fullDuration = stageTimer.current.durationMinutes * 60
            const ok = stageTimer.remaining === fullDuration
            record(
              'timerRestart',
              '10. Start restarts a stopped timer from the beginning',
              ok,
              ok ? `Restarted at ${fullDuration}s as expected` : `Expected ${fullDuration}s, got ${stageTimer.remaining}s`,
            )
          }, 0)
        }, 0)
      },
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ height: 48, borderBottom: '1px solid #2A331F', display: 'flex', alignItems: 'center', paddingLeft: 20, paddingRight: 20, gap: 12, flexShrink: 0 }}>
        <span style={{ fontWeight: 600, fontSize: 13, color: '#EDEAE0', letterSpacing: '0.02em' }}>Presentation Test Mode</span>
        <span style={{ fontSize: 11, color: '#8F9885' }}>Manual verification harness -- not an automated test suite</span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        <p style={{ fontSize: 11, color: '#8F9885', lineHeight: 1.6, marginBottom: 16, maxWidth: 560 }}>
          Each button below exercises one Stage 3 acceptance scenario against the real Presentation Engine and
          Stage timer -- not a mock. Running a test will actually change what's on Preview/Live/Foldback, same as
          using the app normally.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 640 }}>
          {tests.map((t) => {
            const result = results[t.key]
            return (
              <div key={t.key} style={{ background: '#1B2318', border: '1px solid #2A331F', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  onClick={t.run}
                  style={{ background: '#A8702E', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 11, fontWeight: 600, color: '#10160F', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}
                >
                  Run
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: '#EDEAE0' }}>{t.label}</div>
                  {result && <div style={{ fontSize: 11, color: result.pass ? '#6FC98A' : '#ff6060', marginTop: 2 }}>{result.detail}</div>}
                </div>
                {result && (
                  <span style={{ fontSize: 16, color: result.pass ? '#6FC98A' : '#ff6060', flexShrink: 0 }}>{result.pass ? '✓' : '✗'}</span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
