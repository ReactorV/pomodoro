import type { Settings } from '../settings/settings'
import type { Mode } from '../timer/machine'

export type ChimeKind = 'focus' | 'break'

export interface Chime {
  /** Create or resume the audio context. Call from a user gesture (autoplay rule). */
  unlock: () => Promise<void>
  play: (kind: ChimeKind, volumePct: number) => void
  /** Soft glass tick for buttons and shortcuts (AC-5.9) */
  tick: (volumePct: number) => void
}

/** Rising A major for focus end, softer E minor for break end. */
const NOTES: Record<ChimeKind, number[]> = {
  focus: [880, 1108.73, 1318.51],
  break: [659.25, 783.99, 987.77],
}
const NOTE_GAP = 0.18
const NOTE_LENGTH = 0.9
const MAX_GAIN = 0.3
const TICK = { frequency: 2637, length: 0.045, maxGain: 0.08 }

const level = (volumePct: number) => Math.min(100, Math.max(0, volumePct)) / 100

function defaultAudioContext(): AudioContext | null {
  const Ctor = globalThis.AudioContext ?? (globalThis as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  return Ctor ? new Ctor() : null
}

/** One sine note with a quick attack and exponential decay. */
function note(audio: AudioContext, frequency: number, at: number, length: number, peak: number, attack = 0.02): void {
  const osc = audio.createOscillator()
  const gain = audio.createGain()
  osc.type = 'sine'
  osc.frequency.value = frequency
  gain.gain.setValueAtTime(0, at)
  gain.gain.linearRampToValueAtTime(peak, at + attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, at + length)
  osc.connect(gain)
  gain.connect(audio.destination)
  osc.start(at)
  osc.stop(at + length + 0.05)
}

export function createChime(factory: () => AudioContext | null = defaultAudioContext): Chime {
  let ctx: AudioContext | null = null

  const context = () => {
    if (!ctx) {
      try {
        ctx = factory()
      } catch {
        ctx = null
      }
    }
    return ctx
  }

  return {
    async unlock() {
      const audio = context()
      if (audio && audio.state === 'suspended') {
        try {
          await audio.resume()
        } catch {
          // Still blocked; a later gesture can unlock it.
        }
      }
    },

    play(kind, volumePct) {
      const audio = context()
      const peak = MAX_GAIN * level(volumePct)
      if (!audio || peak === 0) return
      NOTES[kind].forEach((frequency, i) => note(audio, frequency, audio.currentTime + i * NOTE_GAP, NOTE_LENGTH, peak))
    },

    tick(volumePct) {
      const audio = context()
      const peak = TICK.maxGain * level(volumePct)
      if (!audio || peak === 0) return
      note(audio, TICK.frequency, audio.currentTime, TICK.length, peak, 0.004)
    },
  }
}

export function playCompletionChime(chime: Chime, finished: Mode, settings: Settings): void {
  if (!settings.sound) return
  chime.play(finished === 'focus' ? 'focus' : 'break', settings.volume)
}

/** Tick for a button or shortcut; the gesture also unlocks audio (AC-5.2, AC-5.9). */
export function playClick(chime: Chime, settings: Settings): void {
  if (!settings.clicks) return
  void chime.unlock()
  chime.tick(settings.volume)
}

/** Leading-edge throttle: run at most once per `waitMs` (AC-5.10 volume preview). */
export function throttle<A extends unknown[]>(fn: (...args: A) => void, waitMs: number, clock: () => number = Date.now): (...args: A) => void {
  let last = Number.NEGATIVE_INFINITY
  return (...args) => {
    const now = clock()
    if (now - last < waitMs) return
    last = now
    fn(...args)
  }
}
