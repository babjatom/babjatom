import { useRef, useState } from 'react'
import { track } from '@/infrastructure/analytics'
import {
  askTomiChat,
  getOrCreateChatSessionId,
  rotateChatSessionId,
  TomiChatError,
} from '@/infrastructure/tomi-chat-api'

export type ChatRole = 'user' | 'assistant'

export type ChatMessageStatus =
  | 'complete'
  | 'pending'
  | 'error'
  | 'cancelled'

export type ChatMessage = {
  id: string
  role: ChatRole
  content: string
  status: ChatMessageStatus
}

export const STARTER_PROMPTS = [
  'What’s your tech stack?',
  'How do you structure a React + TypeScript app?',
  'What’s your approach to testing and CI?',
  'How do you design APIs and data models?',
  'What have you shipped end-to-end recently?',
] as const

export type SendOptions = {
  source?: 'starter' | 'typed'
  starter_id?: string
}

function createId() {
  return crypto.randomUUID()
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError'
}

function classifyAskTomiError(
  error: unknown,
): 'network' | 'http' | 'unknown' {
  if (error instanceof TomiChatError) {
    if (typeof error.status === 'number') return 'http'
    return 'network'
  }
  return 'unknown'
}

export function useTomiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [pending, setPending] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  function abortInFlight() {
    abortRef.current?.abort()
    abortRef.current = null
  }

  function countUserTurns(current: ChatMessage[]) {
    return current.filter((message) => message.role === 'user').length
  }

  async function runQuestion(question: string, assistantId: string) {
    const controller = new AbortController()
    abortRef.current = controller
    setPending(true)
    const startedAt = performance.now()

    try {
      const sessionId = getOrCreateChatSessionId()
      const answer = await askTomiChat(
        question,
        controller.signal,
        sessionId,
      )
      setMessages((current) =>
        current.map((message) =>
          message.id === assistantId
            ? { ...message, content: answer, status: 'complete' }
            : message,
        ),
      )
      track('Ask Tomi Result', {
        status: 'complete',
        latency_ms: Math.round(performance.now() - startedAt),
      })
    } catch (error) {
      const latency_ms = Math.round(performance.now() - startedAt)

      if (isAbortError(error)) {
        setMessages((current) =>
          current.map((message) =>
            message.id === assistantId
              ? {
                  ...message,
                  content: 'Stopped.',
                  status: 'cancelled',
                }
              : message,
          ),
        )
        track('Ask Tomi Result', { status: 'cancelled', latency_ms })
        return
      }

      const message =
        error instanceof Error ? error.message : 'Something went wrong.'
      setMessages((current) =>
        current.map((entry) =>
          entry.id === assistantId
            ? { ...entry, content: message, status: 'error' }
            : entry,
        ),
      )
      track('Ask Tomi Result', {
        status: 'error',
        latency_ms,
        error_kind: classifyAskTomiError(error),
      })
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null
      }
      setPending(false)
    }
  }

  async function send(question: string, options?: SendOptions) {
    const trimmed = question.trim()
    if (!trimmed || pending) return

    const priorUserTurns = countUserTurns(messages)
    const source = options?.source ?? 'typed'
    track('Ask Tomi Message Sent', {
      source,
      ...(options?.starter_id ? { starter_id: options.starter_id } : {}),
      turn_index: priorUserTurns + 1,
      is_follow_up: priorUserTurns > 0,
    })

    const userId = createId()
    const assistantId = createId()

    setMessages((current) => [
      ...current,
      {
        id: userId,
        role: 'user',
        content: trimmed,
        status: 'complete',
      },
      {
        id: assistantId,
        role: 'assistant',
        content: '',
        status: 'pending',
      },
    ])

    await runQuestion(trimmed, assistantId)
  }

  function stop() {
    if (!pending) return
    track('Ask Tomi Action', { action: 'stop' })
    abortInFlight()
  }

  async function regenerate(assistantId: string) {
    if (pending) return

    const index = messages.findIndex((message) => message.id === assistantId)
    if (index <= 0) return

    const assistant = messages[index]
    const previous = messages[index - 1]
    if (
      assistant?.role !== 'assistant' ||
      previous?.role !== 'user' ||
      !previous.content.trim()
    ) {
      return
    }

    track('Ask Tomi Action', { action: 'regenerate' })

    setMessages((current) =>
      current.map((message) =>
        message.id === assistantId
          ? { ...message, content: '', status: 'pending' }
          : message,
      ),
    )

    await runQuestion(previous.content, assistantId)
  }

  function clear() {
    track('Ask Tomi Action', { action: 'clear' })
    abortInFlight()
    setPending(false)
    setMessages([])
    rotateChatSessionId()
  }

  async function copy(content: string) {
    const text = content.trim()
    if (!text) return

    if (typeof navigator.clipboard?.writeText === 'function') {
      await navigator.clipboard.writeText(content)
      track('Ask Tomi Action', { action: 'copy' })
      return
    }

    throw new Error('Clipboard is unavailable.')
  }

  return {
    messages,
    pending,
    send,
    stop,
    regenerate,
    clear,
    copy,
  }
}
