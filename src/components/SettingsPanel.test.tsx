import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_SETTINGS, type Settings } from '../settings/settings'
import { SettingsPanel } from './SettingsPanel'

function setup(settings: Settings = DEFAULT_SETTINGS) {
  const onSave = vi.fn()
  const onClose = vi.fn()
  const onPreviewVolume = vi.fn()
  const onTick = vi.fn()
  render(<SettingsPanel settings={settings} onSave={onSave} onClose={onClose} onPreviewVolume={onPreviewVolume} onTick={onTick} />)
  return { onSave, onClose, onPreviewVolume, onTick }
}

afterEach(() => {
  vi.useRealTimers()
})

describe('SettingsPanel', () => {
  it('is a dialog named Settings', () => {
    setup()
    expect(screen.getByRole('dialog', { name: 'Settings' })).toBeInTheDocument()
  })

  it('shows the current values', () => {
    setup({ ...DEFAULT_SETTINGS, focusMin: 40, sound: false })
    expect(screen.getByLabelText('Focus')).toHaveValue(40)
    expect(screen.getByLabelText('Short break')).toHaveValue(5)
    expect(screen.getByLabelText('Chime')).not.toBeChecked()
  })

  it('AC-4.5 Save applies the edited values', async () => {
    const { onSave } = setup()
    const focus = screen.getByLabelText('Focus')
    await userEvent.clear(focus)
    await userEvent.type(focus, '50')
    await userEvent.click(screen.getByLabelText('Chime'))
    fireEvent.change(screen.getByLabelText('Volume'), { target: { value: '40' } })
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onSave).toHaveBeenCalledWith({ ...DEFAULT_SETTINGS, focusMin: 50, sound: false, volume: 40 })
  })

  it('AC-4.2 AC-4.5 Save clamps out-of-range values and replaces empty ones with defaults', async () => {
    const { onSave } = setup()
    await userEvent.clear(screen.getByLabelText('Focus'))
    await userEvent.type(screen.getByLabelText('Focus'), '500')
    await userEvent.clear(screen.getByLabelText('Long break'))
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onSave).toHaveBeenCalledWith({ ...DEFAULT_SETTINGS, focusMin: 120, longMin: 15 })
  })

  it('AC-4.5 Defaults fills the form without saving', async () => {
    const { onSave } = setup({ ...DEFAULT_SETTINGS, focusMin: 50, flash: false })
    await userEvent.click(screen.getByRole('button', { name: 'Defaults' }))
    expect(screen.getByLabelText('Focus')).toHaveValue(25)
    expect(screen.getByLabelText('Flash screen on finish')).toBeChecked()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('AC-4.4 closes with the close button', async () => {
    const { onClose } = setup()
    await userEvent.click(screen.getByRole('button', { name: 'Close settings' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('moves focus into the panel when it opens', () => {
    setup()
    expect(screen.getByLabelText('Focus')).toHaveFocus()
  })

  it('AC-5.9 Save stores the click sounds toggle', async () => {
    const { onSave } = setup()
    await userEvent.click(screen.getByLabelText('Click sounds'))
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onSave).toHaveBeenCalledWith({ ...DEFAULT_SETTINGS, clicks: false })
  })

  it('AC-5.10 dragging the volume slider plays a preview at its level', () => {
    const { onPreviewVolume } = setup()
    fireEvent.change(screen.getByLabelText('Volume'), { target: { value: '40' } })
    expect(onPreviewVolume).toHaveBeenCalledWith(40)
  })

  it('AC-5.10 previews at most once every 120 ms', () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_000)
    const { onPreviewVolume } = setup()
    const slider = screen.getByLabelText('Volume')
    fireEvent.change(slider, { target: { value: '40' } })
    vi.setSystemTime(1_050)
    fireEvent.change(slider, { target: { value: '45' } })
    vi.setSystemTime(1_200)
    fireEvent.change(slider, { target: { value: '50' } })
    expect(onPreviewVolume.mock.calls).toEqual([[40], [50]])
  })

  it('AC-5.10 keeps the slider enabled when only click sounds are on', () => {
    setup({ ...DEFAULT_SETTINGS, sound: false, clicks: true })
    expect(screen.getByLabelText('Volume')).toBeEnabled()
  })

  it('AC-5.10 disables the slider when chime and click sounds are both off', () => {
    setup({ ...DEFAULT_SETTINGS, sound: false, clicks: false })
    expect(screen.getByLabelText('Volume')).toBeDisabled()
  })

  it('AC-5.9 Defaults ticks, checkboxes stay silent', async () => {
    const { onTick } = setup()
    await userEvent.click(screen.getByLabelText('Dock badge countdown'))
    expect(onTick).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Defaults' }))
    expect(onTick).toHaveBeenCalledTimes(1)
  })
})
