import { Dices } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useFont } from '@/presentation/font/font-provider'
import { useTheme } from '@/presentation/theme/theme-provider'

export function ThemeFontControls() {
  const { theme, themes, selectTheme, randomizeTheme } = useTheme()
  const { font, fonts, selectFont } = useFont()

  return (
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
  )
}
