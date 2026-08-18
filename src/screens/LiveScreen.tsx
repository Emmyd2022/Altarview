import { useState } from 'react'
import { OutputStage, type DisplayContent } from './OutputStage'
import { availableTranslationsFor } from '../verseData'

// ALT-025: translation switcher lives only on Live (not Preview, per the
// spec) -- changing it re-renders the currently-live verse in the new
// translation immediately, without needing to re-search or re-send.
export default function LiveScreen({
  content,
  onExit,
  onChangeTranslation,
}: {
  content: DisplayContent | null
  onExit?: () => void
  onChangeTranslation?: (translation: string, text: string) => void
}) {
  const [open, setOpen] = useState(false)
  const variants = content ? availableTranslationsFor(content.ref) : []

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <OutputStage content={content} badgeLabel="LIVE" badgeColor="#6FC98A" onExit={onExit} />
      {content && variants.length > 0 && onChangeTranslation && (
        <div style={{ position: 'absolute', bottom: 28, left: 36, zIndex: 5 }}>
          <button
            onClick={() => setOpen((v) => !v)}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 6,
              padding: '6px 12px',
              fontSize: 11,
              color: 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
              fontFamily: 'Inter, Segoe UI, sans-serif',
            }}
          >
            Translation: {content.translation || variants[0].translation} ▾
          </button>
          {open && (
            <div
              style={{
                position: 'absolute',
                bottom: '110%',
                left: 0,
                background: '#1B2318',
                border: '1px solid #2A331F',
                borderRadius: 8,
                overflow: 'hidden',
                minWidth: 90,
              }}
            >
              {variants.map((v) => (
                <button
                  key={v.translation}
                  onClick={() => {
                    onChangeTranslation(v.translation, v.text)
                    setOpen(false)
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    background: v.translation === content.translation ? 'rgba(168,112,46,0.15)' : 'transparent',
                    border: 'none',
                    padding: '7px 12px',
                    fontSize: 12,
                    color: v.translation === content.translation ? '#A8702E' : '#EDEAE0',
                    cursor: 'pointer',
                    fontFamily: 'Inter, Segoe UI, sans-serif',
                  }}
                >
                  {v.translation}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
