import '@testing-library/jest-dom/vitest'

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

class IntersectionObserverMock implements IntersectionObserver {
  readonly root: Element | Document | null = null
  readonly rootMargin = ''
  readonly thresholds: ReadonlyArray<number> = []
  constructor(callback: IntersectionObserverCallback) {
    // Reveal content immediately in jsdom so tests stay deterministic.
    queueMicrotask(() => {
      callback(
        [
          {
            isIntersecting: true,
            intersectionRatio: 1,
            target: document.body,
          } as IntersectionObserverEntry,
        ],
        this,
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

vi.stubGlobal('ResizeObserver', ResizeObserverMock)
vi.stubGlobal('IntersectionObserver', IntersectionObserverMock)

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

setMatchMediaMatches(false)
