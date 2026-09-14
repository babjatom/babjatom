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
      screen.getByRole('button', { name: 'Who is Tomi?' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'What is his tech stack?' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Question')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ask' })).toBeDisabled()
    expect(screen.queryByText(/coming soon/i)).not.toBeInTheDocument()
    expect(
      screen.getByText(/follow-ups in this chat can refer to earlier answers/i),
    ).toBeInTheDocument()
  })

  it('sends a starter prompt and renders the answer', async () => {
    const user = userEvent.setup()
    await openAskTomi(user)

    await user.click(screen.getByRole('button', { name: 'Who is Tomi?' }))

    expect(track).toHaveBeenCalledWith('Ask Tomi Message Sent', {
      source: 'starter',
      starter_id: 'Who is Tomi?',
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
    expect(body.question).toBe('Who is Tomi?')
    expect(body.session_id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    )
    expect(sessionStorage.getItem(TOMI_CHAT_SESSION_KEY)).toBe(body.session_id)

    expect(
      await screen.findByText(
        'Tomi is a full-stack engineer based in Prague.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('Who is Tomi?')).toBeInTheDocument()
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

    await user.click(screen.getByRole('button', { name: 'Who is Tomi?' }))
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

    await user.click(screen.getByRole('button', { name: 'Who is Tomi?' }))
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
      screen.getByRole('button', { name: 'Who is Tomi?' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Who is Tomi?' }))
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
    await user.click(screen.getByRole('button', { name: 'Who is Tomi?' }))
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
    await user.click(screen.getByRole('button', { name: 'Who is Tomi?' }))
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

    await user.click(screen.getByRole('button', { name: 'Who is Tomi?' }))
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

  it('shows the 3D scene before the chat composer on the page', async () => {
    const user = userEvent.setup()
    await openAskTomi(user)

    const scene = screen.getByRole('img', { name: /3d tomi scene/i })
    const question = screen.getByLabelText('Question')
    expect(
      scene.compareDocumentPosition(question) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it('is reachable from shell navigation', async () => {
    const user = userEvent.setup()
    await openAskTomi(user)

    expect(screen.getByRole('heading', { name: 'Ask Tomi' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Who is Tomi?' }),
    ).toBeInTheDocument()
  })
})
