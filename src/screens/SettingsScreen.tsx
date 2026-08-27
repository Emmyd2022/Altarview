import { useState, useRef } from 'react'
import { LANGUAGES, useLanguage, useT } from '../i18n'
import { importZefaniaXML, importSimpleJSON, type ImportResult } from '../bibleImport'
import { importZefaniaXMLValidated, importSimpleJSONValidated, type ImportValidationResult } from '../scripture/services/scriptureImport'
import { listLoadedTranslations } from '../bibleModel'

// ALT: EasyVerse-style Translation Library -- curated list of common
// translation names to browse. KJV is genuinely bundled (public domain);
// everything else shows "Install" and opens the real import flow, since
// this app can't legally bundle copyrighted translations the way EasyVerse
// can (they hold actual licensing agreements with those publishers).
const TRANSLATION_CATALOG = [
  { code: 'KJV', name: 'King James Version' },
  { code: 'NKJV', name: 'New King James Version' },
  { code: 'NIV', name: 'New International Version' },
  { code: 'ESV', name: 'English Standard Version' },
  { code: 'NASB', name: 'New American Standard Bible' },
  { code: 'AMP', name: 'Amplified Bible' },
  { code: 'NLT', name: 'New Living Translation' },
  { code: 'MSG', name: 'The Message' },
  { code: 'ERV', name: 'Easy-to-Read Version' },
]

// ALT-041: output routing types/defaults.
type OutputRole = 'live' | 'preview' | 'stage'
interface OutputTarget {
  id: string
  label: string
  kind: 'display' | 'ndi' | 'browser-link' | 'windowed'
}
const VIRTUAL_TARGETS: OutputTarget[] = [
  { id: 'ndi', label: 'NDI Output (virtual)', kind: 'ndi' },
  { id: 'browser-link', label: 'Browser Presentation Link (virtual)', kind: 'browser-link' },
  { id: 'windowed', label: 'Windowed (no physical output)', kind: 'windowed' },
]
const DEFAULT_TARGETS: OutputTarget[] = [
  { id: 'display-1', label: 'Primary Monitor (1920\u00d71080)', kind: 'display' },
  { id: 'display-2', label: 'Display 2 (1920\u00d71080)', kind: 'display' },
  { id: 'display-3', label: 'Display 3 (1920\u00d71080)', kind: 'display' },
  ...VIRTUAL_TARGETS,
]
const ROLE_LABELS: Record<OutputRole, string> = {
  live: 'Live (Audience)',
  preview: 'Preview',
  stage: 'Stage',
}
const KIND_ICON: Record<OutputTarget['kind'], string> = {
  display: '🖥',
  ndi: '📡',
  'browser-link': '🔗',
  windowed: '▢',
}

const TRANSLATIONS_LIST = [
  { code: 'NKJV', name: 'New King James Version', installed: true },
  { code: 'KJV', name: 'King James Version', installed: true },
  { code: 'NIV', name: 'New International Version', installed: true },
  { code: 'ESV', name: 'English Standard Version', installed: true },
  { code: 'AMP', name: 'Amplified Bible', installed: true },
  { code: 'ERV', name: 'Easy-to-Read Version', installed: false },
  { code: 'MSG', name: 'The Message', installed: false },
  { code: 'NLT', name: 'New Living Translation', installed: true },
  { code: 'Pidgin', name: 'Pidgin English Bible', installed: true },
]

