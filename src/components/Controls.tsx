import type { Mode, Status } from '../timer/machine'
import styles from './controls.module.css'
import { PauseIcon, PlayIcon, ResetIcon, SkipIcon } from './icons'

/** Primary button text (AC-6.4). After a completion, `mode` is the session that comes next. */
export function primaryLabel(status: Status, finished: Mode | null, mode: Mode): string {
  if (finished) return mode === 'focus' ? 'Start focus' : 'Start break'
  if (status === 'running') return 'Pause'
  if (status === 'paused') return 'Resume'
  return 'Start'
}

export interface ControlsProps {
  primaryLabel: string
  running: boolean
  onPrimary: () => void
  onReset: () => void
  onSkip: () => void
}

export function Controls({ primaryLabel: label, running, onPrimary, onReset, onSkip }: ControlsProps) {
  return (
    <div className={styles.controls}>
      <button type="button" className={styles.iconButton} aria-label="Reset" onClick={onReset}>
        <ResetIcon />
      </button>
      <button type="button" className={styles.primary} onClick={onPrimary}>
        {running ? <PauseIcon size={20} /> : <PlayIcon size={20} />}
        {label}
      </button>
      <button type="button" className={styles.iconButton} aria-label="Skip to next session" onClick={onSkip}>
        <SkipIcon />
      </button>
    </div>
  )
}
