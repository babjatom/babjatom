import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  BarChart3,
  Home,
  Menu,
  MessageCircle,
  PanelLeftClose,
  PanelLeftOpen,
  SwatchBook,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { track } from '@/infrastructure/analytics'
import { cn } from '@/lib/utils'
import { useTheme } from './theme-provider'

const pages = [
  { to: '/theme-playground', label: 'Theme Playground', icon: SwatchBook },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/ask-tomi', label: 'Ask Tomi', icon: MessageCircle },
] as const

const MOBILE_BREAKPOINT = '(max-width: 1023px)'

function isMobileViewport() {
  return window.matchMedia(MOBILE_BREAKPOINT).matches
}

function PagesNav({
  compact,
  onNavigate,
}: {
  compact: boolean
  onNavigate: () => void
}) {
  return (
    <nav
      className={cn(
        compact
          ? 'flex flex-col items-center gap-1'
          : 'flex flex-wrap gap-1 lg:flex-col lg:flex-nowrap lg:gap-0.5',
      )}
      aria-label="Pages"
    >
      {pages.map((page) => {
        const Icon = page.icon
        return (
          <NavLink
            key={page.to}
            to={page.to}
            onClick={() => {
              track('Nav Clicked', { to: page.to, source: 'sidebar' })
              onNavigate()
            }}
            aria-label={compact ? page.label : undefined}
            title={compact ? page.label : undefined}
            className={({ isActive }) =>
              cn(
                'inline-flex items-center rounded-md text-xs font-medium transition-colors',
                compact ? 'h-8 w-8 justify-center' : 'h-8 gap-1.5 px-2.5',
                isActive
                  ? 'bg-primary/15 text-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
              )
            }
          >
            <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {!compact && page.label}
          </NavLink>
        )
      })}
    </nav>
  )
}

function PrivacyLink({
  compact,
  onNavigate,
}: {
  compact?: boolean
  onNavigate: () => void
}) {
  return (
    <NavLink
      to="/privacy"
      onClick={() => {
        track('Nav Clicked', { to: '/privacy', source: 'sidebar' })
        onNavigate()
      }}
      className={({ isActive }) =>
        cn(
          'text-[11px] text-muted-foreground underline-offset-2 hover:underline',
          compact && 'text-center',
          isActive && 'text-foreground underline',
        )
      }
    >
      Privacy
    </NavLink>
  )
}

export function AppShell() {
  const { pathname } = useLocation()
  const { sidebarCollapsed, setSidebarCollapsed } = useTheme()
  const fillViewport = pathname === '/ask-tomi'
  const menuOpen = !sidebarCollapsed
  const mobile = isMobileViewport()
  const showNavPanel = menuOpen || !mobile

  const closeMobileMenu = () => {
    if (mobile) {
      setSidebarCollapsed(true)
    }
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden lg:flex-row">
      <aside
        className={cn(
          'relative z-30 shrink-0 border-b border-border/80 bg-card lg:flex lg:h-full lg:flex-col lg:border-b-0 lg:border-r',
          sidebarCollapsed ? 'lg:w-14' : 'lg:w-52',
        )}
      >
        <div className="flex h-12 items-center gap-1 px-1.5 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {menuOpen ? (
              <X className="h-4 w-4" aria-hidden />
            ) : (
              <Menu className="h-4 w-4" aria-hidden />
            )}
          </Button>
          <p className="min-w-0 flex-1 truncate text-center font-display text-sm font-semibold tracking-tight">
            babjatom
          </p>
          <NavLink
            to="/"
            aria-label="Home"
            onClick={() => {
              track('Nav Clicked', { to: '/', source: 'brand' })
              closeMobileMenu()
            }}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Home className="h-4 w-4" aria-hidden />
          </NavLink>
        </div>

        <div
          className={cn(
            'hidden h-12 shrink-0 items-center gap-1 px-2 lg:flex',
            sidebarCollapsed && 'justify-center px-1',
          )}
        >
          <NavLink
            to="/"
            onClick={() => track('Nav Clicked', { to: '/', source: 'brand' })}
            className={cn(
              'flex min-w-0 items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring',
              sidebarCollapsed && 'justify-center',
            )}
          >
            <span className="theme-orb flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <SwatchBook className="h-4 w-4" aria-hidden />
            </span>
            {!sidebarCollapsed && (
              <span className="truncate font-display text-sm font-semibold">
                babjatom
              </span>
            )}
          </NavLink>
          {!sidebarCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto h-8 w-8"
              aria-label="Collapse sidebar"
              onClick={() => setSidebarCollapsed(true)}
            >
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          )}
        </div>

        {showNavPanel && (
          <div
            className={cn(
              'z-40 bg-card',
              sidebarCollapsed
                ? 'hidden lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:items-center lg:px-1 lg:pb-3'
                : 'absolute inset-x-0 top-12 border-b border-border/80 px-2 py-2 shadow-md lg:static lg:inset-auto lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:border-0 lg:px-2 lg:py-0 lg:pb-3 lg:shadow-none',
            )}
          >
            {sidebarCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                className="mb-2 hidden h-8 w-8 lg:inline-flex"
                aria-label="Expand sidebar"
                onClick={() => setSidebarCollapsed(false)}
              >
                <PanelLeftOpen className="h-4 w-4" />
              </Button>
            )}
            <PagesNav compact={sidebarCollapsed} onNavigate={closeMobileMenu} />
            <div
              className={cn(
                'mt-2 px-1 lg:mt-auto lg:pt-3',
                sidebarCollapsed && 'lg:flex lg:justify-center',
              )}
            >
              <PrivacyLink
                compact={sidebarCollapsed}
                onNavigate={closeMobileMenu}
              />
            </div>
          </div>
        )}
      </aside>

      <main
        className={cn(
          'min-h-0 min-w-0 flex-1',
          fillViewport
            ? 'overflow-hidden'
            : 'overflow-y-auto overscroll-contain px-3 py-3 sm:px-6 sm:py-6 lg:px-8 lg:py-8',
        )}
      >
        <Outlet />
      </main>
    </div>
  )
}
