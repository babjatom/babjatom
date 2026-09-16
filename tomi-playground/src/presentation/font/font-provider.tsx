import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { FontService } from '@/application/font-service'
import type { FontPreset } from '@/domain/font-presets'
import { track } from '@/infrastructure/analytics'
import { createLocalStorageFontPersistence } from '@/infrastructure/local-storage-persistence'
import { applyFont } from './apply-font'

type FontContextValue = {
  font: FontPreset
  fonts: FontPreset[]
  selectFont: (id: string) => void
}

const FontContext = createContext<FontContextValue | null>(null)

export function FontProvider({ children }: { children: ReactNode }) {
  const service = useMemo(
    () => new FontService(createLocalStorageFontPersistence()),
    [],
  )

  const initial = useMemo(() => service.loadSession(), [service])
  const [font, setFont] = useState<FontPreset>(initial.activeFont)
  const fonts = initial.availableFonts

  useEffect(() => {
    applyFont(font)
  }, [font])

  const selectFont = (id: string) => {
    const next = fonts.find((item) => item.id === id)
    if (!next) return
    service.selectFont(next)
    setFont(next)
    track('Font Selected', { font_id: next.id })
  }

  const value: FontContextValue = {
    font,
    fonts,
    selectFont,
  }

  return <FontContext.Provider value={value}>{children}</FontContext.Provider>
}

export function useFont() {
  const ctx = useContext(FontContext)
  if (!ctx) {
    throw new Error('useFont must be used within FontProvider')
  }
  return ctx
}
