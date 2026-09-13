import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { track } from '@/infrastructure/analytics'

export function HomePage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 animate-rise">
      <header className="relative overflow-hidden rounded-2xl border border-border/70">
        <div className="theme-mesh absolute inset-0 opacity-80" />
        <div className="relative px-6 py-12 sm:px-10">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-foreground/80">
            babjatom
          </p>
          <h1 className="font-display mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            Welcome
          </h1>
          <p className="mt-3 max-w-xl text-base text-foreground/80 sm:text-lg">
            Placeholder home for this site. Use the Pages menu to open Theme
            Playground and explore shadcn/ui components under live CSS-variable
            themes.
          </p>
          <div className="mt-6">
            <Button asChild>
              <Link
                to="/theme-playground"
                onClick={() =>
                  track('Nav Clicked', {
                    to: '/theme-playground',
                    source: 'home',
                  })
                }
              >
                Open Theme Playground
              </Link>
            </Button>
          </div>
        </div>
      </header>
    </div>
  )
}
