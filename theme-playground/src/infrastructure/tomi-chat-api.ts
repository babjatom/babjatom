export const TOMI_CHAT_URL =
  'https://tomi-interview-bot.tomibabjak.workers.dev/chat'

export type TomiChatResponse = {
  answer: string
}

export class TomiChatError extends Error {
  readonly status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'TomiChatError'
    this.status = status
  }
}

export async function askTomiChat(
  question: string,
  signal?: AbortSignal,
): Promise<string> {
  const trimmed = question.trim()
  if (!trimmed) {
    throw new TomiChatError('Question cannot be empty.')
  }

  let response: Response
  try {
    response = await fetch(TOMI_CHAT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: trimmed }),
      signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error
    }
    throw new TomiChatError(
      error instanceof Error ? error.message : 'Network request failed.',
    )
  }

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new TomiChatError(
      response.ok
        ? 'Invalid response from Tomi AI.'
        : `Request failed (${response.status}).`,
      response.status,
    )
  }

  if (!response.ok) {
    const message =
      typeof payload === 'object' &&
      payload !== null &&
      'error' in payload &&
      typeof (payload as { error: unknown }).error === 'string'
        ? (payload as { error: string }).error
        : `Request failed (${response.status}).`
    throw new TomiChatError(message, response.status)
  }

  if (
    typeof payload !== 'object' ||
    payload === null ||
    typeof (payload as TomiChatResponse).answer !== 'string'
  ) {
    throw new TomiChatError('Response missing answer.')
  }

  return (payload as TomiChatResponse).answer
}
