import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '@/App'
import { track } from '@/infrastructure/analytics'
import { TOMI_CHAT_URL } from '@/infrastructure/tomi-chat-api'

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

describe('Ask Tomi chat', () => {
  beforeEach(() => {
    window.localStorage.clear()
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
          body: JSON.stringify({ question: 'Who is Tomi?' }),
        }),
      )
    })

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
      expect(fetch).toHaveBeenCalledWith(
        TOMI_CHAT_URL,
        expect.objectContaining({
          body: JSON.stringify({
            question: 'What languages does he use?',
          }),
        }),
      )
    })

    expect(
      await screen.findByText(
        'Tomi is a full-stack engineer based in Prague.',
      ),
    ).toBeInTheDocument()
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

    await user.click(screen.getByRole('button', { name: 'Clear chat' }))

    expect(
      screen.queryByText('Tomi is a full-stack engineer based in Prague.'),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Who is Tomi?' }),
    ).toBeInTheDocument()
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
