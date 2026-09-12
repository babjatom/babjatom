import '@testing-library/jest-dom/vitest'
import { beforeEach, vi } from 'vitest'

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

class IntersectionObserverMock {
  constructor(callback: IntersectionObserverCallback) {
    // Reveal content immediately in jsdom so tests stay deterministic.
    queueMicrotask(() => {
      callback(
        [
          {
            isIntersecting: true,
            intersectionRatio: 1,
            target: document.body,
          } as unknown as IntersectionObserverEntry,
        ],
        this as unknown as IntersectionObserver,
      )
    })
  }
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
}

function stubObservers() {
  vi.stubGlobal('ResizeObserver', ResizeObserverMock)
  vi.stubGlobal('IntersectionObserver', IntersectionObserverMock)
}

/** Default to desktop so shell nav tests see the expanded menu. */
export function setMatchMediaMatches(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    (query: string): MediaQueryList => ({
      matches,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  )
}

beforeEach(() => {
  stubObservers()
  setMatchMediaMatches(false)
})
