export interface Settings {
  focusMin: number
  shortMin: number
  longMin: number
  longEvery: number
  sound: boolean
  /** Chime volume, 0–100 % */
  volume: number
  notifications: boolean
  badge: boolean
  flash: boolean
}

export const SETTINGS_KEY = 'hexpomo.settings'

export const DEFAULT_SETTINGS: Readonly<Settings> = Object.freeze({
  focusMin: 25,
  shortMin: 5,
  longMin: 15,
  longEvery: 4,
  sound: true,
  volume: 70,
  notifications: true,
  badge: true,
  flash: true,
})

type NumberKey = 'focusMin' | 'shortMin' | 'longMin' | 'longEvery' | 'volume'
type BooleanKey = 'sound' | 'notifications' | 'badge' | 'flash'

const LIMITS: Record<NumberKey, [min: number, max: number]> = {
  focusMin: [1, 120],
  shortMin: [1, 60],
  longMin: [1, 60],
  longEvery: [2, 8],
  volume: [0, 100],
}

const BOOLEAN_KEYS: BooleanKey[] = ['sound', 'notifications', 'badge', 'flash']

function toNumber(value: unknown, key: NumberKey): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return DEFAULT_SETTINGS[key]
  const [min, max] = LIMITS[key]
  return Math.min(max, Math.max(min, Math.round(value)))
}

export function sanitizeSettings(raw: unknown): Settings {
  const input = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const result = { ...DEFAULT_SETTINGS }
  for (const key of Object.keys(LIMITS) as NumberKey[]) {
    result[key] = toNumber(input[key], key)
  }
  for (const key of BOOLEAN_KEYS) {
    if (typeof input[key] === 'boolean') result[key] = input[key]
  }
  return result
}

export function loadSettings(storage: Storage = localStorage): Settings {
  try {
    const stored = storage.getItem(SETTINGS_KEY)
    return sanitizeSettings(stored ? JSON.parse(stored) : null)
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings: Settings, storage: Storage = localStorage): void {
  try {
    storage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch {
    // Storage full or blocked: settings stay in memory for this session.
  }
}
