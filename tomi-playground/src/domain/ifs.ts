import type { Point } from '@/domain/maze'
import { effectiveMazeDensity } from '@/domain/maze-prefs'

/** Desktop point count at density 1. */
export const BASE_IFS_POINTS = 8_000
/**
 * Hard cap so dense large viewports stay ambient-cheap.
 * High enough that density 4 (BASE × 4 = 32k) is not clipped — IFS bake is
 * one-shot, so this can sit above the old maze-era 24k ceiling.
 */
export const MAX_IFS_POINTS = 64_000

/** Affine IFS chaos-game variants for the IFS ambient background. */
export type IfsVariantId = 'barnsley' | 'sierpinski'

export type IfsVariantOption = {
  id: IfsVariantId
  name: string
}

export const IFS_VARIANTS: IfsVariantOption[] = [
  { id: 'barnsley', name: 'Barnsley' },
  { id: 'sierpinski', name: 'Sierpinski' },
]

export const DEFAULT_IFS_VARIANT: IfsVariantId = 'barnsley'

/** Affine map: [x', y'] = [a x + b y + e, c x + d y + f]. */
type Affine = {
  a: number
  b: number
  c: number
  d: number
  e: number
  f: number
  /** Selection probability (should sum to ~1 across the set). */
  p: number
}

type IfsSystem = {
  transforms: Affine[]
  /** Flip vertical axis after generation (plant IFS grow in +y). */
  flipY: boolean
}

const BARNSLEY: IfsSystem = {
  flipY: true,
  transforms: [
    { a: 0, b: 0, c: 0, d: 0.16, e: 0, f: 0, p: 0.01 },
    { a: 0.85, b: 0.04, c: -0.04, d: 0.85, e: 0, f: 1.6, p: 0.85 },
    { a: 0.2, b: -0.26, c: 0.23, d: 0.22, e: 0, f: 1.6, p: 0.07 },
    { a: -0.15, b: 0.28, c: 0.26, d: 0.24, e: 0, f: 0.44, p: 0.07 },
  ],
}

const SIERPINSKI: IfsSystem = {
  flipY: false,
  transforms: [
    { a: 0.5, b: 0, c: 0, d: 0.5, e: 0, f: 0, p: 1 / 3 },
    { a: 0.5, b: 0, c: 0, d: 0.5, e: 0.5, f: 0, p: 1 / 3 },
    { a: 0.5, b: 0, c: 0, d: 0.5, e: 0.25, f: 0.433, p: 1 / 3 },
  ],
}

const IFS_SYSTEMS: Record<IfsVariantId, IfsSystem> = {
  barnsley: BARNSLEY,
  sierpinski: SIERPINSKI,
}

export function parseIfsVariant(
  value: string | null | undefined,
): IfsVariantId {
  if (value === 'barnsley' || value === 'sierpinski') {
    return value
  }
  return DEFAULT_IFS_VARIANT
}

export type BuildIfsOptions = {
  count: number
  width: number
  height: number
  variant?: IfsVariantId
  /** Optional RNG for deterministic tests. */
  random?: () => number
  /** Fraction of the shorter viewport axis kept as padding. Default 0.08. */
  padding?: number
}

/**
 * Map preference density to IFS point count.
 * Mobile widths use half the configured density (shared ambient rule).
 */
export function densityToIfsCount(density: number, width: number): number {
  const scale = effectiveMazeDensity(density, width)
  const count = Math.round(BASE_IFS_POINTS * scale)
  return Math.min(MAX_IFS_POINTS, Math.max(500, count))
}

function pickTransform(transforms: Affine[], r: number): Affine {
  let acc = 0
  for (const t of transforms) {
    acc += t.p
    if (r < acc) return t
  }
  return transforms[transforms.length - 1]
}

/**
 * Chaos-game IFS → canvas points, scaled and centered in the viewport.
 */
export function buildIfsPoints(options: BuildIfsOptions): Point[] {
  const width = Math.max(1, options.width)
  const height = Math.max(1, options.height)
  const count = Math.max(1, Math.floor(options.count))
  const random = options.random ?? Math.random
  const padding = options.padding ?? 0.08
  const variant = parseIfsVariant(options.variant)
  const system = IFS_SYSTEMS[variant]

  const raw: Point[] = []
  let x = 0
  let y = 0
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity

  for (let i = 0; i < count; i++) {
    const t = pickTransform(system.transforms, random())
    const nx = t.a * x + t.b * y + t.e
    const ny = t.c * x + t.d * y + t.f
    x = nx
    y = ny
    raw.push({ x, y })
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y
  }

  const spanX = Math.max(1e-6, maxX - minX)
  const spanY = Math.max(1e-6, maxY - minY)
  const padX = width * padding
  const padY = height * padding
  const availW = Math.max(1, width - padX * 2)
  const availH = Math.max(1, height - padY * 2)
  const scale = Math.min(availW / spanX, availH / spanY)
  const drawnW = spanX * scale
  const drawnH = spanY * scale
  const offsetX = padX + (availW - drawnW) / 2
  const offsetY = padY + (availH - drawnH) / 2

  return raw.map((p) => {
    const localY = system.flipY ? maxY - p.y : p.y - minY
    return {
      x: offsetX + (p.x - minX) * scale,
      y: offsetY + localY * scale,
    }
  })
}
