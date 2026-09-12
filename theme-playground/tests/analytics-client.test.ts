import { beforeEach, describe, expect, it, vi } from 'vitest'

const { initMock, trackMock } = vi.hoisted(() => ({
  initMock: vi.fn(),
  trackMock: vi.fn(),
}))

vi.mock('mixpanel-browser', () => ({
  default: {
    init: initMock,
    track: trackMock,
  },
}))

// Exercise the real analytics module (setup.ts mocks it for UI tests).
vi.unmock('@/infrastructure/analytics')

describe('analytics', () => {
  beforeEach(() => {
    vi.resetModules()
    initMock.mockClear()
    trackMock.mockClear()
    vi.stubEnv('VITE_MIXPANEL_TOKEN', '')
  })

  it('no-ops track when token is missing', async () => {
    const { initMixpanel, track } = await import(
      '@/infrastructure/analytics'
    )

    initMixpanel()
    track('Page Viewed', { path: '/' })

    expect(initMock).not.toHaveBeenCalled()
    expect(trackMock).not.toHaveBeenCalled()
  })

  it('forwards track after init with a token', async () => {
    vi.stubEnv('VITE_MIXPANEL_TOKEN', 'test-token')
    const { initMixpanel, track } = await import(
      '@/infrastructure/analytics'
    )

    initMixpanel()
    track('Page Viewed', { path: '/ask-tomi' })

    expect(initMock).toHaveBeenCalledWith('test-token', {
      track_pageview: false,
      persistence: 'localStorage',
    })
    expect(trackMock).toHaveBeenCalledWith('Page Viewed', {
      path: '/ask-tomi',
    })
  })
})
