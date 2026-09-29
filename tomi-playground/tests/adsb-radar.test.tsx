import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '@/App'

function renderApp(path = '/') {
  window.history.pushState({}, '', path)
  return render(<App />)
}

describe('ADS-B radar page', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('opens from the pages menu with an embedded radar and a fullscreen link', async () => {
    const user = userEvent.setup()
    renderApp('/')

    const pagesNav = screen.getByRole('navigation', { name: /pages/i })
    await user.click(within(pagesNav).getByRole('link', { name: 'ADS-B radar' }))

    expect(
      screen.getByRole('heading', { name: 'ADS-B radar' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Automatic Dependent Surveillance–Broadcast/),
    ).toBeInTheDocument()

    const radar = screen.getByTitle('ADS-B radar')
    expect(radar.tagName).toBe('IFRAME')
    expect(radar).toHaveAttribute('src', 'https://adsb.tomibabjak.dev')

    const fullscreen = screen.getByRole('link', { name: 'Fullscreen' })
    expect(fullscreen).toHaveAttribute('href', 'https://adsb.tomibabjak.dev')
    expect(fullscreen).toHaveAttribute('target', '_blank')
  })
})
