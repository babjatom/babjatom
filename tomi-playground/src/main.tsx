import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { initMixpanel } from '@/infrastructure/analytics'
import './styles/globals.css'

initMixpanel()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
