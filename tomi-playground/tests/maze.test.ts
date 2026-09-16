import { describe, expect, it } from 'vitest'
import {
  buildMazeScene,
  pathMetrics,
  pointAlongPath,
  smoothPolyline,
  trailAlongPath,
} from '@/domain/maze'

function seededRandom(seed: number) {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 0x100000000
  }
}

describe('buildMazeScene', () => {
  it('builds walls and a solution from start to end', () => {
    const scene = buildMazeScene({
      width: 800,
      height: 600,
      cols: 9,
      rows: 7,
      random: seededRandom(42),
    })

    expect(scene.walls.length).toBeGreaterThan(20)
    expect(scene.path.length).toBeGreaterThan(2)
    expect(scene.path[0].x).toBeCloseTo(800 / 9 / 2, 5)
    expect(scene.path[0].y).toBeCloseTo(600 / 7 / 2, 5)
    expect(scene.path.at(-1)?.x).toBeCloseTo(800 - 800 / 9 / 2, 5)
    expect(scene.path.at(-1)?.y).toBeCloseTo(600 - 600 / 7 / 2, 5)
  })

  it('stays deterministic for a fixed seed', () => {
    const a = buildMazeScene({
      width: 400,
      height: 300,
      random: seededRandom(7),
    })
    const b = buildMazeScene({
      width: 400,
      height: 300,
      random: seededRandom(7),
    })
    expect(a).toEqual(b)
  })
})

describe('smoothPolyline', () => {
  it('adds bend samples around corners', () => {
    const path = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
    ]
    const smooth = smoothPolyline(path, 20, 4)
    expect(smooth.length).toBeGreaterThan(path.length)
    expect(smooth[0]).toEqual(path[0])
    expect(smooth.at(-1)).toEqual(path.at(-1))
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

describe('trailAlongPath', () => {
  it('keeps corner vertices instead of chord-cutting', () => {
    const path = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 200, y: 100 },
    ]
    const trail = trailAlongPath(path, 0.1, 0.9)
    expect(trail.some((p) => p.x === 100 && p.y === 0)).toBe(true)
    expect(trail.some((p) => p.x === 100 && p.y === 100)).toBe(true)
  })
})
