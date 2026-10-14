import { describe, expect, it } from 'vitest'
import { cubeFaces, hexVertices, litVertices, progressPath, toPath, toPoints, type Point } from './hex'

const R = 100

function length(points: Point[]): number {
  let total = 0
  for (let i = 1; i < points.length; i++) {
    total += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1])
  }
  return total
}

/** Shoelace formula */
function area(points: Point[]): number {
  let sum = 0
  for (let i = 0; i < points.length; i++) {
    const [x1, y1] = points[i]
    const [x2, y2] = points[(i + 1) % points.length]
    sum += x1 * y2 - x2 * y1
  }
  return Math.abs(sum) / 2
}

describe('hexVertices', () => {
  it('AC-6.1 starts at the top vertex (pointy-top hexagon)', () => {
    const [x, y] = hexVertices(R)[0]
    expect(x).toBeCloseTo(0)
    expect(y).toBeCloseTo(-R)
  })

  it('AC-6.1 runs clockwise on screen', () => {
    const [x, y] = hexVertices(R)[1]
    expect(x).toBeGreaterThan(0)
    expect(y).toBeLessThan(0)
  })

  it('places all 6 vertices on the radius around the center', () => {
    const vertices = hexVertices(R, 10, 20)
    expect(vertices).toHaveLength(6)
    for (const [x, y] of vertices) expect(Math.hypot(x - 10, y - 20)).toBeCloseTo(R)
  })
})

describe('cubeFaces', () => {
  it('AC-6.1 splits the hexagon into 3 equal rhombuses', () => {
    const faces = cubeFaces(R)
    const hexArea = area(hexVertices(R))
    for (const face of [faces.top, faces.left, faces.right]) {
      expect(face).toHaveLength(4)
      expect(area(face)).toBeCloseTo(hexArea / 3)
    }
  })

  it('AC-6.1 every rhombus has 4 equal sides', () => {
    const { top } = cubeFaces(R)
    const sides = top.map((p, i) => Math.hypot(top[(i + 1) % 4][0] - p[0], top[(i + 1) % 4][1] - p[1]))
    for (const side of sides) expect(side).toBeCloseTo(R)
  })
})

describe('progressPath', () => {
  it('AC-6.1 has no length at 0 progress', () => {
    expect(length(progressPath(R, 0))).toBeCloseTo(0)
  })

  it('AC-6.1 length is proportional to progress', () => {
    expect(length(progressPath(R, 0.25))).toBeCloseTo(1.5 * R)
    expect(length(progressPath(R, 0.5))).toBeCloseTo(3 * R)
  })

  it('AC-6.1 reaches the bottom vertex at half progress', () => {
    const path = progressPath(R, 0.5)
    const [x, y] = path[path.length - 1]
    expect(x).toBeCloseTo(0)
    expect(y).toBeCloseTo(R)
  })

  it('AC-6.1 closes the full perimeter at 100 %', () => {
    const path = progressPath(R, 1)
    expect(length(path)).toBeCloseTo(6 * R)
    expect(path[path.length - 1][1]).toBeCloseTo(-R)
  })

  it('clamps progress outside 0–1', () => {
    expect(length(progressPath(R, 2))).toBeCloseTo(6 * R)
    expect(length(progressPath(R, -1))).toBeCloseTo(0)
  })
})

describe('litVertices', () => {
  it('AC-6.1 lights nothing before progress starts', () => {
    expect(litVertices(0)).toEqual([false, false, false, false, false, false])
  })

  it('AC-6.1 lights the vertices progress has reached', () => {
    expect(litVertices(0.5)).toEqual([true, true, true, true, false, false])
    expect(litVertices(0.4)).toEqual([true, true, true, false, false, false])
  })

  it('AC-6.1 lights all vertices when done', () => {
    expect(litVertices(1).every(Boolean)).toBe(true)
  })
})

describe('SVG strings', () => {
  it('formats points for polygon/polyline', () => {
    expect(toPoints([[0, -1], [1.23456, 2]])).toBe('0.00,-1.00 1.23,2.00')
  })

  it('formats a closed path', () => {
    expect(toPath([[0, 0], [1, 0], [1, 1]])).toBe('M0.00 0.00L1.00 0.00L1.00 1.00Z')
  })
})
