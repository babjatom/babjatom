import { describe, expect, it } from 'vitest'
import { extractCalScheduleUrl } from '@/infrastructure/cal-url'

describe('extractCalScheduleUrl', () => {
  it('detects a bare Cal.com link', () => {
    expect(extractCalScheduleUrl('https://cal.com/acme/intro')).toBe(
      'https://cal.com/acme/intro',
    )
  })

  it('extracts a Cal.com link from surrounding text', () => {
    expect(
      extractCalScheduleUrl('book this https://cal.com/bob/30min please'),
    ).toBe('https://cal.com/bob/30min')
  })

  it('ignores non-Cal URLs', () => {
    expect(extractCalScheduleUrl('https://calendly.com/tomi/30')).toBeNull()
  })
})
