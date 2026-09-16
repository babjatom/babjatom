import { Dices } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useTheme } from './theme-provider'

export function ThemeSwitcher({ className }: { className?: string }) {
  const { theme, themes, selectTheme, randomizeTheme } = useTheme()

  return (
    <div
      className={cn('flex flex-wrap items-center gap-1.5', className)}
      role="group"
      aria-label="Themes"
    >
      {themes.map((item) => (
        <Button
          key={item.id}
          type="button"
          size="sm"
          variant={item.id === theme.id ? 'secondary' : 'ghost'}
          onClick={() => selectTheme(item.id)}
          className={cn(
            'h-8 px-2.5 text-xs',
            item.id === theme.id && 'border border-primary/40',
          )}
        >
          {item.name}
          {item.generated ? ' · generated' : ''}
        </Button>
      ))}
      <Button
        type="button"
        size="sm"
        className="h-8 px-2.5 text-xs"
        onClick={randomizeTheme}
      >
        <Dices className="h-3.5 w-3.5" />
        Random theme
      </Button>
    </div>
  )
}
