import type { Mode } from '../timer/machine'

/** Base palette; mirrored as CSS custom properties in tokens.css. */
export const COLORS = {
  night: '#0B0F1A',
  ink: '#121826',
  rain: '#151C2B',
  slate: '#24304A',
  edge: '#2E3A55',
  fog: '#8C96AB',
  haze: '#C4CCDA',
  mist: '#E6ECF5',
} as const

/** Mode accents: sodium streetlight, cold neon, violet (AC-6.3). */
export const ACCENT: Readonly<Record<Mode, string>> = {
  focus: '#F2A541',
  short: '#4FD1D9',
  long: '#9A8CE0',
}
