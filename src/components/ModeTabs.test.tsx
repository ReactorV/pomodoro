import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ModeTabs } from './ModeTabs'

describe('ModeTabs', () => {
  it('AC-6.6 marks the current mode with aria-pressed', () => {
    render(<ModeTabs mode="short" onSelect={() => {}} />)
    expect(screen.getByRole('button', { name: 'Short break' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Focus' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'Long break' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('AC-3.12 selects a mode on click', async () => {
    const onSelect = vi.fn()
    render(<ModeTabs mode="focus" onSelect={onSelect} />)
    await userEvent.click(screen.getByRole('button', { name: 'Long break' }))
    expect(onSelect).toHaveBeenCalledWith('long')
  })

  it('groups the tabs under an accessible name', () => {
    render(<ModeTabs mode="focus" onSelect={() => {}} />)
    expect(screen.getByRole('group', { name: 'Timer mode' })).toBeInTheDocument()
  })
})
