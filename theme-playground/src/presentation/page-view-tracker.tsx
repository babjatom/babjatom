import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { track } from '@/infrastructure/analytics'

export function PageViewTracker() {
  const location = useLocation()

  useEffect(() => {
    track('Page Viewed', { path: location.pathname })
  }, [location.pathname])

  return null
}
