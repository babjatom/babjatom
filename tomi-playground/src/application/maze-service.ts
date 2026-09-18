import {
  clampMazeDensity,
  clampMazeVisibility,
  DEFAULT_AMBIENT_BACKGROUND,
  DEFAULT_MAZE_DENSITY,
  DEFAULT_MAZE_VISIBILITY,
  parseAmbientBackground,
  type AmbientBackgroundId,
  type MazePrefs,
} from '@/domain/maze-prefs'
import type { MazePersistence } from './ports'

function parseStored(raw: string | null, fallback: number): number {
  if (raw == null || raw === '') return fallback
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : fallback
}

export class MazeService {
  private readonly persistence: MazePersistence

  constructor(persistence: MazePersistence) {
    this.persistence = persistence
  }

  loadPrefs(): MazePrefs {
    return {
      background: parseAmbientBackground(this.persistence.loadBackground()),
      density: clampMazeDensity(
        parseStored(this.persistence.loadDensity(), DEFAULT_MAZE_DENSITY),
      ),
      visibility: clampMazeVisibility(
        parseStored(
          this.persistence.loadVisibility(),
          DEFAULT_MAZE_VISIBILITY,
        ),
      ),
    }
  }

  saveBackground(id: AmbientBackgroundId): AmbientBackgroundId {
    const next = parseAmbientBackground(id)
    this.persistence.saveBackground(next)
    return next
  }

  saveDensity(density: number): number {
    const next = clampMazeDensity(density)
    this.persistence.saveDensity(String(next))
    return next
  }

  saveVisibility(visibility: number): number {
    const next = clampMazeVisibility(visibility)
    this.persistence.saveVisibility(String(next))
    return next
  }
}

export { DEFAULT_AMBIENT_BACKGROUND }
