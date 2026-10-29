import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { track } from '@/infrastructure/analytics'
import { extractCalScheduleUrl } from '@/infrastructure/cal-url'
import { JdParseError, parseJdFile } from '@/infrastructure/parse-jd-file'
import {
  askTomiChat,
  persistChatSessionId,
  TomiChatError,
} from '@/infrastructure/tomi-chat-api'
import {
  matchJdToCv,
  TomiCvMatchError,
  type CvMatchResult,
} from '@/infrastructure/tomi-cv-match-api'
import {
  createStoredChat,
  firstQuestionLine,
  loadChatHistory,
  MAX_STORED_CHATS,
  saveChatHistory,
  type StoredChat,
} from '@/infrastructure/tomi-chat-history'
import {
  previewCalLink,
  scheduleCalLink,
  TOMI_OWN_CAL_URL,
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
  cvMatch?: CvMatchResult
}

export type PendingScheduleChoice = {
  url: string
  slots: SchedulePreviewSlot[]
}

/** User turn inserted when the Schedule call chip loads open times. */
export const SCHEDULE_CALL_PROMPT = 'Schedule call'

/** User turn inserted when Match to your JD parses a file. */
export const MATCH_JD_PROMPT = 'Match to your JD'

export function matchJdUserLine(filename: string): string {
  return `${MATCH_JD_PROMPT} (${filename})`
}

