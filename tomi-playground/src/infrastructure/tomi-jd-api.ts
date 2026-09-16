import {
  TomiChatError,
  getOrCreateChatSessionId,
} from '@/infrastructure/tomi-chat-api'

export const TOMI_JD_URL =
  'https://tomi-interview-bot.tomibabjak.workers.dev/jd'

export type TomiJdResponse = {
  answer: string
}

export async function analyzeTomiJd(
  files: readonly File[],
  signal?: AbortSignal,
  sessionId?: string,
): Promise<string> {
  if (files.length === 0) {
    throw new TomiChatError('Add at least one job description.')
  }

  const resolvedSessionId = sessionId ?? getOrCreateChatSessionId()
  const body = new FormData()
  body.append('session_id', resolvedSessionId)
  for (const file of files) {
    body.append('files', file, file.name)
  }

  let response: Response
  try {
    response = await fetch(TOMI_JD_URL, {
      method: 'POST',
      body,
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
        ? 'Invalid response from Ask Tomi.'
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
    typeof (payload as TomiJdResponse).answer !== 'string'
  ) {
    throw new TomiChatError('Response missing answer.')
  }

  return (payload as TomiJdResponse).answer
}
