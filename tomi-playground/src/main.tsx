import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { initMixpanel } from '@/infrastructure/analytics'
import '@fontsource/outfit/400.css'
import '@fontsource/outfit/500.css'
import '@fontsource/outfit/600.css'
import '@fontsource/outfit/700.css'
import '@fontsource/fraunces/500.css'
import '@fontsource/fraunces/700.css'
import './styles/globals.css'

initMixpanel()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
