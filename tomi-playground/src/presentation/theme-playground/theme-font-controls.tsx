import { useState } from 'react'
import { Dices, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  MAX_MAZE_DENSITY,
  MAX_MAZE_VISIBILITY,
  MIN_MAZE_DENSITY,
  MIN_MAZE_VISIBILITY,
} from '@/domain/maze-prefs'
import { cn } from '@/lib/utils'
import { useFont } from '@/presentation/font/font-provider'
import { useMaze } from '@/presentation/maze/maze-provider'
import { useTheme } from '@/presentation/theme/theme-provider'

export function ThemeFontControls() {
  const { theme, themes, selectTheme, randomizeTheme } = useTheme()
  const { font, fonts, selectFont } = useFont()
  const {
    background,
    backgrounds,
    density,
    visibility,
    setBackground,
    setDensity,
    setVisibility,
    regenerate,
  } = useMaze()
  const [draftDensity, setDraftDensity] = useState<number | null>(null)
  const densityValue = draftDensity ?? density

  const commitDensity = (value: number) => {
    setDensity(value)
    setDraftDensity(null)
  }

  return (
    <div className="flex flex-col gap-6">
      <Card
        className="animate-rise-delay"
        role="group"
        aria-label="Background controls"
      >
        <CardHeader>
          <CardTitle>Background</CardTitle>
          <CardDescription>
            Ambient backdrop behind every page. More options can plug in later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Backdrop
              </p>
              <div
                className="flex flex-col gap-2"
                role="group"
                aria-label="Background options"
              >
                {backgrounds.map((item) => (
                  <Button
                    key={item.id}
                    type="button"
                    variant="ghost"
                    onClick={() => setBackground(item.id)}
                    className={cn(
                      'h-auto w-full flex-col items-start rounded-lg border px-3 py-2 text-left',
                      item.id === background
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-transparent bg-secondary/50 hover:bg-secondary',
                    )}
                  >
                    <span className="font-medium">{item.name}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Settings
              </p>
              {background === 'maze' ? (
                <div className="space-y-4" role="group" aria-label="Maze controls">
                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-foreground">
                      Density
                    </span>
                    <input
                      type="range"
                      min={MIN_MAZE_DENSITY}
                      max={MAX_MAZE_DENSITY}
                      step={0.05}
                      value={densityValue}
                      aria-label="Maze density"
                      className="h-2 w-full cursor-pointer appearance-none rounded-full bg-secondary accent-primary"
                      onChange={(event) => {
                        setDraftDensity(Number(event.target.value))
                      }}
                      onPointerUp={(event) => {
                        commitDensity(Number(event.currentTarget.value))
                      }}
                      onKeyUp={(event) => {
                        commitDensity(Number(event.currentTarget.value))
                      }}
                    />
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-foreground">
                      Visibility
                    </span>
                    <input
                      type="range"
                      min={MIN_MAZE_VISIBILITY}
                      max={MAX_MAZE_VISIBILITY}
                      step={0.05}
                      value={visibility}
                      aria-label="Maze visibility"
                      className="h-2 w-full cursor-pointer appearance-none rounded-full bg-secondary accent-primary"
                      onChange={(event) => {
                        setVisibility(Number(event.target.value))
                      }}
                    />
                  </label>

                  <Button className="w-full" onClick={regenerate}>
                    <RefreshCw className="h-4 w-4" />
                    Regenerate maze
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No settings for this background.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <section
        className="animate-rise-delay rounded-2xl border border-border/70 bg-card/50 p-6"
        aria-label="Theme and font controls"
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Themes
            </p>
            <div className="flex flex-col gap-2" role="group" aria-label="Themes">
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
          </div>

          <div>
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
          </div>
        </div>
      </section>
    </div>
  )
}
