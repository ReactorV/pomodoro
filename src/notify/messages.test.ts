import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS } from '../settings/settings'
import { completionMessage } from './messages'

describe('completionMessage', () => {
  it('AC-5.5 focus followed by a short break', () => {
    expect(completionMessage('focus', 'short', DEFAULT_SETTINGS)).toEqual({
      title: 'Focus complete',
      body: 'Short break next — 5 min.',
    })
  })

  it('AC-5.5 focus followed by a long break at the end of a cycle', () => {
    expect(completionMessage('focus', 'long', DEFAULT_SETTINGS)).toEqual({
      title: 'Focus complete',
      body: 'Long break next — 15 min.',
    })
  })

  it('AC-5.5 a break followed by focus', () => {
    expect(completionMessage('short', 'focus', DEFAULT_SETTINGS)).toEqual({
      title: 'Break over',
      body: 'Back to focus — 25 min.',
    })
    expect(completionMessage('long', 'focus', DEFAULT_SETTINGS).title).toBe('Break over')
  })

  it('AC-5.5 takes the minutes from the settings', () => {
    const settings = { ...DEFAULT_SETTINGS, focusMin: 50, shortMin: 10 }
    expect(completionMessage('focus', 'short', settings).body).toBe('Short break next — 10 min.')
    expect(completionMessage('short', 'focus', settings).body).toBe('Back to focus — 50 min.')
  })
})
