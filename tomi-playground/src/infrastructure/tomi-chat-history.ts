import { TOMI_CHAT_SESSION_IDLE_MS } from '@/infrastructure/tomi-chat-api'
import {
  parseCvMatchPayload,
  type CvMatchResult,
} from '@/infrastructure/tomi-cv-match-api'

export const TOMI_CHAT_HISTORY_KEY = 'tomi-chat-history'
export const MAX_STORED_CHATS = 3

export type StoredChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  status: 'complete' | 'pending' | 'error' | 'cancelled'
  schedulePreview?: {
    slots: { start: string; end: string; label: string }[]
  }
  cvMatch?: CvMatchResult
}

export type StoredChat = {
  id: string
  updatedAt: number
  messages: StoredChatMessage[]
}

export type StoredChatHistory = {
  activeId: string
  chats: StoredChat[]
}

const MESSAGE_STATUSES = new Set<StoredChatMessage['status']>([
  'complete',
  'pending',
  'error',
  'cancelled',
])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function createStoredChat(now = Date.now()): StoredChat {
  return {
    id: crypto.randomUUID(),
    updatedAt: now,
    messages: [],
  }
}

export function firstQuestionLine(
  messages: { role: string; content: string }[],
): string {
  const first = messages.find(
    (message) => message.role === 'user' && message.content.trim(),
  )
  if (!first) return ''
  return first.content.split(/\r?\n/, 1)[0]?.trim() ?? ''
}

function normalizeSlot(value: unknown) {
  if (!isRecord(value)) return null
  if (
    typeof value.start !== 'string' ||
    typeof value.end !== 'string' ||
    typeof value.label !== 'string'
  ) {
    return null
  }
  return { start: value.start, end: value.end, label: value.label }
}

function normalizeMessage(value: unknown): StoredChatMessage | null {
  if (!isRecord(value)) return null
  if (typeof value.id !== 'string' || !value.id.trim()) return null
  if (value.role !== 'user' && value.role !== 'assistant') return null
  if (typeof value.content !== 'string') return null
  if (
    typeof value.status !== 'string' ||
    !MESSAGE_STATUSES.has(value.status as StoredChatMessage['status'])
  ) {
    return null
  }

  let status = value.status as StoredChatMessage['status']
  let content = value.content
  if (status === 'pending') {
    status = 'cancelled'
    content = content.trim() ? content : 'Stopped.'
  }

  const message: StoredChatMessage = {
    id: value.id,
    role: value.role,
    content,
    status,
  }

  if (isRecord(value.schedulePreview) && Array.isArray(value.schedulePreview.slots)) {
    const slots = value.schedulePreview.slots
      .map(normalizeSlot)
      .filter((slot) => slot !== null)
    if (slots.length > 0) {
      message.schedulePreview = { slots }
    }
  }

  if (value.cvMatch) {
    try {
      message.cvMatch = parseCvMatchPayload(value.cvMatch)
    } catch {
      // Drop a stored match that no longer matches the API shape.
    }
  }

  return message
}

function normalizeChat(value: unknown): StoredChat | null {
  if (!isRecord(value)) return null
  if (typeof value.id !== 'string' || !value.id.trim()) return null
  if (typeof value.updatedAt !== 'number' || !Number.isFinite(value.updatedAt)) {
    return null
  }
  if (!Array.isArray(value.messages)) return null

  return {
    id: value.id,
    updatedAt: value.updatedAt,
    messages: value.messages
      .map(normalizeMessage)
      .filter((message) => message !== null),
  }
}

function readHistory(storage: Storage): StoredChatHistory | null {
  try {
    const raw = storage.getItem(TOMI_CHAT_HISTORY_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed) || !Array.isArray(parsed.chats)) return null
    return {
      activeId: typeof parsed.activeId === 'string' ? parsed.activeId : '',
      chats: parsed.chats
        .map(normalizeChat)
        .filter((chat) => chat !== null),
    }
  } catch {
    return null
  }
}

export function loadChatHistory(
  storage: Storage = window.localStorage,
  now = Date.now(),
  idleMs = TOMI_CHAT_SESSION_IDLE_MS,
): StoredChatHistory {
  const parsed = readHistory(storage)
  const fresh = (parsed?.chats ?? []).filter(
    (chat) => now - chat.updatedAt < idleMs,
  )
  const active = fresh.find((chat) => chat.id === parsed?.activeId)
  if (active) {
    return {
      activeId: active.id,
      chats: fresh.filter(
        (chat) => chat.id === active.id || firstQuestionLine(chat.messages),
      ),
    }
  }

  const next = createStoredChat(now)
  return {
    activeId: next.id,
    chats: [
      ...fresh.filter((chat) => firstQuestionLine(chat.messages)),
      next,
    ],
  }
}

export function saveChatHistory(
  history: StoredChatHistory,
  storage: Storage = window.localStorage,
) {
  try {
    storage.setItem(TOMI_CHAT_HISTORY_KEY, JSON.stringify(history))
  } catch {
    // localStorage may be full or unavailable; the open tab still works
  }
}
