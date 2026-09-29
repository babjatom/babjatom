import { Button } from '@/components/ui/button'
import { track } from '@/infrastructure/analytics'

const ADSB_URL = 'https://adsb.tomibabjak.dev'

export function AdsbRadarPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <header className="animate-rise relative overflow-hidden rounded-2xl border border-border/70">
        <div className="theme-mesh absolute inset-0 opacity-80" />
        <div className="relative px-6 py-10 sm:px-10">
          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            ADS-B radar
          </h1>
          <p className="mt-3 max-w-xl text-base text-foreground/80 sm:text-lg">
            ADS-B (Automatic Dependent Surveillance–Broadcast) is how aircraft
            broadcast their position and velocity. This is my self-hosted
            receiver showing nearby air traffic live.
          </p>
          <div className="mt-5">
            <Button asChild>
              <a
                href={ADSB_URL}
                target="_blank"
                rel="noreferrer"
                onClick={() =>
                  track('Nav Clicked', {
                    to: ADSB_URL,
                    source: 'adsb_fullscreen',
                  })
                }
              >
                Fullscreen
              </a>
            </Button>
          </div>
        </div>
      </header>

      <div
        className="overflow-hidden rounded-2xl border border-border bg-card/50"
        style={{ height: '75dvh' }}
      >
        <iframe
          title="ADS-B radar"
          src={ADSB_URL}
          className="h-full w-full border-0"
        />
      </div>
    </div>
  )
}
