import { AppShell } from '@/presentation/app-shell'
import { ComponentShowcase } from '@/presentation/component-showcase'
import { ThemeProvider } from '@/presentation/theme-provider'

export default function App() {
  return (
    <ThemeProvider>
      <AppShell>
        <ComponentShowcase />
      </AppShell>
    </ThemeProvider>
  )
}
