import { cubeFaces, hexVertices, toPath, toPoints } from '../geometry/hex'
import { ACCENT, COLORS } from '../styles/theme'
import styles from './feedback.module.css'

const CUBE = cubeFaces(11, 12, 12.5)
const OUTLINE = toPoints(hexVertices(10.5, 12, 12.5))
const FILL = ACCENT.focus

export interface HexCounterProps {
  /** Focus sessions completed today */
  done: number
  /** Focus sessions per cycle (longEvery) */
  groupSize: number
}

function Cell({ done }: { done: boolean }) {
  return (
    <svg data-cell data-done={done} width="22" height="23" viewBox="0 0 24 25" aria-hidden="true">
      {done ? (
        <>
          <path d={toPath(CUBE.top)} fill={FILL} />
          <path d={toPath(CUBE.left)} fill={FILL} fillOpacity={0.55} />
          <path d={toPath(CUBE.right)} fill={FILL} fillOpacity={0.28} />
        </>
      ) : (
        <polygon points={OUTLINE} fill="none" stroke={COLORS.edge} strokeWidth={1.5} strokeLinejoin="round" />
      )}
    </svg>
  )
}

/** Today's pomodoros as cubes, two cycles wide (AC-6.5). */
export function HexCounter({ done, groupSize }: HexCounterProps) {
  const groups = [0, 1].map((g) => Array.from({ length: groupSize }, (_, i) => g * groupSize + i < done))
  return (
    <div className={styles.counter}>
      <span className={styles.eyebrow}>Today</span>
      <div className={styles.groups}>
        {groups.map((cells, g) => (
          <div key={g} data-group className={styles.group}>
            {cells.map((isDone, i) => (
              <Cell key={i} done={isDone} />
            ))}
          </div>
        ))}
      </div>
      <span className={styles.count}>
        {done} {done === 1 ? 'pomodoro' : 'pomodoros'}
      </span>
    </div>
  )
}
