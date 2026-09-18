import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '@/App'
import { track } from '@/infrastructure/analytics'
import { setMatchMediaMatches } from './setup'

function renderApp(path = '/babjatom/') {
  window.history.pushState({}, '', path)
  return render(<App />)
}

describe('babjatom shell navigation', () => {
  beforeEach(() => {
    window.localStorage.clear()
    setMatchMediaMatches(false)
    vi.mocked(track).mockClear()
  })

  it('renders Ask Tomi as the home page with pages nav', () => {
    renderApp('/babjatom/')
    expect(screen.getByRole('heading', { name: 'Ask Tomi' })).toBeInTheDocument()
    expect(screen.getByLabelText('Question')).toBeInTheDocument()

    const pagesNav = screen.getByRole('navigation', { name: /pages/i })
    const links = within(pagesNav).getAllByRole('link')
    expect(links.map((link) => link.textContent)).toEqual([
      'Ask Tomi',
      'Theme Playground',
      'Analytics',
    ])
    expect(
      screen.queryByRole('button', { name: /random theme/i }),
    ).not.toBeInTheDocument()
    expect(screen.getByTestId('maze-light-background')).toBeInTheDocument()
  })

  it('keeps the ambient maze light behind content and non-interactive', () => {
    renderApp('/babjatom/')
    const canvas = screen.getByTestId('maze-light-background')
    expect(canvas.tagName).toBe('CANVAS')
    expect(canvas).toHaveAttribute('aria-hidden')
    expect(canvas).toHaveClass('pointer-events-none')
    expect(canvas).toHaveClass('z-0')
  })

  it('keeps the pages menu collapsed on mobile viewports', async () => {
    const user = userEvent.setup()
    setMatchMediaMatches(true)
    renderApp('/babjatom/')

    expect(screen.queryByRole('navigation', { name: /pages/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /toggle sidebar/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /toggle sidebar/i }))
    expect(screen.getByRole('navigation', { name: /pages/i })).toBeInTheDocument()
  })

  it('dismisses the mobile menu when tapping outside', async () => {
    const user = userEvent.setup()
    setMatchMediaMatches(true)
    renderApp('/babjatom/')

    await user.click(screen.getByRole('button', { name: /toggle sidebar/i }))
    expect(screen.getByRole('navigation', { name: /pages/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /dismiss menu/i }))
    expect(screen.queryByRole('navigation', { name: /pages/i })).not.toBeInTheDocument()
  })

  it('collapses the menu on mobile when a nav link is clicked', async () => {
    const user = userEvent.setup()
    setMatchMediaMatches(true)
    renderApp('/babjatom/')

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
    renderApp('/babjatom/')

    const pagesNav = screen.getByRole('navigation', { name: /pages/i })
    await user.click(
      within(pagesNav).getByRole('link', { name: 'Theme Playground' }),
    )
    expect(screen.getByRole('button', { name: 'Primary' })).toBeInTheDocument()
    expect(screen.getByText(/recent visits/i)).toBeInTheDocument()
  })

  it('navigates to Ask Tomi home from the pages menu', async () => {
    const user = userEvent.setup()
    renderApp('/babjatom/')

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
    renderApp('/babjatom/ask-tomi')

    expect(window.location.pathname).not.toMatch(/ask-tomi/)
    expect(screen.getByRole('heading', { name: 'Ask Tomi' })).toBeInTheDocument()
    expect(screen.getByLabelText('Question')).toBeInTheDocument()
  })

  it('switches themes from Theme Playground', async () => {
    const user = userEvent.setup()
    renderApp('/babjatom/')

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
    renderApp('/babjatom/')

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
    renderApp('/babjatom/')

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
    renderApp('/babjatom/')

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
    renderApp('/babjatom/')

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
})
