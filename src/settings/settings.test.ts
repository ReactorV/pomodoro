import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, SETTINGS_KEY, loadSettings, sanitizeSettings, saveSettings } from './settings'

describe('settings', () => {
  it('AC-4.1 has the specified defaults', () => {
    expect(DEFAULT_SETTINGS).toEqual({
      focusMin: 25,
      shortMin: 5,
      longMin: 15,
      longEvery: 4,
      sound: true,
      clicks: true,
      volume: 70,
      notifications: true,
      badge: true,
      flash: true,
    })
  })

  it('AC-4.2 clamps values out of range', () => {
    const s = sanitizeSettings({ focusMin: 500, shortMin: 0, longMin: -3, longEvery: 20, volume: 140 })
    expect(s).toMatchObject({ focusMin: 120, shortMin: 1, longMin: 1, longEvery: 8, volume: 100 })
  })

  it('AC-4.2 rounds minutes to whole numbers', () => {
    expect(sanitizeSettings({ focusMin: 24.6 }).focusMin).toBe(25)
  })

  it('AC-4.2 falls back to defaults for values that are not numbers or booleans', () => {
    const s = sanitizeSettings({ focusMin: 'abc', longEvery: null, sound: 'yes', clicks: 1, volume: Number.NaN })
    expect(s.focusMin).toBe(25)
    expect(s.longEvery).toBe(4)
    expect(s.sound).toBe(true)
    expect(s.clicks).toBe(true)
    expect(s.volume).toBe(70)
  })

  it('AC-4.2 keeps valid booleans', () => {
    expect(sanitizeSettings({ sound: false, clicks: false, flash: false })).toMatchObject({ sound: false, clicks: false, flash: false })
  })

  it('AC-4.3 loads defaults when storage is empty', () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
  })

  it('AC-4.3 loads defaults when stored data is broken', () => {
    localStorage.setItem(SETTINGS_KEY, '{not json')
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
  })

  it('AC-4.3 saves and loads settings', () => {
    saveSettings({ ...DEFAULT_SETTINGS, focusMin: 50, sound: false })
    expect(loadSettings()).toEqual({ ...DEFAULT_SETTINGS, focusMin: 50, sound: false })
  })
})
