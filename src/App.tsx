import { useState, useEffect, type ReactNode } from 'react'
import { APP_INITIALS } from './config'
import type { DisplayContent } from './screens/OutputStage'
import { useStageTimer } from './hooks/useStageTimer'
import { DEFAULT_SESSIONS, type ServiceSession } from './sessionModel'
import OperatorScreen, { type OperatorPage } from './screens/OperatorScreen'
import PreviewScreen from './screens/PreviewScreen'
import LiveScreen from './screens/LiveScreen'
import StageScreen from './screens/StageScreen'
import StageControlScreen from './screens/StageControlScreen'
import PlaylistScreen from './screens/PlaylistScreen'
import ThemesScreen from './screens/ThemesScreen'
import { DEFAULT_THEMES, type ThemeDef } from './themeModel'
import { DEFAULT_SONGS, type Song } from './songModel'
import { getAppServices } from './core/AppServices'
import { migratePinnedItems } from './core/pinMigration'
import { usePresentationEngine } from './core/PresentationEngine'
import { getAllLoadedChapters, getAllLoadedVerses, addImportedChapter, addImportedVerses } from './bibleModel'
import type { PinnedItem } from './pinModel'
import MediaScreen from './screens/MediaScreen'
import PluginsScreen from './screens/PluginsScreen'
import RecordingScreen from './screens/RecordingScreen'
import RemoteControlScreen from './screens/RemoteControlScreen'
import SettingsScreen from './screens/SettingsScreen'
import PresentationTestMode from './screens/PresentationTestMode'

type Screen =
  | 'operator'
  | 'songs'
  | 'slides'
  | 'playlist'
  | 'timer'
  | 'themes'
  | 'up-next'
  | 'media'
  | 'plugins'
  | 'recording'
  | 'remote'
  | 'settings'
  | 'preview'
  | 'live'
  | 'stage'
  | 'stage-control'
  | 'test-mode'

interface NavItem {
  id: Screen
  label: string
  icon: ReactNode
}

const PRESENT_NAV: NavItem[] = [
  {
    id: 'operator',
    label: 'Live Control',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="7.5" cy="7.5" r="4.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M11 11L15 15" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'playlist',
    label: 'Service Playlist',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M3 5h12M3 9h12M3 13h7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M13 11l3 2-3 2v-4z" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'stage',
    label: 'Stage Output',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="2" y="4" width="14" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M6 16h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="9" cy="8.5" r="2" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    ),
  },
  {
    id: 'stage-control',
    label: 'Stage Control',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M9 5.5v4l2.5 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="9" cy="9" r="1" fill="currentColor" />
      </svg>
    ),
  },
]

const MANAGE_NAV: NavItem[] = [
  {
    id: 'themes',
    label: 'Themes',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M9 3v2M9 13v2M3 9h2M13 9h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'media',
    label: 'Media & External',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="2" y="4" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M7 7.5l4.5 2.5-4.5 2.5v-5z" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'plugins',
    label: 'Plugins',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path
          d="M7.5 2.5H5a2 2 0 00-2 2v2.5a2 2 0 002 2H7.5m0-6.5v6.5m0-6.5H10a2 2 0 012 2V7a2 2 0 01-2 2H7.5m0 0V15m0 0H5a2 2 0 01-2-2v-2.5a2 2 0 012-2h2.5m3.5-4h2.5a2 2 0 012 2V9a2 2 0 01-2 2H11"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: 'recording',
    label: 'Recording & Archive',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="2" y="5" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.4" />
        <path d="M2 8h14" stroke="currentColor" strokeWidth="1.4" />
        <path d="M6 3h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="9" cy="12" r="1.5" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    ),
  },
  {
    id: 'remote',
    label: 'Remote Control',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="5" y="2" width="8" height="14" rx="3" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="9" cy="13" r="1" fill="currentColor" />
        <path d="M7 6h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'settings',
    label: 'Settings & Integrations',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.4" />
        <path
          d="M9 1.5l.9 1.8a5.5 5.5 0 011.4.6l2-.3 1 1.7-1.3 1.6v1.2l1.3 1.6-1 1.7-2-.3a5.5 5.5 0 01-1.4.6L9 16.5l-.9-1.8a5.5 5.5 0 01-1.4-.6l-2 .3-1-1.7 1.3-1.6V9.4L3.7 7.8l1-1.7 2 .3A5.5 5.5 0 018.1 5.8L9 1.5z"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: 'test-mode',
    label: 'Presentation Test Mode',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M6 3l6 6-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="14" cy="15" r="1.4" fill="currentColor" />
      </svg>
    ),
  },
]

