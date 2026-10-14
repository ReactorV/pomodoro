import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import type { Settings } from '../settings/settings'
import { durationMs, localDay, reducer, remainingAt, type Mode, type TimerState } from './machine'
import { loadTimer, saveTimer } from './persist'

const TICK_MS = 250
const DAY_CHECK_MS = 60_000

export interface UseTimerOptions {
  settings: Settings
  /** Called once per completed session, after the state moved to the next mode. */
  onComplete?: (finished: Mode, next: Mode) => void
}

export interface UseTimer {
  state: TimerState
  remainingMs: number
  /** Elapsed share of the current session, 0–1 */
  progress: number
  start: () => void
  pause: () => void
  toggle: () => void
  reset: () => void
  skip: () => void
  setMode: (mode: Mode) => void
}

function sameSettings(a: Settings, b: Settings): boolean {
  return (Object.keys(a) as (keyof Settings)[]).every((key) => a[key] === b[key])
}

export function useTimer({ settings, onComplete }: UseTimerOptions): UseTimer {
  const [state, dispatch] = useReducer(reducer, settings, (s) => loadTimer(s, localDay(new Date())))
  const [now, setNow] = useState(() => Date.now())

  const stateRef = useRef(state)
  const prevRef = useRef(state)
  const onCompleteRef = useRef(onComplete)
  useEffect(() => {
    stateRef.current = state
    onCompleteRef.current = onComplete
  })

  /** Re-read the wall clock: roll the day over and complete a session that is due (AC-3.14, AC-3.15). */
  const check = useCallback(() => {
    const t = Date.now()
    setNow(t)
    dispatch({ type: 'newDay', day: localDay(new Date(t)) })
    const { status, endsAt } = stateRef.current
    if (status === 'running' && endsAt !== null && t >= endsAt) dispatch({ type: 'complete', now: t })
  }, [])

  useEffect(() => {
    if (!sameSettings(settings, state.settings)) dispatch({ type: 'settingsChanged', settings })
  }, [settings, state.settings])

  useEffect(() => {
    saveTimer(state)
    const prev = prevRef.current
    prevRef.current = state
    if (prev !== state && prev.status === 'running' && state.finished !== null) {
      onCompleteRef.current?.(state.finished, state.mode)
    }
  }, [state])

  useEffect(() => {
    if (state.status !== 'running' || state.endsAt === null) return
    const tick = setInterval(check, TICK_MS)
    const due = setTimeout(check, Math.max(0, state.endsAt - Date.now()))
    return () => {
      clearInterval(tick)
      clearTimeout(due)
    }
  }, [state.status, state.endsAt, check])

  useEffect(() => {
    const firstCheck = setTimeout(check, 0) // a restored session may already be due
    const dayCheck = setInterval(check, DAY_CHECK_MS)
    document.addEventListener('visibilitychange', check)
    return () => {
      clearTimeout(firstCheck)
      clearInterval(dayCheck)
      document.removeEventListener('visibilitychange', check)
    }
  }, [check])

  const start = useCallback(() => {
    const t = Date.now()
    setNow(t)
    dispatch({ type: 'start', now: t })
  }, [])
  const pause = useCallback(() => dispatch({ type: 'pause', now: Date.now() }), [])
  const toggle = useCallback(() => (stateRef.current.status === 'running' ? pause() : start()), [pause, start])
  const reset = useCallback(() => dispatch({ type: 'reset' }), [])
  const skip = useCallback(() => dispatch({ type: 'skip' }), [])
  const setMode = useCallback((mode: Mode) => dispatch({ type: 'setMode', mode }), [])

  const remainingMs = remainingAt(state, now)
  const progress = Math.min(1, Math.max(0, 1 - remainingMs / durationMs(state.mode, state.settings)))

  return { state, remainingMs, progress, start, pause, toggle, reset, skip, setMode }
}
