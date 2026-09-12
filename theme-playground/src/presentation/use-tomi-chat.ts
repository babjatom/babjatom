import { useRef, useState } from 'react'
import { track } from '@/infrastructure/analytics'
import { askTomiChat } from '@/infrastructure/tomi-chat-api'

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
  'Who is Tomi?',
  'What is his tech stack?',
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

export function useTomiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [pending, setPending] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  function abortInFlight() {
    abortRef.current?.abort()
    abortRef.current = null
  }

  async function runQuestion(question: string, assistantId: string) {
    const controller = new AbortController()
    abortRef.current = controller
    setPending(true)

    try {
      const answer = await askTomiChat(question, controller.signal)
      setMessages((current) =>
        current.map((message) =>
          message.id === assistantId
            ? { ...message, content: answer, status: 'complete' }
            : message,
        ),
      )
      track('Ask Tomi Result', { status: 'complete' })
    } catch (error) {
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
        track('Ask Tomi Result', { status: 'cancelled' })
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
      track('Ask Tomi Result', { status: 'error' })
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

    const source = options?.source ?? 'typed'
    track('Ask Tomi Message Sent', {
      source,
      ...(options?.starter_id ? { starter_id: options.starter_id } : {}),
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
