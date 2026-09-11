import '@testing-library/jest-dom/vitest'

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal('ResizeObserver', ResizeObserverMock)

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
