import type { ReactNode } from 'react'
import { Dices, Menu, PanelLeftClose, PanelLeftOpen, SwatchBook } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useTheme } from './theme-provider'

export function AppShell({ children }: { children: ReactNode }) {
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
          <div className={cn('flex items-center gap-3', sidebarCollapsed && 'lg:justify-center lg:w-full')}>
            <div className="theme-orb flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <SwatchBook className="h-5 w-5" />
            </div>
            {!sidebarCollapsed && (
              <div className="animate-rise">
                <p className="font-display text-lg font-semibold leading-none">
                  Theme Playground
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  shadcn/ui · CSS variables
                </p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Toggle themes panel"
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
                  Themes
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

        {!sidebarCollapsed && (
          <div className="px-4 pb-4 lg:hidden">
            {/* mobile panel already shown above when not collapsed */}
          </div>
        )}

        {sidebarCollapsed && (
          <div className="flex gap-2 px-4 pb-4 lg:hidden">
            <Button className="flex-1" onClick={() => setSidebarCollapsed(false)}>
              Show themes
            </Button>
            <Button variant="outline" onClick={randomizeTheme}>
              <Dices className="h-4 w-4" />
            </Button>
          </div>
        )}
      </aside>

      <main className="px-4 py-6 sm:px-6 lg:px-10 lg:py-8">{children}</main>
    </div>
  )
}
