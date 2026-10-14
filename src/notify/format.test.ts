import { describe, expect, it } from 'vitest'
import { MODE_LABEL, badgeMinutes, documentTitle, formatClock } from './format'

const MIN = 60_000

describe('formatClock', () => {
  it('AC-6.2 shows whole minutes as MM:00', () => {
    expect(formatClock(25 * MIN)).toBe('25:00')
  })

  it('AC-6.2 rounds up to the whole second', () => {
    expect(formatClock(1)).toBe('00:01')
    expect(formatClock(59_001)).toBe('01:00')
  })

  it('AC-6.2 shows zero as 00:00', () => {
    expect(formatClock(0)).toBe('00:00')
  })

  it('AC-6.2 never shows negative time', () => {
    expect(formatClock(-500)).toBe('00:00')
  })

  it('AC-6.2 keeps minutes above 99', () => {
    expect(formatClock(120 * MIN)).toBe('120:00')
  })
})

describe('documentTitle', () => {
  it('AC-5.7 shows the countdown and mode while running', () => {
    expect(documentTitle('running', 'focus', 16 * MIN + 15_000)).toBe('▶ 16:15 · Focus')
  })

  it('AC-5.7 names break modes', () => {
    expect(documentTitle('running', 'short', 5 * MIN)).toBe('▶ 05:00 · Short break')
  })

  it('AC-5.7 shows the app name when not running', () => {
    expect(documentTitle('idle', 'focus', 25 * MIN)).toBe('Hex Pomodoro')
    expect(documentTitle('paused', 'focus', 3 * MIN)).toBe('Hex Pomodoro')
  })
})

describe('badgeMinutes', () => {
  it('AC-5.8 rounds minutes left up', () => {
    expect(badgeMinutes(16 * MIN + 1)).toBe(17)
    expect(badgeMinutes(MIN)).toBe(1)
    expect(badgeMinutes(0)).toBe(0)
  })
})

describe('MODE_LABEL', () => {
  it('has a label for every mode', () => {
    expect(MODE_LABEL).toEqual({ focus: 'Focus', short: 'Short break', long: 'Long break' })
  })
})
