import { useEffect, useState } from 'react'

export const PENDING_STATUS_PRIMARY = [
  'Tomi is thinking…',
  'Tomi is grinding coffee beans…',
  'Tomi is inventing an algorithm…',
  'Tomi is arguing with agents…',
  'Tomi is rushing the response…',
] as const

export const PENDING_STATUS_GENERIC = [
  'Tomi is sipping his coffee…',
  'Tomi is filtering hallucinations from the answer…',
  'Tomi is reading a Robert C. Martin book…',
  'Tomi is rushing the response…',
  'Tomi is arguing with agents…',
  'Tomi is freaking out because of the cloud bill…',
] as const

export const PENDING_STATUS_INTERVAL_MS = 1600

/**
 * Rotates playful pending status lines: primary set once, then loops generics.
 * Resets when `active` becomes false.
 */
export function usePendingStatus(active: boolean): string {
  const [index, setIndex] = useState(0)
  const [wasActive, setWasActive] = useState(active)

  if (active !== wasActive) {
    setWasActive(active)
    setIndex(0)
  }

  useEffect(() => {
    if (!active) return

    const timer = window.setInterval(() => {
      setIndex((current) => current + 1)
    }, PENDING_STATUS_INTERVAL_MS)

    return () => window.clearInterval(timer)
  }, [active])

  if (!active) {
    return PENDING_STATUS_PRIMARY[0]
  }

  const primaryCount = PENDING_STATUS_PRIMARY.length
  if (index < primaryCount) {
    return PENDING_STATUS_PRIMARY[index]
  }

  const genericIndex = (index - primaryCount) % PENDING_STATUS_GENERIC.length
  return PENDING_STATUS_GENERIC[genericIndex]
}
