import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { HexCounter } from './HexCounter'

describe('HexCounter', () => {
  it('AC-6.5 shows longEvery × 2 cells in groups of longEvery', () => {
    const { container } = render(<HexCounter done={0} groupSize={4} />)
    const groups = container.querySelectorAll('[data-group]')
    expect(groups).toHaveLength(2)
    for (const group of groups) expect(group.querySelectorAll('[data-cell]')).toHaveLength(4)
  })

  it('AC-6.5 follows a custom cycle length', () => {
    const { container } = render(<HexCounter done={0} groupSize={3} />)
    expect(container.querySelectorAll('[data-cell]')).toHaveLength(6)
  })

  it('AC-6.5 fills one cube per completed pomodoro', () => {
    const { container } = render(<HexCounter done={5} groupSize={4} />)
    expect(container.querySelectorAll('[data-cell][data-done="true"]')).toHaveLength(5)
  })

  it('AC-6.5 caps filled cells at the number of cells', () => {
    const { container } = render(<HexCounter done={11} groupSize={4} />)
    expect(container.querySelectorAll('[data-cell][data-done="true"]')).toHaveLength(8)
  })

  it('AC-6.5 labels the count with correct plural', () => {
    const { rerender } = render(<HexCounter done={1} groupSize={4} />)
    expect(screen.getByText('1 pomodoro')).toBeInTheDocument()
    rerender(<HexCounter done={11} groupSize={4} />)
    expect(screen.getByText('11 pomodoros')).toBeInTheDocument()
  })
})
