import type { Settings } from '../settings/settings'
import type { Mode } from '../timer/machine'

export type ChimeKind = 'focus' | 'break'

export interface Chime {
  /** Create or resume the audio context. Call from a user gesture (autoplay rule). */
  unlock: () => Promise<void>
  play: (kind: ChimeKind, volumePct: number) => void
}

/** Rising A major for focus end, softer E minor for break end. */
const NOTES: Record<ChimeKind, number[]> = {
  focus: [880, 1108.73, 1318.51],
  break: [659.25, 783.99, 987.77],
}
const NOTE_GAP = 0.18
const NOTE_LENGTH = 0.9
const MAX_GAIN = 0.3

function defaultAudioContext(): AudioContext | null {
  const Ctor = globalThis.AudioContext ?? (globalThis as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  return Ctor ? new Ctor() : null
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
      const peak = MAX_GAIN * (Math.min(100, Math.max(0, volumePct)) / 100)
      if (!audio || peak === 0) return
      NOTES[kind].forEach((frequency, i) => {
        const at = audio.currentTime + i * NOTE_GAP
        const osc = audio.createOscillator()
        const gain = audio.createGain()
        osc.type = 'sine'
        osc.frequency.value = frequency
        gain.gain.setValueAtTime(0, at)
        gain.gain.linearRampToValueAtTime(peak, at + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.0001, at + NOTE_LENGTH)
        osc.connect(gain)
        gain.connect(audio.destination)
        osc.start(at)
        osc.stop(at + NOTE_LENGTH + 0.05)
      })
    },
  }
}

export function playCompletionChime(chime: Chime, finished: Mode, settings: Settings): void {
  if (!settings.sound) return
  chime.play(finished === 'focus' ? 'focus' : 'break', settings.volume)
}
