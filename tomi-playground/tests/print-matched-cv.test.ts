import { describe, expect, it, vi } from 'vitest'
import { matchedCvHtml, printMatchedCv } from '@/presentation/ask-tomi/print-matched-cv'
import type { MatchedCv } from '@/infrastructure/tomi-cv-match-api'

const cv: MatchedCv = {
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
      pageBreak: false,
      bullets: ['Built public pages in React.'],
    },
  ],
  projects: [
    {
      id: 'ask-tomi',
      name: 'Ask Tomi',
      href: 'https://tomibabjak.dev',
      when: '2026',
      bullets: ['Built a chat.'],
    },
  ],
  education: { school: 'Czech Technical University, Prague', when: '2009–2013' },
  interests: 'Plane spotting and flight tracking.',
}

describe('matchedCvHtml', () => {
  it('renders headline, summary, and print CSS', () => {
    const html = matchedCvHtml(cv, 'https://tomibabjak.dev')
    expect(html).toContain('Senior Frontend Engineer')
    expect(html).toContain('Built public pages in React.')
    expect(html).toContain('Exo 2')
    expect(html).not.toContain('<script')
  })
})

describe('printMatchedCv', () => {
  it('writes the CV into a new window', () => {
    const print = vi.fn()
    const openDoc = { open: vi.fn(), write: vi.fn(), close: vi.fn(), readyState: 'complete' }
    const popup = {
      document: openDoc,
      focus: vi.fn(),
      print,
      onload: null as (() => void) | null,
    }
    const opened = printMatchedCv(cv, () => popup as unknown as Window)
    expect(opened).toBe(true)
    expect(openDoc.write).toHaveBeenCalled()
    expect(String(openDoc.write.mock.calls[0]?.[0])).toContain('Senior Frontend Engineer')
    expect(print).toHaveBeenCalled()
  })
})
