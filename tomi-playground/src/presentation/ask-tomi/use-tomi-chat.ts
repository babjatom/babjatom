import { useRef, useState } from 'react'
import { track } from '@/infrastructure/analytics'
import {
  askTomiChat,
  getOrCreateChatSessionId,
  rotateChatSessionId,
} from '@/infrastructure/tomi-chat-api'
import { analyzeTomiJd } from '@/infrastructure/tomi-jd-api'
import { describeJdUpload } from './jd-file-validation'

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
  'Who are you?',
  'What’s your tech stack?',
  'How do you structure a React + TypeScript app?',
  'What’s your approach to testing and CI?',
  'How do you design APIs and data models?',
  'What have you shipped end-to-end recently?',
] as const

export type SendOptions = {
  source?: 'starter' | 'typed' | 'jd'
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
  const jdFilesByUserIdRef = useRef(new Map<string, File[]>())

  function abortInFlight() {
    abortRef.current?.abort()
    abortRef.current = null
  }

  async function runRequest(
    assistantId: string,
    request: (signal: AbortSignal, sessionId: string) => Promise<string>,
  ) {
    const controller = new AbortController()
    abortRef.current = controller
    setPending(true)

    try {
      const sessionId = getOrCreateChatSessionId()
      const answer = await request(controller.signal, sessionId)
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

  async function runQuestion(question: string, assistantId: string) {
    await runRequest(assistantId, (signal, sessionId) =>
      askTomiChat(question, signal, sessionId),
    )
  }

  async function runJdAnalysis(files: readonly File[], assistantId: string) {
    await runRequest(assistantId, (signal, sessionId) =>
      analyzeTomiJd(files, signal, sessionId),
    )
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

  async function analyzeJd(files: File[]) {
    if (pending || files.length === 0) return

    track('Ask Tomi Message Sent', {
      source: 'jd',
      file_count: files.length,
    })

    const userId = createId()
    const assistantId = createId()
    jdFilesByUserIdRef.current.set(userId, files)

    setMessages((current) => [
      ...current,
      {
        id: userId,
        role: 'user',
        content: describeJdUpload(files),
        status: 'complete',
      },
      {
        id: assistantId,
        role: 'assistant',
        content: '',
        status: 'pending',
      },
    ])

    await runJdAnalysis(files, assistantId)
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

    const jdFiles = jdFilesByUserIdRef.current.get(previous.id)
    if (jdFiles && jdFiles.length > 0) {
      await runJdAnalysis(jdFiles, assistantId)
      return
    }

    await runQuestion(previous.content, assistantId)
  }

  function clear() {
    track('Ask Tomi Action', { action: 'clear' })
    abortInFlight()
    setPending(false)
    setMessages([])
    jdFilesByUserIdRef.current.clear()
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
    analyzeJd,
    stop,
    regenerate,
    clear,
    copy,
  }
}
