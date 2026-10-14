import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, type Settings } from '../settings/settings'
import { durationMs, initialState, localDay, nextMode, reducer, remainingAt, type TimerState } from './machine'

const MIN = 60_000
const DAY = '2026-10-14'

function fresh(settings: Settings = DEFAULT_SETTINGS): TimerState {
  return initialState(settings, DAY)
}

function run(state: TimerState, now = 0): TimerState {
  return reducer(state, { type: 'start', now })
}

/** Start the current session and let it finish. */
function finish(state: TimerState, now = 0): TimerState {
  const running = run(state, now)
  return reducer(running, { type: 'complete', now: running.endsAt! })
}

describe('timer machine', () => {
  it('AC-3.1 starts idle in focus with the full focus duration', () => {
    const s = fresh()
    expect(s).toMatchObject({ mode: 'focus', status: 'idle', remainingMs: 25 * MIN, completedToday: 0, cycleCount: 0, endsAt: null })
  })

  it('AC-3.2 start from idle sets running and endsAt = now + remaining', () => {
    const s = run(fresh(), 1_000)
    expect(s.status).toBe('running')
    expect(s.endsAt).toBe(1_000 + 25 * MIN)
  })

  it('AC-3.2 start from paused resumes with the kept remaining time', () => {
    const paused = reducer(run(fresh(), 0), { type: 'pause', now: 10 * MIN })
    const resumed = reducer(paused, { type: 'start', now: 20 * MIN })
    expect(resumed.status).toBe('running')
    expect(resumed.endsAt).toBe(20 * MIN + 15 * MIN)
  })

  it('AC-3.3 start while running changes nothing', () => {
    const s = run(fresh(), 0)
    expect(reducer(s, { type: 'start', now: 5_000 })).toBe(s)
  })

  it('AC-3.4 pause keeps remaining = endsAt − now', () => {
    const s = reducer(run(fresh(), 0), { type: 'pause', now: 4 * MIN })
    expect(s).toMatchObject({ status: 'paused', remainingMs: 21 * MIN, endsAt: null })
  })

  it('AC-3.4 pause never stores negative remaining time', () => {
    const s = reducer(run(fresh(), 0), { type: 'pause', now: 30 * MIN })
    expect(s.remainingMs).toBe(0)
  })

  it('AC-3.5 pause while not running changes nothing', () => {
    const s = fresh()
    expect(reducer(s, { type: 'pause', now: 1 })).toBe(s)
  })

  it('AC-3.6 reset returns to idle with the full duration of the same mode', () => {
    const paused = reducer(run(fresh(), 0), { type: 'pause', now: 3 * MIN })
    const s = reducer(paused, { type: 'reset' })
    expect(s).toMatchObject({ mode: 'focus', status: 'idle', remainingMs: 25 * MIN, endsAt: null })
  })

  it('AC-3.7 skip moves to the next mode without counting a focus session', () => {
    const s = reducer(run(fresh(), 0), { type: 'skip' })
    expect(s).toMatchObject({ mode: 'short', status: 'idle', remainingMs: 5 * MIN, completedToday: 0, cycleCount: 0 })
  })

  it('AC-3.7 skip from a break goes back to focus', () => {
    const s = reducer(reducer(fresh(), { type: 'skip' }), { type: 'skip' })
    expect(s.mode).toBe('focus')
  })

  it('AC-3.7 skipping a long break resets the cycle like completing it', () => {
    let s = fresh()
    for (let i = 0; i < 3; i++) s = finish(finish(s))
    s = finish(s) // 4th focus → long break
    s = reducer(s, { type: 'skip' })
    expect(s).toMatchObject({ mode: 'focus', cycleCount: 0 })
  })

  it('AC-3.7 skipping focus on the last cycle slot still goes to a short break', () => {
    let s = fresh()
    for (let i = 0; i < 3; i++) s = finish(finish(s))
    expect(reducer(s, { type: 'skip' }).mode).toBe('short')
  })

  it('AC-3.8 completing focus counts it and goes to a short break', () => {
    const s = finish(fresh())
    expect(s).toMatchObject({ mode: 'short', completedToday: 1, cycleCount: 1 })
  })

  it('AC-3.8 the longEvery-th focus session leads to a long break', () => {
    let s = fresh()
    for (let i = 0; i < 3; i++) s = finish(finish(s)) // focus + short break
    expect(s.cycleCount).toBe(3)
    s = finish(s)
    expect(s).toMatchObject({ mode: 'long', completedToday: 4, cycleCount: 4 })
  })

  it('AC-3.8 respects a custom longEvery', () => {
    let s = fresh({ ...DEFAULT_SETTINGS, longEvery: 2 })
    s = finish(finish(s))
    s = finish(s)
    expect(s.mode).toBe('long')
  })

  it('AC-3.9 completing a short break goes to focus', () => {
    const s = finish(finish(fresh()))
    expect(s).toMatchObject({ mode: 'focus', cycleCount: 1 })
  })

  it('AC-3.9 completing a long break goes to focus and resets the cycle', () => {
    let s = fresh()
    for (let i = 0; i < 4; i++) s = finish(finish(s))
    expect(s).toMatchObject({ mode: 'focus', cycleCount: 0, completedToday: 4 })
  })

  it('AC-3.10 after completion the next session waits idle with its full duration', () => {
    const s = finish(fresh())
    expect(s).toMatchObject({ status: 'idle', remainingMs: 5 * MIN, endsAt: null })
  })

  it('AC-3.11 completion records the finished mode', () => {
    expect(finish(fresh()).finished).toBe('focus')
  })

  it('AC-3.11 the next action clears the finished mode', () => {
    const done = finish(fresh())
    expect(run(done).finished).toBeNull()
    expect(reducer(done, { type: 'skip' }).finished).toBeNull()
    expect(reducer(done, { type: 'setMode', mode: 'long' }).finished).toBeNull()
  })

  it('AC-3.12 choosing a mode sets it idle with its full duration', () => {
    const s = reducer(run(fresh()), { type: 'setMode', mode: 'long' })
    expect(s).toMatchObject({ mode: 'long', status: 'idle', remainingMs: 15 * MIN, endsAt: null })
  })

  it('AC-3.13 settings change while idle updates remaining time', () => {
    const s = reducer(fresh(), { type: 'settingsChanged', settings: { ...DEFAULT_SETTINGS, focusMin: 50 } })
    expect(s.remainingMs).toBe(50 * MIN)
    expect(s.settings.focusMin).toBe(50)
  })

  it('AC-3.13 settings change while running keeps the current session', () => {
    const running = run(fresh(), 0)
    const s = reducer(running, { type: 'settingsChanged', settings: { ...DEFAULT_SETTINGS, focusMin: 50 } })
    expect(s.endsAt).toBe(running.endsAt)
    expect(s.settings.focusMin).toBe(50)
  })

  it('AC-3.13 settings change while paused keeps the remaining time', () => {
    const paused = reducer(run(fresh(), 0), { type: 'pause', now: MIN })
    const s = reducer(paused, { type: 'settingsChanged', settings: { ...DEFAULT_SETTINGS, focusMin: 50 } })
    expect(s.remainingMs).toBe(24 * MIN)
  })

  it('AC-3.14 a new day resets the counts', () => {
    const done = finish(fresh())
    const s = reducer(done, { type: 'newDay', day: '2026-10-15' })
    expect(s).toMatchObject({ completedToday: 0, cycleCount: 0, day: '2026-10-15' })
  })

  it('AC-3.14 the same day changes nothing', () => {
    const s = fresh()
    expect(reducer(s, { type: 'newDay', day: DAY })).toBe(s)
  })

  it('AC-3.15 remaining time comes from the wall clock', () => {
    const s = run(fresh(), 0)
    expect(remainingAt(s, 60_500)).toBe(25 * MIN - 60_500)
    expect(remainingAt(s, 99 * MIN)).toBe(0)
    expect(remainingAt(fresh(), 123)).toBe(25 * MIN)
  })

  it('AC-3.17 complete while not running changes nothing', () => {
    const s = fresh()
    expect(reducer(s, { type: 'complete', now: 0 })).toBe(s)
  })

  it('nextMode and durationMs follow the settings', () => {
    expect(nextMode(fresh())).toBe('short')
    expect(durationMs('long', { ...DEFAULT_SETTINGS, longMin: 20 })).toBe(20 * MIN)
  })

  it('localDay formats the local calendar date', () => {
    expect(localDay(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
  })
})
