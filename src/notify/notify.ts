import type { Settings } from '../settings/settings'
import type { TimerState } from '../timer/machine'
import { badgeMinutes } from './format'
import type { Message } from './messages'

interface NotificationApi {
  permission: NotificationPermission
  requestPermission: () => Promise<NotificationPermission>
  new (title: string, options?: NotificationOptions): Notification
}

/** Browser APIs used here; each one may be missing. Tests pass fakes. */
export interface NotifyEnv {
  Notification?: NotificationApi
  serviceWorker?: { getRegistration: () => Promise<ServiceWorkerRegistration | undefined> }
  badge?: { setAppBadge: (n?: number) => Promise<void>; clearAppBadge: () => Promise<void> }
}

export function browserEnv(): NotifyEnv {
  const nav = typeof navigator === 'undefined' ? undefined : navigator
  return {
    Notification: typeof Notification === 'undefined' ? undefined : Notification,
    serviceWorker: nav && 'serviceWorker' in nav ? nav.serviceWorker : undefined,
    badge: nav && 'setAppBadge' in nav ? (nav as Required<NotifyEnv>['badge'] & Navigator) : undefined,
  }
}

/** Ask for permission only while it is still undecided. Call from a user gesture. */
export async function requestPermissionOnce(env: NotifyEnv = browserEnv()): Promise<NotificationPermission | 'unsupported'> {
  const api = env.Notification
  if (!api) return 'unsupported'
  if (api.permission !== 'default') return api.permission
  try {
    return await api.requestPermission()
  } catch {
    return api.permission
  }
}

/** Show a system notification. Returns true when one was shown. */
export async function notifyCompletion(message: Message, settings: Settings, env: NotifyEnv = browserEnv()): Promise<boolean> {
  const api = env.Notification
  if (!settings.notifications || !api || api.permission !== 'granted') return false
  const options: NotificationOptions = { body: message.body, tag: 'hex-pomodoro', icon: '/pwa-192x192.png' }
  try {
    const registration = await env.serviceWorker?.getRegistration()
    if (registration) {
      await registration.showNotification(message.title, options)
    } else {
      new api(message.title, options)
    }
    return true
  } catch {
    return false
  }
}

/** Minutes for the dock badge, or null to clear it. */
export function badgeValue(state: TimerState, remainingMs: number, settings: Settings): number | null {
  return settings.badge && state.status === 'running' ? badgeMinutes(remainingMs) : null
}

export function applyBadge(value: number | null, env: NotifyEnv = browserEnv()): void {
  const badge = env.badge
  if (!badge) return
  const done = value === null ? badge.clearAppBadge() : badge.setAppBadge(value)
  done.catch(() => {})
}
