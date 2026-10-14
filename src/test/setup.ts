import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Testing Library detects fake timers through a `jest` global and advances them while it
// waits for async events; without this shim user-event hangs under vi.useFakeTimers().
Object.assign(globalThis, { jest: { advanceTimersByTime: (ms: number) => vi.advanceTimersByTime(ms) } })

afterEach(() => {
  cleanup()
  localStorage.clear()
})
