import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AnalyticsPage } from '@/presentation/analytics/analytics-page'
import { AskTomiPage } from '@/presentation/ask-tomi/ask-tomi-page'
import { DosGamesPage } from '@/presentation/dos-games/dos-games-page'
import { FontProvider } from '@/presentation/font/font-provider'
import { MazeProvider } from '@/presentation/maze/maze-provider'
import { PrivacyPage } from '@/presentation/privacy/privacy-page'
import { AppShell } from '@/presentation/shell/app-shell'
import { PageViewTracker } from '@/presentation/shell/page-view-tracker'
import { ThemeProvider } from '@/presentation/theme/theme-provider'
import { ComponentShowcase } from '@/presentation/theme-playground/component-showcase'

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/'

export default function App() {
  return (
    <ThemeProvider>
      <FontProvider>
        <MazeProvider>
          <BrowserRouter basename={basename}>
            <PageViewTracker />
            <Routes>
              <Route element={<AppShell />}>
                <Route index element={<AskTomiPage />} />
                <Route path="theme-playground" element={<ComponentShowcase />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="dos-games" element={<DosGamesPage />} />
                <Route path="privacy" element={<PrivacyPage />} />
                <Route path="ask-tomi" element={<Navigate to="/" replace />} />
                <Route path="tomi-ai" element={<Navigate to="/" replace />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </MazeProvider>
      </FontProvider>
    </ThemeProvider>
  )
}
