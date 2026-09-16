import {
  createElement,
  type ReactNode,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from 'react'
import { cn } from '@/lib/utils'

/** Intrinsic tags only — avoids React Three Fiber JSX IntrinsicElements widening `ElementType` to `never`. */
type RevealTag = 'div' | 'p' | 'li' | 'span' | 'section'

type RevealProps = {
  children: ReactNode
  className?: string
  /** Extra delay after the element enters the viewport. */
  delayMs?: number
  /** Scroll root for IntersectionObserver. Defaults to the viewport. */
  rootRef?: RefObject<Element | null>
  /** HTML tag to render. Defaults to `div`. */
  as?: RevealTag
  /** Only animate the first time the element enters view. */
  once?: boolean
}

function prefersReducedMotion() {
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/**
 * Fade-in + slight rise when the element scrolls (or mounts) into view.
 * Skips motion when `prefers-reduced-motion` is set.
 */
export function Reveal({
  children,
  className,
  delayMs = 0,
  rootRef,
  as: Tag = 'div',
  once = true,
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null)
  const [visible, setVisible] = useState(prefersReducedMotion)

  useEffect(() => {
    if (visible) return

    const node = ref.current
    if (!node || typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        setVisible(true)
        if (once) observer.disconnect()
      },
      {
        root: rootRef?.current ?? null,
        rootMargin: '0px 0px -6% 0px',
        threshold: 0.08,
      },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [once, rootRef, visible])

  return createElement(
    Tag,
    {
      ref,
      className: cn(visible ? 'animate-fade-in-up' : 'reveal-pending', className),
      style: delayMs > 0 ? { animationDelay: `${delayMs}ms` } : undefined,
    },
    children,
  )
}
