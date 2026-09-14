export const TOMI_CHAT_URL =
  'https://tomi-interview-bot.tomibabjak.workers.dev/chat'

export const TOMI_CHAT_SESSION_KEY = 'tomi-chat-session-id'
export const TOMI_CHAT_SESSION_ACTIVITY_KEY = 'tomi-chat-session-activity'
export const TOMI_CHAT_SESSION_IDLE_MS = 30 * 60 * 1000

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

function createSessionId() {
  return crypto.randomUUID()
}

function readStoredSessionId() {
  try {
    return sessionStorage.getItem(TOMI_CHAT_SESSION_KEY)
  } catch {
    return null
  }
}

function writeStoredSessionId(sessionId: string) {
  try {
    sessionStorage.setItem(TOMI_CHAT_SESSION_KEY, sessionId)
    sessionStorage.setItem(TOMI_CHAT_SESSION_ACTIVITY_KEY, String(Date.now()))
  } catch {
    // sessionStorage may be unavailable; still return the in-memory id
  }
}

function readLastActivity() {
  try {
    const raw = sessionStorage.getItem(TOMI_CHAT_SESSION_ACTIVITY_KEY)
    if (!raw) return null
    const value = Number(raw)
    return Number.isFinite(value) ? value : null
  } catch {
    return null
  }
}

export function rotateChatSessionId() {
  const sessionId = createSessionId()
  writeStoredSessionId(sessionId)
  return sessionId
}

export function getOrCreateChatSessionId(
  now = Date.now(),
  idleMs = TOMI_CHAT_SESSION_IDLE_MS,
) {
  const existing = readStoredSessionId()
  const lastActivity = readLastActivity()

  if (
    existing &&
    (lastActivity === null || now - lastActivity < idleMs)
  ) {
    writeStoredSessionId(existing)
    return existing
  }

  return rotateChatSessionId()
}

export async function askTomiChat(
  question: string,
  signal?: AbortSignal,
  sessionId?: string,
): Promise<string> {
  const trimmed = question.trim()
  if (!trimmed) {
    throw new TomiChatError('Question cannot be empty.')
  }

  const resolvedSessionId = sessionId ?? getOrCreateChatSessionId()

  let response: Response
  try {
    response = await fetch(TOMI_CHAT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: trimmed,
        session_id: resolvedSessionId,
      }),
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
    typeof (payload as TomiChatResponse).answer !== 'string'
  ) {
    throw new TomiChatError('Response missing answer.')
  }

  return (payload as TomiChatResponse).answer
}