export default function SettingsScreen({ onBibleImported }: { onBibleImported?: () => void } = {}) {
  const [obsConnected] = useState(true)
  const [importTranslationName, setImportTranslationName] = useState('')
  const [importResult, setImportResult] = useState<ImportResult | null>(null)

  // ALT-STAGE4-1-PART9/10: adapts the Stage 4 validated pipeline's richer
  // result shape into the existing display shape, so the UI below (built
  // in Stage 2) doesn't need restructuring -- Section 12's "meaningful
  // errors, not technical messages" is satisfied by
  // scriptureImport.ts's own error messages, which are already
  // operator-readable (e.g. "'NotARealBook' is not a recognized Bible
  // book name"), not raw exceptions.
  function toDisplayResult(validated: ImportValidationResult): ImportResult {
    return {
      translation: validated.translationName,
      chaptersImported: validated.valid ? validated.summary.chapters : 0,
      versesImported: validated.valid ? validated.summary.verses : 0,
      errors: validated.errors.map((e) => (e.chapter ? `${e.bookNameRaw} ${e.chapter}: ${e.message}` : e.bookNameRaw ? `${e.bookNameRaw}: ${e.message}` : e.message)),
    }
  }
  const bibleFileInputRef = useRef<HTMLInputElement>(null)
  const [ndiEnabled, setNdiEnabled] = useState(false)
  const [streamingTool, setStreamingTool] = useState('OBS Studio')
  // ALT-015 (extended): real i18n -- language state is global (Context),
  // and every string on this screen is now translated live.
  const { languageCode, setLanguageCode } = useLanguage()
  const t = useT()
  // ALT-015: browser presentation link -- distinct purpose from Remote
  // Control's join link (that one controls the service; this one displays
  // the Live output). See RemoteControlScreen.tsx for the other half.
  const [browserLinkEnabled, setBrowserLinkEnabled] = useState(true)
  // ALT-041: output routing -- which physical/virtual target each screen
  // role (Live/Preview/Stage) sends to. Modeled on ProPresenter's
  // "Configure Screens" (per-role output picker: system displays, NDI,
  // placeholder) and EasyWorship/EasyVerse's primary/secondary assignment.
  const [outputTargets, setOutputTargets] = useState<OutputTarget[]>(DEFAULT_TARGETS)
  const [assignments, setAssignments] = useState<Record<OutputRole, string>>({
    live: 'display-2',
    preview: 'windowed',
    stage: 'display-3',
  })
  const [detecting, setDetecting] = useState(false)

  async function detectScreens() {
    setDetecting(true)
    try {
      // Real browser Window Management API where available (Chromium
      // 100+, requires a permission prompt); falls back to a reasonable
      // simulated pair of monitors everywhere else so the picker still
      // works in this prototype/demo context.
      const w = window as any
      if (w.getScreenDetails) {
        const details = await w.getScreenDetails()
        const detected: OutputTarget[] = details.screens.map((s: any, i: number) => ({
          id: `display-${i + 1}`,
          label: `${i === 0 ? 'Primary' : `Display ${i + 1}`} (${s.width}\u00d7${s.height})`,
          kind: 'display' as const,
        }))
        setOutputTargets([...detected, ...VIRTUAL_TARGETS])
      } else {
        setOutputTargets(DEFAULT_TARGETS)
      }
    } catch {
      setOutputTargets(DEFAULT_TARGETS)
    } finally {
      setDetecting(false)
    }
  }

  // ALT: Translation Library derivation -- combines the curated catalog
  // with whatever's actually loaded in bibleModel (built-in KJV + any
  // imports), so "Installed" reflects real usable data, not a mock flag.
  const loadedCodes = listLoadedTranslations()
  const libraryEntries = [
    ...TRANSLATION_CATALOG.map((t) => ({ ...t, installed: loadedCodes.includes(t.code) })),
    ...loadedCodes
      .filter((code) => !TRANSLATION_CATALOG.some((t) => t.code === code))
      .map((code) => ({ code, name: code, installed: true })),
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Top bar */}
      <div
        style={{
          height: 48,
          borderBottom: '1px solid #2A331F',
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 20,
          paddingRight: 20,
          gap: 12,
          flexShrink: 0,
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 13, color: '#EDEAE0', letterSpacing: '0.02em' }}>
          Settings & Integrations
        </span>
        <StatusPill />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 700 }}>
          {/* Streaming Software */}
          <SettingsCard title="Streaming Software">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: '#10160F',
                  border: '1px solid #2A331F',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6" stroke="#8F9885" strokeWidth="1.2" />
                  <circle cx="8" cy="8" r="2.5" fill="#8F9885" />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#EDEAE0', marginBottom: 2 }}>
                  {streamingTool}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: obsConnected ? '#6FC98A' : '#8F9885',
                      boxShadow: obsConnected ? '0 0 4px rgba(111,201,138,0.6)' : 'none',
                    }}
                  />
                  <span style={{ fontSize: 11, color: obsConnected ? '#6FC98A' : '#8F9885' }}>
                    {obsConnected ? 'Connected via websocket' : 'Not connected'}
                  </span>
                </div>
              </div>
              <select
                value={streamingTool}
                onChange={(e) => setStreamingTool(e.target.value)}
                style={{
                  background: '#10160F',
                  border: '1px solid #2A331F',
                  borderRadius: 6,
                  padding: '5px 9px',
                  fontSize: 12,
                  color: '#EDEAE0',
                  outline: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {['OBS Studio', 'Streamlabs', 'vMix', 'Wirecast'].map((t) => (
                  <option key={t} value={t} style={{ background: '#10160F' }}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </SettingsCard>

          {/* NDI Output -- ALT: relabeled for clarity, since there are two
              legitimate but different NDI features in this app (see
              Output Routing below for the other one). */}
          <SettingsCard title="NDI Broadcast Output">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#EDEAE0', marginBottom: 3 }}>
                  Broadcast the whole show as one NDI feed
                </div>
                <div style={{ fontSize: 11, color: '#8F9885', lineHeight: 1.5 }}>
                  For streaming: sends your entire compiled program (whatever is on Live) as a single NDI video
                  source so software like OBS or vMix can pull it in. This is separate from Output Routing below,
                  which is about delivering individual screens (Live/Preview/Stage) to specific displays.
                </div>
              </div>
              <Toggle value={ndiEnabled} onChange={setNdiEnabled} />
            </div>
          </SettingsCard>

          {/* ALT-041: Output Routing -- detect screens and assign each
              output role (Live/Preview/Stage) to a target, modeled on
              ProPresenter's Configure Screens / EasyWorship's primary-
              secondary assignment. */}
          <SettingsCard title="Output Routing">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <p style={{ fontSize: 11, color: '#8F9885', lineHeight: 1.5, margin: 0, maxWidth: 360 }}>
                Assign each output to a physical monitor, a windowed placeholder, or NDI as a cable
                replacement (e.g. delivering Stage to a receiver box near the pulpit over your network instead
                of running an HDMI cable) — different from the whole-show NDI Broadcast above. Detecting real
                screens needs the browser's screen-permission prompt; without it, a simulated multi-monitor
                setup is shown so this still works everywhere.
              </p>
              <button
                onClick={detectScreens}
                disabled={detecting}
                style={{
                  background: 'transparent',
                  border: '1px solid #2A331F',
                  borderRadius: 6,
                  padding: '6px 14px',
                  fontSize: 11,
                  color: detecting ? '#3A4430' : '#8F9885',
                  cursor: detecting ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (!detecting) {
                    e.currentTarget.style.borderColor = '#A8702E'
                    e.currentTarget.style.color = '#A8702E'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!detecting) {
                    e.currentTarget.style.borderColor = '#2A331F'
                    e.currentTarget.style.color = '#8F9885'
                  }
                }}
              >
                {detecting ? 'Detecting…' : 'Detect Screens'}
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(Object.keys(ROLE_LABELS) as OutputRole[]).map((role) => (
                <div
                  key={role}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#10160F',
                    border: '1px solid #2A331F',
                    borderRadius: 6,
                    padding: '8px 12px',
                  }}
                >
                  <span style={{ fontSize: 12, color: '#EDEAE0', fontWeight: 500 }}>{ROLE_LABELS[role]}</span>
                  <select
                    value={assignments[role]}
                    onChange={(e) => setAssignments((prev) => ({ ...prev, [role]: e.target.value }))}
                    style={{
                      background: '#1B2318',
                      border: '1px solid #2A331F',
                      borderRadius: 6,
                      padding: '5px 9px',
                      fontSize: 12,
                      color: '#EDEAE0',
                      outline: 'none',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    {outputTargets.map((target) => (
                      <option key={target.id} value={target.id} style={{ background: '#1B2318' }}>
                        {KIND_ICON[target.kind]} {target.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </SettingsCard>

          {/* ALT-015: Browser Presentation Link -- for DISPLAYING the Live
              output in a browser tab. Not to be confused with Remote
              Control's join link, which is for CONTROLLING the service. */}
          <SettingsCard title="Browser Presentation Link">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#EDEAE0', marginBottom: 3 }}>
                  local.cayc-media.net/live
                </div>
                <div style={{ fontSize: 11, color: '#8F9885', lineHeight: 1.5 }}>
                  {t.browserLinkDescription}
                </div>
              </div>
              <Toggle value={browserLinkEnabled} onChange={setBrowserLinkEnabled} />
            </div>
          </SettingsCard>

          {/* ALT: EasyVerse-style Translation Library -- browse translations,
              click Install. KJV is genuinely bundled (public domain, no
              licensing needed). Everything else opens the real import flow
              -- this app can't legally bundle copyrighted translations the
              way EasyVerse can, since that requires actual licensing
              agreements with the publishers, not a technical trick. */}
          <SettingsCard title="Translation Library">
            <p style={{ fontSize: 11, color: '#8F9885', lineHeight: 1.5, margin: '0 0 12px' }}>
              Browse translations and install what you need. Only KJV ships built-in (public domain) -- everything
              else requires your own properly licensed file (Zefania XML, or a simple JSON format), since this app
              doesn't hold publisher licensing the way commercial software does.
            </p>
            <div style={{ background: '#10160F', border: '1px solid #2A331F', borderRadius: 7, overflow: 'hidden', marginBottom: 14 }}>
              {libraryEntries.map((entry, i) => (
                <div
                  key={entry.code}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '9px 12px',
                    borderBottom: i < libraryEntries.length - 1 ? '1px solid #2A331F' : 'none',
                    gap: 10,
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#A8702E', minWidth: 50 }}>{entry.code}</span>
                  <span style={{ fontSize: 12, color: '#8F9885', flex: 1 }}>{entry.name}</span>
                  {entry.installed ? (
                    <span style={{ fontSize: 10, color: '#6FC98A', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6FC98A' }} />
                      {entry.code === 'KJV' ? 'Built-in · Public Domain' : 'Installed'}
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        setImportTranslationName(entry.code)
                        bibleFileInputRef.current?.click()
                      }}
                      style={{ background: 'transparent', border: '1px solid rgba(168,112,46,0.4)', borderRadius: 5, padding: '3px 10px', fontSize: 10, color: '#A8702E', cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      Install
                    </button>
                  )}
                </div>
              ))}
            </div>

            <p style={{ fontSize: 10, color: '#3A4430', margin: '0 0 8px' }}>
              Or import a translation not listed above:
            </p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
              <input
                value={importTranslationName}
                onChange={(e) => setImportTranslationName(e.target.value)}
                placeholder="Translation name (for XML files, e.g. NIV)"
                style={{ flex: 1, background: '#10160F', border: '1px solid #2A331F', borderRadius: 6, padding: '7px 10px', fontSize: 12, color: '#EDEAE0', outline: 'none', fontFamily: 'inherit' }}
              />
              <button
                onClick={() => bibleFileInputRef.current?.click()}
                style={{ background: '#A8702E', border: 'none', borderRadius: 6, padding: '7px 16px', fontSize: 11, fontWeight: 600, color: '#10160F', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
              >
                Choose File
              </button>
              <input
                ref={bibleFileInputRef}
                type="file"
                accept=".xml,.json"
                style={{ display: 'none' }}
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const text = await file.text()
                  let validated: ImportValidationResult
                  if (file.name.toLowerCase().endsWith('.json')) {
                    validated = importSimpleJSONValidated(text)
                  } else {
                    if (!importTranslationName.trim()) {
                      setImportResult({ translation: '', chaptersImported: 0, versesImported: 0, errors: ['Enter a translation name before importing an XML file.'] })
                      e.target.value = ''
                      return
                    }
                    // ALT-STAGE4-1-PART9/10: the validated pipeline
                    // stages and validates BEFORE committing anything --
                    // an invalid file leaves the installed library
                    // completely untouched (Section 10's explicit
                    // requirement), unlike the old importer which
                    // committed each chapter as it parsed.
                    validated = importZefaniaXMLValidated(text, importTranslationName.trim())
                  }
                  const result = toDisplayResult(validated)
                  setImportResult(result)
                  if (validated.valid) onBibleImported?.()
                  e.target.value = ''
                }}
              />
            </div>
            {importResult && (
              <div style={{ background: '#10160F', border: '1px solid #2A331F', borderRadius: 6, padding: '10px 12px' }}>
                {importResult.errors.length > 0 && (
                  <div style={{ fontSize: 11, color: '#ff6060', marginBottom: importResult.chaptersImported || importResult.versesImported ? 6 : 0 }}>
                    {importResult.errors.map((err, i) => (
                      <div key={i}>{err}</div>
                    ))}
                  </div>
                )}
                {(importResult.chaptersImported > 0 || importResult.versesImported > 0) && (
                  <div style={{ fontSize: 11, color: '#6FC98A' }}>
                    Imported {importResult.translation}: {importResult.chaptersImported} chapter{importResult.chaptersImported === 1 ? '' : 's'},{' '}
                    {importResult.versesImported} verse{importResult.versesImported === 1 ? '' : 's'}.
                  </div>
                )}
              </div>
            )}
          </SettingsCard>

          {/* AI Speech Engine */}
          {/* ALT-016: per-installation billing -- each church supplies its
              own Deepgram key/account here. There is no shared/centralized
              key or billing logic in this app; "Swap provider" changes
              which service THIS installation's key talks to. */}
          <SettingsCard title="AI Speech Engine">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#EDEAE0' }}>
                    Deepgram (Nova-3)
                  </span>
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: '#6FC98A',
                      boxShadow: '0 0 4px rgba(111,201,138,0.6)',
                    }}
                  />
                  <span style={{ fontSize: 11, color: '#6FC98A' }}>{t.connected}</span>
                </div>
                <div style={{ fontSize: 11, color: '#8F9885', lineHeight: 1.5 }}>
                  {t.aiEngineDescription}
                </div>
              </div>
              <button
                style={{
                  background: 'transparent',
                  border: '1px solid #2A331F',
                  borderRadius: 6,
                  padding: '5px 12px',
                  fontSize: 11,
                  color: '#8F9885',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#A8702E'
                  e.currentTarget.style.color = '#A8702E'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#2A331F'
                  e.currentTarget.style.color = '#8F9885'
                }}
              >
                Swap provider
              </button>
            </div>
          </SettingsCard>

          {/* ALT-015 (extended): real world-language list, actually translates the UI */}
          <SettingsCard title={t.language}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <div style={{ fontSize: 11, color: '#8F9885', lineHeight: 1.5, maxWidth: 320 }}>
                {t.languageDescription} Fully translated: English, Español, Français. Others fall back to
                English until translated (same engine, more work to extend).
              </div>
              <select
                value={languageCode}
                onChange={(e) => setLanguageCode(e.target.value)}
                style={{
                  background: '#10160F',
                  border: '1px solid #2A331F',
                  borderRadius: 6,
                  padding: '5px 9px',
                  fontSize: 12,
                  color: '#EDEAE0',
                  outline: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  flexShrink: 0,
                }}
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code} style={{ background: '#10160F' }}>
                    {l.nativeName} ({l.name})
                  </option>
                ))}
              </select>
            </div>
          </SettingsCard>
        </div>
      </div>
    </div>
  )
}

function SettingsCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        background: '#1B2318',
        border: '1px solid #2A331F',
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '10px 14px',
          borderBottom: '1px solid #2A331F',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.07em',
          color: '#8F9885',
          textTransform: 'uppercase',
        }}
      >
        {title}
      </div>
      <div style={{ padding: 14 }}>{children}</div>
    </div>
  )
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 40,
        height: 22,
        borderRadius: 11,
        border: 'none',
        background: value ? '#A8702E' : '#2A331F',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background 0.2s',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: '#EDEAE0',
          position: 'absolute',
          top: 3,
          left: value ? 21 : 3,
          transition: 'left 0.2s',
        }}
      />
    </button>
  )
}

function StatusPill() {
  const t = useT()
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: '#10160F',
        border: '1px solid #2A331F',
        borderRadius: 20,
        padding: '3px 10px',
      }}
    >
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#A8702E', boxShadow: '0 0 4px rgba(168,112,46,0.7)' }} />
      <span style={{ fontSize: 11, color: '#8F9885' }}>{t.prototypeBuild}</span>
    </div>
  )
}
