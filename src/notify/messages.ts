import type { Settings } from '../settings/settings'
import type { Mode } from '../timer/machine'

export interface Message {
  title: string
  body: string
}

export function completionMessage(finished: Mode, next: Mode, settings: Settings): Message {
  if (finished !== 'focus') {
    return { title: 'Break over', body: `Back to focus — ${settings.focusMin} min.` }
  }
  const body = next === 'long' ? `Long break next — ${settings.longMin} min.` : `Short break next — ${settings.shortMin} min.`
  return { title: 'Focus complete', body }
}
