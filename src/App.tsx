import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import styles from './App.module.css'
import { AlertBanner } from './components/AlertBanner'
import { Controls } from './components/Controls'
import { HexCounter } from './components/HexCounter'
import { HexTimer } from './components/HexTimer'
import { ModeTabs } from './components/ModeTabs'
import { SettingsPanel } from './components/SettingsPanel'
import { SettingsIcon } from './components/icons'
import { cubeFaces, toPath } from './geometry/hex'
import { useHotkeys } from './hooks/useHotkeys'
import { useMediaQuery } from './hooks/useMediaQuery'
import { MODE_LABEL, documentTitle, primaryLabel } from './notify/format'
import { completionMessage } from './notify/messages'
import { applyBadge, badgeValue, browserEnv, notifyCompletion, requestPermissionOnce, type NotifyEnv } from './notify/notify'
import { createChime, playCompletionChime, type Chime } from './notify/sound'
import { loadSettings, saveSettings, type Settings } from './settings/settings'
import { ACCENT } from './styles/theme'
import type { Mode, Status } from './timer/machine'
import { useTimer } from './timer/useTimer'

/** Below 520 px the window is compact: no tabs, no shortcut footer (AC-6.8). */
const COMPACT_QUERY = '(max-width: 519px)'
const FLASH_MS = 3_000
const BRAND = cubeFaces(11, 12, 12.5)

const STATUS_TEXT: Record<Status, string> = { idle: 'READY', running: 'RUNNING', paused: 'PAUSED' }

const SHORTCUTS: [key: string, label: string][] = [
  ['Space', 'start / pause'],
  ['R', 'reset'],
  ['S', 'skip'],
  [',', 'settings'],
]

function subtitle(mode: Mode, finished: Mode | null, cycleCount: number, longEvery: number): string {
  const shown = finished ?? mode
  if (shown !== 'focus') return MODE_LABEL[shown].toUpperCase()
  const n = finished ? cycleCount || longEvery : (cycleCount % longEvery) + 1
  return `FOCUS · ${n} / ${longEvery}`
}

export interface AppProps {
  /** Injected in tests; defaults to the Web Audio chime */
  chime?: Chime
  /** Injected in tests; defaults to the real browser APIs */
  env?: NotifyEnv
}

export function App({ chime: chimeProp, env: envProp }: AppProps) {
  const chime = useMemo(() => chimeProp ?? createChime(), [chimeProp])
  const env = useMemo(() => envProp ?? browserEnv(), [envProp])
  const [settings, setSettings] = useState(loadSettings)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [flash, setFlash] = useState<{ id: number; color: string } | null>(null)
  const compact = useMediaQuery(COMPACT_QUERY)

  const settingsRef = useRef(settings)
  useEffect(() => {
    settingsRef.current = settings
  })

  const onComplete = useCallback(
    (finished: Mode, next: Mode) => {
      const current = settingsRef.current
      playCompletionChime(chime, finished, current)
      void notifyCompletion(completionMessage(finished, next, current), current, env)
      if (current.flash) setFlash({ id: Date.now(), color: ACCENT[finished] })
    },
    [chime, env],
  )

  const timer = useTimer({ settings, onComplete })
  const { state, remainingMs, progress } = timer
  const { finished } = state

  useEffect(() => {
    if (!flash) return
    const id = setTimeout(() => setFlash(null), FLASH_MS)
    return () => clearTimeout(id)
  }, [flash])

  useEffect(() => {
    document.title = documentTitle(state.status, state.mode, remainingMs)
  }, [state.status, state.mode, remainingMs])

  const badge = badgeValue(state, remainingMs, settings)
  useEffect(() => applyBadge(badge, env), [badge, env])

  const togglePrimary = () => {
    if (state.status !== 'running') {
      // Start is a user gesture: unlock audio and ask for notifications here (AC-5.2, AC-5.3).
      void chime.unlock()
      void requestPermissionOnce(env)
    }
    timer.toggle()
  }

  const saveNewSettings = (next: Settings) => {
    saveSettings(next)
    setSettings(next)
    setSettingsOpen(false)
  }

  useHotkeys({
    toggle: () => !settingsOpen && togglePrimary(),
    reset: () => !settingsOpen && timer.reset(),
    skip: () => !settingsOpen && timer.skip(),
    openSettings: () => setSettingsOpen(true),
    closeSettings: () => setSettingsOpen(false),
  })

  const accent = ACCENT[finished ?? state.mode]
  const message = finished ? completionMessage(finished, state.mode, settings) : null

  return (
    <div className={styles.app} style={{ '--accent': accent } as CSSProperties}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.brand}>
            <svg width="28" height="30" viewBox="0 0 24 25" aria-hidden="true">
              <path d={toPath(BRAND.top)} fill={accent} />
              <path d={toPath(BRAND.left)} fill={accent} fillOpacity={0.55} />
              <path d={toPath(BRAND.right)} fill={accent} fillOpacity={0.28} />
            </svg>
            <span>Hex Pomodoro</span>
          </div>
          <button type="button" className={styles.settingsButton} aria-label="Settings" onClick={() => setSettingsOpen(true)}>
            <SettingsIcon size={20} />
          </button>
        </header>

        <main className={styles.main}>
          {message ? (
            <AlertBanner title={message.title} body={message.body} />
          ) : (
            !compact && <ModeTabs mode={state.mode} onSelect={timer.setMode} />
          )}

          <HexTimer
            mode={finished ?? state.mode}
            remainingMs={finished ? 0 : remainingMs}
            progress={finished ? 1 : progress}
            statusText={finished ? 'COMPLETE' : STATUS_TEXT[state.status]}
            subtitle={subtitle(state.mode, finished, state.cycleCount, settings.longEvery)}
            celebrating={finished !== null}
          />

          <Controls
            primaryLabel={primaryLabel(state.status, finished, state.mode)}
            running={state.status === 'running'}
            onPrimary={togglePrimary}
            onReset={timer.reset}
            onSkip={timer.skip}
          />

          <HexCounter done={state.completedToday} groupSize={settings.longEvery} />
        </main>

        {!compact && (
          <footer className={styles.footer}>
            {SHORTCUTS.map(([key, label]) => (
              <span key={key} className={styles.shortcut}>
                <kbd>{key}</kbd>
                {label}
              </span>
            ))}
          </footer>
        )}
      </div>

      {settingsOpen && <SettingsPanel settings={settings} onSave={saveNewSettings} onClose={() => setSettingsOpen(false)} />}

      {flash && <div key={flash.id} className="flash-overlay" style={{ '--flash-color': flash.color } as CSSProperties} aria-hidden="true" />}
    </div>
  )
}
