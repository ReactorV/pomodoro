import { useCallback, useSyncExternalStore } from 'react'

/** Live result of a CSS media query; false where matchMedia is missing. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = globalThis.matchMedia?.(query)
      list?.addEventListener('change', onChange)
      return () => list?.removeEventListener('change', onChange)
    },
    [query],
  )
  return useSyncExternalStore(
    subscribe,
    () => globalThis.matchMedia?.(query).matches ?? false,
    () => false,
  )
}
