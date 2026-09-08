import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '@/App'

describe('Theme Playground UI', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('renders the brand and showcase', () => {
    render(<App />)
    expect(
      screen.getAllByText('Theme Playground').length,
    ).toBeGreaterThanOrEqual(1)
    expect(screen.getByRole('button', { name: /random theme/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Primary' })).toBeInTheDocument()
  })

  it('switches themes from the sidebar', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /ink night/i }))
    expect(document.documentElement.dataset.theme).toBe('ink-night')
    expect(window.localStorage.getItem('theme-playground:theme-id')).toBe(
      'ink-night',
    )
  })

  it('generates a random theme and persists it', async () => {
    const user = userEvent.setup()
    render(<App />)

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
