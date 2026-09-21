export const TOMI_SCHEDULE_URL =
  import.meta.env.VITE_TOMI_SCHEDULE_URL?.trim() ||
  'https://tomi-scheduler.tomibabjak.workers.dev/schedule'

export const TOMI_SCHEDULE_PREVIEW_URL = TOMI_SCHEDULE_URL.replace(
  /\/schedule\/?$/,
  '/schedule/preview',
)

export type TomiScheduleResponse = {
  ok: boolean
  answer: string
}

export type SchedulePreviewSlot = {
  start: string
  end: string
  label: string
}

export type TomiSchedulePreviewResponse = {
  ok: boolean
  answer: string
  slots: SchedulePreviewSlot[]
}

export class TomiScheduleError extends Error {
  readonly status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'TomiScheduleError'
    this.status = status
  }
}

async function postScheduleJson<T extends { answer: string }>(
  endpoint: string,
  body: Record<string, string>,
  signal?: AbortSignal,
): Promise<{ status: number; payload: T }> {
  let response: Response
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error
    }
    throw new TomiScheduleError(
      error instanceof Error ? error.message : 'Network request failed.',
    )
  }

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new TomiScheduleError(
      response.ok
        ? 'Invalid response from scheduler.'
        : `Request failed (${response.status}).`,
      response.status,
    )
  }

  if (
    typeof payload !== 'object' ||
    payload === null ||
    typeof (payload as { answer: unknown }).answer !== 'string'
  ) {
    throw new TomiScheduleError('Response missing answer.', response.status)
  }

  return { status: response.status, payload: payload as T }
}

export async function previewCalLink(
  url: string,
  signal?: AbortSignal,
): Promise<TomiSchedulePreviewResponse> {
  const trimmed = url.trim()
  if (!trimmed) {
    throw new TomiScheduleError('Cal.com URL cannot be empty.')
  }

  const { status, payload } =
    await postScheduleJson<TomiSchedulePreviewResponse>(
      TOMI_SCHEDULE_PREVIEW_URL,
      { url: trimmed },
      signal,
    )

  const slots = Array.isArray(payload.slots)
    ? payload.slots.filter(
        (slot): slot is SchedulePreviewSlot =>
          typeof slot === 'object' &&
          slot !== null &&
          typeof slot.start === 'string' &&
          typeof slot.end === 'string' &&
          typeof slot.label === 'string',
      )
    : []

  if (!status.toString().startsWith('2') && status !== 422) {
    throw new TomiScheduleError(
      payload.answer || `Request failed (${status}).`,
      status,
    )
  }

  return {
    ok: Boolean(payload.ok),
    answer: payload.answer,
    slots,
  }
}

export async function scheduleCalLink(
  url: string,
  start: string,
  signal?: AbortSignal,
): Promise<string> {
  const trimmed = url.trim()
  if (!trimmed) {
    throw new TomiScheduleError('Cal.com URL cannot be empty.')
  }
  const startTrimmed = start.trim()
  if (!startTrimmed) {
    throw new TomiScheduleError('Start time cannot be empty.')
  }

  const { status, payload } = await postScheduleJson<TomiScheduleResponse>(
    TOMI_SCHEDULE_URL,
    { url: trimmed, start: startTrimmed },
    signal,
  )

  if (!status.toString().startsWith('2') && status !== 422) {
    throw new TomiScheduleError(
      payload.answer || `Request failed (${status}).`,
      status,
    )
  }

  return payload.answer
}
