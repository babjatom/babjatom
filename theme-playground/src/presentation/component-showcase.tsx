import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { THEME_TOKEN_KEYS } from '@/domain/theme'
import { useTheme } from './theme-provider'

export function ComponentShowcase() {
  const { theme } = useTheme()
  const [notifications, setNotifications] = useState(true)

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <header className="animate-rise relative overflow-hidden rounded-2xl border border-border/70">
        <div className="theme-mesh absolute inset-0 opacity-80" />
        <div className="relative px-6 py-10 sm:px-10">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary-foreground/90 mix-blend-difference">
            Active · {theme.name}
          </p>
          <h1 className="font-display mt-3 max-w-2xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Theme Playground
          </h1>
          <p className="mt-3 max-w-xl text-base text-foreground/80 sm:text-lg">
            The same shadcn/ui component system, reshaped only by semantic CSS
            variables — switch themes without duplicating components.
          </p>
        </div>
      </header>

      <section className="animate-rise-delay grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>
              Buttons inherit primary, secondary, and destructive tokens.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Form controls</CardTitle>
            <CardDescription>
              Inputs, selects, and switches share border and ring tokens.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project">Project name</Label>
              <Input id="project" placeholder="aurora-dashboard" />
            </div>
            <div className="space-y-2">
              <Label>Density</Label>
              <Select defaultValue="comfortable">
                <SelectTrigger aria-label="Density">
                  <SelectValue placeholder="Choose density" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact">Compact</SelectItem>
                  <SelectItem value="comfortable">Comfortable</SelectItem>
                  <SelectItem value="spacious">Spacious</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="notifications">Email notifications</Label>
              <Switch
                id="notifications"
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dialog</CardTitle>
            <CardDescription>
              Overlay surfaces use background and muted foreground tokens.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Open dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Theme preview</DialogTitle>
                  <DialogDescription>
                    Dialogs stay visually consistent across every theme because
                    they consume the same semantic variables.
                  </DialogDescription>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">
                  Active theme: <strong>{theme.name}</strong>
                </p>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Token map</CardTitle>
            <CardDescription>
              Live values for the active theme. Add themes by editing variables,
              not components.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid max-h-64 grid-cols-1 gap-2 overflow-auto sm:grid-cols-2">
              {THEME_TOKEN_KEYS.map((key) => (
                <div
                  key={key}
                  className="flex items-center justify-between gap-3 rounded-md border border-border/70 bg-secondary/40 px-3 py-2 text-xs"
                >
                  <span className="font-medium">{key}</span>
                  <span className="truncate text-muted-foreground">
                    {theme.tokens[key]}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="rounded-2xl border border-dashed border-border/80 bg-card/50 p-6">
        <h2 className="font-display text-2xl font-semibold">Visual effects</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Mesh gradients, soft pulses, and rise-in motion are pure CSS — they
          recolor automatically when theme tokens change.
        </p>
        <Separator className="my-4" />
        <div className="grid gap-4 sm:grid-cols-3">
          {['Primary wash', 'Accent bloom', 'Muted haze'].map((label, index) => (
            <div
              key={label}
              className="theme-mesh rounded-xl border border-border/60 p-5"
              style={{ animationDelay: `${index * 120}ms` }}
            >
              <p className="font-medium">{label}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                CSS-variable driven
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
