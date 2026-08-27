import { useState } from 'react'

interface Plugin {
  id: string
  name: string
  description: string
  enabled: boolean
  version: string
}

const INITIAL_PLUGINS: Plugin[] = [
  {
    id: 'hello-world',
    name: 'Hello world sample',
    description: 'Starter plugin demonstrating the Altarview plugin API.',
    enabled: true,
    version: '1.0.0',
  },
  {
    id: 'recording',
    name: 'Recording and storage',
    description: 'Automatically records each service session and archives displayed verses.',
    enabled: false,
    version: '0.9.2',
  },
  {
    id: 'obs',
    name: 'Streaming capture (OBS)',
    description: 'Sends verse overlays to OBS via websocket for live stream integration.',
    enabled: false,
    version: '1.2.1',
  },
  {
    id: 'remote',
    name: 'Remote control',
    description: 'Allows worship leaders to trigger verses from a phone or tablet.',
    enabled: false,
    version: '0.7.0',
  },
  {
    id: 'ai-training',
    name: 'AI accuracy training',
    description: 'Captures corrections to AI auto-detect suggestions to improve future accuracy.',
    enabled: false,
    version: '0.3.1',
  },
]

export default function PluginsScreen() {
  const [plugins, setPlugins] = useState(INITIAL_PLUGINS)

  function toggle(id: string) {
    setPlugins((prev) => prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p)))
  }

  const enabledCount = plugins.filter((p) => p.enabled).length

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
          Plugins
        </span>
        <StatusPill />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        <p style={{ margin: '0 0 20px 0', fontSize: 12, color: '#8F9885', lineHeight: 1.6 }}>
          Features ship as plugins — enable only what your team needs. Disabled plugins do not run during services.
        </p>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Installed', value: plugins.length },
            { label: 'Enabled', value: enabledCount },
            { label: 'Disabled', value: plugins.length - enabledCount },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: '#1B2318',
                border: '1px solid #2A331F',
                borderRadius: 8,
                padding: '10px 16px',
                minWidth: 90,
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 600, color: '#EDEAE0' }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: '#8F9885', marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Plugin list */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.07em',
              color: '#8F9885',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            Installed plugins
          </div>
          <div
            style={{
              background: '#1B2318',
              border: '1px solid #2A331F',
              borderRadius: 8,
              overflow: 'hidden',
            }}
          >
            {plugins.map((plugin, i) => (
              <PluginRow
                key={plugin.id}
                plugin={plugin}
                isLast={i === plugins.length - 1}
                onToggle={() => toggle(plugin.id)}
              />
            ))}
          </div>
        </div>

        {/* Install hint */}
        <div
          style={{
            padding: '12px 14px',
            background: '#1B2318',
            border: '1px dashed #2A331F',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
            <circle cx="7" cy="7" r="5.5" stroke="#8F9885" strokeWidth="1.2" />
            <path d="M7 4.5v3M7 9v.5" stroke="#8F9885" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <span style={{ fontSize: 12, color: '#8F9885' }}>
            Place plugin folders in{' '}
            <code
              style={{
                fontFamily: 'monospace',
                background: '#10160F',
                padding: '1px 5px',
                borderRadius: 3,
                fontSize: 11,
                color: '#A8702E',
              }}
            >
              ~/altarview/plugins/
            </code>{' '}
            and restart the app to install.
          </span>
        </div>
      </div>
    </div>
  )
}

function PluginRow({
  plugin,
  isLast,
  onToggle,
}: {
  plugin: Plugin
  isLast: boolean
  onToggle: () => void
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '13px 16px',
        borderBottom: isLast ? 'none' : '1px solid #2A331F',
        gap: 14,
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 7,
          background: plugin.enabled ? 'rgba(168,112,46,0.1)' : '#10160F',
          border: `1px solid ${plugin.enabled ? 'rgba(168,112,46,0.25)' : '#2A331F'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'background 0.2s, border-color 0.2s',
        }}
      >
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
          <path
            d="M6.5 2H4a2 2 0 00-2 2v2.5a2 2 0 002 2H6.5m0-6.5v6.5m0-6.5h3a2 2 0 012 2V9a2 2 0 01-2 2H6.5m0 0V15m0 0H4a2 2 0 01-2-2v-2.5a2 2 0 012-2h2.5m4-4.5h2a2 2 0 012 2V9a2 2 0 01-2 2h-2"
            stroke={plugin.enabled ? '#A8702E' : '#8F9885'}
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#EDEAE0', marginBottom: 2 }}>
          {plugin.name}
          <span style={{ marginLeft: 7, fontSize: 10, color: '#8F9885', fontWeight: 400 }}>
            v{plugin.version}
          </span>
        </div>
        <div style={{ fontSize: 11, color: '#8F9885', lineHeight: 1.5 }}>{plugin.description}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 500,
            padding: '3px 9px',
            borderRadius: 20,
            background: plugin.enabled ? 'rgba(111,201,138,0.12)' : 'transparent',
            border: plugin.enabled ? '1px solid rgba(111,201,138,0.3)' : '1px solid #2A331F',
            color: plugin.enabled ? '#6FC98A' : '#8F9885',
            transition: 'all 0.2s',
          }}
        >
          {plugin.enabled ? 'Enabled' : 'Disabled'}
        </div>
        <button
          onClick={onToggle}
          style={{
            width: 36,
            height: 20,
            borderRadius: 10,
            border: 'none',
            background: plugin.enabled ? '#A8702E' : '#2A331F',
            position: 'relative',
            cursor: 'pointer',
            transition: 'background 0.2s',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: '#EDEAE0',
              position: 'absolute',
              top: 3,
              left: plugin.enabled ? 19 : 3,
              transition: 'left 0.2s',
            }}
          />
        </button>
      </div>
    </div>
  )
}

function StatusPill() {
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
      <span style={{ fontSize: 11, color: '#8F9885' }}>Prototype build</span>
    </div>
  )
}
