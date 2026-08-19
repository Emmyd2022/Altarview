import { useState, type ReactNode } from 'react'
import { APP_INITIALS } from './config'
import type { DisplayContent } from './screens/OutputStage'
import { useStageTimer } from './hooks/useStageTimer'
import { DEFAULT_SESSIONS, type ServiceSession } from './sessionModel'
import OperatorScreen from './screens/OperatorScreen'
import PreviewScreen from './screens/PreviewScreen'
import LiveScreen from './screens/LiveScreen'
import StageScreen from './screens/StageScreen'
import StageControlScreen from './screens/StageControlScreen'
import SongLyricsScreen from './screens/SongLyricsScreen'
import SermonSlidesScreen from './screens/SermonSlidesScreen'
import PlaylistScreen from './screens/PlaylistScreen'
import TimerScreen from './screens/TimerScreen'
import ThemesScreen from './screens/ThemesScreen'
import { DEFAULT_THEMES, type ThemeDef } from './themeModel'
import { DEFAULT_SONGS, type Song } from './songModel'
import UpNextScreen from './screens/UpNextScreen'
import MediaScreen from './screens/MediaScreen'
import PluginsScreen from './screens/PluginsScreen'
import RecordingScreen from './screens/RecordingScreen'
import RemoteControlScreen from './screens/RemoteControlScreen'
import SettingsScreen from './screens/SettingsScreen'

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
    id: 'songs',
    label: 'Song Lyrics',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M7 14V5l8-2v9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="5" cy="14" r="2" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="13" cy="12" r="2" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
  },
  {
    id: 'slides',
    label: 'Sermon Notes & Slides',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="3" y="2" width="12" height="14" rx="2" stroke="currentColor" strokeWidth="1.4" />
        <path d="M6 6h6M6 9h6M6 12h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
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
    id: 'timer',
    label: 'Timer / Countdown',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="10" r="6" stroke="currentColor" strokeWidth="1.4" />
        <path d="M9 7v3l2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 2h4M9 2v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
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
    id: 'up-next',
    label: 'Up Next',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M4 4l6 5-6 5V4z" fill="currentColor" />
        <path d="M12 4v10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
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
  // ALT-003: lifted here so Operator and the two output screens share
  // one source of truth instead of each faking its own local state.
  const [previewContent, setPreviewContent] = useState<DisplayContent | null>(null)
  const [liveContent, setLiveContent] = useState<DisplayContent | null>(null)
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
  const [activeThemeId, setActiveThemeId] = useState(
    DEFAULT_THEMES.find((t) => t.category === 'Middle')?.id ?? DEFAULT_THEMES[0].id,
  )
  const activeTheme = themes.find((t) => t.id === activeThemeId) ?? null

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
          onChangeTranslation={(translation, text) =>
            setLiveContent((prev) => (prev ? { ...prev, translation, text } : prev))
          }
          theme={activeTheme}
        />
      </div>
    )
  }
  if (screen === 'stage') {
    return (
      <div style={{ width: '100vw', height: '100vh' }}>
        <StageScreen state={stageTimer} onExit={() => setScreen('operator')} />
      </div>
    )
  }

  const screens: Record<Exclude<Screen, 'preview' | 'live' | 'stage'>, ReactNode> = {
    operator: (
      <OperatorScreen
        previewContent={previewContent}
        liveContent={liveContent}
        onSendPreview={(v) => setPreviewContent({ type: 'verse', ...v })}
        onSendLive={(v) => setLiveContent({ type: 'verse', ...v })}
        onPushToLive={() => setLiveContent(previewContent)}
        onClearPreview={() => setPreviewContent(null)}
        onClearLive={() => setLiveContent(null)}
        onChangeLiveTranslation={(translation, text) =>
          setLiveContent((prev) => (prev && prev.type === 'verse' ? { ...prev, translation, text } : prev))
        }
        onSetLiveSecondary={(translation, text) =>
          setLiveContent((prev) =>
            prev && prev.type === 'verse'
              ? { ...prev, secondaryTranslation: translation ?? undefined, secondaryText: text ?? undefined }
              : prev,
          )
        }
        onOpenPreview={() => setScreen('preview')}
        onOpenLive={() => setScreen('live')}
      />
    ),
    songs: (
      <SongLyricsScreen
        onSendPreview={(content) => setPreviewContent(content)}
        onSendLive={(content) => setLiveContent(content)}
        songs={songs}
        onChangeSongs={setSongs}
      />
    ),
    slides: <SermonSlidesScreen onSendLive={(content) => setLiveContent(content)} />,
    playlist: (
      <PlaylistScreen
        sessions={sessions}
        onChangeSessions={setSessions}
        onSendLive={(content) => setLiveContent(content)}
        songs={songs}
        onStartService={() => {
          // Confirmed: Start Service only starts the countdown -- it does
          // NOT force-navigate. The operator manages/watches it from
          // Stage Control on their own terms, by clicking there themselves.
          stageTimer.startFromBeginning()
        }}
      />
    ),
    timer: <TimerScreen />,
    themes: (
      <ThemesScreen
        themes={themes}
        onChangeThemes={setThemes}
        activeThemeId={activeThemeId}
        onSetActive={setActiveThemeId}
      />
    ),
    'up-next': <UpNextScreen sessions={sessions} />,
    media: <MediaScreen onSendLive={(content) => setLiveContent(content)} />,
    plugins: <PluginsScreen />,
    recording: <RecordingScreen />,
    remote: <RemoteControlScreen />,
    settings: <SettingsScreen />,
    'stage-control': (
      <StageControlScreen
        state={stageTimer}
        onOpenStageOutput={() => setScreen('stage')}
        onPushToLive={(content) => setLiveContent(content)}
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
          {PRESENT_NAV.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              active={screen === item.id}
              onClick={() => setScreen(item.id)}
            />
          ))}
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
        {screens[screen as Exclude<Screen, 'preview' | 'live' | 'stage'>]}
      </div>
    </div>
  )
}
