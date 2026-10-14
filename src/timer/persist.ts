import type { Settings } from '../settings/settings'
import { durationMs, initialState, reducer, type Mode, type Status, type TimerState } from './machine'

export const TIMER_KEY = 'hexpomo.timer'

type Stored = Pick<TimerState, 'mode' | 'status' | 'endsAt' | 'remainingMs' | 'completedToday' | 'cycleCount' | 'day'>

const MODES: readonly Mode[] = ['focus', 'short', 'long']
const STATUSES: readonly Status[] = ['idle', 'running', 'paused']

const isCount = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0
const isTime = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0

function parse(raw: unknown): Stored | null {
  if (!raw || typeof raw !== 'object') return null
  const s = raw as Record<string, unknown>
  if (!MODES.includes(s.mode as Mode) || !STATUSES.includes(s.status as Status)) return null
  if (!isTime(s.remainingMs) || !isCount(s.completedToday) || !isCount(s.cycleCount)) return null
  if (typeof s.day !== 'string') return null
  if (s.status === 'running' ? !isTime(s.endsAt) : s.endsAt !== null) return null
  return s as unknown as Stored
}

export function saveTimer(state: TimerState, storage: Storage = localStorage): void {
  const { mode, status, endsAt, remainingMs, completedToday, cycleCount, day } = state
  try {
    storage.setItem(TIMER_KEY, JSON.stringify({ mode, status, endsAt, remainingMs, completedToday, cycleCount, day }))
  } catch {
    // Storage full or blocked: the timer keeps working in memory.
  }
}

export function loadTimer(settings: Settings, today: string, storage: Storage = localStorage): TimerState {
  let stored: Stored | null = null
  try {
    stored = parse(JSON.parse(storage.getItem(TIMER_KEY) ?? 'null'))
  } catch {
    stored = null
  }
  if (!stored) return initialState(settings, today)

  const restored: TimerState = {
    ...stored,
    remainingMs: stored.status === 'idle' ? durationMs(stored.mode, settings) : stored.remainingMs,
    finished: null,
    settings,
  }
  return reducer(restored, { type: 'newDay', day: today })
}
