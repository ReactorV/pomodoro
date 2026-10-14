import { useEffect, useRef } from 'react'

export interface HotkeyHandlers {
  toggle: () => void
  reset: () => void
  skip: () => void
  openSettings: () => void
  closeSettings: () => void
}

const TYPING_TAGS = new Set(['INPUT', 'SELECT', 'TEXTAREA'])
const ACTIVATABLE_TAGS = new Set(['BUTTON', 'A'])

function isTyping(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (TYPING_TAGS.has(target.tagName) || target.isContentEditable)
}

function isActivatable(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && ACTIVATABLE_TAGS.has(target.tagName)
}

/** Global keyboard shortcuts (AC-7.1, AC-7.2). */
export function useHotkeys(handlers: HotkeyHandlers): void {
  const ref = useRef(handlers)
  useEffect(() => {
    ref.current = handlers
  })

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) return
      const h = ref.current
      if (event.key === 'Escape') {
        h.closeSettings()
        return
      }
      if (isTyping(event.target)) return

      switch (event.key) {
        case ' ':
          if (isActivatable(event.target)) return
          event.preventDefault()
          h.toggle()
          break
        case 'r':
        case 'R':
          h.reset()
          break
        case 's':
        case 'S':
          h.skip()
          break
        case ',':
          // The panel focuses its first input during this keydown; don't let the comma land in it.
          event.preventDefault()
          h.openSettings()
          break
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])
}
