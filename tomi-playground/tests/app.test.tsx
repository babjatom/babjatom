import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '@/App'
import {
  DEFAULT_MAZE_DENSITY,
  densityToGrid,
  MAX_MAZE_DENSITY,
} from '@/domain/maze-prefs'
import { track } from '@/infrastructure/analytics'
import { setMatchMediaMatches } from './setup'

function renderApp(path = '/') {
  window.history.pushState({}, '', path)
  return render(<App />)
}

function setViewport(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  })
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    writable: true,
    value: height,
  })
}

describe('babjatom shell navigation', () => {
  beforeEach(() => {
    window.localStorage.clear()
    setMatchMediaMatches(false)
    setViewport(1440, 900)
    vi.mocked(track).mockClear()
  })

  afterEach(() => {
    setViewport(1440, 900)
  })

  it('renders Ask Tomi as the home page with pages nav', () => {
    renderApp('/')
    expect(screen.getByRole('heading', { name: 'Ask Tomi' })).toBeInTheDocument()
    expect(screen.getByLabelText('Question')).toBeInTheDocument()

    const pagesNav = screen.getByRole('navigation', { name: /pages/i })
    const links = within(pagesNav).getAllByRole('link')
    expect(links.map((link) => link.textContent)).toEqual([
      'Ask Tomi',
      'Theme Playground',
      'Analytics',
      'Dos games',
    ])
    expect(
      screen.queryByRole('button', { name: /random theme/i }),
    ).not.toBeInTheDocument()
    expect(screen.getByTestId('maze-light-background')).toBeInTheDocument()
  })

  it('keeps the ambient maze light behind content and non-interactive', () => {
    renderApp('/')
    const canvas = screen.getByTestId('maze-light-background')
    expect(canvas.tagName).toBe('CANVAS')
    expect(canvas).toHaveAttribute('aria-hidden')
    expect(canvas).toHaveClass('pointer-events-none')
    expect(canvas).toHaveClass('z-0')
  })

  it('starts the ambient maze at maximum density on desktop', () => {
    renderApp('/')
    const canvas = screen.getByTestId('maze-light-background')
    const maxGrid = densityToGrid(MAX_MAZE_DENSITY, 1440, 900)
    expect(DEFAULT_MAZE_DENSITY).toBe(MAX_MAZE_DENSITY)
    expect(canvas).toHaveAttribute('data-maze-cols', String(maxGrid.cols))
    expect(canvas).toHaveAttribute('data-maze-rows', String(maxGrid.rows))
  })

  it('uses a taller maze grid on a tall phone viewport', () => {
    setViewport(390, 844)
    renderApp('/')
    const canvas = screen.getByTestId('maze-light-background')
    const cols = Number(canvas.getAttribute('data-maze-cols'))
    const rows = Number(canvas.getAttribute('data-maze-rows'))
    expect(rows).toBeGreaterThan(cols)
    expect(densityToGrid(DEFAULT_MAZE_DENSITY, 390, 844)).toEqual({
      cols,
      rows,
    })
  })

  it('regenerates the maze grid when resized to a tall phone shape', async () => {
    renderApp('/')
    const canvas = screen.getByTestId('maze-light-background')
    const rebuildBefore = canvas.getAttribute('data-maze-rebuild')

    setViewport(390, 844)
    window.dispatchEvent(new Event('resize'))

    await waitFor(() => {
      const cols = Number(canvas.getAttribute('data-maze-cols'))
      const rows = Number(canvas.getAttribute('data-maze-rows'))
      expect(rows).toBeGreaterThan(cols)
      expect(canvas.getAttribute('data-maze-rebuild')).not.toBe(rebuildBefore)
    })
  })

  it('keeps the pages menu collapsed on mobile viewports', async () => {
    const user = userEvent.setup()
    setMatchMediaMatches(true)
    renderApp('/')

    expect(screen.queryByRole('navigation', { name: /pages/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /toggle sidebar/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /toggle sidebar/i }))
    expect(screen.getByRole('navigation', { name: /pages/i })).toBeInTheDocument()
  })

  it('dismisses the mobile menu when tapping outside', async () => {
    const user = userEvent.setup()
    setMatchMediaMatches(true)
    renderApp('/')

    await user.click(screen.getByRole('button', { name: /toggle sidebar/i }))
    expect(screen.getByRole('navigation', { name: /pages/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /dismiss menu/i }))
    expect(screen.queryByRole('navigation', { name: /pages/i })).not.toBeInTheDocument()
  })

  it('collapses the menu on mobile when a nav link is clicked', async () => {
    const user = userEvent.setup()
    setMatchMediaMatches(true)
    renderApp('/')

    await user.click(screen.getByRole('button', { name: /toggle sidebar/i }))
    const pagesNav = screen.getByRole('navigation', { name: /pages/i })
    expect(pagesNav).toBeInTheDocument()

    await user.click(
      within(pagesNav).getByRole('link', { name: 'Theme Playground' }),
    )
    expect(screen.queryByRole('navigation', { name: /pages/i })).not.toBeInTheDocument()
  })

  it('navigates to the theme playground route', async () => {
    const user = userEvent.setup()
    renderApp('/')

    const pagesNav = screen.getByRole('navigation', { name: /pages/i })
    await user.click(
      within(pagesNav).getByRole('link', { name: 'Theme Playground' }),
    )
    expect(screen.getByRole('button', { name: 'Primary' })).toBeInTheDocument()
    expect(screen.getByText(/recent visits/i)).toBeInTheDocument()
  })

  it('navigates to Ask Tomi home from the pages menu', async () => {
    const user = userEvent.setup()
    renderApp('/')

    const pagesNav = screen.getByRole('navigation', { name: /pages/i })
    await user.click(
      within(pagesNav).getByRole('link', { name: 'Theme Playground' }),
    )
    expect(
      screen.getByRole('heading', { name: 'Theme Playground' }),
    ).toBeInTheDocument()

    await user.click(within(pagesNav).getByRole('link', { name: 'Ask Tomi' }))

    expect(window.location.pathname).not.toMatch(/ask-tomi/)
    expect(screen.getByRole('heading', { name: 'Ask Tomi' })).toBeInTheDocument()
    expect(screen.getByLabelText('Question')).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText(
        /ask about tomi’s experience, stack, or approach/i,
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ask' })).toBeDisabled()
    expect(
      screen.getByRole('button', { name: 'What’s your tech stack?' }),
    ).toBeInTheDocument()
    expect(screen.queryByText(/coming soon/i)).not.toBeInTheDocument()
  })

  it('redirects the legacy Ask Tomi URL to home', () => {
    renderApp('/ask-tomi')

    expect(window.location.pathname).not.toMatch(/ask-tomi/)
    expect(screen.getByRole('heading', { name: 'Ask Tomi' })).toBeInTheDocument()
    expect(screen.getByLabelText('Question')).toBeInTheDocument()
  })

  it('switches themes from Theme Playground', async () => {
    const user = userEvent.setup()
    renderApp('/')

    const pagesNav = screen.getByRole('navigation', { name: /pages/i })
    await user.click(
      within(pagesNav).getByRole('link', { name: 'Theme Playground' }),
    )

    await user.click(screen.getByRole('button', { name: /ink night/i }))
    expect(document.documentElement.dataset.theme).toBe('ink-night')
    expect(window.localStorage.getItem('tomi-playground:theme-id')).toBe(
      'ink-night',
    )
    expect(track).toHaveBeenCalledWith('Theme Selected', {
      theme_id: 'ink-night',
      source: 'preset',
    })
  })

  it('generates a random theme and persists it', async () => {
    const user = userEvent.setup()
    renderApp('/')

    const pagesNav = screen.getByRole('navigation', { name: /pages/i })
    await user.click(
      within(pagesNav).getByRole('link', { name: 'Theme Playground' }),
    )

    await user.click(screen.getByRole('button', { name: /random theme/i }))
    const themeId = document.documentElement.dataset.theme
    expect(themeId).toMatch(/^random-/)
    expect(window.localStorage.getItem('tomi-playground:theme-id')).toBe(
      themeId,
    )
    expect(
      window.localStorage.getItem('tomi-playground:custom-theme'),
    ).toContain(themeId)
  })

  it('switches fonts from Theme Playground and persists them', async () => {
    const user = userEvent.setup()
    renderApp('/')

    const pagesNav = screen.getByRole('navigation', { name: /pages/i })
    await user.click(
      within(pagesNav).getByRole('link', { name: 'Theme Playground' }),
    )

    expect(document.documentElement.dataset.font).toBe('exo-2')
    await user.click(screen.getByRole('button', { name: /^classic$/i }))
    expect(document.documentElement.dataset.font).toBe('classic')
    expect(window.localStorage.getItem('tomi-playground:font-id')).toBe(
      'classic',
    )
    expect(track).toHaveBeenCalledWith('Font Selected', { font_id: 'classic' })
  })

  it('keeps the selected font when switching themes', async () => {
    const user = userEvent.setup()
    renderApp('/')

    const pagesNav = screen.getByRole('navigation', { name: /pages/i })
    await user.click(
      within(pagesNav).getByRole('link', { name: 'Theme Playground' }),
    )

    await user.click(screen.getByRole('button', { name: /^classic$/i }))
    await user.click(screen.getByRole('button', { name: /ink night/i }))

    expect(document.documentElement.dataset.theme).toBe('ink-night')
    expect(document.documentElement.dataset.font).toBe('classic')
  })

  it('shows theme and font controls above typography on Theme Playground', async () => {
    const user = userEvent.setup()
    renderApp('/')

    const pagesNav = screen.getByRole('navigation', { name: /pages/i })
    await user.click(
      within(pagesNav).getByRole('link', { name: 'Theme Playground' }),
    )

    const controls = screen.getByRole('region', {
      name: /theme and font controls/i,
    })
    const typography = screen.getByRole('region', {
      name: /typography sample for/i,
    })
    expect(controls.compareDocumentPosition(typography)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
    expect(
      screen.getByRole('button', { name: /random theme/i }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^classic$/i }))

    expect(
      screen.getByRole('region', {
        name: /typography sample for classic/i,
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/display heading in classic/i),
    ).toBeInTheDocument()
  })

  it('shows background controls before themes and maze settings when Maze is on', async () => {
    const user = userEvent.setup()
    renderApp('/')

    const pagesNav = screen.getByRole('navigation', { name: /pages/i })
    await user.click(
      within(pagesNav).getByRole('link', { name: 'Theme Playground' }),
    )

    const backgroundControls = screen.getByRole('group', {
      name: /background controls/i,
    })
    const themeControls = screen.getByRole('region', {
      name: /theme and font controls/i,
    })
    expect(backgroundControls.compareDocumentPosition(themeControls)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )

    expect(
      screen.getByRole('group', { name: /background options/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('group', { name: /maze controls/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /regenerate maze/i }),
    ).toBeInTheDocument()

    const canvas = screen.getByTestId('maze-light-background')
    const baseGrid = densityToGrid(DEFAULT_MAZE_DENSITY, 1440, 900)
    expect(canvas).toHaveAttribute('data-maze-cols', String(baseGrid.cols))
    expect(canvas).toHaveAttribute('data-maze-rows', String(baseGrid.rows))
    expect(canvas).toHaveAttribute('data-maze-visibility', '1')
    expect(canvas).toHaveAttribute('data-maze-generation', '0')

    const baseCells = baseGrid.cols * baseGrid.rows
    const density = screen.getByRole('slider', { name: /maze density/i })
    fireEvent.change(density, { target: { value: '2' } })
    fireEvent.pointerUp(density)
    const sparser = densityToGrid(2, 1440, 900)
    expect(canvas).toHaveAttribute('data-maze-cols', String(sparser.cols))
    expect(canvas).toHaveAttribute('data-maze-rows', String(sparser.rows))
    expect(sparser.cols * sparser.rows).toBeLessThan(baseCells)

    const visibility = screen.getByRole('slider', { name: /maze visibility/i })
    fireEvent.change(visibility, { target: { value: '2.5' } })
    expect(canvas).toHaveAttribute('data-maze-visibility', '2.5')

    await user.click(screen.getByRole('button', { name: /regenerate maze/i }))
    expect(canvas).toHaveAttribute('data-maze-generation', '1')
  })

  it('hides the maze when None background is selected', async () => {
    const user = userEvent.setup()
    renderApp('/')

    const pagesNav = screen.getByRole('navigation', { name: /pages/i })
    await user.click(
      within(pagesNav).getByRole('link', { name: 'Theme Playground' }),
    )

    expect(screen.getByTestId('maze-light-background')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^none$/i }))

    expect(
      screen.queryByTestId('maze-light-background'),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('group', { name: /maze controls/i }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByText(/no settings for this background/i),
    ).toBeInTheDocument()
  })

  it('persists background and maze prefs across remount', async () => {
    const user = userEvent.setup()
    const { unmount } = renderApp('/')

    const pagesNav = screen.getByRole('navigation', { name: /pages/i })
    await user.click(
      within(pagesNav).getByRole('link', { name: 'Theme Playground' }),
    )

    const density = screen.getByRole('slider', { name: /maze density/i })
    fireEvent.change(density, { target: { value: '1.5' } })
    fireEvent.pointerUp(density)
    fireEvent.change(screen.getByRole('slider', { name: /maze visibility/i }), {
      target: { value: '2' },
    })
    await user.click(screen.getByRole('button', { name: /^none$/i }))

    unmount()
    renderApp('/')

    expect(
      screen.queryByTestId('maze-light-background'),
    ).not.toBeInTheDocument()

    const remountNav = screen.getByRole('navigation', { name: /pages/i })
    await user.click(
      within(remountNav).getByRole('link', { name: 'Theme Playground' }),
    )

    expect(screen.getByRole('button', { name: /^none$/i })).toHaveClass(
      /border-primary/,
    )
    await user.click(screen.getByRole('button', { name: /^maze$/i }))

    const canvas = screen.getByTestId('maze-light-background')
    const saved = densityToGrid(1.5, 1440, 900)
    const defaultGrid = densityToGrid(DEFAULT_MAZE_DENSITY, 1440, 900)
    expect(saved.cols * saved.rows).toBeLessThan(
      defaultGrid.cols * defaultGrid.rows,
    )
    expect(canvas).toHaveAttribute('data-maze-cols', String(saved.cols))
    expect(canvas).toHaveAttribute('data-maze-rows', String(saved.rows))
    expect(canvas).toHaveAttribute('data-maze-visibility', '2')
    expect(screen.getByRole('slider', { name: /maze density/i })).toHaveValue(
      '1.5',
    )
    expect(
      screen.getByRole('slider', { name: /maze visibility/i }),
    ).toHaveValue('2')
  })
})
