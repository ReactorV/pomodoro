import { useId } from 'react'
import { cubeFaces, hexVertices, litVertices, progressPath, toPath, toPoints, type Point } from '../geometry/hex'
import { MODE_LABEL, formatClock } from '../notify/format'
import { ACCENT, COLORS } from '../styles/theme'
import type { Mode } from '../timer/machine'
import styles from './HexTimer.module.css'

export interface HexTimerProps {
  mode: Mode
  remainingMs: number
  /** Elapsed share of the session, 0–1 */
  progress: number
  statusText: string
  subtitle: string
  /** Session just completed: show glow rings */
  celebrating?: boolean
}

const RING_R = 232
const CUBE_R = 190
const ECHO_R = [258, 284]
const FACES = cubeFaces(CUBE_R)
const RING = toPoints(hexVertices(RING_R))
/** Elongated hexagon behind the digits, so cube edges don't cross them */
const PLATE = toPoints([[-160, 0], [-132, -52], [132, -52], [160, 0], [132, 52], [-132, 52]])

function marker([x, y]: Point): string {
  return toPoints([[x, y - 10], [x + 6.5, y], [x, y + 10], [x - 6.5, y]])
}

export function HexTimer({ mode, remainingMs, progress, statusText, subtitle, celebrating = false }: HexTimerProps) {
  const glowId = useId()
  const accent = ACCENT[mode]
  const time = formatClock(remainingMs)
  const progressPoints = toPoints(progressPath(RING_R, progress))
  const lit = litVertices(progress)

  return (
    <svg className={styles.timer} viewBox="-300 -300 600 600" role="img" aria-label={`${MODE_LABEL[mode]} timer, ${time} left`}>
      <defs>
        <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>

      {celebrating &&
        ECHO_R.map((r, i) => (
          <polygon
            key={r}
            data-echo
            className={styles.echo}
            points={toPoints(hexVertices(r))}
            fill="none"
            stroke={accent}
            strokeOpacity={i === 0 ? 0.4 : 0.16}
            strokeWidth={2}
            strokeLinejoin="round"
          />
        ))}

      <path data-face="top" d={toPath(FACES.top)} fill={accent} fillOpacity={0.1} stroke={COLORS.slate} strokeWidth={1.5} strokeLinejoin="round" />
      <path data-face="left" d={toPath(FACES.left)} fill="#131A28" stroke={COLORS.slate} strokeWidth={1.5} strokeLinejoin="round" />
      <path data-face="right" d={toPath(FACES.right)} fill="#0F1420" stroke={COLORS.slate} strokeWidth={1.5} strokeLinejoin="round" />

      <polygon points={RING} fill="none" stroke="#1E2738" strokeWidth={5} strokeLinejoin="round" />
      <polyline
        points={progressPoints}
        fill="none"
        stroke={accent}
        strokeWidth={12}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={celebrating ? 0.9 : 0.5}
        filter={`url(#${CSS.escape(glowId)})`}
      />
      <polyline data-progress points={progressPoints} fill="none" stroke={accent} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />

      {hexVertices(RING_R).map((vertex, i) => (
        <polygon key={i} data-marker data-lit={lit[i]} points={marker(vertex)} fill={lit[i] ? accent : COLORS.edge} />
      ))}

      <polygon points={PLATE} fill={COLORS.night} fillOpacity={0.94} stroke={COLORS.slate} strokeWidth={1.5} strokeLinejoin="round" />
      <text className={styles.status} x="0" y="-84" textAnchor="middle" fill={COLORS.fog}>
        {statusText}
      </text>
      <text className={styles.time} x="0" y="29" textAnchor="middle" fill={COLORS.mist}>
        {time}
      </text>
      <text className={styles.subtitle} x="0" y="100" textAnchor="middle" fill={accent}>
        {subtitle}
      </text>
    </svg>
  )
}