function NavButton({
  item,
  active,
  onClick,
}: {
  item: NavItem
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      title={item.label}
      style={{
        width: 40,
        height: 36,
        borderRadius: 7,
        border: 'none',
        background: active ? 'rgba(168,112,46,0.1)' : 'transparent',
        color: active ? '#A8702E' : '#8F9885',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'background 0.15s, color 0.15s',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
          e.currentTarget.style.color = '#EDEAE0'
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = '#8F9885'
        }
      }}
    >
      {item.icon}
    </button>
  )
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('operator')
  // ALT: unified Operator screen -- Scripture, Songs, Slides, Timer, and
  // Up Next are now pages within Operator instead of separate top-level
  // screens, so the Preview/Live/Pinned panel stays visible on all of them.
  const [operatorPage, setOperatorPage] = useState<OperatorPage>('scripture')

  function openOperatorPage(page: OperatorPage) {
    setScreen('operator')
    setOperatorPage(page)
  }
  // ALT-STAGE3: Preview/Live/Foldback(Stage) are now owned by the
  // Presentation Engine (src/core/PresentationEngine.ts) instead of raw
  // useState here -- this is the single authoritative presentation state
  // the brief requires. Instantiated below, after `songs` is declared
  // (song navigation needs it). `previewContent`/`liveContent`/
  // `stageContent` stay as read-only aliases so every existing call site
  // elsewhere in this file keeps working unchanged.
  // ALT-017/018/019: lifted so the Stage output and the operator's Stage
  // Control panel share one timer instead of each faking its own.
  // ALT-022: sessions are lifted here too, so the Playlist editor and the
  // Stage timer both read/drive the same underlying data.
  const [sessions, setSessions] = useState<ServiceSession[]>(DEFAULT_SESSIONS)
  const stageTimer = useStageTimer(sessions)
  // ALT-043: theme state lifted here so Live/Preview can render using
  // whichever theme is marked active, instead of a hardcoded style.
  const [themes, setThemes] = useState<ThemeDef[]>(DEFAULT_THEMES)
  // ALT: songs lifted here so Song Lyrics and Service Playlist share the
  // same real song/lyrics data -- lets Playlist look up a song's actual
  // sections for inline verse/chorus navigation.
  const [songs, setSongs] = useState<Song[]>(DEFAULT_SONGS)
  // ALT-STAGE3: the engine, now that `songs` (needed for song-navigation
  // logic) exists.
  const engine = usePresentationEngine(songs)
  const previewContent = engine.preview
  const liveContent = engine.live
  const stageContent = engine.foldback
  // ALT: Bible import -- bumped whenever Settings imports a new
  // translation file, so Operator re-renders and picks up the newly
  // added (mutated in bibleModel.ts) chapters/verses.
  const [bibleDataVersion, setBibleDataVersion] = useState(0)
  const [activeThemeId, setActiveThemeId] = useState(
    DEFAULT_THEMES.find((t) => t.category === 'Middle')?.id ?? DEFAULT_THEMES[0].id,
  )
  const activeTheme = themes.find((t) => t.id === activeThemeId) ?? null
  // ALT-STAGE2-PART4/6: pinned items are persistent state -- lifted here
  // (previously local to OperatorScreen, lost on navigation) so they can
  // be saved/restored the same way songs/themes/sessions already are.
  const [pinned, setPinned] = useState<PinnedItem[]>([])
  // ALT-STAGE2-PART2/6: real persistence. `loading` gates the first
  // render so we don't briefly flash default data before persisted data
  // (if any exists) has loaded -- and so the save-effects below don't
  // fire during the load itself, which would just re-save what was just
  // loaded.
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const services = await getAppServices()
      const [storedSongs, storedThemes, storedSessions, storedPinned, activeThemeMeta, chapters, verses] = await Promise.all([
        services.songRepo.getAll(),
        services.themeRepo.getAll(),
        services.serviceRepo.getAll(),
        services.pinnedRepo.getAll(),
        services.themeRepo.getActiveThemeId(),
        services.bibleRepo.getAllChapters(),
        services.bibleRepo.getAllVerses(),
      ])
      if (cancelled) return
      if (storedSongs.length > 0) setSongs(storedSongs)
      if (storedThemes.length > 0) setThemes(storedThemes)
      if (storedSessions.length > 0) setSessions(storedSessions)
      // ALT-STAGE4-2-PART15/16/17: legacy pins (pre-Stage-4.2, flat
      // verseRef-string shape) are migrated to the new discriminated-
      // union `target` shape here, once, on load. A pin that can't be
      // migrated (malformed/unparseable legacy reference) is dropped
      // with a console warning rather than crashing the whole load or
      // silently losing every other pin. The migrated set is
      // immediately re-saved, so this only ever runs once per pin.
      if (storedPinned.length > 0) {
        const { items: migratedPinned, report } = migratePinnedItems(storedPinned as unknown[])
        setPinned(migratedPinned)
        if (report.migrated > 0 || report.failed.length > 0) {
          services.pinnedRepo.replaceAll(migratedPinned)
        }
        if (report.failed.length > 0) {
          // eslint-disable-next-line no-console
          console.warn(`[Altarview] ${report.failed.length} pinned item(s) could not be migrated and were dropped:`, report.failed)
        }
      }
      if (activeThemeMeta) setActiveThemeId(activeThemeMeta)
      // ALT-STAGE2-PART5: repopulate bibleModel's in-memory Map with
      // whatever was previously imported, so imported translations
      // survive a reload instead of only lasting the current session.
      for (const c of chapters) addImportedChapter(c.book, c.chapter, c.translation, c.verses)
      if (verses.length > 0) addImportedVerses(verses)
      if (chapters.length > 0 || verses.length > 0) setBibleDataVersion((v) => v + 1)
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ALT-STAGE2-PART2/6: save-on-change effects. Each one is a no-op
  // until the initial load above completes, so we never overwrite
  // freshly-loaded persisted data with the in-memory defaults it was
  // about to be replaced by.
  useEffect(() => {
    if (loading) return
    getAppServices().then((s) => s.songRepo.saveAll(songs))
  }, [songs, loading])

  useEffect(() => {
    if (loading) return
    getAppServices().then((s) => s.themeRepo.saveAll(themes))
  }, [themes, loading])

  useEffect(() => {
    if (loading) return
    getAppServices().then((s) => s.themeRepo.setActiveThemeId(activeThemeId))
  }, [activeThemeId, loading])

  useEffect(() => {
    if (loading) return
    getAppServices().then((s) => s.serviceRepo.replaceAll(sessions))
  }, [sessions, loading])

  useEffect(() => {
    if (loading) return
    getAppServices().then((s) => s.pinnedRepo.replaceAll(pinned))
  }, [pinned, loading])

  // ALT-STAGE2-PART5: persists the FULL current Bible dataset snapshot
  // (built-in + everything imported so far) whenever bibleDataVersion
  // changes -- i.e. right after a new import completes. Simpler and more
  // robust than trying to persist only "the delta" from each import call.
  useEffect(() => {
    if (loading || bibleDataVersion === 0) return
    getAppServices().then(async (s) => {
      const chapters = getAllLoadedChapters().map((c) => ({ id: `${c.book}|${c.chapter}|${c.translation}`, ...c }))
      const verses = getAllLoadedVerses().map((v) => ({ id: `${v.book}|${v.chapter}|${v.verse}|${v.translation}`, ...v }))
      await Promise.all([
        ...chapters.map((c) => s.bibleRepo.saveChapter(c)),
        s.bibleRepo.saveVerses(verses),
      ])
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bibleDataVersion, loading])

  // ALT-STAGE2-PART2: a minimal, deliberately unstyled loading gate --
  // Stage 2 does not redesign the interface, so this is intentionally
  // plain rather than a polished splash screen.
  if (loading) {
    return (
      <div style={{ width: '100vw', height: '100vh', background: '#10160F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#8F9885', fontFamily: 'Inter, Segoe UI, sans-serif', fontSize: 13 }}>Loading Altarview…</span>
      </div>
    )
  }

  if (screen === 'preview') {
    return (
      <div style={{ width: '100vw', height: '100vh' }}>
        <PreviewScreen content={previewContent} onExit={() => setScreen('operator')} theme={activeTheme} />
      </div>
    )
  }
  if (screen === 'live') {
    return (
      <div style={{ width: '100vw', height: '100vh' }}>
        <LiveScreen
          content={liveContent}
          onExit={() => setScreen('operator')}
          onChangeTranslation={(translation, text) => engine.changeLiveTranslation(translation, text)}
          theme={activeTheme}
          songs={songs}
          onNavigateSong={(content) => engine.sendToLive(content)}
        />
      </div>
    )
  }
  if (screen === 'stage') {
    return (
      <div style={{ width: '100vw', height: '100vh' }}>
        <StageScreen state={stageTimer} onExit={() => setScreen('operator')} content={stageContent} />
      </div>
    )
  }

  const screens: Record<Exclude<Screen, 'preview' | 'live' | 'stage' | 'songs' | 'slides' | 'timer' | 'up-next'>, ReactNode> = {
    operator: (
      <OperatorScreen
        page={operatorPage}
        onChangePage={setOperatorPage}
        bibleDataVersion={bibleDataVersion}
        previewContent={previewContent}
        liveContent={liveContent}
        onSendPreview={(v) => engine.stageToPreview({ type: 'verse', ...v })}
        onSendLive={(v) => engine.sendToLive({ type: 'verse', ...v })}
        onPushToLive={() => engine.pushPreviewToLive()}
        onClearPreview={() => engine.clearPreview()}
        onClearLive={() => engine.clearLive()}
        onChangeLiveTranslation={(translation, text) => engine.changeLiveTranslation(translation, text)}
        onSetLiveSecondary={(translation, text) => engine.setLiveSecondaryTranslation(translation, text)}
        onOpenPreview={() => setScreen('preview')}
        onOpenLive={() => setScreen('live')}
        songs={songs}
        onChangeSongs={setSongs}
        onSendPreviewContent={(content) => engine.stageToPreview(content)}
        onSendLiveContent={(content) => engine.sendToLive(content)}
        onSendStageContent={(content) => engine.sendToFoldback(content)}
        sessions={sessions}
        pinned={pinned}
        onChangePinned={setPinned}
        foldbackContent={stageContent}
      />
    ),
    playlist: (
      <PlaylistScreen
        sessions={sessions}
        onChangeSessions={setSessions}
        onStartService={() => {
          // Confirmed: Start Service only starts the countdown -- it does
          // NOT force-navigate. The operator manages/watches it from
          // Stage Control on their own terms, by clicking there themselves.
          stageTimer.startFromBeginning()
        }}
      />
    ),
    themes: (
      <ThemesScreen
        themes={themes}
        onChangeThemes={setThemes}
        activeThemeId={activeThemeId}
        onSetActive={setActiveThemeId}
      />
    ),
    media: <MediaScreen onSendLive={(content) => engine.sendToLive(content)} />,
    plugins: <PluginsScreen />,
    recording: <RecordingScreen />,
    remote: <RemoteControlScreen />,
    settings: <SettingsScreen onBibleImported={() => setBibleDataVersion((v) => v + 1)} />,
    'test-mode': <PresentationTestMode engine={engine} stageTimer={stageTimer} />,
    'stage-control': (
      <StageControlScreen
        state={stageTimer}
        onOpenStageOutput={() => setScreen('stage')}
        onPushToLive={(content) => engine.sendToLive(content)}
        hasStageContent={!!stageContent}
        onClearStage={() => engine.clearFoldback()}
        onNextFoldback={() => engine.nextFoldback()}
        onPreviousFoldback={() => engine.previousFoldback()}
      />
    ),
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#10160F', overflow: 'hidden' }}>
      {/* Sidebar */}
      <nav
        style={{
          width: 56,
          flexShrink: 0,
          background: '#0B0F09',
          borderRight: '1px solid #2A331F',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: 12,
          paddingBottom: 12,
        }}
      >
        {/* Altarview Logo badge */}
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 7,
            background: 'rgba(168,112,46,0.15)',
            border: '1px solid rgba(168,112,46,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 14,
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#A8702E',
              letterSpacing: '0.04em',
              fontFamily: 'Inter, Segoe UI, sans-serif',
            }}
          >
            {APP_INITIALS}
          </span>
        </div>

        {/* PRESENT section */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            width: '100%',
            padding: '0 8px',
          }}
        >
          <span
            style={{
              fontSize: 8,
              fontWeight: 600,
              letterSpacing: '0.1em',
              color: '#3A4430',
              textTransform: 'uppercase',
              marginBottom: 4,
              fontFamily: 'Inter, Segoe UI, sans-serif',
            }}
          >
            PRESENT
          </span>
          {PRESENT_NAV.map((item) => {
            const mergedPages: Record<string, OperatorPage> = {
              operator: 'scripture',
              songs: 'songs',
              slides: 'slides',
              timer: 'timer',
              'up-next': 'up-next',
            }
            const isMerged = item.id in mergedPages
            return (
              <NavButton
                key={item.id}
                item={item}
                active={isMerged ? screen === 'operator' && operatorPage === mergedPages[item.id] : screen === item.id}
                onClick={() => (isMerged ? openOperatorPage(mergedPages[item.id]) : setScreen(item.id))}
              />
            )
          })}
        </div>

        {/* Divider */}
        <div
          style={{
            width: 28,
            height: 1,
            background: '#2A331F',
            margin: '10px 0',
            flexShrink: 0,
          }}
        />

        {/* MANAGE section */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            width: '100%',
            padding: '0 8px',
          }}
        >
          <span
            style={{
              fontSize: 8,
              fontWeight: 600,
              letterSpacing: '0.1em',
              color: '#3A4430',
              textTransform: 'uppercase',
              marginBottom: 4,
              fontFamily: 'Inter, Segoe UI, sans-serif',
            }}
          >
            MANAGE
          </span>
          {MANAGE_NAV.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              active={screen === item.id}
              onClick={() => setScreen(item.id)}
            />
          ))}
        </div>
      </nav>

      {/* Main content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {screens[screen as Exclude<Screen, 'preview' | 'live' | 'stage' | 'songs' | 'slides' | 'timer' | 'up-next'>]}
      </div>
    </div>
  )
}
