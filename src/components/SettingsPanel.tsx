import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react'
import { throttle } from '../notify/sound'
import { DEFAULT_SETTINGS, sanitizeSettings, type Settings } from '../settings/settings'
import { ACCENT } from '../styles/theme'
import { CloseIcon, Diamond } from './icons'
import styles from './SettingsPanel.module.css'

type NumberField = 'focusMin' | 'shortMin' | 'longMin' | 'longEvery'
type ToggleField = 'sound' | 'clicks' | 'notifications' | 'badge' | 'flash'

/** Number inputs are kept as text while editing, so an empty field is allowed until Save. */
type Draft = Omit<Settings, NumberField> & Record<NumberField, string>

const NUMBER_FIELDS: { key: NumberField; label: string; min: number; max: number; color?: string }[] = [
  { key: 'focusMin', label: 'Focus', min: 1, max: 120, color: ACCENT.focus },
  { key: 'shortMin', label: 'Short break', min: 1, max: 60, color: ACCENT.short },
  { key: 'longMin', label: 'Long break', min: 1, max: 60, color: ACCENT.long },
  { key: 'longEvery', label: 'Long break after (sessions)', min: 2, max: 8 },
]

const TOGGLES: { key: ToggleField; label: string }[] = [
  { key: 'sound', label: 'Chime' },
  { key: 'clicks', label: 'Click sounds' },
  { key: 'notifications', label: 'macOS notification' },
  { key: 'badge', label: 'Dock badge countdown' },
  { key: 'flash', label: 'Flash screen on finish' },
]

function toDraft(s: Settings): Draft {
  return { ...s, focusMin: String(s.focusMin), shortMin: String(s.shortMin), longMin: String(s.longMin), longEvery: String(s.longEvery) }
}

function fromDraft(d: Draft): Settings {
  const num = (v: string) => (v.trim() === '' ? Number.NaN : Number(v))
  return sanitizeSettings({ ...d, focusMin: num(d.focusMin), shortMin: num(d.shortMin), longMin: num(d.longMin), longEvery: num(d.longEvery) })
}

export interface SettingsPanelProps {
  settings: Settings
  onSave: (settings: Settings) => void
  onClose: () => void
  /** Play a tick at this volume while the slider moves (throttled here, AC-5.10) */
  onPreviewVolume?: (volume: number) => void
  /** Tick for panel buttons handled inside the panel (Defaults) */
  onTick?: () => void
}

const PREVIEW_MS = 120

export function SettingsPanel({ settings, onSave, onClose, onPreviewVolume, onTick }: SettingsPanelProps) {
  const [draft, setDraft] = useState(() => toDraft(settings))
  const firstInput = useRef<HTMLInputElement>(null)
  const id = useId()

  useEffect(() => {
    firstInput.current?.focus()
  }, [])

  const previewRef = useRef(onPreviewVolume)
  useEffect(() => {
    previewRef.current = onPreviewVolume
  })
  const preview = useMemo(() => throttle((volume: number) => previewRef.current?.(volume), PREVIEW_MS), [])

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }))

  const submit = (event: FormEvent) => {
    event.preventDefault()
    onSave(fromDraft(draft))
  }

  return (
    <div className={styles.backdrop} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className={styles.panel} role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} noValidate onSubmit={submit}>
        <div className={styles.header}>
          <h2 id={`${id}-title`}>Settings</h2>
          <button type="button" className={styles.close} aria-label="Close settings" onClick={onClose}>
            <CloseIcon size={18} />
          </button>
        </div>

        <fieldset className={styles.fieldset}>
          <legend>Durations · minutes</legend>
          {NUMBER_FIELDS.map(({ key, label, min, max, color }, i) => (
            <div key={key} className={styles.row}>
              <label htmlFor={`${id}-${key}`} className={color ? styles.dotLabel : styles.plainLabel}>
                {color && <Diamond color={color} />}
                {label}
              </label>
              <input
                ref={i === 0 ? firstInput : undefined}
                id={`${id}-${key}`}
                className={styles.number}
                type="number"
                inputMode="numeric"
                min={min}
                max={max}
                value={draft[key]}
                onChange={(e) => set(key, e.target.value)}
              />
            </div>
          ))}
        </fieldset>

        <fieldset className={styles.fieldset}>
          <legend>Alerts</legend>
          {TOGGLES.map(({ key, label }) => (
            <div key={key}>
              <label className={styles.toggle}>
                {label}
                <input type="checkbox" checked={draft[key]} onChange={(e) => set(key, e.target.checked)} />
              </label>
              {key === 'clicks' && (
                <div className={styles.volume}>
                  <div className={styles.volumeHead}>
                    <label htmlFor={`${id}-volume`}>Volume</label>
                    <output htmlFor={`${id}-volume`}>{draft.volume}%</output>
                  </div>
                  <input
                    id={`${id}-volume`}
                    type="range"
                    min={0}
                    max={100}
                    value={draft.volume}
                    disabled={!draft.sound && !draft.clicks}
                    onChange={(e) => {
                      const volume = Number(e.target.value)
                      set('volume', volume)
                      preview(volume)
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </fieldset>

        <div className={styles.actions}>
          <button type="button" className={styles.ghost} onClick={() => {
              onTick?.()
              setDraft(toDraft(DEFAULT_SETTINGS))
            }}>
            Defaults
          </button>
          <button type="submit" className={styles.save}>
            Save
          </button>
        </div>
      </form>
    </div>
  )
}
