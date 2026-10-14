import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_SETTINGS, type Settings } from '../settings/settings'
import { initialState, reducer } from './machine'
import { TIMER_KEY, saveTimer } from './persist'
import { useTimer } from './useTimer'

const MIN = 60_000
const START = new Date(2026, 9, 14, 10, 0, 0).getTime()

function setup(settings: Settings = DEFAULT_SETTINGS) {
  const onComplete = vi.fn()
  const hook = renderHook((props: { settings: Settings }) => useTimer({ settings: props.settings, onComplete }), {
    initialProps: { settings },
  })
  return { ...hook, onComplete }
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(START)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useTimer', () => {
  it('AC-3.1 starts idle in focus with the full duration', () => {
    const { result } = setup()
    expect(result.current.state).toMatchObject({ mode: 'focus', status: 'idle' })
    expect(result.current.remainingMs).toBe(25 * MIN)
    expect(result.current.progress).toBe(0)
  })

  it('AC-3.15 counts down from the wall clock', () => {
    const { result } = setup()
    act(() => result.current.start())
    act(() => vi.advanceTimersByTime(10_000))
    expect(result.current.remainingMs).toBe(25 * MIN - 10_000)
    expect(result.current.progress).toBeCloseTo(10_000 / (25 * MIN))
  })

  it('AC-3.15 completes when the end time is reached and reports it once', () => {
    const { result, onComplete } = setup()
    act(() => result.current.start())
    act(() => vi.advanceTimersByTime(25 * MIN))
    expect(result.current.state).toMatchObject({ mode: 'short', status: 'idle', finished: 'focus', completedToday: 1 })
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(onComplete).toHaveBeenCalledWith('focus', 'short')
  })

  it('AC-3.15 completes on visibilitychange after the Mac slept', () => {
    const { result, onComplete } = setup()
    act(() => result.current.start())
    vi.setSystemTime(START + 40 * MIN) // clock jumps, timers did not fire
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(result.current.state.mode).toBe('short')
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('AC-3.4 pause stops the countdown and prevents completion', () => {
    const { result, onComplete } = setup()
    act(() => result.current.start())
    act(() => vi.advanceTimersByTime(5 * MIN))
    act(() => result.current.pause())
    act(() => vi.advanceTimersByTime(60 * MIN))
    expect(result.current.state.status).toBe('paused')
    expect(result.current.remainingMs).toBe(20 * MIN)
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('AC-7.1 toggle starts, pauses and resumes', () => {
    const { result } = setup()
    act(() => result.current.toggle())
    expect(result.current.state.status).toBe('running')
    act(() => result.current.toggle())
    expect(result.current.state.status).toBe('paused')
    act(() => result.current.toggle())
    expect(result.current.state.status).toBe('running')
  })

  it('AC-3.7 skip, AC-3.6 reset and AC-3.12 setMode reach the reducer', () => {
    const { result, onComplete } = setup()
    act(() => result.current.skip())
    expect(result.current.state.mode).toBe('short')
    act(() => result.current.setMode('long'))
    expect(result.current.state.mode).toBe('long')
    act(() => result.current.start())
    act(() => vi.advanceTimersByTime(MIN))
    act(() => result.current.reset())
    expect(result.current.state).toMatchObject({ mode: 'long', status: 'idle' })
    expect(result.current.remainingMs).toBe(15 * MIN)
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('AC-3.13 applies new settings while idle', () => {
    const { result, rerender } = setup()
    rerender({ settings: { ...DEFAULT_SETTINGS, focusMin: 40 } })
    expect(result.current.remainingMs).toBe(40 * MIN)
  })

  it('AC-3.16 saves the state on every change', () => {
    const { result } = setup()
    act(() => result.current.start())
    expect(JSON.parse(localStorage.getItem(TIMER_KEY)!)).toMatchObject({ status: 'running', endsAt: START + 25 * MIN })
  })

  it('AC-3.16 restores a running session after reload', () => {
    saveTimer(reducer(initialState(DEFAULT_SETTINGS, '2026-10-14'), { type: 'start', now: START - 5 * MIN }))
    const { result } = setup()
    expect(result.current.state.status).toBe('running')
    expect(result.current.remainingMs).toBe(20 * MIN)
  })

  it('AC-3.15 completes a restored session whose end time passed while closed', () => {
    saveTimer(reducer(initialState(DEFAULT_SETTINGS, '2026-10-14'), { type: 'start', now: START - 30 * MIN }))
    const { result, onComplete } = setup()
    act(() => vi.advanceTimersByTime(0))
    expect(result.current.state.mode).toBe('short')
    expect(onComplete).toHaveBeenCalledWith('focus', 'short')
  })

  it('AC-3.14 resets the counts when the date changes', () => {
    const { result } = setup()
    act(() => result.current.start())
    act(() => vi.advanceTimersByTime(25 * MIN))
    expect(result.current.state.completedToday).toBe(1)
    vi.setSystemTime(new Date(2026, 9, 15, 0, 0, 30).getTime())
    act(() => vi.advanceTimersByTime(60_000))
    expect(result.current.state).toMatchObject({ completedToday: 0, day: '2026-10-15' })
  })
})
