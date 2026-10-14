import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Controls, primaryLabel } from './Controls'

describe('primaryLabel', () => {
  it('AC-6.4 reads Start when idle', () => {
    expect(primaryLabel('idle', null, 'focus')).toBe('Start')
  })

  it('AC-6.4 reads Pause when running', () => {
    expect(primaryLabel('running', null, 'focus')).toBe('Pause')
  })

  it('AC-6.4 reads Resume when paused', () => {
    expect(primaryLabel('paused', null, 'short')).toBe('Resume')
  })

  it('AC-6.4 reads Start break after a focus session', () => {
    expect(primaryLabel('idle', 'focus', 'short')).toBe('Start break')
    expect(primaryLabel('idle', 'focus', 'long')).toBe('Start break')
  })

  it('AC-6.4 reads Start focus after a break', () => {
    expect(primaryLabel('idle', 'short', 'focus')).toBe('Start focus')
  })
})

describe('Controls', () => {
  function setup(running = false) {
    const handlers = { onPrimary: vi.fn(), onReset: vi.fn(), onSkip: vi.fn() }
    render(<Controls primaryLabel={running ? 'Pause' : 'Start'} running={running} {...handlers} />)
    return handlers
  }

  it('AC-6.4 shows the primary label', () => {
    setup(true)
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument()
  })

  it('calls the primary handler', async () => {
    const h = setup()
    await userEvent.click(screen.getByRole('button', { name: 'Start' }))
    expect(h.onPrimary).toHaveBeenCalledTimes(1)
  })

  it('AC-3.6 reset and AC-3.7 skip are labelled icon buttons', async () => {
    const h = setup()
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }))
    await userEvent.click(screen.getByRole('button', { name: 'Skip to next session' }))
    expect(h.onReset).toHaveBeenCalledTimes(1)
    expect(h.onSkip).toHaveBeenCalledTimes(1)
  })
})
