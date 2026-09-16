import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  Dices,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  SwatchBook,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { track } from '@/infrastructure/analytics'
import { cn } from '@/lib/utils'
import { useFont } from '@/presentation/font/font-provider'
import { MazeLightBackground } from '@/presentation/shared/maze-light-background'
import { useTheme } from '@/presentation/theme/theme-provider'

const pages = [
  { to: '/theme-playground', label: 'Theme Playground', end: false },
  { to: '/analytics', label: 'Analytics', end: false },
  { to: '/', label: 'Ask Tomi', end: true },
] as const

const MOBILE_BREAKPOINT = '(max-width: 1023px)'

function getIsMobileViewport() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }
  return window.matchMedia(MOBILE_BREAKPOINT).matches
}

export function AppShell() {
  const {
    theme,
    themes,
    sidebarCollapsed,
    setSidebarCollapsed,
    selectTheme,
    randomizeTheme,
  } = useTheme()
  const { font, fonts, selectFont } = useFont()
  const { pathname } = useLocation()
  const isAskTomi = pathname === '/'
  const [isMobile, setIsMobile] = useState(getIsMobileViewport)
  const mobileMenuOpen = isMobile && !sidebarCollapsed

  const closeMobileMenu = () => {
    if (window.matchMedia(MOBILE_BREAKPOINT).matches) {
      setSidebarCollapsed(true)
    }
  }

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const media = window.matchMedia(MOBILE_BREAKPOINT)
    const sync = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(event.matches)
    }
    sync(media)
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    if (!mobileMenuOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [mobileMenuOpen])

  const menuPanel = (
    <>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Pages
        </p>
        <Button
          variant="ghost"
          size="icon"
          className="hidden lg:inline-flex"
          aria-label="Collapse sidebar"
          onClick={() => setSidebarCollapsed(true)}
        >
          <PanelLeftClose className="h-4 w-4" />
        </Button>
      </div>
      <nav className="mb-4 flex flex-col gap-2" aria-label="Pages">
        {pages.map((page) => (
          <NavLink
            key={page.to}
            to={page.to}
            end={page.end}
            onClick={() => {
              track('Nav Clicked', { to: page.to, source: 'sidebar' })
              closeMobileMenu()
            }}
            className={({ isActive }) =>
              cn(
                'rounded-lg border px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-transparent bg-secondary/50 hover:bg-secondary',
              )
            }
          >
            {page.label}
          </NavLink>
        ))}
      </nav>

      <Separator className="my-4" />

      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        Themes
      </p>
      <div className="flex flex-col gap-2">
        {themes.map((item) => (
          <Button
            key={item.id}
            type="button"
            variant="ghost"
            onClick={() => selectTheme(item.id)}
            className={cn(
              'h-auto w-full flex-col items-start rounded-lg border px-3 py-2 text-left',
              item.id === theme.id
                ? 'border-primary bg-primary/10 text-foreground'
                : 'border-transparent bg-secondary/50 hover:bg-secondary',
            )}
          >
            <span className="font-medium">{item.name}</span>
            {item.generated && (
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Generated
              </span>
            )}
          </Button>
        ))}
      </div>
      <Separator className="my-4" />
      <Button className="w-full" onClick={randomizeTheme}>
        <Dices className="h-4 w-4" />
        Random theme
      </Button>

      <Separator className="my-4" />

      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        Fonts
      </p>
      <div className="flex flex-col gap-2" role="group" aria-label="Fonts">
        {fonts.map((item) => (
          <Button
            key={item.id}
            type="button"
            variant="ghost"
            onClick={() => selectFont(item.id)}
            className={cn(
              'h-auto w-full flex-col items-start rounded-lg border px-3 py-2 text-left',
              item.id === font.id
                ? 'border-primary bg-primary/10 text-foreground'
                : 'border-transparent bg-secondary/50 hover:bg-secondary',
            )}
          >
            <span className="font-medium">{item.name}</span>
          </Button>
        ))}
      </div>

      <div className="mt-6 border-t border-border/60 pt-4">
        <NavLink
          to="/privacy"
          onClick={() => {
            track('Nav Clicked', { to: '/privacy', source: 'sidebar' })
            closeMobileMenu()
          }}
          className={({ isActive }) =>
            cn(
              'text-xs text-muted-foreground underline-offset-4 hover:underline',
              isActive && 'text-foreground underline',
            )
          }
        >
          Privacy
        </NavLink>
      </div>
    </>
  )

  return (
    <div
      className={cn(
        'relative lg:grid lg:grid-cols-[auto_1fr]',
        isAskTomi
          ? 'flex h-dvh max-h-dvh flex-col overflow-hidden'
          : 'min-h-screen',
      )}
    >
      <MazeLightBackground />
      <aside
        className={cn(
          'relative z-30 shrink-0 border-b border-border/80 bg-card/70 pt-[env(safe-area-inset-top)] backdrop-blur-md transition-[width,padding] duration-300 lg:min-h-screen lg:border-b-0 lg:border-r lg:pt-0',
          sidebarCollapsed ? 'lg:w-[4.5rem]' : 'lg:w-72',
        )}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-4">
          <NavLink
            to="/"
            onClick={() => {
              track('Nav Clicked', { to: '/', source: 'brand' })
              closeMobileMenu()
            }}
            className={cn(
              'flex items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring',
              sidebarCollapsed && 'lg:justify-center lg:w-full',
            )}
          >
            <div className="theme-orb flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <SwatchBook className="h-5 w-5" />
            </div>
            <div
              className={cn('animate-rise', sidebarCollapsed && 'lg:hidden')}
            >
              <p className="font-display text-lg font-semibold leading-none">
                babjatom
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Tomi Babjak · Full Stack Engineer
              </p>
            </div>
          </NavLink>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Toggle sidebar"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {!isMobile && (
          <div className="px-4 pb-4">
            {!sidebarCollapsed && menuPanel}

            {sidebarCollapsed && (
              <div className="flex flex-col items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Expand sidebar"
                  onClick={() => setSidebarCollapsed(false)}
                >
                  <PanelLeftOpen className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Random theme"
                  onClick={randomizeTheme}
                >
                  <Dices className="h-4 w-4" />
                </Button>
                <NavLink
                  to="/privacy"
                  onClick={() => {
                    track('Nav Clicked', { to: '/privacy', source: 'sidebar' })
                    closeMobileMenu()
                  }}
                  className={({ isActive }) =>
                    cn(
                      'mt-2 text-[10px] text-muted-foreground underline-offset-2 hover:underline',
                      isActive && 'text-foreground underline',
                    )
                  }
                >
                  Privacy
                </NavLink>
              </div>
            )}
          </div>
        )}
      </aside>

      {mobileMenuOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-background/60 backdrop-blur-[2px]"
            aria-label="Dismiss menu"
            onClick={() => setSidebarCollapsed(true)}
          />
          <div
            className="fixed inset-x-0 bottom-0 top-[calc(env(safe-area-inset-top)+4.5rem)] z-50 overflow-y-auto border-b border-border/80 bg-card px-4 py-4 shadow-lg"
            role="dialog"
            aria-label="Pages menu"
          >
            {menuPanel}
          </div>
        </>
      )}

      <main
        className={cn(
          'relative z-10',
          isAskTomi
            ? 'flex min-h-0 flex-1 flex-col px-3 pt-3 sm:px-6 sm:pt-6 lg:min-h-0 lg:px-6 lg:py-8'
            : 'px-3 py-3 sm:px-6 sm:py-6 lg:px-10 lg:py-8',
        )}
      >
        <Outlet />
      </main>
    </div>
  )
}
