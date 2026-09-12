import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AnalyticsPage } from '@/presentation/analytics-page'
import { AppShell } from '@/presentation/app-shell'
import { ComponentShowcase } from '@/presentation/component-showcase'
import { HomePage } from '@/presentation/home-page'
import { ThemeProvider } from '@/presentation/theme-provider'
import { AskTomiPage } from '@/presentation/ask-tomi-page'

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/'

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter basename={basename}>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<HomePage />} />
            <Route path="theme-playground" element={<ComponentShowcase />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="ask-tomi" element={<AskTomiPage />} />
            <Route path="tomi-ai" element={<Navigate to="/ask-tomi" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
