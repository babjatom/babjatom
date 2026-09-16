import { AnalyticsCharts } from './analytics-charts'
import { Reveal } from './reveal'
import { VisitsDataTable } from './visits-data-table'

export function AnalyticsPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <header className="animate-rise">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Analytics
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Mock visit data with the shared table, plus shadcn/ui chart examples
          (area, bar, line, pie, radar, radial, tooltip) styled by the active
          theme.
        </p>
      </header>

      <Reveal as="section" className="flex flex-col gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold">Recent visits</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Same interactive table used on Theme Playground.
          </p>
        </div>
        <VisitsDataTable />
      </Reveal>

      <Reveal as="section" className="flex flex-col gap-3" delayMs={60}>
        <div>
          <h2 className="font-display text-2xl font-semibold">Charts</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Recharts-powered shadcn chart primitives.
          </p>
        </div>
        <AnalyticsCharts />
      </Reveal>
    </div>
  )
}
