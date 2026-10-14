import { describe, expect, it } from 'vitest'
import { MANIFEST, PRECACHE_GLOBS } from './manifest'

describe('PWA manifest', () => {
  it('AC-8.1 is a standalone app named Hex Pomodoro with night theme colors', () => {
    expect(MANIFEST).toMatchObject({
      name: 'Hex Pomodoro',
      display: 'standalone',
      theme_color: '#0B0F1A',
      background_color: '#0B0F1A',
    })
  })

  it('AC-8.1 has 192, 512 and maskable 512 icons', () => {
    const icons = MANIFEST.icons ?? []
    expect(icons).toContainEqual(expect.objectContaining({ sizes: '192x192', type: 'image/png' }))
    expect(icons).toContainEqual(expect.objectContaining({ sizes: '512x512', type: 'image/png' }))
    expect(icons).toContainEqual(expect.objectContaining({ sizes: '512x512', purpose: 'maskable' }))
  })
})

describe('service worker precache', () => {
  it('AC-8.2 AC-8.3 covers pages, code, styles, fonts and icons', () => {
    const pattern = PRECACHE_GLOBS.join(' ')
    for (const ext of ['html', 'js', 'css', 'woff2', 'png', 'svg', 'ico']) {
      expect(pattern).toContain(ext)
    }
  })
})
