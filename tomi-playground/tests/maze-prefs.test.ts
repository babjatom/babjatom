import { describe, expect, it } from 'vitest'
import { MazeService } from '@/application/maze-service'
import type { MazePersistence } from '@/application/ports'
import {
  clampMazeDensity,
  clampMazeVisibility,
  DEFAULT_AMBIENT_BACKGROUND,
  DEFAULT_MAZE_DENSITY,
  DEFAULT_MAZE_VISIBILITY,
  densityToGrid,
  effectiveMazeDensity,
  mazeLightSpeedPxPerSec,
  MAZE_LIGHT_SPEED_PX_PER_SEC,
  MAX_MAZE_CELLS,
  MAX_MAZE_DENSITY,
  MIN_MAZE_DENSITY,
  MIN_MAZE_VISIBILITY,
  MOBILE_MAZE_DENSITY_FACTOR,
  parseAmbientBackground,
  REF_MAZE_CELL_PX,
} from '@/domain/maze-prefs'

describe('densityToGrid', () => {
  it('maps density 1 on a 1440×900 window to ~15×9', () => {
    expect(densityToGrid(1, 1440, 900)).toEqual({ cols: 15, rows: 9 })
  })

  it('uses more rows than cols on a tall phone viewport', () => {
    const grid = densityToGrid(1, 390, 844)
    expect(grid.rows).toBeGreaterThan(grid.cols)
    expect(grid.cols).toBeGreaterThanOrEqual(3)
    expect(grid.rows).toBeGreaterThanOrEqual(3)
  })

  it('halves configured density on mobile widths', () => {
    expect(effectiveMazeDensity(DEFAULT_MAZE_DENSITY, 390)).toBe(
      DEFAULT_MAZE_DENSITY * MOBILE_MAZE_DENSITY_FACTOR,
    )
    expect(effectiveMazeDensity(DEFAULT_MAZE_DENSITY, 1440)).toBe(
      DEFAULT_MAZE_DENSITY,
    )
    // Preference 4 on a phone → effective 2 → ~8×18 passage cells.
    expect(densityToGrid(DEFAULT_MAZE_DENSITY, 390, 844)).toEqual({
      cols: 8,
      rows: 18,
    })
    const fullCols = Math.round(390 / (REF_MAZE_CELL_PX / DEFAULT_MAZE_DENSITY))
    const fullRows = Math.round(844 / (REF_MAZE_CELL_PX / DEFAULT_MAZE_DENSITY))
    expect(8 * 18).toBeLessThan(fullCols * fullRows)
  })

  it('uses the same traveling-light speed on mobile and desktop', () => {
    expect(mazeLightSpeedPxPerSec(1440)).toBe(MAZE_LIGHT_SPEED_PX_PER_SEC)
    expect(mazeLightSpeedPxPerSec(390)).toBe(MAZE_LIGHT_SPEED_PX_PER_SEC)
  })

  it('raises cell count when density increases for the same viewport', () => {
    const base = densityToGrid(1, 1440, 900)
    const denser = densityToGrid(2, 1440, 900)
    expect(denser.cols * denser.rows).toBeGreaterThan(base.cols * base.rows)
    expect(denser.cols).toBeGreaterThan(base.cols)
    expect(denser.rows).toBeGreaterThan(base.rows)
  })

  it('clamps invalid density and keeps at least 3 cells per axis', () => {
    expect(densityToGrid(0, 1440, 900)).toEqual(
      densityToGrid(MIN_MAZE_DENSITY, 1440, 900),
    )
    expect(densityToGrid(1, 10, 10)).toEqual({ cols: 3, rows: 3 })
  })

  it('caps total cells on huge dense viewports', () => {
    const grid = densityToGrid(MAX_MAZE_DENSITY, 8000, 8000)
    expect(grid.cols * grid.rows).toBeLessThanOrEqual(MAX_MAZE_CELLS + 50)
    expect(REF_MAZE_CELL_PX).toBe(96)
  })
})

describe('clamp helpers', () => {
  it('clamps density and visibility into range', () => {
    expect(clampMazeDensity(99)).toBe(MAX_MAZE_DENSITY)
    expect(clampMazeDensity(Number.NaN)).toBe(DEFAULT_MAZE_DENSITY)
    expect(clampMazeVisibility(0)).toBe(MIN_MAZE_VISIBILITY)
    expect(clampMazeVisibility(Number.NaN)).toBe(DEFAULT_MAZE_VISIBILITY)
  })

  it('parses ambient background ids', () => {
    expect(parseAmbientBackground('none')).toBe('none')
    expect(parseAmbientBackground('maze')).toBe('maze')
    expect(parseAmbientBackground('nope')).toBe(DEFAULT_AMBIENT_BACKGROUND)
  })
})

describe('MazeService', () => {
  function memoryPersistence(
    initial: {
      background?: string
      density?: string
      visibility?: string
    } = {},
  ): MazePersistence & { store: Record<string, string | null> } {
    const store: Record<string, string | null> = {
      background: initial.background ?? null,
      density: initial.density ?? null,
      visibility: initial.visibility ?? null,
    }
    return {
      store,
      loadBackground: () => store.background,
      saveBackground: (value) => {
        store.background = value
      },
      loadDensity: () => store.density,
      saveDensity: (value) => {
        store.density = value
      },
      loadVisibility: () => store.visibility,
      saveVisibility: (value) => {
        store.visibility = value
      },
    }
  }

  it('loads defaults when nothing is stored', () => {
    const service = new MazeService(memoryPersistence())
    expect(service.loadPrefs()).toEqual({
      background: DEFAULT_AMBIENT_BACKGROUND,
      density: DEFAULT_MAZE_DENSITY,
      visibility: DEFAULT_MAZE_VISIBILITY,
    })
  })

  it('persists and reloads background and clamped prefs', () => {
    const persistence = memoryPersistence()
    const service = new MazeService(persistence)

    expect(service.saveBackground('none')).toBe('none')
    expect(service.saveDensity(1.5)).toBe(1.5)
    expect(service.saveVisibility(2)).toBe(2)
    expect(persistence.store.background).toBe('none')
    expect(persistence.store.density).toBe('1.5')
    expect(persistence.store.visibility).toBe('2')
    expect(service.loadPrefs()).toEqual({
      background: 'none',
      density: 1.5,
      visibility: 2,
    })
  })
})
