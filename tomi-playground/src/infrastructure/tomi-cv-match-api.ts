import { TOMI_CHAT_URL, getOrCreateChatSessionId } from '@/infrastructure/tomi-chat-api'

export const TOMI_CV_MATCH_URL = TOMI_CHAT_URL.replace(/\/chat$/, '/cv-match')

export type CvMatchRole = 'fullstack' | 'frontend' | 'backend'

export type MatchedCvSkill = {
  group: string
  items: string
}

export type MatchedCvJob = {
  id: string
  title: string
  when: string
  location: string
  stack: string
  pageBreak?: boolean
  bullets: string[]
}

export type MatchedCvProject = {
  id: string
  name: string
  href?: string
  when: string
  bullets: string[]
}

export type MatchedCv = {
  headline: string
  summary: string
  skills: MatchedCvSkill[]
  jobs: MatchedCvJob[]
  projects: MatchedCvProject[]
  education: { school: string; when: string }
  interests: string
}

export type CvMatchResult = {
  answer: string
  role: CvMatchRole | null
  cv: MatchedCv | null
  omitted_tools: string[]
}

export class TomiCvMatchError extends Error {
  readonly status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'TomiCvMatchError'
    this.status = status
  }
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function parseSkill(value: unknown): MatchedCvSkill | null {
  if (!isRecord(value)) return null
  if (typeof value.group !== 'string' || typeof value.items !== 'string') {
    return null
  }
  return { group: value.group, items: value.items }
}

function parseJob(value: unknown): MatchedCvJob | null {
  if (!isRecord(value)) return null
  if (
    typeof value.id !== 'string' ||
    typeof value.title !== 'string' ||
    typeof value.when !== 'string' ||
    typeof value.location !== 'string' ||
    typeof value.stack !== 'string' ||
    !isStringArray(value.bullets)
  ) {
    return null
  }
  return {
    id: value.id,
    title: value.title,
    when: value.when,
    location: value.location,
    stack: value.stack,
    pageBreak: value.pageBreak === true,
    bullets: value.bullets,
  }
}

function parseProject(value: unknown): MatchedCvProject | null {
  if (!isRecord(value)) return null
  if (
    typeof value.id !== 'string' ||
    typeof value.name !== 'string' ||
    typeof value.when !== 'string' ||
    !isStringArray(value.bullets)
  ) {
    return null
  }
  const project: MatchedCvProject = {
    id: value.id,
    name: value.name,
    when: value.when,
    bullets: value.bullets,
  }
  if (typeof value.href === 'string' && value.href) {
    project.href = value.href
  }
  return project
}

export function parseCvMatchPayload(payload: unknown): CvMatchResult {
  if (!isRecord(payload) || typeof payload.answer !== 'string') {
    throw new TomiCvMatchError('Response missing answer.')
  }
  const role = payload.role
  if (
    role !== null &&
    role !== undefined &&
    role !== 'fullstack' &&
    role !== 'frontend' &&
    role !== 'backend'
  ) {
    throw new TomiCvMatchError('Response has an invalid role.')
  }
  const omitted = isStringArray(payload.omitted_tools)
    ? payload.omitted_tools
    : []
  if (payload.cv == null) {
    return {
      answer: payload.answer,
      role: (role as CvMatchRole | null) ?? null,
      cv: null,
      omitted_tools: omitted,
    }
  }
  if (!isRecord(payload.cv)) {
    throw new TomiCvMatchError('Response missing CV.')
  }
  const raw = payload.cv
  if (
    typeof raw.headline !== 'string' ||
    typeof raw.summary !== 'string' ||
    !Array.isArray(raw.skills) ||
    !Array.isArray(raw.jobs) ||
    !Array.isArray(raw.projects) ||
    !isRecord(raw.education) ||
    typeof raw.education.school !== 'string' ||
    typeof raw.education.when !== 'string' ||
    typeof raw.interests !== 'string'
  ) {
    throw new TomiCvMatchError('Response missing CV.')
  }
  const skills = raw.skills.map(parseSkill).filter((item) => item !== null)
  const jobs = raw.jobs.map(parseJob).filter((item) => item !== null)
  const projects = raw.projects.map(parseProject).filter((item) => item !== null)
  if (skills.length === 0 || jobs.length === 0) {
    throw new TomiCvMatchError('Response missing CV.')
  }
  return {
    answer: payload.answer,
    role: (role as CvMatchRole | null) ?? null,
    omitted_tools: omitted,
    cv: {
      headline: raw.headline,
      summary: raw.summary,
      skills,
      jobs,
      projects,
      education: {
        school: raw.education.school,
        when: raw.education.when,
      },
      interests: raw.interests,
    },
  }
}

async function postCvMatchRequest(
  jdText: string,
  sessionId: string,
  signal?: AbortSignal,
): Promise<Response> {
  try {
    return await fetch(TOMI_CV_MATCH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jd_text: jdText,
        session_id: sessionId,
      }),
      signal,
    })
  } catch (error) {
    if (isAbortError(error)) {
      throw error
    }
    throw new TomiCvMatchError(
      error instanceof Error ? error.message : 'Network request failed.',
    )
  }
}

export async function matchJdToCv(
  jdText: string,
  signal?: AbortSignal,
  sessionId?: string,
): Promise<CvMatchResult> {
  const trimmed = jdText.trim()
  if (!trimmed) {
    throw new TomiCvMatchError('Job description cannot be empty.')
  }
  const resolvedSessionId = sessionId ?? getOrCreateChatSessionId()

  let response: Response
  try {
    response = await postCvMatchRequest(trimmed, resolvedSessionId, signal)
  } catch (error) {
    if (isAbortError(error) || signal?.aborted) {
      throw error
    }
    response = await postCvMatchRequest(trimmed, resolvedSessionId, signal)
  }

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new TomiCvMatchError(
      response.ok
        ? 'Invalid response from Ask Tomi.'
        : `Request failed (${response.status}).`,
      response.status,
    )
  }

  if (!response.ok) {
    const message =
      isRecord(payload) && typeof payload.error === 'string'
        ? payload.error
        : `Request failed (${response.status}).`
    throw new TomiCvMatchError(message, response.status)
  }

  return parseCvMatchPayload(payload)
}
