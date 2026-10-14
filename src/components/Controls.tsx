import styles from './controls.module.css'
import { PauseIcon, PlayIcon, ResetIcon, SkipIcon } from './icons'

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
