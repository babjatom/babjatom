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
  MAX_MAZE_DENSITY,
  MIN_MAZE_DENSITY,
  MIN_MAZE_VISIBILITY,
  parseAmbientBackground,
} from '@/domain/maze-prefs'

describe('densityToGrid', () => {
  it('maps default density to 15×9', () => {
    expect(densityToGrid(1)).toEqual({ cols: 15, rows: 9 })
  })

  it('scales both axes and clamps to at least 3 cells', () => {
    expect(densityToGrid(2)).toEqual({ cols: 30, rows: 18 })
    expect(densityToGrid(4)).toEqual({ cols: 60, rows: 36 })
    expect(densityToGrid(0.5)).toEqual({ cols: 8, rows: 5 })
    expect(densityToGrid(0)).toEqual(densityToGrid(MIN_MAZE_DENSITY))
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
