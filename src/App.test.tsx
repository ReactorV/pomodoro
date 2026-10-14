import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'
import type { NotifyEnv } from './notify/notify'
import type { Chime } from './notify/sound'
import { DEFAULT_SETTINGS, SETTINGS_KEY, saveSettings } from './settings/settings'

const MIN = 60_000

function fakeChime() {
  const played: string[] = []
  let unlocked = 0
  const chime: Chime = {
    unlock: async () => {
      unlocked++
    },
    play: (kind) => {
      played.push(kind)
    },
  }
  return { chime, played, unlocked: () => unlocked }
}

function fakeEnv() {
  const notifications: { title: string; body?: string }[] = []
  const badges: (number | null)[] = []
  let asked = 0
  const Notification = class {
    static permission: NotificationPermission = 'default'
    static async requestPermission() {
      asked++
      Notification.permission = 'granted'
      return 'granted' as const
    }
    constructor(title: string, options?: NotificationOptions) {
      notifications.push({ title, body: options?.body })
    }
  }
  const env: NotifyEnv = {
    Notification: Notification as unknown as NotifyEnv['Notification'],
    badge: {
      setAppBadge: async (n?: number) => void badges.push(n ?? 0),
      clearAppBadge: async () => void badges.push(null),
    },
  }
  return { env, notifications, badges, asked: () => asked }
}

function setup() {
  const sound = fakeChime()
  const browser = fakeEnv()
  const user = userEvent.setup({ delay: null, advanceTimers: vi.advanceTimersByTime })
  render(<App chime={sound.chime} env={browser.env} />)
  return { user, sound, browser }
}

const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms))

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 9, 14, 9, 0, 0))
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('App', () => {
  it('AC-3.1 opens idle on a full focus session', () => {
    setup()
    expect(screen.getByText('25:00')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Focus' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('0 pomodoros')).toBeInTheDocument()
  })

  it('AC-5.2 AC-5.3 the first Start unlocks audio and asks for notification permission once', async () => {
    const { user, sound, browser } = setup()
    await user.click(screen.getByRole('button', { name: 'Start' }))
    await user.click(screen.getByRole('button', { name: 'Pause' }))
    await user.click(screen.getByRole('button', { name: 'Resume' }))
    expect(sound.unlocked()).toBeGreaterThanOrEqual(1)
    expect(browser.asked()).toBe(1)
  })

  it('AC-5.1 AC-5.4 AC-5.6 AC-6.7 alerts with chime, notification, flash and banner when focus ends', async () => {
    const { user, sound, browser } = setup()
    await user.click(screen.getByRole('button', { name: 'Start' }))
    await advance(25 * MIN)

    const banner = screen.getByRole('status')
    expect(banner).toHaveTextContent('Focus complete')
    expect(banner).toHaveTextContent('Short break next — 5 min.')
    expect(sound.played).toEqual(['focus'])
    expect(browser.notifications).toEqual([{ title: 'Focus complete', body: 'Short break next — 5 min.' }])
    expect(document.querySelector('.flash-overlay')).toBeInTheDocument()
    expect(screen.getByText('1 pomodoro')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start break' })).toBeInTheDocument()

    await advance(3_000)
    expect(document.querySelector('.flash-overlay')).not.toBeInTheDocument()
  })

  it('AC-3.10 AC-3.11 the next session waits; starting it clears the alert', async () => {
    const { user, sound } = setup()
    await user.click(screen.getByRole('button', { name: 'Start' }))
    await advance(25 * MIN)
    await user.click(screen.getByRole('button', { name: 'Start break' }))

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Short break' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('05:00')).toBeInTheDocument()

    await advance(5 * MIN)
    expect(screen.getByRole('status')).toHaveTextContent('Break over')
    expect(sound.played).toEqual(['focus', 'break'])
  })

  it('AC-5.7 shows the countdown in the window title while running', async () => {
    const { user } = setup()
    expect(document.title).toBe('Hex Pomodoro')
    await user.click(screen.getByRole('button', { name: 'Start' }))
    await advance(61_000)
    expect(document.title).toBe('▶ 23:59 · Focus')
    await user.click(screen.getByRole('button', { name: 'Pause' }))
    expect(document.title).toBe('Hex Pomodoro')
  })

  it('AC-5.8 shows minutes left on the dock badge and clears it on pause', async () => {
    const { user, browser } = setup()
    await user.click(screen.getByRole('button', { name: 'Start' }))
    expect(browser.badges.at(-1)).toBe(25)
    await user.click(screen.getByRole('button', { name: 'Pause' }))
    expect(browser.badges.at(-1)).toBeNull()
  })

  it('AC-5.1 AC-5.6 respects chime and flash settings', async () => {
    saveSettings({ ...DEFAULT_SETTINGS, focusMin: 1, sound: false, flash: false })
    const { user, sound } = setup()
    await user.click(screen.getByRole('button', { name: 'Start' }))
    await advance(MIN)
    expect(screen.getByRole('status')).toHaveTextContent('Focus complete')
    expect(sound.played).toEqual([])
    expect(document.querySelector('.flash-overlay')).not.toBeInTheDocument()
  })

  it('AC-4.4 opens settings with the header button and closes with Esc', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'Settings' }))
    expect(screen.getByRole('dialog', { name: 'Settings' })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('AC-4.4 AC-4.5 opens settings with the comma key and saves new durations', async () => {
    const { user } = setup()
    await user.keyboard(',')
    const dialog = screen.getByRole('dialog', { name: 'Settings' })
    const focus = within(dialog).getByLabelText('Focus')
    await user.clear(focus)
    await user.type(focus, '50')
    await user.click(within(dialog).getByRole('button', { name: 'Save' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText('50:00')).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem(SETTINGS_KEY)!).focusMin).toBe(50)
  })

  it('AC-7.1 Space starts and pauses, S skips, R resets', async () => {
    const { user } = setup()
    await user.keyboard(' ')
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument()
    await advance(MIN)
    await user.keyboard('r')
    expect(screen.getByText('25:00')).toBeInTheDocument()
    await user.keyboard('s')
    expect(screen.getByRole('button', { name: 'Short break' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('AC-3.12 switches mode with the tabs', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'Long break' }))
    expect(screen.getByText('15:00')).toBeInTheDocument()
  })

  it('AC-6.8 hides tabs and the shortcut footer in a compact window', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('max-width'),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }))
    setup()
    expect(screen.queryByRole('group', { name: 'Timer mode' })).not.toBeInTheDocument()
    expect(screen.queryByText('start / pause')).not.toBeInTheDocument()
  })

  it('AC-6.8 shows tabs and the shortcut footer in a normal window', () => {
    setup()
    expect(screen.getByRole('group', { name: 'Timer mode' })).toBeInTheDocument()
    expect(screen.getByText('start / pause')).toBeInTheDocument()
  })
})
