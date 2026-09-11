import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '@/App'

function renderApp(path = '/babjatom/') {
  window.history.pushState({}, '', path)
  return render(<App />)
}

describe('babjatom shell navigation', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('renders the home placeholder with pages nav', () => {
    renderApp('/babjatom/')
    expect(screen.getByRole('heading', { name: /welcome/i })).toBeInTheDocument()

    const pagesNav = screen.getByRole('navigation', { name: /pages/i })
    expect(
      within(pagesNav).getByRole('link', { name: 'Theme Playground' }),
    ).toBeInTheDocument()
    expect(
      within(pagesNav).getByRole('link', { name: 'Tomi AI' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /random theme/i })).toBeInTheDocument()
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

  it('navigates to the Tomi AI chat route', async () => {
    const user = userEvent.setup()
    renderApp('/babjatom/')

    const pagesNav = screen.getByRole('navigation', { name: /pages/i })
    await user.click(within(pagesNav).getByRole('link', { name: 'Tomi AI' }))

    expect(screen.getByRole('heading', { name: 'Tomi AI' })).toBeInTheDocument()
    expect(screen.getByLabelText('Question')).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText(
        /ask about tomi’s experience, stack, or approach/i,
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ask' })).toBeDisabled()
    expect(
      screen.getByRole('button', { name: 'Who is Tomi?' }),
    ).toBeInTheDocument()
    expect(screen.queryByText(/coming soon/i)).not.toBeInTheDocument()
  })

  it('switches themes from the sidebar', async () => {
    const user = userEvent.setup()
    renderApp('/babjatom/')

    await user.click(screen.getByRole('button', { name: /ink night/i }))
    expect(document.documentElement.dataset.theme).toBe('ink-night')
    expect(window.localStorage.getItem('theme-playground:theme-id')).toBe(
      'ink-night',
    )
  })

  it('generates a random theme and persists it', async () => {
    const user = userEvent.setup()
    renderApp('/babjatom/')

    await user.click(screen.getByRole('button', { name: /random theme/i }))
    const themeId = document.documentElement.dataset.theme
    expect(themeId).toMatch(/^random-/)
    expect(window.localStorage.getItem('theme-playground:theme-id')).toBe(
      themeId,
    )
    expect(
      window.localStorage.getItem('theme-playground:custom-theme'),
    ).toContain(themeId)
  })
})
