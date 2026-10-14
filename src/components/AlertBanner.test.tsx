import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AlertBanner } from './AlertBanner'

describe('AlertBanner', () => {
  it('AC-6.7 announces the completion as a status message', () => {
    render(<AlertBanner title="Focus complete" body="Short break next — 5 min." />)
    const status = screen.getByRole('status')
    expect(status).toHaveTextContent('Focus complete')
    expect(status).toHaveTextContent('Short break next — 5 min.')
  })
})
