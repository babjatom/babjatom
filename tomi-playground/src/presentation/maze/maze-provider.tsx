import { createContext, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { MazeService } from '@/application/maze-service'
import { IFS_VARIANTS, type IfsVariantId } from '@/domain/ifs'
import {
  AMBIENT_BACKGROUNDS,
  type AmbientBackgroundId,
} from '@/domain/maze-prefs'
import { track } from '@/infrastructure/analytics'
import { createLocalStorageMazePersistence } from '@/infrastructure/local-storage-persistence'

type MazeContextValue = {
  background: AmbientBackgroundId
  backgrounds: typeof AMBIENT_BACKGROUNDS
  density: number
  visibility: number
  ifsVariant: IfsVariantId
  ifsVariants: typeof IFS_VARIANTS
  /** Bumped on regenerate so the ambient canvas rebuilds the layout. */
  generation: number
  setBackground: (id: AmbientBackgroundId) => void
  setDensity: (density: number) => void
  setVisibility: (visibility: number) => void
  setIfsVariant: (id: IfsVariantId) => void
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
  const [ifsVariant, setIfsVariantState] = useState(initial.ifsVariant)
  const [generation, setGeneration] = useState(0)

  const setBackground = (id: AmbientBackgroundId) => {
    const next = service.saveBackground(id)
    setBackgroundState(next)
    track('Background Setting Changed', {
      setting: 'background',
      value: next,
    })
  }

  const setDensity = (value: number) => {
    const next = service.saveDensity(value)
    setDensityState(next)
    track('Background Setting Changed', {
      setting: 'density',
      value: next,
    })
  }

  const setVisibility = (value: number) => {
    const next = service.saveVisibility(value)
    setVisibilityState(next)
    track('Background Setting Changed', {
      setting: 'visibility',
      value: next,
    })
  }

  const setIfsVariant = (id: IfsVariantId) => {
    const next = service.saveIfsVariant(id)
    setIfsVariantState(next)
    track('Background Setting Changed', {
      setting: 'variant',
      value: next,
    })
  }

  const regenerate = () => {
    setGeneration((current) => current + 1)
    track('Background Setting Changed', { setting: 'regenerate' })
  }

  const value: MazeContextValue = {
    background,
    backgrounds: AMBIENT_BACKGROUNDS,
    density,
    visibility,
    ifsVariant,
    ifsVariants: IFS_VARIANTS,
    generation,
    setBackground,
    setDensity,
    setVisibility,
    setIfsVariant,
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
