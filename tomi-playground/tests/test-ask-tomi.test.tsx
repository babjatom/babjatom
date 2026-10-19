import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '@/App'
import { track } from '@/infrastructure/analytics'
import {
  TOMI_CHAT_SESSION_KEY,
  TOMI_CHAT_URL,
  TOMI_TEST_ASK_PATH,
  TOMI_TEST_CHAT_URL,
} from '@/infrastructure/tomi-chat-api'
import {
  TOMI_CHAT_HISTORY_KEY,
  TOMI_TEST_CHAT_HISTORY_KEY,
} from '@/infrastructure/tomi-chat-history'

const ANSWER = 'Tomi is a full-stack engineer based in Prague.'

function renderApp(path = '/') {
  window.history.pushState({}, '', path)
  return render(<App />)
}

async function ask(user: ReturnType<typeof userEvent.setup>, question: string) {
  await user.type(screen.getByLabelText('Question'), question)
  await user.click(screen.getByRole('button', { name: 'Ask' }))
  expect(await screen.findByText(ANSWER)).toBeInTheDocument()
}

describe('Test Ask Tomi', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
    vi.mocked(track).mockClear()
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ answer: ANSWER })),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows Ask Tomi and My chat without a pages-menu entry', () => {
    renderApp(TOMI_TEST_ASK_PATH)

    expect(screen.getByRole('heading', { name: 'Ask Tomi' })).toBeInTheDocument()
    expect(screen.getByText('My chat')).toBeInTheDocument()
    const pagesNav = screen.getByRole('navigation', { name: /pages/i })
    const hrefs = within(pagesNav)
      .getAllByRole('link')
      .map((link) => link.getAttribute('href'))
    expect(hrefs).not.toContain(TOMI_TEST_ASK_PATH)
  })

  it('keeps the trial chat list separate from home', async () => {
    const user = userEvent.setup()
    const home = renderApp('/')
    await ask(user, 'Where did the Prague office sit?')
    const homeSessionId = window.sessionStorage.getItem(TOMI_CHAT_SESSION_KEY)
    expect(homeSessionId).toEqual(expect.any(String))
    home.unmount()

    const trial = renderApp(TOMI_TEST_ASK_PATH)
    expect(
      screen.queryByText('Where did the Prague office sit?'),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'What’s your tech stack?' }),
    ).toBeInTheDocument()

    await ask(user, 'What is your trial question?')
    expect(fetch).toHaveBeenCalledWith(
      TOMI_TEST_CHAT_URL,
      expect.objectContaining({ method: 'POST' }),
    )
    expect(window.sessionStorage.getItem(TOMI_CHAT_SESSION_KEY)).toBe(
      homeSessionId,
    )
    trial.unmount()

    renderApp('/')
    expect(
      within(screen.getByRole('navigation', { name: 'My chat' })).getByRole(
        'button',
        { name: 'Where did the Prague office sit?' },
      ),
    ).toBeInTheDocument()
    expect(
      screen.queryByText('What is your trial question?'),
    ).not.toBeInTheDocument()

    const homeRaw = window.localStorage.getItem(TOMI_CHAT_HISTORY_KEY)
    const trialRaw = window.localStorage.getItem(TOMI_TEST_CHAT_HISTORY_KEY)
    expect(homeRaw).toContain('Where did the Prague office sit?')
    expect(homeRaw).not.toContain('What is your trial question?')
    expect(trialRaw).toContain('What is your trial question?')
    expect(trialRaw).not.toContain('Where did the Prague office sit?')
  })

  it('sends the home question to the live chat path', async () => {
    const user = userEvent.setup()
    renderApp('/')
    expect(screen.getByText('My chat')).toBeInTheDocument()
    await ask(user, 'Where did the Prague office sit?')
    expect(fetch).toHaveBeenCalledWith(
      TOMI_CHAT_URL,
      expect.objectContaining({ method: 'POST' }),
    )
  })
})
