import { createTheme, type Theme, type ThemeTokens } from './theme'

/**
 * Generates a coherent random theme from a numeric seed.
 * Pure domain logic — no React or DOM dependencies.
 */
export function generateRandomTheme(seed = Date.now()): Theme {
  const random = mulberry32(seed)
  const next = (min: number, max: number) =>
    Math.floor(random() * (max - min + 1)) + min

  const hue = next(0, 359)
  const isDark = random() > 0.45
  const accentHue = (hue + next(20, 50) * (random() > 0.5 ? 1 : -1) + 360) % 360
  const secondaryHue = (hue + 180) % 360

  const background = isDark
    ? hsl(hue, next(18, 32), next(6, 12))
    : hsl(hue, next(12, 28), next(94, 98))
  const foreground = isDark
    ? hsl(hue, next(10, 25), next(92, 98))
    : hsl(hue, next(20, 40), next(10, 18))
  const card = isDark
    ? hsl(hue, next(16, 28), next(12, 18))
    : hsl(hue, next(20, 40), next(98, 100))
  const primary = hsl(hue, next(55, 80), isDark ? next(48, 62) : next(38, 52))
  const primaryFg = isDark
    ? hsl(hue, next(20, 40), next(8, 14))
    : hsl(hue, next(10, 30), next(96, 100))
  const secondary = isDark
    ? hsl(secondaryHue, next(12, 28), next(16, 24))
    : hsl(secondaryHue, next(14, 30), next(88, 94))
  const mutedFg = isDark
    ? hsl(hue, next(8, 18), next(60, 72))
    : hsl(hue, next(8, 18), next(35, 45))
  const accent = hsl(
    accentHue,
    next(45, 70),
    isDark ? next(42, 55) : next(32, 45),
  )
  const border = isDark
    ? hsl(hue, next(10, 22), next(20, 28))
    : hsl(hue, next(10, 22), next(78, 88))
  const destructive = hsl(0, next(60, 80), next(42, 55))
  const radii = ['0.25rem', '0.5rem', '0.75rem', '1rem', '1.25rem'] as const
  const radius = radii[next(0, radii.length - 1)]!

  const tokens: ThemeTokens = {
    background,
    foreground,
    card,
    'card-foreground': foreground,
    primary,
    'primary-foreground': primaryFg,
    secondary,
    'secondary-foreground': foreground,
    muted: secondary,
    'muted-foreground': mutedFg,
    accent,
    'accent-foreground': primaryFg,
    destructive,
    'destructive-foreground': '0 0% 100%',
    border,
    input: border,
    ring: primary,
    radius,
  }

  return createTheme(`random-${seed}`, `Random ${hue}°`, tokens, true)
}

/** Deterministic PRNG for reproducible tests. */
export function mulberry32(seed: number): () => number {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

function hsl(h: number, s: number, l: number): string {
  return `${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%`
}
