export const TOMI_SCHEDULE_URL =
  import.meta.env.VITE_TOMI_SCHEDULE_URL?.trim() ||
  'https://tomi-scheduler.tomibabjak.workers.dev/schedule'

export type TomiScheduleResponse = {
  ok: boolean
  answer: string
}

export class TomiScheduleError extends Error {
  readonly status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'TomiScheduleError'
    this.status = status
  }
}

export async function scheduleCalLink(
  url: string,
  signal?: AbortSignal,
): Promise<string> {
  const trimmed = url.trim()
  if (!trimmed) {
    throw new TomiScheduleError('Cal.com URL cannot be empty.')
  }

  let response: Response
  try {
    response = await fetch(TOMI_SCHEDULE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: trimmed }),
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
    typeof (payload as TomiScheduleResponse).answer !== 'string'
  ) {
    throw new TomiScheduleError('Response missing answer.', response.status)
  }

  const answer = (payload as TomiScheduleResponse).answer
  if (!response.ok && response.status !== 422) {
    throw new TomiScheduleError(answer || `Request failed (${response.status}).`, response.status)
  }

  return answer
}
