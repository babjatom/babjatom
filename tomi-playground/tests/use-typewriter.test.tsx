import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useTypewriter } from '@/presentation/use-typewriter'

describe('useTypewriter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal(
      'matchMedia',
      (query: string): MediaQueryList => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    )
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('reveals text over time when animation is forced on', () => {
    const onProgress = vi.fn()
    const { result } = renderHook(() =>
      useTypewriter('Hello from Ask Tomi — a longer sample answer.', {
        enabled: true,
        skipAnimation: false,
        onProgress,
      }),
    )

    expect(result.current.displayText).toBe('')
    expect(result.current.done).toBe(false)

    act(() => {
      vi.advanceTimersByTime(48)
    })

    expect(result.current.displayText.length).toBeGreaterThan(0)
    expect(result.current.done).toBe(false)
    expect(onProgress).toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(result.current.displayText).toBe(
      'Hello from Ask Tomi — a longer sample answer.',
    )
    expect(result.current.done).toBe(true)
  })

  it('shows full text immediately when disabled', () => {
    const { result } = renderHook(() =>
      useTypewriter('Instant', { enabled: false }),
    )

    expect(result.current.displayText).toBe('Instant')
    expect(result.current.done).toBe(true)
  })
})