export function isMatchJdUserContent(content: string): boolean {
  const trimmed = content.trim()
  return (
    trimmed === MATCH_JD_PROMPT || trimmed.startsWith(`${MATCH_JD_PROMPT} (`)
  )
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
): 'network' | 'http' | 'unknown' | 'parse' {
  if (error instanceof JdParseError) return 'parse'
  if (
    error instanceof TomiChatError ||
    error instanceof TomiScheduleError ||
    error instanceof TomiCvMatchError
  ) {
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

export type ChatListItem = {
  id: string
  label: string
  active: boolean
}

type TomiChatValue = {
  messages: ChatMessage[]
  pending: boolean
  pendingSchedule: PendingScheduleChoice | null
  chatList: ChatListItem[]
  newChatDisabled: boolean
  send: (question: string, options?: SendOptions) => Promise<void>
  requestOwnSchedule: () => Promise<void>
  requestMatchJd: (file: File) => Promise<void>
  stop: () => void
  regenerate: (assistantId: string) => Promise<void>
  clear: () => void
  copy: (content: string) => Promise<void>
  startNewChat: () => void
  selectChat: (chatId: string) => void
}

const TomiChatContext = createContext<TomiChatValue | null>(null)

function useTomiChatState(): TomiChatValue {
  const [history, setHistory] = useState(() => loadChatHistory())
  const [pending, setPending] = useState(false)
  const [scheduleByChat, setScheduleByChat] = useState<
    Record<string, PendingScheduleChoice | null>
  >({})
  const abortRef = useRef<AbortController | null>(null)

  const { activeId, chats } = history
  const messages =
    chats.find((chat) => chat.id === activeId)?.messages ?? []

  useEffect(() => {
    saveChatHistory(history)
    persistChatSessionId(history.activeId)
  }, [history])

  function writeSchedule(chatId: string, value: PendingScheduleChoice | null) {
    setScheduleByChat((current) => ({ ...current, [chatId]: value }))
  }

  function updateChat(
    chatId: string,
    updater: (chat: StoredChat) => StoredChat,
  ) {
    setHistory((current) => ({
      ...current,
      chats: current.chats.map((chat) =>
        chat.id === chatId ? updater(chat) : chat,
      ),
    }))
  }

  function abortInFlight() {
    abortRef.current?.abort()
    abortRef.current = null
  }

  function countUserTurns(current: ChatMessage[]) {
    return current.filter((message) => message.role === 'user').length
  }

  function completeAssistant(
    chatId: string,
    assistantId: string,
    content: string,
    status: ChatMessageStatus = 'complete',
    extras?: {
      schedulePreview?: { slots: SchedulePreviewSlot[] }
      cvMatch?: CvMatchResult
    },
  ) {
    updateChat(chatId, (chat) => ({
      ...chat,
      updatedAt: Date.now(),
      messages: chat.messages.map((message) =>
        message.id === assistantId
          ? {
              ...message,
              content,
              status,
              schedulePreview: extras?.schedulePreview,
              cvMatch: extras?.cvMatch,
            }
          : message,
      ),
    }))
  }

  async function runWithPending(
    chatId: string,
    assistantId: string,
    work: (signal: AbortSignal) => Promise<{
      content: string
      kind:
        | 'chat'
        | 'schedule'
        | 'schedule_preview'
        | 'schedule_cancel'
        | 'cv_match'
      schedulePreview?: { slots: SchedulePreviewSlot[] }
      cvMatch?: CvMatchResult
    }>,
  ) {
    const controller = new AbortController()
    abortRef.current = controller
    setPending(true)
    const startedAt = performance.now()

    try {
      const result = await work(controller.signal)
      completeAssistant(chatId, assistantId, result.content, 'complete', {
        schedulePreview: result.schedulePreview,
        cvMatch: result.cvMatch,
      })
      track('Ask Tomi Result', {
        status: 'complete',
        latency_ms: Math.round(performance.now() - startedAt),
        kind: result.kind,
      })
    } catch (error) {
      const latency_ms = Math.round(performance.now() - startedAt)

      if (isAbortError(error)) {
        completeAssistant(chatId, assistantId, 'Stopped.', 'cancelled')
        track('Ask Tomi Result', { status: 'cancelled', latency_ms })
        return
      }

      const message =
        error instanceof Error ? error.message : 'Something went wrong.'
      completeAssistant(chatId, assistantId, message, 'error')
      track('Ask Tomi Result', {
        status: 'error',
        latency_ms,
        error_kind: classifyAskTomiError(error),
      })
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null
        setPending(false)
      }
    }
  }

  async function runPreview(
    chatId: string,
    calUrl: string,
    assistantId: string,
  ) {
    await runWithPending(chatId, assistantId, async (signal) => {
      const preview = await previewCalLink(calUrl, signal)
      if (preview.ok && preview.slots.length > 0) {
        writeSchedule(chatId, { url: calUrl, slots: preview.slots })
        return {
          content: preview.answer,
          kind: 'schedule_preview',
          schedulePreview: { slots: preview.slots },
        }
      }
      writeSchedule(chatId, null)
      return {
        content: preview.answer,
        kind: 'schedule_preview',
      }
    })
  }

  async function runBook(
    chatId: string,
    calUrl: string,
    start: string,
    assistantId: string,
  ) {
    writeSchedule(chatId, null)
    await runWithPending(chatId, assistantId, async (signal) => {
      const answer = await scheduleCalLink(calUrl, start, signal)
      return { content: answer, kind: 'schedule' }
    })
  }

  async function runChat(
    chatId: string,
    question: string,
    assistantId: string,
  ) {
    writeSchedule(chatId, null)
    await runWithPending(chatId, assistantId, async (signal) => {
      persistChatSessionId(chatId)
      const answer = await askTomiChat(question, signal, chatId)
      return { content: answer, kind: 'chat' }
    })
  }

  function appendTurn(chatId: string, content: string) {
    const userId = createId()
    const assistantId = createId()

    updateChat(chatId, (chat) => ({
      ...chat,
      updatedAt: Date.now(),
      messages: [
        ...chat.messages,
        {
          id: userId,
          role: 'user',
          content,
          status: 'complete',
        },
        {
          id: assistantId,
          role: 'assistant',
          content: '',
          status: 'pending',
        },
      ],
    }))

    return assistantId
  }

  async function requestOwnSchedule() {
    if (pending) return

    const chatId = history.activeId
    const assistantId = appendTurn(chatId, SCHEDULE_CALL_PROMPT)
    await runPreview(chatId, TOMI_OWN_CAL_URL, assistantId)
  }

  async function requestMatchJd(file: File) {
    if (pending) return

    const chatId = history.activeId
    const assistantId = appendTurn(chatId, matchJdUserLine(file.name))
    track('Ask Tomi Chip Clicked', { chip: 'match_jd' })
    track('Ask Tomi Action', { action: 'match_jd' })
    await runWithPending(chatId, assistantId, async (signal) => {
      persistChatSessionId(chatId)
      const jdText = await parseJdFile(file)
      const result = await matchJdToCv(jdText, signal, chatId)
      return {
        content: result.answer,
        kind: 'cv_match',
        cvMatch: result,
      }
    })
  }

  async function send(question: string, options?: SendOptions) {
    const trimmed = question.trim()
    if (!trimmed || pending) return

    const chatId = history.activeId
    const currentMessages =
      history.chats.find((chat) => chat.id === chatId)?.messages ?? []
    const priorUserTurns = countUserTurns(currentMessages)
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

    const assistantId = appendTurn(chatId, trimmed)
    const pendingChoice = scheduleByChat[chatId] ?? null

    if (pendingChoice) {
      const choice = parseScheduleChoice(trimmed, pendingChoice.slots.length)
      if (choice.kind === 'decline') {
        writeSchedule(chatId, null)
        completeAssistant(chatId, assistantId, 'Cancelled.', 'complete')
        track('Ask Tomi Result', {
          status: 'complete',
          latency_ms: 0,
          kind: 'schedule_cancel',
        })
        return
      }
      if (choice.kind === 'book') {
        const slot = pendingChoice.slots[choice.index]
        if (slot) {
          await runBook(chatId, pendingChoice.url, slot.start, assistantId)
          return
        }
      }
      // Unrecognized while preview pending: drop pending and continue normally
      writeSchedule(chatId, null)
    }

    const calUrl = extractCalScheduleUrl(trimmed)
    if (calUrl) {
      await runPreview(chatId, calUrl, assistantId)
      return
    }

    await runChat(chatId, trimmed, assistantId)
  }

  function stop() {
    if (!pending) return
    track('Ask Tomi Action', { action: 'stop' })
    abortInFlight()
  }

  async function regenerate(assistantId: string) {
    if (pending) return

    const chatId = history.activeId
    const currentMessages =
      history.chats.find((chat) => chat.id === chatId)?.messages ?? []
    const index = currentMessages.findIndex((message) => message.id === assistantId)
    if (index <= 0) return

    const assistant = currentMessages[index]
    const previous = currentMessages[index - 1]
    if (
      assistant?.role !== 'assistant' ||
      previous?.role !== 'user' ||
      !previous.content.trim()
    ) {
      return
    }

    track('Ask Tomi Action', { action: 'regenerate' })

    updateChat(chatId, (chat) => ({
      ...chat,
      updatedAt: Date.now(),
      messages: chat.messages.map((message) =>
        message.id === assistantId
          ? {
              ...message,
              content: '',
              status: 'pending',
              schedulePreview: undefined,
              cvMatch: undefined,
            }
          : message,
      ),
    }))

    if (previous.content === SCHEDULE_CALL_PROMPT) {
      await runPreview(chatId, TOMI_OWN_CAL_URL, assistantId)
      return
    }

    if (isMatchJdUserContent(previous.content)) {
      completeAssistant(
        chatId,
        assistantId,
        'Upload the job description again to match it.',
        'error',
      )
      return
    }

    // Regenerating a preview/book choice: treat prior user text as a fresh send target
    const calUrl = extractCalScheduleUrl(previous.content)
    if (calUrl) {
      await runPreview(chatId, calUrl, assistantId)
      return
    }

    // If regenerating a book confirmation reply, prior was "2" etc. — fall through to chat
    writeSchedule(chatId, null)
    await runChat(chatId, previous.content, assistantId)
  }

  function openFreshChat(dropActive: boolean) {
    const droppedId = dropActive ? history.activeId : null
    const next = createStoredChat()
    if (droppedId) writeSchedule(droppedId, null)
    setHistory((current) => ({
      activeId: next.id,
      chats: [
        ...current.chats.filter((chat) => {
          if (droppedId && chat.id === droppedId) return false
          return Boolean(firstQuestionLine(chat.messages))
        }),
        next,
      ],
    }))
    persistChatSessionId(next.id)
  }

  function clear() {
    track('Ask Tomi Action', { action: 'clear' })
    abortInFlight()
    setPending(false)
    openFreshChat(true)
  }

  function startNewChat() {
    const savedCount = history.chats.filter((chat) =>
      firstQuestionLine(chat.messages),
    ).length
    if (savedCount >= MAX_STORED_CHATS) return
    abortInFlight()
    setPending(false)
    openFreshChat(false)
  }

  function selectChat(chatId: string) {
    if (chatId === history.activeId) return
    if (!history.chats.some((chat) => chat.id === chatId)) return
    abortInFlight()
    setPending(false)
    setHistory((current) => ({ ...current, activeId: chatId }))
    persistChatSessionId(chatId)
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

  const pendingSchedule = scheduleByChat[activeId] ?? null

  const chatList = useMemo<ChatListItem[]>(() => {
    return chats
      .filter((chat) => firstQuestionLine(chat.messages))
      .sort((left, right) => right.updatedAt - left.updatedAt)
      .map((chat) => ({
        id: chat.id,
        label: firstQuestionLine(chat.messages),
        active: chat.id === activeId,
      }))
  }, [activeId, chats])

  const newChatDisabled = chatList.length >= MAX_STORED_CHATS

  return {
    messages,
    pending,
    pendingSchedule,
    chatList,
    newChatDisabled,
    send,
    requestOwnSchedule,
    requestMatchJd,
    stop,
    regenerate,
    clear,
    copy,
    startNewChat,
    selectChat,
  }
}

export function TomiChatProvider({ children }: { children: ReactNode }) {
  const value = useTomiChatState()
  return (
    <TomiChatContext.Provider value={value}>{children}</TomiChatContext.Provider>
  )
}

export function useTomiChat() {
  const value = useContext(TomiChatContext)
  if (!value) {
    throw new Error('useTomiChat must be used within TomiChatProvider')
  }
  return value
}
