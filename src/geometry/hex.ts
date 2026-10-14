export type Point = readonly [number, number]

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

/** Pointy-top hexagon vertices, clockwise on screen, starting at the top. */
export function hexVertices(r: number, cx = 0, cy = 0): Point[] {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 180) * (60 * i - 90)
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)] as const
  })
}

/** The hexagon split into 3 rhombuses that meet in the center (isometric cube). */
export function cubeFaces(r: number, cx = 0, cy = 0): { top: Point[]; left: Point[]; right: Point[] } {
  const [v0, v1, v2, v3, v4, v5] = hexVertices(r, cx, cy)
  const c: Point = [cx, cy]
  return {
    top: [v5, v0, v1, c],
    right: [c, v1, v2, v3],
    left: [v5, c, v3, v4],
  }
}

/** Polyline along the hexagon edge from the top vertex, clockwise, covering `progress` (0–1) of the perimeter. */
export function progressPath(r: number, progress: number): Point[] {
  const ring = hexVertices(r)
  const along = clamp01(progress) * 6
  const whole = Math.floor(along)
  const fraction = along - whole
  const path: Point[] = [ring[0]]
  for (let i = 1; i <= whole; i++) path.push(ring[i % 6])
  if (whole < 6 && fraction > 0) {
    const [ax, ay] = ring[whole]
    const [bx, by] = ring[(whole + 1) % 6]
    path.push([ax + (bx - ax) * fraction, ay + (by - ay) * fraction])
  }
  return path
}

/** Which of the 6 vertex markers progress has reached. */
export function litVertices(progress: number): boolean[] {
  const p = clamp01(progress)
  return Array.from({ length: 6 }, (_, i) => p > 0 && p >= i / 6)
}

export function toPoints(points: readonly Point[]): string {
  return points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ')
}

export function toPath(points: readonly Point[]): string {
  return `M${points.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join('L')}Z`
}
