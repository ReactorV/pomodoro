import type { Mode, Status } from '../timer/machine'

export const APP_NAME = 'Hex Pomodoro'

export const MODE_LABEL: Readonly<Record<Mode, string>> = {
  focus: 'Focus',
  short: 'Short break',
  long: 'Long break',
}

/** `MM:SS`, rounded up to the whole second. */
export function formatClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function documentTitle(status: Status, mode: Mode, remainingMs: number): string {
  if (status !== 'running') return APP_NAME
  return `▶ ${formatClock(remainingMs)} · ${MODE_LABEL[mode]}`
}

export function badgeMinutes(ms: number): number {
  return Math.max(0, Math.ceil(ms / 60_000))
}

/** Primary button text (AC-6.4). After a completion, `mode` is the session that comes next. */
export function primaryLabel(status: Status, finished: Mode | null, mode: Mode): string {
  if (finished) return mode === 'focus' ? 'Start focus' : 'Start break'
  if (status === 'running') return 'Pause'
  if (status === 'paused') return 'Resume'
  return 'Start'
}
