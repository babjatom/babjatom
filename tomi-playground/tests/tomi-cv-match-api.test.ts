import { describe, expect, it } from 'vitest'
import {
  parseCvMatchPayload,
  TomiCvMatchError,
} from '@/infrastructure/tomi-cv-match-api'

const cv = {
  headline: 'Senior Frontend Engineer · Prague, Czechia',
  summary: 'Senior frontend engineer with over 10 years building React.',
  skills: [{ group: 'Frontend', items: 'React, Next.js' }],
  jobs: [
    {
      id: 'plots',
      title: 'Fullstack Engineer · Plots Inc',
      when: '2024–2026',
      location: 'Los Angeles',
      stack: 'React',
      bullets: ['Built public pages in React.'],
    },
  ],
  projects: [
    {
      id: 'ask-tomi',
      name: 'Ask Tomi',
      when: '2026',
      bullets: ['Built a chat.'],
    },
  ],
  education: { school: 'Czech Technical University, Prague', when: '2009–2013' },
  interests: 'Plane spotting and flight tracking.',
}

describe('parseCvMatchPayload', () => {
  it('parses a tailored CV', () => {
    const result = parseCvMatchPayload({
      answer: 'I matched this to a senior frontend role.',
      role: 'frontend',
      cv,
      omitted_tools: ['Kotlin'],
    })
    expect(result.role).toBe('frontend')
    expect(result.cv?.headline).toContain('Frontend')
    expect(result.omitted_tools).toEqual(['Kotlin'])
  })

  it('parses a deferral with no CV', () => {
    const result = parseCvMatchPayload({
      answer: 'I flagged this for the real Tomi.',
      role: null,
      cv: null,
      omitted_tools: [],
    })
    expect(result.cv).toBeNull()
    expect(result.role).toBeNull()
  })

  it('rejects a payload without an answer', () => {
    expect(() => parseCvMatchPayload({ role: 'frontend', cv })).toThrow(
      TomiCvMatchError,
    )
  })
})
