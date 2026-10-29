import { describe, expect, it, vi } from 'vitest'
import {
  matchedCvHtml,
  openMatchedCvPreview,
} from '@/presentation/ask-tomi/print-matched-cv'
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
  it('renders headline, jobs, and skills', () => {
    const html = matchedCvHtml(cv, 'https://tomibabjak.dev')
    expect(html).toContain('Senior Frontend Engineer')
    expect(html).toContain('Built public pages in React.')
    expect(html).toContain('React, Next.js')
    expect(html).toContain('Exo 2')
    expect(html).not.toContain('<script')
  })
})

describe('openMatchedCvPreview', () => {
  it('opens the full matched CV in a new tab', async () => {
    const open = vi.fn(() => ({ closed: false }) as unknown as Window)
    const createObjectURL = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:cv-preview')
    const opened = openMatchedCvPreview(cv, open)
    expect(opened).toBe(true)
    expect(open).toHaveBeenCalledWith(
      'blob:cv-preview',
      '_blank',
      'noopener,noreferrer',
    )
    const blob = createObjectURL.mock.calls[0]?.[0] as Blob
    expect(blob.type).toContain('text/html')
    expect(await blob.text()).toContain('Built public pages in React.')
    expect(open.mock.calls[0]?.[2]).toContain('noopener')
    createObjectURL.mockRestore()
  })
})
