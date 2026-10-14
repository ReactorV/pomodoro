import type { ManifestOptions } from 'vite-plugin-pwa'
import { COLORS } from '../styles/theme'

/** Web app manifest (AC-8.1). Icons are generated from public/favicon.svg. */
export const MANIFEST: Partial<ManifestOptions> = {
  name: 'Hex Pomodoro',
  short_name: 'Pomodoro',
  description: 'Pomodoro timer with hexagon rhombus design',
  display: 'standalone',
  start_url: '/',
  theme_color: COLORS.night,
  background_color: COLORS.night,
  icons: [
    { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
    { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
    { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
    { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
}

/** Files the service worker precaches so the installed app opens offline (AC-8.2, AC-8.3). */
export const PRECACHE_GLOBS = ['**/*.{js,css,html,svg,png,ico,woff2}']
