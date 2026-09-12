import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { ThemeService } from '@/application/theme-service'
import type { Theme } from '@/domain/theme'
import { track } from '@/infrastructure/analytics'
import { createLocalStoragePersistence } from '@/infrastructure/local-storage-persistence'
import { applyTheme } from './apply-theme'

type ThemeContextValue = {
  theme: Theme
  themes: Theme[]
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  selectTheme: (id: string) => void
  randomizeTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

/** Matches Tailwind `lg` — below this, the shell menu starts collapsed. */
const MOBILE_MENU_QUERY = '(max-width: 1023px)'

function getIsMobileViewport() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }
  return window.matchMedia(MOBILE_MENU_QUERY).matches
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const service = useMemo(
    () => new ThemeService(createLocalStoragePersistence()),
    [],
  )

  const initial = useMemo(() => service.loadSession(), [service])
  const [theme, setTheme] = useState<Theme>(initial.activeTheme)
  const [themes, setThemes] = useState<Theme[]>(initial.availableThemes)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(getIsMobileViewport)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return

    const media = window.matchMedia(MOBILE_MENU_QUERY)
    const syncCollapsedToViewport = (event: MediaQueryListEvent | MediaQueryList) => {
      setSidebarCollapsed(event.matches)
    }

    syncCollapsedToViewport(media)
    media.addEventListener('change', syncCollapsedToViewport)
    return () => media.removeEventListener('change', syncCollapsedToViewport)
  }, [])

  const selectTheme = (id: string) => {
    const next = themes.find((item) => item.id === id)
    if (!next) return
    service.selectTheme(next)
    setTheme(next)
    track('Theme Selected', { theme_id: next.id, source: 'preset' })
  }

  const randomizeTheme = () => {
    const next = service.createRandomTheme()
    setThemes((current) => {
      const withoutGenerated = current.filter((item) => !item.generated)
      return [...withoutGenerated, next]
    })
    setTheme(next)
    track('Theme Selected', { theme_id: next.id, source: 'random' })
  }

  const value: ThemeContextValue = {
    theme,
    themes,
    sidebarCollapsed,
    setSidebarCollapsed,
    selectTheme,
    randomizeTheme,
  }

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return ctx
}
