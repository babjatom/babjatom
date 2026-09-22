import { useRef, useState } from 'react'
import { track } from '@/infrastructure/analytics'
import { extractCalScheduleUrl } from '@/infrastructure/cal-url'
import {
  askTomiChat,
  getOrCreateChatSessionId,
  rotateChatSessionId,
  TomiChatError,
} from '@/infrastructure/tomi-chat-api'
import {
  previewCalLink,
  scheduleCalLink,
  TomiScheduleError,
  type SchedulePreviewSlot,
} from '@/infrastructure/tomi-schedule-api'

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
  schedulePreview?: { slots: SchedulePreviewSlot[] }
}

export type PendingScheduleChoice = {
  url: string
  slots: SchedulePreviewSlot[]
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
  submit_method?: 'button' | 'enter' | 'chip'
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
  if (error instanceof TomiChatError || error instanceof TomiScheduleError) {
    if (typeof error.status === 'number') return 'http'
    return 'network'
  }
  return 'unknown'
}

export type ScheduleChoice =
  | { kind: 'book'; index: number }
  | { kind: 'decline' }
  | { kind: 'unrecognized' }

/** Parse chat replies while a schedule preview is pending. */
export function parseScheduleChoice(
  text: string,
  slotCount: number,
): ScheduleChoice {
  const normalized = text.trim().toLowerCase()
  if (!normalized) return { kind: 'unrecognized' }

  if (
    normalized === 'no' ||
    normalized === 'n' ||
    normalized === 'cancel' ||
    normalized === 'nope'
  ) {
    return { kind: 'decline' }
  }

  if (normalized === 'yes' || normalized === 'y') {
    return slotCount > 0 ? { kind: 'book', index: 0 } : { kind: 'unrecognized' }
  }

  if (/^[123]$/.test(normalized)) {
    const index = Number(normalized) - 1
    if (index >= 0 && index < slotCount) {
      return { kind: 'book', index }
    }
    return { kind: 'unrecognized' }
  }

  return { kind: 'unrecognized' }
}

export function useTomiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [pending, setPending] = useState(false)
  const [pendingSchedule, setPendingSchedule] =
    useState<PendingScheduleChoice | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  function abortInFlight() {
    abortRef.current?.abort()
    abortRef.current = null
  }

  function countUserTurns(current: ChatMessage[]) {
    return current.filter((message) => message.role === 'user').length
  }

  function completeAssistant(
    assistantId: string,
    content: string,
    status: ChatMessageStatus = 'complete',
    schedulePreview?: { slots: SchedulePreviewSlot[] },
  ) {
    setMessages((current) =>
      current.map((message) =>
        message.id === assistantId
          ? {
              ...message,
              content,
              status,
              ...(schedulePreview ? { schedulePreview } : { schedulePreview: undefined }),
            }
          : message,
      ),
    )
  }

  async function runWithPending(
    assistantId: string,
    work: (signal: AbortSignal) => Promise<{
      content: string
      kind: 'chat' | 'schedule' | 'schedule_preview' | 'schedule_cancel'
      schedulePreview?: { slots: SchedulePreviewSlot[] }
    }>,
  ) {
    const controller = new AbortController()
    abortRef.current = controller
    setPending(true)
    const startedAt = performance.now()

    try {
      const result = await work(controller.signal)
      completeAssistant(
        assistantId,
        result.content,
        'complete',
        result.schedulePreview,
      )
      track('Ask Tomi Result', {
        status: 'complete',
        latency_ms: Math.round(performance.now() - startedAt),
        kind: result.kind,
      })
    } catch (error) {
      const latency_ms = Math.round(performance.now() - startedAt)

      if (isAbortError(error)) {
        completeAssistant(assistantId, 'Stopped.', 'cancelled')
        track('Ask Tomi Result', { status: 'cancelled', latency_ms })
        return
      }

      const message =
        error instanceof Error ? error.message : 'Something went wrong.'
      completeAssistant(assistantId, message, 'error')
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

  async function runPreview(calUrl: string, assistantId: string) {
    await runWithPending(assistantId, async (signal) => {
      const preview = await previewCalLink(calUrl, signal)
      if (preview.ok && preview.slots.length > 0) {
        setPendingSchedule({ url: calUrl, slots: preview.slots })
        return {
          content: preview.answer,
          kind: 'schedule_preview',
          schedulePreview: { slots: preview.slots },
        }
      }
      setPendingSchedule(null)
      return {
        content: preview.answer,
        kind: 'schedule_preview',
      }
    })
  }

  async function runBook(
    calUrl: string,
    start: string,
    assistantId: string,
  ) {
    setPendingSchedule(null)
    await runWithPending(assistantId, async (signal) => {
      const answer = await scheduleCalLink(calUrl, start, signal)
      return { content: answer, kind: 'schedule' }
    })
  }

  async function runChat(question: string, assistantId: string) {
    setPendingSchedule(null)
    await runWithPending(assistantId, async (signal) => {
      const answer = await askTomiChat(
        question,
        signal,
        getOrCreateChatSessionId(),
      )
      return { content: answer, kind: 'chat' }
    })
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
      ...(options?.submit_method
        ? { submit_method: options.submit_method }
        : {}),
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

    if (pendingSchedule) {
      const choice = parseScheduleChoice(trimmed, pendingSchedule.slots.length)
      if (choice.kind === 'decline') {
        setPendingSchedule(null)
        completeAssistant(assistantId, 'Cancelled.', 'complete')
        track('Ask Tomi Result', {
          status: 'complete',
          latency_ms: 0,
          kind: 'schedule_cancel',
        })
        return
      }
      if (choice.kind === 'book') {
        const slot = pendingSchedule.slots[choice.index]
        if (slot) {
          await runBook(pendingSchedule.url, slot.start, assistantId)
          return
        }
      }
      // Unrecognized while preview pending: drop pending and continue normally
      setPendingSchedule(null)
    }

    const calUrl = extractCalScheduleUrl(trimmed)
    if (calUrl) {
      await runPreview(calUrl, assistantId)
      return
    }

    await runChat(trimmed, assistantId)
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
          ? {
              ...message,
              content: '',
              status: 'pending',
              schedulePreview: undefined,
            }
          : message,
      ),
    )

    // Regenerating a preview/book choice: treat prior user text as a fresh send target
    const calUrl = extractCalScheduleUrl(previous.content)
    if (calUrl) {
      await runPreview(calUrl, assistantId)
      return
    }

    // If regenerating a book confirmation reply, prior was "2" etc. — fall through to chat
    setPendingSchedule(null)
    await runChat(previous.content, assistantId)
  }

  function clear() {
    track('Ask Tomi Action', { action: 'clear' })
    abortInFlight()
    setPending(false)
    setPendingSchedule(null)
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
    pendingSchedule,
    send,
    stop,
    regenerate,
    clear,
    copy,
  }
}
