import type { Settings } from '../settings/settings'

export type Mode = 'focus' | 'short' | 'long'
export type Status = 'idle' | 'running' | 'paused'

export interface TimerState {
  mode: Mode
  status: Status
  /** Epoch ms when the running session ends; null unless running */
  endsAt: number | null
  /** Time left while idle or paused */
  remainingMs: number
  completedToday: number
  /** Focus sessions completed in the current cycle */
  cycleCount: number
  /** Local date (YYYY-MM-DD) the counts belong to */
  day: string
  /** Mode that just finished, for the alert; null otherwise */
  finished: Mode | null
  settings: Settings
}

export type TimerAction =
  | { type: 'start'; now: number }
  | { type: 'pause'; now: number }
  | { type: 'reset' }
  | { type: 'skip' }
  | { type: 'complete'; now: number }
  | { type: 'setMode'; mode: Mode }
  | { type: 'settingsChanged'; settings: Settings }
  | { type: 'newDay'; day: string }

const MINUTE = 60_000

export function durationMs(mode: Mode, settings: Settings): number {
  const minutes = { focus: settings.focusMin, short: settings.shortMin, long: settings.longMin }[mode]
  return minutes * MINUTE
}

export function localDay(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function initialState(settings: Settings, day: string): TimerState {
  return {
    mode: 'focus',
    status: 'idle',
    endsAt: null,
    remainingMs: durationMs('focus', settings),
    completedToday: 0,
    cycleCount: 0,
    day,
    finished: null,
    settings,
  }
}

/** Mode that follows the current one, given the cycle count after this session. */
function followingMode(mode: Mode, cycleCount: number, settings: Settings): Mode {
  if (mode !== 'focus') return 'focus'
  return cycleCount >= settings.longEvery ? 'long' : 'short'
}

/** Mode that comes next if the current session completes. */
export function nextMode(state: TimerState): Mode {
  const cycle = state.mode === 'focus' ? state.cycleCount + 1 : state.cycleCount
  return followingMode(state.mode, cycle, state.settings)
}

export function remainingAt(state: TimerState, now: number): number {
  if (state.status !== 'running' || state.endsAt === null) return state.remainingMs
  return Math.max(0, state.endsAt - now)
}

function idleIn(state: TimerState, mode: Mode): TimerState {
  return { ...state, mode, status: 'idle', endsAt: null, remainingMs: durationMs(mode, state.settings), finished: null }
}

/** Move to the next session. Only a completed focus session counts toward the day and the cycle. */
function advance(state: TimerState, counts: boolean): TimerState {
  const countsFocus = counts && state.mode === 'focus'
  const cycle = state.mode === 'long' ? 0 : state.cycleCount + (countsFocus ? 1 : 0)
  return {
    ...idleIn(state, followingMode(state.mode, cycle, state.settings)),
    completedToday: state.completedToday + (countsFocus ? 1 : 0),
    cycleCount: cycle,
  }
}

export function reducer(state: TimerState, action: TimerAction): TimerState {
  switch (action.type) {
    case 'start':
      if (state.status === 'running') return state
      return { ...state, status: 'running', endsAt: action.now + state.remainingMs, finished: null }

    case 'pause':
      if (state.status !== 'running') return state
      return { ...state, status: 'paused', remainingMs: remainingAt(state, action.now), endsAt: null, finished: null }

    case 'reset':
      return idleIn(state, state.mode)

    case 'skip':
      return advance(state, false)

    case 'complete':
      if (state.status !== 'running') return state
      return { ...advance(state, true), finished: state.mode }

    case 'setMode':
      return idleIn(state, action.mode)

    case 'settingsChanged': {
      const updated = { ...state, settings: action.settings, finished: null }
      return state.status === 'idle' ? { ...updated, remainingMs: durationMs(state.mode, action.settings) } : updated
    }

    case 'newDay':
      if (action.day === state.day) return state
      return { ...state, day: action.day, completedToday: 0, cycleCount: 0, finished: null }
  }
}
