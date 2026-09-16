import { describe, expect, it } from 'vitest'
import {
  buildDijkstraPath,
  pathMetrics,
  pointAlongPath,
} from '@/domain/path-light'

function seededRandom(seed: number) {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 0x100000000
  }
}

describe('buildDijkstraPath', () => {
  it('returns a corner-to-corner path on a sparse grid', () => {
    const path = buildDijkstraPath({
      width: 800,
      height: 600,
      cols: 8,
      rows: 6,
      random: seededRandom(42),
    })

    expect(path.length).toBeGreaterThan(2)
    expect(path[0].x).toBeGreaterThan(0)
    expect(path[0].y).toBeGreaterThan(0)
    expect(path.at(-1)?.x).toBeLessThan(800)
    expect(path.at(-1)?.y).toBeLessThan(600)
    expect(path.at(-1)?.x).toBeGreaterThan(path[0].x)
    expect(path.at(-1)?.y).toBeGreaterThan(path[0].y)
  })

  it('stays deterministic for a fixed seed', () => {
    const a = buildDijkstraPath({
      width: 400,
      height: 300,
      random: seededRandom(7),
    })
    const b = buildDijkstraPath({
      width: 400,
      height: 300,
      random: seededRandom(7),
    })
    expect(a).toEqual(b)
  })
})

describe('pointAlongPath', () => {
  it('interpolates along arc length', () => {
    const path = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
    ]
    expect(pointAlongPath(path, 0)).toEqual({ x: 0, y: 0 })
    expect(pointAlongPath(path, 0.25)).toEqual({ x: 50, y: 0 })
    expect(pointAlongPath(path, 0.5)).toEqual({ x: 100, y: 0 })
    expect(pointAlongPath(path, 1)).toEqual({ x: 100, y: 100 })
    expect(pathMetrics(path).total).toBe(200)
  })
})
