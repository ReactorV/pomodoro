import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS } from '../settings/settings'
import { initialState, reducer } from './machine'
import { TIMER_KEY, loadTimer, saveTimer } from './persist'

const MIN = 60_000
const DAY = '2026-10-14'

describe('timer persistence', () => {
  it('AC-3.16 restores a running session with its end time and counts', () => {
    const running = { ...reducer(initialState(DEFAULT_SETTINGS, DAY), { type: 'start', now: 1_000 }), completedToday: 3, cycleCount: 3 }
    saveTimer(running)

    const restored = loadTimer(DEFAULT_SETTINGS, DAY)

    expect(restored).toMatchObject({ mode: 'focus', status: 'running', endsAt: 1_000 + 25 * MIN, completedToday: 3, cycleCount: 3 })
  })

  it('AC-3.16 restores a paused session with its remaining time', () => {
    const start = reducer(initialState(DEFAULT_SETTINGS, DAY), { type: 'start', now: 0 })
    saveTimer(reducer(start, { type: 'pause', now: 7 * MIN }))

    expect(loadTimer(DEFAULT_SETTINGS, DAY)).toMatchObject({ status: 'paused', remainingMs: 18 * MIN, endsAt: null })
  })

  it('AC-3.16 restores an idle session with the full duration from current settings', () => {
    saveTimer(reducer(initialState(DEFAULT_SETTINGS, DAY), { type: 'setMode', mode: 'long' }))

    const restored = loadTimer({ ...DEFAULT_SETTINGS, longMin: 20 }, DAY)

    expect(restored).toMatchObject({ mode: 'long', status: 'idle', remainingMs: 20 * MIN })
  })

  it('AC-3.16 uses the given settings, not stored ones', () => {
    saveTimer(initialState(DEFAULT_SETTINGS, DAY))

    expect(loadTimer({ ...DEFAULT_SETTINGS, longEvery: 6 }, DAY).settings.longEvery).toBe(6)
  })

  it('AC-3.16 does not restore the finished alert', () => {
    const done = reducer(reducer(initialState(DEFAULT_SETTINGS, DAY), { type: 'start', now: 0 }), { type: 'complete', now: 25 * MIN })
    saveTimer(done)

    expect(loadTimer(DEFAULT_SETTINGS, DAY).finished).toBeNull()
  })

  it('AC-3.14 resets the counts when the stored day is not today', () => {
    saveTimer({ ...initialState(DEFAULT_SETTINGS, '2026-10-13'), completedToday: 5, cycleCount: 1 })

    expect(loadTimer(DEFAULT_SETTINGS, DAY)).toMatchObject({ completedToday: 0, cycleCount: 0, day: DAY })
  })

  it('AC-3.16 returns the initial state when nothing is stored', () => {
    expect(loadTimer(DEFAULT_SETTINGS, DAY)).toEqual(initialState(DEFAULT_SETTINGS, DAY))
  })

  it('AC-3.16 returns the initial state when stored data is broken', () => {
    localStorage.setItem(TIMER_KEY, '{oops')

    expect(loadTimer(DEFAULT_SETTINGS, DAY)).toEqual(initialState(DEFAULT_SETTINGS, DAY))
  })

  it('AC-3.16 returns the initial state when stored data has invalid fields', () => {
    localStorage.setItem(TIMER_KEY, JSON.stringify({ mode: 'nap', status: 'running', endsAt: 'soon' }))

    expect(loadTimer(DEFAULT_SETTINGS, DAY)).toEqual(initialState(DEFAULT_SETTINGS, DAY))
  })

  it('AC-3.16 treats a running session without an end time as invalid', () => {
    localStorage.setItem(TIMER_KEY, JSON.stringify({ mode: 'focus', status: 'running', endsAt: null, remainingMs: 1, completedToday: 0, cycleCount: 0, day: DAY }))

    expect(loadTimer(DEFAULT_SETTINGS, DAY)).toEqual(initialState(DEFAULT_SETTINGS, DAY))
  })
})
