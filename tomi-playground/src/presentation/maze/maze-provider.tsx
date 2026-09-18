import { createContext, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { MazeService } from '@/application/maze-service'
import {
  AMBIENT_BACKGROUNDS,
  type AmbientBackgroundId,
} from '@/domain/maze-prefs'
import { createLocalStorageMazePersistence } from '@/infrastructure/local-storage-persistence'

type MazeContextValue = {
  background: AmbientBackgroundId
  backgrounds: typeof AMBIENT_BACKGROUNDS
  density: number
  visibility: number
  /** Bumped on regenerate so the ambient canvas rebuilds the layout. */
  generation: number
  setBackground: (id: AmbientBackgroundId) => void
  setDensity: (density: number) => void
  setVisibility: (visibility: number) => void
  regenerate: () => void
}

const MazeContext = createContext<MazeContextValue | null>(null)

export function MazeProvider({ children }: { children: ReactNode }) {
  const service = useMemo(
    () => new MazeService(createLocalStorageMazePersistence()),
    [],
  )

  const initial = useMemo(() => service.loadPrefs(), [service])
  const [background, setBackgroundState] = useState(initial.background)
  const [density, setDensityState] = useState(initial.density)
  const [visibility, setVisibilityState] = useState(initial.visibility)
  const [generation, setGeneration] = useState(0)

  const setBackground = (id: AmbientBackgroundId) => {
    setBackgroundState(service.saveBackground(id))
  }

  const setDensity = (value: number) => {
    setDensityState(service.saveDensity(value))
  }

  const setVisibility = (value: number) => {
    setVisibilityState(service.saveVisibility(value))
  }

  const regenerate = () => {
    setGeneration((current) => current + 1)
  }

  const value: MazeContextValue = {
    background,
    backgrounds: AMBIENT_BACKGROUNDS,
    density,
    visibility,
    generation,
    setBackground,
    setDensity,
    setVisibility,
    regenerate,
  }

  return <MazeContext.Provider value={value}>{children}</MazeContext.Provider>
}

export function useMaze() {
  const ctx = useContext(MazeContext)
  if (!ctx) {
    throw new Error('useMaze must be used within MazeProvider')
  }
  return ctx
}
