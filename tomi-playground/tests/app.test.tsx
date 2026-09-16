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

  it('renders the home placeholder with pages nav', () => {
    renderApp('/babjatom/')
    expect(screen.getByRole('heading', { name: /welcome/i })).toBeInTheDocument()

    const pagesNav = screen.getByRole('navigation', { name: /pages/i })
    const links = within(pagesNav).getAllByRole('link')
    expect(links.map((link) => link.textContent)).toEqual([
      'Home',
      'Theme Playground',
      'Analytics',
      'Ask Tomi',
    ])
    expect(screen.getByRole('button', { name: /random theme/i })).toBeInTheDocument()

    const brand = screen.getByRole('link', { name: 'babjatom on GitHub' })
    expect(brand).toHaveAttribute('href', 'https://github.com/babjatom')
    expect(brand).toHaveAttribute('target', '_blank')

    expect(
      screen.getByRole('link', { name: 'Follow @babjatom on GitHub' }),
    ).toHaveAttribute('href', 'https://github.com/babjatom')
  })

  it('keeps the pages menu collapsed on mobile viewports', async () => {
    const user = userEvent.setup()
    setMatchMediaMatches(true)
    renderApp('/babjatom/')

    expect(screen.queryByRole('navigation', { name: /pages/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /show menu/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /show menu/i }))
    expect(screen.getByRole('navigation', { name: /pages/i })).toBeInTheDocument()
  })

  it('collapses the menu on mobile when a nav link is clicked', async () => {
    const user = userEvent.setup()
    setMatchMediaMatches(true)
    renderApp('/babjatom/')

    await user.click(screen.getByRole('button', { name: /show menu/i }))
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

  it('navigates to the Ask Tomi chat route', async () => {
    const user = userEvent.setup()
    renderApp('/babjatom/')

    const pagesNav = screen.getByRole('navigation', { name: /pages/i })
    await user.click(within(pagesNav).getByRole('link', { name: 'Ask Tomi' }))

    expect(screen.getByRole('heading', { name: 'Ask Tomi' })).toBeInTheDocument()
    expect(screen.getByLabelText('Question')).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText(
        /ask about tomi’s experience, stack, or approach/i,
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ask' })).toBeDisabled()
    expect(
      screen.getByRole('button', { name: 'Who are you?' }),
    ).toBeInTheDocument()
    expect(screen.queryByText(/coming soon/i)).not.toBeInTheDocument()
  })

  it('switches themes from the sidebar', async () => {
    const user = userEvent.setup()
    renderApp('/babjatom/')

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
})
