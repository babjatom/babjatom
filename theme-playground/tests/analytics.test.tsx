import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '@/App'

function renderApp(path = '/babjatom/') {
  window.history.pushState({}, '', path)
  return render(<App />)
}

describe('Analytics page', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('is listed after Theme Playground and shows table plus charts', async () => {
    const user = userEvent.setup()
    renderApp('/babjatom/')

    const pagesNav = screen.getByRole('navigation', { name: /pages/i })
    const links = within(pagesNav).getAllByRole('link')
    expect(links.map((link) => link.textContent)).toEqual([
      'Theme Playground',
      'Analytics',
      'Tomi AI',
    ])

    await user.click(within(pagesNav).getByRole('link', { name: 'Analytics' }))

    expect(screen.getByRole('heading', { name: 'Analytics' })).toBeInTheDocument()
    expect(screen.getByText('203.0.113.42')).toBeInTheDocument()
    expect(screen.getByText('Area')).toBeInTheDocument()
    expect(screen.getByText('Bar')).toBeInTheDocument()
    expect(screen.getByText('Line')).toBeInTheDocument()
    expect(screen.getByText('Pie')).toBeInTheDocument()
    expect(screen.getByText('Radar')).toBeInTheDocument()
    expect(screen.getByText('Radial')).toBeInTheDocument()
    expect(screen.getByText('Tooltip')).toBeInTheDocument()
  })
})
