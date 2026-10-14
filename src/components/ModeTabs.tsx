import type { CSSProperties } from 'react'
import { MODE_LABEL } from '../notify/format'
import { ACCENT, COLORS } from '../styles/theme'
import type { Mode } from '../timer/machine'
import styles from './controls.module.css'
import { Diamond } from './icons'

const MODES: Mode[] = ['focus', 'short', 'long']

export interface ModeTabsProps {
  mode: Mode
  onSelect: (mode: Mode) => void
}

export function ModeTabs({ mode, onSelect }: ModeTabsProps) {
  return (
    <div className={styles.tabs} role="group" aria-label="Timer mode">
      {MODES.map((m) => {
        const active = m === mode
        return (
          <button
            key={m}
            type="button"
            className={styles.tab}
            aria-pressed={active}
            style={{ '--tab-accent': ACCENT[m] } as CSSProperties}
            onClick={() => onSelect(m)}
          >
            <Diamond color={active ? ACCENT[m] : COLORS.edge} />
            {MODE_LABEL[m]}
          </button>
        )
      })}
    </div>
  )
}
