import { fireEvent, render, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useHotkeys, type HotkeyHandlers } from './useHotkeys'

function setup() {
  const handlers: HotkeyHandlers = {
    toggle: vi.fn(),
    reset: vi.fn(),
    skip: vi.fn(),
    openSettings: vi.fn(),
    closeSettings: vi.fn(),
  }
  renderHook(() => useHotkeys(handlers))
  return handlers
}

describe('useHotkeys', () => {
  it('AC-7.1 Space toggles the timer and does not scroll', () => {
    const h = setup()
    const event = new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true, cancelable: true })
    document.body.dispatchEvent(event)
    expect(h.toggle).toHaveBeenCalledTimes(1)
    expect(event.defaultPrevented).toBe(true)
  })

  it('AC-7.1 R resets, S skips, comma opens settings, Esc closes them', () => {
    const h = setup()
    fireEvent.keyDown(document.body, { key: 'r' })
    fireEvent.keyDown(document.body, { key: 'S' })
    fireEvent.keyDown(document.body, { key: ',' })
    fireEvent.keyDown(document.body, { key: 'Escape' })
    expect(h.reset).toHaveBeenCalledTimes(1)
    expect(h.skip).toHaveBeenCalledTimes(1)
    expect(h.openSettings).toHaveBeenCalledTimes(1)
    expect(h.closeSettings).toHaveBeenCalledTimes(1)
  })

  it('AC-7.2 ignores keys typed into an input', () => {
    const h = setup()
    const { getByRole } = render(<input aria-label="Focus minutes" />)
    fireEvent.keyDown(getByRole('textbox'), { key: 'r' })
    fireEvent.keyDown(getByRole('textbox'), { key: ' ' })
    expect(h.reset).not.toHaveBeenCalled()
    expect(h.toggle).not.toHaveBeenCalled()
  })

  it('AC-7.2 ignores keys in select and textarea', () => {
    const h = setup()
    const { container } = render(
      <>
        <select aria-label="pick" />
        <textarea aria-label="notes" />
      </>,
    )
    fireEvent.keyDown(container.querySelector('select')!, { key: 's' })
    fireEvent.keyDown(container.querySelector('textarea')!, { key: 's' })
    expect(h.skip).not.toHaveBeenCalled()
  })

  it('AC-7.2 still closes settings with Esc from an input', () => {
    const h = setup()
    const { getByRole } = render(<input aria-label="Focus minutes" />)
    fireEvent.keyDown(getByRole('textbox'), { key: 'Escape' })
    expect(h.closeSettings).toHaveBeenCalledTimes(1)
  })

  it('AC-7.2 ignores shortcuts with ⌘, Ctrl or Alt', () => {
    const h = setup()
    fireEvent.keyDown(document.body, { key: 'r', metaKey: true })
    fireEvent.keyDown(document.body, { key: 'r', ctrlKey: true })
    fireEvent.keyDown(document.body, { key: 'r', altKey: true })
    expect(h.reset).not.toHaveBeenCalled()
  })

  it('AC-7.2 ignores auto-repeat', () => {
    const h = setup()
    fireEvent.keyDown(document.body, { key: ' ', repeat: true })
    expect(h.toggle).not.toHaveBeenCalled()
  })

  it('AC-7.2 leaves Space on a focused button to the button', () => {
    const h = setup()
    const { getByRole } = render(<button type="button">Reset</button>)
    fireEvent.keyDown(getByRole('button'), { key: ' ' })
    expect(h.toggle).not.toHaveBeenCalled()
  })

  it('stops listening after unmount', () => {
    const toggle = vi.fn()
    const { unmount } = renderHook(() =>
      useHotkeys({ toggle, reset: vi.fn(), skip: vi.fn(), openSettings: vi.fn(), closeSettings: vi.fn() }),
    )
    unmount()
    fireEvent.keyDown(document.body, { key: ' ' })
    expect(toggle).not.toHaveBeenCalled()
  })
})
