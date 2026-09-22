/** Ambient background choices shown on Theme Playground. */
export type AmbientBackgroundId = 'maze' | 'none'

export type AmbientBackgroundOption = {
  id: AmbientBackgroundId
  name: string
}

export const AMBIENT_BACKGROUNDS: AmbientBackgroundOption[] = [
  { id: 'maze', name: 'Maze' },
  { id: 'none', name: 'None' },
]

export const DEFAULT_AMBIENT_BACKGROUND: AmbientBackgroundId = 'maze'

/** Scale 1 = historical baseline (15×9 passage cells on a ~1440×900 window). */
export const MIN_MAZE_DENSITY = 0.5
export const MAX_MAZE_DENSITY = 4
/** Desktop default: densest ambient maze the slider allows. */
export const DEFAULT_MAZE_DENSITY = MAX_MAZE_DENSITY

/**
 * Mobile viewports use half the configured density so the maze stays lighter
 * on small screens. Matches the shell mobile breakpoint (max-width: 1023px).
 */
export const MOBILE_MAZE_MAX_WIDTH_PX = 1023
export const MOBILE_MAZE_DENSITY_FACTOR = 0.5

/** Scale 1 = today's draw alphas for walls and traveling light. */
export const DEFAULT_MAZE_VISIBILITY = 1
export const MIN_MAZE_VISIBILITY = 0.25
export const MAX_MAZE_VISIBILITY = 2.5

/** Historical desktop reference grid at density 1 on a wide window. */
export const BASE_MAZE_COLS = 15
export const BASE_MAZE_ROWS = 9

/** Passage-cell target size (px) at density 1 — ~1440 / 15. */
export const REF_MAZE_CELL_PX = 96

/** Soft cap so dense large viewports stay ambient-cheap (~60×36). */
export const MAX_MAZE_CELLS = BASE_MAZE_COLS * BASE_MAZE_ROWS * MAX_MAZE_DENSITY ** 2

export type MazePrefs = {
  background: AmbientBackgroundId
  density: number
  visibility: number
}

export function parseAmbientBackground(
  value: string | null | undefined,
): AmbientBackgroundId {
  if (value === 'maze' || value === 'none') return value
  return DEFAULT_AMBIENT_BACKGROUND
}

export function clampMazeDensity(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_MAZE_DENSITY
  return Math.min(MAX_MAZE_DENSITY, Math.max(MIN_MAZE_DENSITY, value))
}

export function clampMazeVisibility(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_MAZE_VISIBILITY
  return Math.min(MAX_MAZE_VISIBILITY, Math.max(MIN_MAZE_VISIBILITY, value))
}

export function isMobileMazeViewport(width: number): boolean {
  return width <= MOBILE_MAZE_MAX_WIDTH_PX
}

/** Preference density after the mobile half-density adaptation. */
export function effectiveMazeDensity(density: number, width: number): number {
  const scale = clampMazeDensity(density)
  if (!isMobileMazeViewport(width)) return scale
  return clampMazeDensity(scale * MOBILE_MAZE_DENSITY_FACTOR)
}

/**
 * Map density + viewport to a passage-cell grid with roughly square cells.
 * Higher density → smaller target cell size → more cells for the same viewport.
 * Mobile widths use half the configured density.
 */
export function densityToGrid(
  density: number,
  width: number,
  height: number,
): { cols: number; rows: number } {
  const scale = effectiveMazeDensity(density, width)
  const w = Math.max(1, width)
  const h = Math.max(1, height)
  const cellSize = REF_MAZE_CELL_PX / scale

  let cols = Math.max(3, Math.round(w / cellSize))
  let rows = Math.max(3, Math.round(h / cellSize))

  const total = cols * rows
  if (total > MAX_MAZE_CELLS) {
    const factor = Math.sqrt(MAX_MAZE_CELLS / total)
    cols = Math.max(3, Math.round(cols * factor))
    rows = Math.max(3, Math.round(rows * factor))
  }

  return { cols, rows }
}
