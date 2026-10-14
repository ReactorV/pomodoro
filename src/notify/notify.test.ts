import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS } from '../settings/settings'
import { initialState, reducer } from '../timer/machine'
import { applyBadge, badgeValue, notifyCompletion, requestPermissionOnce, type NotifyEnv } from './notify'

const MESSAGE = { title: 'Focus complete', body: 'Short break next — 5 min.' }

function fakeNotification(permission: NotificationPermission, answer: NotificationPermission = 'granted') {
  const shown: { title: string; body?: string }[] = []
  let asked = 0
  const Fake = class {
    static permission = permission
    static async requestPermission() {
      asked++
      Fake.permission = answer
      return answer
    }
    constructor(title: string, options?: NotificationOptions) {
      shown.push({ title, body: options?.body })
    }
  }
  return { Fake: Fake as unknown as NotifyEnv['Notification'], shown, asked: () => asked }
}

function fakeRegistration() {
  const shown: { title: string; body?: string }[] = []
  const serviceWorker = {
    getRegistration: async () =>
      ({
        showNotification: async (title: string, options?: NotificationOptions) => {
          shown.push({ title, body: options?.body })
        },
      }) as unknown as ServiceWorkerRegistration,
  }
  return { serviceWorker, shown }
}

describe('requestPermissionOnce', () => {
  it('AC-5.3 asks when permission is still default', async () => {
    const n = fakeNotification('default')
    await expect(requestPermissionOnce({ Notification: n.Fake })).resolves.toBe('granted')
    expect(n.asked()).toBe(1)
  })

  it('AC-5.3 does not ask again once decided', async () => {
    const n = fakeNotification('denied')
    await expect(requestPermissionOnce({ Notification: n.Fake })).resolves.toBe('denied')
    expect(n.asked()).toBe(0)
  })

  it('AC-5.3 reports unsupported browsers', async () => {
    await expect(requestPermissionOnce({})).resolves.toBe('unsupported')
  })
})

describe('notifyCompletion', () => {
  it('AC-5.4 shows the notification through the service worker registration', async () => {
    const n = fakeNotification('granted')
    const sw = fakeRegistration()
    const shown = await notifyCompletion(MESSAGE, DEFAULT_SETTINGS, { Notification: n.Fake, serviceWorker: sw.serviceWorker })
    expect(shown).toBe(true)
    expect(sw.shown).toEqual([MESSAGE])
    expect(n.shown).toEqual([])
  })

  it('AC-5.4 falls back to new Notification without a registration', async () => {
    const n = fakeNotification('granted')
    await notifyCompletion(MESSAGE, DEFAULT_SETTINGS, { Notification: n.Fake, serviceWorker: { getRegistration: async () => undefined } })
    expect(n.shown).toEqual([MESSAGE])
  })

  it('AC-5.4 shows nothing without permission', async () => {
    const n = fakeNotification('denied')
    const sw = fakeRegistration()
    const shown = await notifyCompletion(MESSAGE, DEFAULT_SETTINGS, { Notification: n.Fake, serviceWorker: sw.serviceWorker })
    expect(shown).toBe(false)
    expect(sw.shown).toEqual([])
  })

  it('AC-5.4 shows nothing when the setting is off', async () => {
    const n = fakeNotification('granted')
    await notifyCompletion(MESSAGE, { ...DEFAULT_SETTINGS, notifications: false }, { Notification: n.Fake })
    expect(n.shown).toEqual([])
  })

  it('AC-5.4 does not throw in browsers without notifications', async () => {
    await expect(notifyCompletion(MESSAGE, DEFAULT_SETTINGS, {})).resolves.toBe(false)
  })
})

describe('badge', () => {
  const idle = initialState(DEFAULT_SETTINGS, '2026-10-14')
  const running = reducer(idle, { type: 'start', now: 0 })

  it('AC-5.8 shows minutes left while running', () => {
    expect(badgeValue(running, 16 * 60_000 + 1, DEFAULT_SETTINGS)).toBe(17)
  })

  it('AC-5.8 clears when not running', () => {
    expect(badgeValue(idle, 25 * 60_000, DEFAULT_SETTINGS)).toBeNull()
  })

  it('AC-5.8 clears when the setting is off', () => {
    expect(badgeValue(running, 60_000, { ...DEFAULT_SETTINGS, badge: false })).toBeNull()
  })

  it('AC-5.8 sets and clears the app badge', () => {
    const calls: (number | 'clear')[] = []
    const env: NotifyEnv = {
      badge: {
        setAppBadge: async (n?: number) => void calls.push(n ?? 0),
        clearAppBadge: async () => void calls.push('clear'),
      },
    }
    applyBadge(12, env)
    applyBadge(null, env)
    expect(calls).toEqual([12, 'clear'])
  })

  it('AC-5.8 ignores browsers without the Badging API', () => {
    expect(() => applyBadge(3, {})).not.toThrow()
  })

  it('AC-5.8 swallows badge errors', async () => {
    const env: NotifyEnv = { badge: { setAppBadge: () => Promise.reject(new Error('nope')), clearAppBadge: async () => {} } }
    expect(() => applyBadge(3, env)).not.toThrow()
    await Promise.resolve()
  })
})
