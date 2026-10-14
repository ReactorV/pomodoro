import { remainingAt, type Mode, type TimerState } from '../timer/machine'

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

export function documentTitle(state: TimerState, now: number): string {
  if (state.status !== 'running') return APP_NAME
  return `▶ ${formatClock(remainingAt(state, now))} · ${MODE_LABEL[state.mode]}`
}

export function badgeMinutes(ms: number): number {
  return Math.max(0, Math.ceil(ms / 60_000))
}
