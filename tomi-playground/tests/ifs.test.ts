import { describe, expect, it } from 'vitest'
import {
  BASE_IFS_POINTS,
  buildIfsPoints,
  DEFAULT_IFS_VARIANT,
  densityToIfsCount,
  IFS_VARIANTS,
  MAX_IFS_POINTS,
  parseIfsVariant,
} from '@/domain/ifs'
import { DEFAULT_MAZE_DENSITY } from '@/domain/maze-prefs'

function cyclingRandom() {
  let i = 0
  return () => {
    i = (i + 1) % 100
    return i / 100
  }
}

describe('densityToIfsCount', () => {
  it('scales point count with density and halves on mobile', () => {
    expect(densityToIfsCount(1, 1440)).toBe(BASE_IFS_POINTS)
    expect(densityToIfsCount(DEFAULT_MAZE_DENSITY, 1440)).toBe(
      BASE_IFS_POINTS * DEFAULT_MAZE_DENSITY,
    )
    expect(densityToIfsCount(DEFAULT_MAZE_DENSITY, 1440)).toBeLessThanOrEqual(
      MAX_IFS_POINTS,
    )
    expect(densityToIfsCount(DEFAULT_MAZE_DENSITY, 390)).toBe(
      Math.round(BASE_IFS_POINTS * (DEFAULT_MAZE_DENSITY * 0.5)),
    )
    expect(densityToIfsCount(4, 1440)).toBeGreaterThan(densityToIfsCount(3, 1440))
  })
})

describe('parseIfsVariant', () => {
  it('accepts known variants and falls back for junk', () => {
    expect(parseIfsVariant('barnsley')).toBe('barnsley')
    expect(parseIfsVariant('sierpinski')).toBe('sierpinski')
    expect(parseIfsVariant('fishbone')).toBe(DEFAULT_IFS_VARIANT)
    expect(parseIfsVariant('nope')).toBe(DEFAULT_IFS_VARIANT)
    expect(IFS_VARIANTS.map((v) => v.id)).toEqual(['barnsley', 'sierpinski'])
  })
})

describe('buildIfsPoints', () => {
  it('returns the requested count of points inside the viewport', () => {
    const points = buildIfsPoints({
      count: 200,
      width: 400,
      height: 800,
      random: cyclingRandom(),
    })
    expect(points).toHaveLength(200)
    for (const p of points) {
      expect(p.x).toBeGreaterThanOrEqual(0)
      expect(p.x).toBeLessThanOrEqual(400)
      expect(p.y).toBeGreaterThanOrEqual(0)
      expect(p.y).toBeLessThanOrEqual(800)
    }
  })

  it('produces distinct layouts for Barnsley and Sierpinski', () => {
    const shared = {
      count: 400,
      width: 400,
      height: 400,
    }
    const barnsley = buildIfsPoints({
      ...shared,
      variant: 'barnsley',
      random: cyclingRandom(),
    })
    const sierpinski = buildIfsPoints({
      ...shared,
      variant: 'sierpinski',
      random: cyclingRandom(),
    })

    const fingerprint = (pts: { x: number; y: number }[]) =>
      pts
        .slice(0, 8)
        .map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`)
        .join('|')

    expect(fingerprint(barnsley)).not.toBe(fingerprint(sierpinski))
  })
})
