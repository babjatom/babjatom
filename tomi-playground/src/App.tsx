import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AnalyticsPage } from '@/presentation/analytics-page'
import { AppShell } from '@/presentation/app-shell'
import { AskTomiPage } from '@/presentation/ask-tomi-page'
import { ComponentShowcase } from '@/presentation/component-showcase'
import { PageViewTracker } from '@/presentation/page-view-tracker'
import { PrivacyPage } from '@/presentation/privacy-page'
import { ThemeProvider } from '@/presentation/theme-provider'

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/'

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter basename={basename}>
        <PageViewTracker />
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<AskTomiPage />} />
            <Route path="theme-playground" element={<ComponentShowcase />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="privacy" element={<PrivacyPage />} />
            <Route path="ask-tomi" element={<Navigate to="/" replace />} />
            <Route path="tomi-ai" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
