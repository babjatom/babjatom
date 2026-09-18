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

/** Scale 1 = today's default maze (15×9 passage cells). */
export const DEFAULT_MAZE_DENSITY = 1
export const MIN_MAZE_DENSITY = 0.5
export const MAX_MAZE_DENSITY = 4

/** Scale 1 = today's draw alphas for walls and traveling light. */
export const DEFAULT_MAZE_VISIBILITY = 1
export const MIN_MAZE_VISIBILITY = 0.25
export const MAX_MAZE_VISIBILITY = 2.5

export const BASE_MAZE_COLS = 15
export const BASE_MAZE_ROWS = 9

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

/** Map density scale to passage-cell grid, keeping the ~15:9 aspect. */
export function densityToGrid(density: number): { cols: number; rows: number } {
  const scale = clampMazeDensity(density)
  return {
    cols: Math.max(3, Math.round(BASE_MAZE_COLS * scale)),
    rows: Math.max(3, Math.round(BASE_MAZE_ROWS * scale)),
  }
}
