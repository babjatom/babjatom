import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '@/App'
import { track } from '@/infrastructure/analytics'
import {
  TOMI_CHAT_SESSION_KEY,
  TOMI_CHAT_URL,
} from '@/infrastructure/tomi-chat-api'

function renderApp(path = '/babjatom/') {
  window.history.pushState({}, '', path)
  return render(<App />)
}

async function openAskTomi(
  user: ReturnType<typeof userEvent.setup>,
  path = '/babjatom/',
) {
  renderApp(path)
  const pagesNav = screen.getByRole('navigation', { name: /pages/i })
  await user.click(within(pagesNav).getByRole('link', { name: 'Ask Tomi' }))
}

function getChatRequestBody(callIndex = 0) {
  const fetchMock = vi.mocked(fetch)
  const init = fetchMock.mock.calls[callIndex]?.[1] as RequestInit | undefined
  expect(init?.body).toEqual(expect.any(String))
  return JSON.parse(String(init?.body)) as {
    question: string
    session_id: string
  }
}

describe('Ask Tomi chat', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
    vi.mocked(track).mockClear()
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json({
          answer: 'Tomi is a full-stack engineer based in Prague.',
        }),
      ),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('shows starter prompts on the empty state', async () => {
    const user = userEvent.setup()
    await openAskTomi(user)

    expect(screen.getByRole('heading', { name: 'Ask Tomi' })).toBeInTheDocument()
    expect(
      screen.getByText(/prototype — don’t take the results seriously/i),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/don’t send secrets/i),
    ).toBeInTheDocument()
    expect(
      screen.getAllByRole('link', { name: 'Privacy' }).length,
    ).toBeGreaterThanOrEqual(1)
    const starterHint = screen.getByText(
      /start with a suggested question, or type your own below/i,
    )
    expect(starterHint).toBeInTheDocument()
    expect(starterHint.className).toMatch(/\bhidden\b/)
    expect(starterHint.className).toMatch(/\bsm:block\b/)
    expect(
      screen.getByRole('button', { name: 'What’s your tech stack?' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: 'How do you structure a React + TypeScript app?',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: 'What’s your approach to testing and CI?',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: 'How do you design APIs and data models?',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: 'What have you shipped end-to-end recently?',
      }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Question')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ask' })).toBeDisabled()
    expect(screen.queryByText(/coming soon/i)).not.toBeInTheDocument()
    expect(
      screen.getByText(/follow-ups in this chat can refer to earlier answers/i),
    ).toBeInTheDocument()

    const askHeading = screen.getByRole('heading', { name: 'Ask Tomi' })
    const askTitleMesh = askHeading
      .closest('header')
      ?.querySelector('.theme-mesh')
    expect(askTitleMesh).toBeTruthy()

    const pagesNav = screen.getByRole('navigation', { name: /pages/i })
    await user.click(
      within(pagesNav).getByRole('link', { name: 'Theme Playground' }),
    )
    const playgroundTitleMesh = screen
      .getByRole('heading', { name: 'Theme Playground' })
      .closest('header')
      ?.querySelector('.theme-mesh')
    expect(playgroundTitleMesh).toBeTruthy()
    expect(askTitleMesh?.className).toBe(playgroundTitleMesh?.className)
  })

  it('hides the suggested-question hint on a mobile viewport', () => {
    renderApp('/babjatom/')

    expect(
      screen.getByRole('button', { name: 'What’s your tech stack?' }),
    ).toBeInTheDocument()

    const starterHint = screen.getByText(
      /start with a suggested question, or type your own below/i,
    )
    // Phone layouts rely on Tailwind `hidden sm:block` (see ask-tomi.feature).
    expect(starterHint.className).toMatch(/\bhidden\b/)
    expect(starterHint.className).toMatch(/\bsm:block\b/)
  })

  it('keeps empty chat without an inner scrollbar when starters fit and does not clip the heading', async () => {
    const user = userEvent.setup()
    await openAskTomi(user)

    const askHeading = screen.getByRole('heading', { name: 'Ask Tomi' })
    expect(askHeading).toBeInTheDocument()
    expect(screen.getByLabelText('Question')).toBeInTheDocument()

    const header = askHeading.closest('header')
    expect(header).toBeTruthy()
    expect(header?.className).not.toMatch(/overflow-hidden/)
    expect(askHeading.className).toMatch(/leading-tight/)
    const headerInner = header?.querySelector(':scope > div.relative')
    expect(headerInner?.className).toMatch(/pt-5/)

    const conversation = screen.getByRole('region', { name: /conversation/i })
    expect(conversation).toBeInTheDocument()
    // jsdom reports 0×0 sizes, so empty content is treated as fitting.
    expect(conversation.className).toMatch(/overflow-hidden/)
    expect(conversation.className).not.toMatch(/overflow-y-auto/)
    expect(conversation.className).not.toMatch(/scrollbar-overlay/)
    expect(conversation.className).not.toMatch(/\bborder\b/)
    expect(conversation.className).not.toMatch(/bg-background/)
  })

  it('scrolls empty starters when they do not fit the conversation area', async () => {
    const user = userEvent.setup()
    await openAskTomi(user)

    const conversation = screen.getByRole('region', { name: /conversation/i })
    const content = conversation.querySelector('.flex.flex-col.gap-5')
    expect(content).toBeTruthy()

    Object.defineProperty(conversation, 'clientHeight', {
      configurable: true,
      value: 120,
    })
    Object.defineProperty(content as HTMLElement, 'scrollHeight', {
      configurable: true,
      value: 480,
    })

    window.dispatchEvent(new Event('resize'))

    await waitFor(() => {
      expect(conversation.className).toMatch(/overflow-y-auto/)
      expect(conversation.className).toMatch(/scrollbar-overlay/)
    })

    expect(
      screen.getByRole('button', { name: 'What’s your tech stack?' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: 'What have you shipped end-to-end recently?',
      }),
    ).toBeInTheDocument()
  })

  it('enables inner conversation scroll once chatting', async () => {
    const user = userEvent.setup()
    await openAskTomi(user)

    await user.click(screen.getByRole('button', { name: 'What’s your tech stack?' }))
    expect(
      await screen.findByText(
        'Tomi is a full-stack engineer based in Prague.',
      ),
    ).toBeInTheDocument()

    const conversation = screen.getByRole('region', { name: /conversation/i })
    expect(conversation.className).toMatch(/overflow-y-auto/)
    expect(conversation.className).toMatch(/scrollbar-overlay/)
    expect(conversation.className).not.toMatch(/\bborder\b/)
  })

  it('keeps starter prompts in the conversation area', async () => {
    const user = userEvent.setup()
    await openAskTomi(user)

    const conversation = screen.getByRole('region', { name: /conversation/i })
    const starter = within(conversation).getByRole('button', {
      name: 'What’s your tech stack?',
    })
    expect(starter).toBeInTheDocument()
    expect(starter.closest('.max-w-3xl')).toBeTruthy()
  })

  it('quiets the header and composer once chatting', async () => {
    const user = userEvent.setup()
    await openAskTomi(user)

    await user.click(screen.getByRole('button', { name: 'What’s your tech stack?' }))
    expect(
      await screen.findByText(
        'Tomi is a full-stack engineer based in Prague.',
      ),
    ).toBeInTheDocument()

    expect(screen.getByRole('heading', { name: 'Ask Tomi' })).toBeInTheDocument()
    expect(
      screen.queryByText(/follow-ups in this chat can refer to earlier answers/i),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText(/prototype — don’t take the results seriously/i),
    ).not.toBeInTheDocument()

    const main = document.querySelector('main')
    expect(main).toBeTruthy()
    expect(
      within(main as HTMLElement).queryByRole('link', { name: 'Privacy' }),
    ).not.toBeInTheDocument()

    await user.click(screen.getByLabelText('Question'))

    expect(
      screen.getByText(/prototype — don’t take the results seriously/i),
    ).toBeInTheDocument()
    expect(
      within(main as HTMLElement).getByRole('link', { name: 'Privacy' }),
    ).toBeInTheDocument()
  })

  it('uses a compact auto-growing composer once chatting', async () => {
    const user = userEvent.setup()
    await openAskTomi(user)

    await user.click(screen.getByRole('button', { name: 'What’s your tech stack?' }))
    expect(
      await screen.findByText(
        'Tomi is a full-stack engineer based in Prague.',
      ),
    ).toBeInTheDocument()

    const composer = screen.getByLabelText('Question')
    expect(composer).toHaveAttribute('rows', '1')
    expect(composer).toHaveAttribute('placeholder', 'Ask a follow-up…')
    expect(composer.className).toMatch(/overflow-hidden/)
    expect(composer.style.overflowY).toBe('hidden')
  })

  it('sends a starter prompt and renders the answer', async () => {
    const user = userEvent.setup()
    await openAskTomi(user)

    await user.click(screen.getByRole('button', { name: 'What’s your tech stack?' }))

    expect(track).toHaveBeenCalledWith('Ask Tomi Message Sent', {
      source: 'starter',
      starter_id: 'What’s your tech stack?',
    })

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        TOMI_CHAT_URL,
        expect.objectContaining({
          method: 'POST',
        }),
      )
    })

    const body = getChatRequestBody()
    expect(body.question).toBe('What’s your tech stack?')
    expect(body.session_id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    )
    expect(sessionStorage.getItem(TOMI_CHAT_SESSION_KEY)).toBe(body.session_id)

    expect(
      await screen.findByText(
        'Tomi is a full-stack engineer based in Prague.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('What’s your tech stack?')).toBeInTheDocument()
  })

  it('submits a typed question from the composer', async () => {
    const user = userEvent.setup()
    await openAskTomi(user)

    await user.type(
      screen.getByLabelText('Question'),
      'What languages does he use?',
    )
    await user.click(screen.getByRole('button', { name: 'Ask' }))

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled()
    })

    const body = getChatRequestBody()
    expect(body).toEqual({
      question: 'What languages does he use?',
      session_id: expect.any(String),
    })

    expect(
      await screen.findByText(
        'Tomi is a full-stack engineer based in Prague.',
      ),
    ).toBeInTheDocument()
  })

  it('reuses the same session_id across messages in one conversation', async () => {
    const user = userEvent.setup()
    await openAskTomi(user)

    await user.click(screen.getByRole('button', { name: 'What’s your tech stack?' }))
    expect(
      await screen.findByText(
        'Tomi is a full-stack engineer based in Prague.',
      ),
    ).toBeInTheDocument()

    await user.type(
      screen.getByLabelText('Question'),
      'What other projects?',
    )
    await user.click(screen.getByRole('button', { name: 'Ask' }))

    await waitFor(() => {
      expect(vi.mocked(fetch).mock.calls).toHaveLength(2)
    })

    const first = getChatRequestBody(0)
    const second = getChatRequestBody(1)
    expect(first.session_id).toBe(second.session_id)
    expect(second.question).toBe('What other projects?')
  })

  it('clears the conversation', async () => {
    const user = userEvent.setup()
    await openAskTomi(user)

    await user.click(screen.getByRole('button', { name: 'What’s your tech stack?' }))
    expect(
      await screen.findByText(
        'Tomi is a full-stack engineer based in Prague.',
      ),
    ).toBeInTheDocument()

    const sessionBeforeClear = getChatRequestBody(0).session_id

    await user.click(screen.getByRole('button', { name: 'Clear chat' }))

    expect(
      screen.queryByText('Tomi is a full-stack engineer based in Prague.'),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'What’s your tech stack?' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'What’s your tech stack?' }))
    await waitFor(() => {
      expect(vi.mocked(fetch).mock.calls).toHaveLength(2)
    })

    const sessionAfterClear = getChatRequestBody(1).session_id
    expect(sessionAfterClear).not.toBe(sessionBeforeClear)
  })

  it('stops an in-flight request', async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: string, init?: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => {
              reject(new DOMException('Aborted', 'AbortError'))
            })
          }),
      ),
    )

    await openAskTomi(user)
    await user.click(screen.getByRole('button', { name: 'What’s your tech stack?' }))
    expect(await screen.findByRole('button', { name: 'Stop' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Stop' }))

    expect(await screen.findByText('Stopped.')).toBeInTheDocument()
  })

  it('regenerates the latest assistant answer', async () => {
    const user = userEvent.setup()
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({ answer: 'First answer about Tomi.' }),
      )
      .mockResolvedValueOnce(
        Response.json({ answer: 'Regenerated answer about Tomi.' }),
      )
    vi.stubGlobal('fetch', fetchMock)

    await openAskTomi(user)
    await user.click(screen.getByRole('button', { name: 'What’s your tech stack?' }))
    expect(
      await screen.findByText('First answer about Tomi.'),
    ).toBeInTheDocument()

    await user.click(
      await screen.findByRole('button', { name: 'Regenerate answer' }),
    )

    expect(
      await screen.findByText('Regenerated answer about Tomi.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('First answer about Tomi.')).not.toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(2)

    const first = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body)) as {
      session_id: string
    }
    const second = JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body)) as {
      session_id: string
    }
    expect(first.session_id).toBe(second.session_id)
  })

  it('copies the assistant answer to the clipboard', async () => {
    const user = userEvent.setup()
    const clipboardWrite = vi.fn(async () => undefined)
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      configurable: true,
      writable: true,
      value: { writeText: clipboardWrite },
    })

    await openAskTomi(user)

    await user.click(screen.getByRole('button', { name: 'What’s your tech stack?' }))
    expect(
      await screen.findByText(
        'Tomi is a full-stack engineer based in Prague.',
      ),
    ).toBeInTheDocument()

    await user.click(
      await screen.findByRole('button', { name: 'Copy answer' }),
    )

    await waitFor(() => {
      expect(clipboardWrite).toHaveBeenCalledWith(
        'Tomi is a full-stack engineer based in Prague.',
      )
    })
    expect(await screen.findByText('Copied')).toBeInTheDocument()
  })

  it('does not mount the 3D scene on the page', async () => {
    const user = userEvent.setup()
    await openAskTomi(user)

    expect(
      screen.queryByRole('img', { name: /3d tomi scene/i }),
    ).not.toBeInTheDocument()
    expect(screen.getByLabelText('Question')).toBeInTheDocument()
  })

  it('is reachable from shell navigation', async () => {
    const user = userEvent.setup()
    await openAskTomi(user)

    expect(screen.getByRole('heading', { name: 'Ask Tomi' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'What’s your tech stack?' }),
    ).toBeInTheDocument()
  })
})
