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

describe('Privacy page', () => {
  beforeEach(() => {
    window.localStorage.clear()
    setMatchMediaMatches(false)
    vi.mocked(track).mockClear()
  })

  it('links Privacy from the shell and discloses hosting, Ask Tomi, and the profile pixel', async () => {
    const user = userEvent.setup()
    const { container } = renderApp('/babjatom/')

    const aside = container.querySelector('aside')
    expect(aside).toBeTruthy()
    await user.click(within(aside as HTMLElement).getByRole('link', { name: 'Privacy' }))

    expect(screen.getByRole('heading', { name: 'Privacy' })).toBeInTheDocument()
    expect(
      screen.getByText(/does not use advertising cookies or product analytics/i),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/the playground is hosted on GitHub Pages/i),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/tomi-interview-bot\.tomibabjak\.workers\.dev/i),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/github-visitors-tracking\.tomibabjak\.workers\.dev/i),
    ).toBeInTheDocument()
    expect(track).toHaveBeenCalledWith('Nav Clicked', {
      to: '/privacy',
      source: 'sidebar',
    })
  })

  it('is reachable from Ask Tomi composer disclosure', async () => {
    const user = userEvent.setup()
    const { container } = renderApp('/babjatom/')

    expect(
      screen.getByText(/don’t send secrets/i),
    ).toBeInTheDocument()

    const main = container.querySelector('main')
    expect(main).toBeTruthy()
    await user.click(within(main as HTMLElement).getByRole('link', { name: 'Privacy' }))
    expect(screen.getByRole('heading', { name: 'Privacy' })).toBeInTheDocument()
  })
})
