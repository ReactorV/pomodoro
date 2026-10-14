import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS } from '../settings/settings'
import { createChime, playClick, playCompletionChime, throttle } from './sound'

/** Minimal in-memory Web Audio fake that records what was scheduled. */
class FakeAudioContext {
  state: 'suspended' | 'running' = 'suspended'
  currentTime = 0
  destination = {}
  notes: { frequency: number; started: boolean; peak: number }[] = []
  resumed = 0

  async resume() {
    this.resumed++
    this.state = 'running'
  }

  createOscillator() {
    const note = { frequency: 0, started: false, peak: 0 }
    this.notes.push(note)
    return {
      type: 'sine',
      frequency: {
        set value(v: number) {
          note.frequency = v
        },
      },
      connect: () => {},
      start: () => {
        note.started = true
      },
      stop: () => {},
    }
  }

  createGain() {
    const note = () => this.notes[this.notes.length - 1]
    return {
      gain: {
        setValueAtTime: () => {},
        linearRampToValueAtTime: (v: number) => {
          // gain is created right after its oscillator
          const n = note()
          if (n) n.peak = Math.max(n.peak, v)
        },
        exponentialRampToValueAtTime: () => {},
      },
      connect: () => {},
    }
  }
}

function setup() {
  const contexts: FakeAudioContext[] = []
  const chime = createChime(() => {
    const ctx = new FakeAudioContext()
    contexts.push(ctx)
    return ctx as unknown as AudioContext
  })
  return { chime, contexts }
}

describe('chime', () => {
  it('AC-5.2 unlock creates the audio context and resumes it', async () => {
    const { chime, contexts } = setup()
    await chime.unlock()
    expect(contexts).toHaveLength(1)
    expect(contexts[0].state).toBe('running')
  })

  it('AC-5.2 unlock reuses one audio context', async () => {
    const { chime, contexts } = setup()
    await chime.unlock()
    await chime.unlock()
    expect(contexts).toHaveLength(1)
  })

  it('AC-5.1 plays 3 notes', async () => {
    const { chime, contexts } = setup()
    await chime.unlock()
    chime.play('focus', 70)
    expect(contexts[0].notes.filter((n) => n.started)).toHaveLength(3)
  })

  it('AC-5.1 focus end and break end use different notes', async () => {
    const { chime, contexts } = setup()
    await chime.unlock()
    chime.play('focus', 70)
    chime.play('break', 70)
    const freqs = contexts[0].notes.map((n) => n.frequency)
    expect(freqs.slice(0, 3)).not.toEqual(freqs.slice(3, 6))
  })

  it('AC-5.1 scales loudness with the volume', async () => {
    const { chime, contexts } = setup()
    await chime.unlock()
    chime.play('focus', 100)
    chime.play('focus', 50)
    const [loud, quiet] = [contexts[0].notes[0].peak, contexts[0].notes[3].peak]
    expect(quiet).toBeCloseTo(loud / 2)
  })

  it('AC-5.1 volume 0 plays nothing', async () => {
    const { chime, contexts } = setup()
    await chime.unlock()
    chime.play('focus', 0)
    expect(contexts[0].notes).toHaveLength(0)
  })

  it('works without Web Audio support', async () => {
    const chime = createChime(() => null)
    await expect(chime.unlock()).resolves.toBeUndefined()
    expect(() => chime.play('focus', 70)).not.toThrow()
  })
})

describe('playCompletionChime', () => {
  it('AC-5.1 plays the focus chime after focus with the set volume', async () => {
    const { chime, contexts } = setup()
    await chime.unlock()
    playCompletionChime(chime, 'focus', DEFAULT_SETTINGS)
    expect(contexts[0].notes).toHaveLength(3)
  })

  it('AC-5.1 stays silent when the chime setting is off', async () => {
    const { chime, contexts } = setup()
    await chime.unlock()
    playCompletionChime(chime, 'short', { ...DEFAULT_SETTINGS, sound: false })
    expect(contexts[0].notes).toHaveLength(0)
  })
})

describe('click tick', () => {
  it('AC-5.9 plays one short high note', async () => {
    const { chime, contexts } = setup()
    await chime.unlock()
    chime.tick(70)
    expect(contexts[0].notes).toHaveLength(1)
    expect(contexts[0].notes[0].started).toBe(true)
    expect(contexts[0].notes[0].frequency).toBeGreaterThan(2000)
  })

  it('AC-5.9 is softer than the chime at the same volume', async () => {
    const { chime, contexts } = setup()
    await chime.unlock()
    chime.tick(100)
    chime.play('focus', 100)
    expect(contexts[0].notes[0].peak).toBeLessThan(contexts[0].notes[1].peak)
  })

  it('AC-5.10 scales with the shared volume', async () => {
    const { chime, contexts } = setup()
    await chime.unlock()
    chime.tick(100)
    chime.tick(25)
    expect(contexts[0].notes[1].peak).toBeCloseTo(contexts[0].notes[0].peak / 4)
  })

  it('AC-5.9 volume 0 plays nothing', async () => {
    const { chime, contexts } = setup()
    await chime.unlock()
    chime.tick(0)
    expect(contexts[0].notes).toHaveLength(0)
  })
})

describe('playClick', () => {
  it('AC-5.2 AC-5.9 unlocks audio and ticks when click sounds are on', () => {
    const { chime, contexts } = setup()
    playClick(chime, DEFAULT_SETTINGS)
    expect(contexts[0].resumed).toBe(1)
    expect(contexts[0].notes).toHaveLength(1)
  })

  it('AC-5.9 stays silent when click sounds are off', () => {
    const { chime, contexts } = setup()
    playClick(chime, { ...DEFAULT_SETTINGS, clicks: false })
    expect(contexts).toHaveLength(0)
  })
})

describe('throttle', () => {
  it('AC-5.10 runs at most once per wait period', () => {
    let now = 0
    const calls: number[] = []
    const preview = throttle((v: number) => calls.push(v), 120, () => now)
    preview(10)
    now = 50
    preview(20)
    now = 130
    preview(30)
    expect(calls).toEqual([10, 30])
  })
})
