import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { HexTimer, type HexTimerProps } from './HexTimer'

const MIN = 60_000

function renderTimer(props: Partial<HexTimerProps> = {}) {
  return render(
    <HexTimer
      mode="focus"
      remainingMs={16 * MIN + 15_000}
      progress={0.35}
      statusText="RUNNING"
      subtitle="FOCUS · 3 / 4"
      {...props}
    />,
  )
}

function lastPoint(points: string): [number, number] {
  const pairs = points.trim().split(' ')
  const [x, y] = pairs[pairs.length - 1].split(',').map(Number)
  return [x, y]
}

describe('HexTimer', () => {
  it('AC-6.2 shows the remaining time as MM:SS', () => {
    renderTimer()
    expect(screen.getByText('16:15')).toBeInTheDocument()
  })

  it('has an accessible name with mode and time left', () => {
    renderTimer()
    expect(screen.getByRole('img', { name: 'Focus timer, 16:15 left' })).toBeInTheDocument()
  })

  it('AC-6.1 draws the hexagon as 3 rhombus faces', () => {
    const { container } = renderTimer()
    expect(container.querySelectorAll('[data-face]')).toHaveLength(3)
  })

  it('AC-6.1 draws progress from the top vertex clockwise', () => {
    const { container } = renderTimer({ progress: 0.5 })
    const line = container.querySelector('[data-progress]')!
    const [x, y] = lastPoint(line.getAttribute('points')!)
    expect(x).toBeCloseTo(0)
    expect(y).toBeGreaterThan(0) // bottom vertex at half progress
  })

  it('AC-6.1 lights the vertex markers progress has passed', () => {
    const { container } = renderTimer({ progress: 0.5 })
    expect(container.querySelectorAll('[data-marker][data-lit="true"]')).toHaveLength(4)
    expect(container.querySelectorAll('[data-marker]')).toHaveLength(6)
  })

  it('AC-6.3 strokes progress in the mode accent', () => {
    const { container } = renderTimer({ mode: 'short' })
    expect(container.querySelector('[data-progress]')).toHaveAttribute('stroke', '#4FD1D9')
  })

  it('shows the status and subtitle text', () => {
    renderTimer({ statusText: 'PAUSED', subtitle: 'SHORT BREAK' })
    expect(screen.getByText('PAUSED')).toBeInTheDocument()
    expect(screen.getByText('SHORT BREAK')).toBeInTheDocument()
  })

  it('AC-5.6 shows glow rings only while celebrating a completion', () => {
    const { container, rerender } = renderTimer()
    expect(container.querySelectorAll('[data-echo]')).toHaveLength(0)
    rerender(<HexTimer mode="focus" remainingMs={0} progress={1} statusText="COMPLETE" subtitle="" celebrating />)
    expect(container.querySelectorAll('[data-echo]')).toHaveLength(2)
  })
})
