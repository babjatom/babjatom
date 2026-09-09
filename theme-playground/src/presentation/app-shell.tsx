import { NavLink, Outlet } from 'react-router-dom'
import {
  Dices,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  SwatchBook,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useTheme } from './theme-provider'

const pages = [
  { to: '/theme-playground', label: 'Theme Playground', end: false },
  { to: '/analytics', label: 'Analytics', end: false },
  { to: '/tomi-ai', label: 'Tomi AI', end: false },
] as const

export function AppShell() {
  const {
    theme,
    themes,
    sidebarCollapsed,
    setSidebarCollapsed,
    selectTheme,
    randomizeTheme,
  } = useTheme()

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[auto_1fr]">
      <aside
        className={cn(
          'border-b border-border/80 bg-card/70 backdrop-blur-md transition-[width,padding] duration-300 lg:min-h-screen lg:border-b-0 lg:border-r',
          sidebarCollapsed ? 'lg:w-[4.5rem]' : 'lg:w-72',
        )}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-4">
          <NavLink
            to="/"
            className={cn(
              'flex items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring',
              sidebarCollapsed && 'lg:justify-center lg:w-full',
            )}
          >
            <div className="theme-orb flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <SwatchBook className="h-5 w-5" />
            </div>
            {!sidebarCollapsed && (
              <div className="animate-rise">
                <p className="font-display text-lg font-semibold leading-none">
                  babjatom
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  shadcn/ui · CSS variables
                </p>
              </div>
            )}
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

        <div
          className={cn(
            'px-4 pb-4',
            sidebarCollapsed ? 'hidden lg:block' : 'block',
            sidebarCollapsed && 'max-lg:hidden',
          )}
        >
          {!sidebarCollapsed && (
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
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectTheme(item.id)}
                    className={cn(
                      'rounded-lg border px-3 py-2 text-left text-sm transition-colors',
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
                  </button>
                ))}
              </div>
              <Separator className="my-4" />
              <Button className="w-full" onClick={randomizeTheme}>
                <Dices className="h-4 w-4" />
                Random theme
              </Button>
            </>
          )}

          {sidebarCollapsed && (
            <div className="hidden flex-col items-center gap-2 lg:flex">
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
            </div>
          )}
        </div>

        {sidebarCollapsed && (
          <div className="flex gap-2 px-4 pb-4 lg:hidden">
            <Button className="flex-1" onClick={() => setSidebarCollapsed(false)}>
              Show menu
            </Button>
            <Button variant="outline" onClick={randomizeTheme}>
              <Dices className="h-4 w-4" />
            </Button>
          </div>
        )}
      </aside>

      <main className="px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <Outlet />
      </main>
    </div>
  )
}
