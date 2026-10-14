import { describe, expect, it } from 'vitest'
import indexHtml from '../../index.html?raw'
import globalCss from './global.css?raw'
import { ACCENT, COLORS } from './theme'
import tokensCss from './tokens.css?raw'

describe('theme', () => {
  it('AC-6.3 has one accent per mode', () => {
    expect(ACCENT).toEqual({ focus: '#F2A541', short: '#4FD1D9', long: '#9A8CE0' })
  })

  it('AC-6.3 CSS tokens match the TypeScript accents', () => {
    expect(tokensCss).toContain(`--sodium: ${ACCENT.focus}`)
    expect(tokensCss).toContain(`--neon: ${ACCENT.short}`)
    expect(tokensCss).toContain(`--violet: ${ACCENT.long}`)
  })

  it('CSS tokens match the base palette', () => {
    for (const [name, value] of Object.entries(COLORS)) {
      expect(tokensCss).toContain(`--${name}: ${value}`)
    }
  })

  it('AC-8.3 loads no fonts from a CDN', () => {
    for (const source of [tokensCss, globalCss, indexHtml]) {
      expect(source).not.toMatch(/fonts\.(googleapis|gstatic)\.com/)
    }
  })
})
