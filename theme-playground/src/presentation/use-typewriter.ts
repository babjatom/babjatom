import { useEffect, useState } from 'react'

function prefersReducedMotion() {
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

type TypewriterOptions = {
  /** When false, show the full text immediately. Defaults to true. */
  enabled?: boolean
  /**
   * Force or skip the animation. When omitted, animation is skipped for
   * reduced-motion preferences and the Vitest environment.
   */
  skipAnimation?: boolean
  /** Called after each visible-length update (useful for auto-scroll). */
  onProgress?: () => void
}

/**
 * Reveals `text` with a typewriter effect.
 * Skips animation for reduced motion and in unit tests (unless overridden).
 */
export function useTypewriter(text: string, options: TypewriterOptions = {}) {
  const enabled = options.enabled ?? true
  const instant =
    options.skipAnimation ??
    (!enabled || prefersReducedMotion() || import.meta.env.MODE === 'test')
  const [visibleLength, setVisibleLength] = useState(() =>
    instant ? text.length : 0,
  )

  useEffect(() => {
    if (instant) {
      setVisibleLength(text.length)
      return
    }

    setVisibleLength(0)
    if (!text) return

    // Aim for ~1–1.5s on typical answers without feeling sluggish.
    const charsPerTick = Math.max(2, Math.ceil(text.length / 60))
    const tickMs = 24
    let length = 0

    const timer = window.setInterval(() => {
      length = Math.min(text.length, length + charsPerTick)
      setVisibleLength(length)
      options.onProgress?.()
      if (length >= text.length) {
        window.clearInterval(timer)
      }
    }, tickMs)

    return () => window.clearInterval(timer)
    // Restart only when the answer text or instant mode changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onProgress is a scroll helper
  }, [text, instant])

  const done = visibleLength >= text.length

  return {
    displayText: text.slice(0, visibleLength),
    done,
  }
}
