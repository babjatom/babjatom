import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  PENDING_STATUS_GENERIC,
  PENDING_STATUS_INTERVAL_MS,
  PENDING_STATUS_PRIMARY,
  usePendingStatus,
} from '@/presentation/ask-tomi/use-pending-status'

describe('usePendingStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('plays the primary set once, then loops generics', () => {
    const { result } = renderHook(() => usePendingStatus(true))

    expect(result.current).toBe(PENDING_STATUS_PRIMARY[0])

    for (let i = 1; i < PENDING_STATUS_PRIMARY.length; i += 1) {
      act(() => {
        vi.advanceTimersByTime(PENDING_STATUS_INTERVAL_MS)
      })
      expect(result.current).toBe(PENDING_STATUS_PRIMARY[i])
    }

    act(() => {
      vi.advanceTimersByTime(PENDING_STATUS_INTERVAL_MS)
    })
    expect(result.current).toBe(PENDING_STATUS_GENERIC[0])

    for (let i = 1; i < PENDING_STATUS_GENERIC.length; i += 1) {
      act(() => {
        vi.advanceTimersByTime(PENDING_STATUS_INTERVAL_MS)
      })
      expect(result.current).toBe(PENDING_STATUS_GENERIC[i])
    }

    act(() => {
      vi.advanceTimersByTime(PENDING_STATUS_INTERVAL_MS)
    })
    expect(result.current).toBe(PENDING_STATUS_GENERIC[0])
  })

  it('resets to the first primary line when inactive', () => {
    const { result, rerender } = renderHook(
      ({ active }) => usePendingStatus(active),
      { initialProps: { active: true } },
    )

    act(() => {
      vi.advanceTimersByTime(PENDING_STATUS_INTERVAL_MS * 2)
    })
    expect(result.current).toBe(PENDING_STATUS_PRIMARY[2])

    rerender({ active: false })
    expect(result.current).toBe(PENDING_STATUS_PRIMARY[0])

    rerender({ active: true })
    expect(result.current).toBe(PENDING_STATUS_PRIMARY[0])

    act(() => {
      vi.advanceTimersByTime(PENDING_STATUS_INTERVAL_MS)
    })
    expect(result.current).toBe(PENDING_STATUS_PRIMARY[1])
  })
})
