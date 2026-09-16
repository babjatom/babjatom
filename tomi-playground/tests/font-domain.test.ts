import { describe, expect, it } from 'vitest'
import {
  DEFAULT_FONT_ID,
  findFontPreset,
  fontPresets,
} from '@/domain/font-presets'

describe('font presets', () => {
  it('defaults to Exo 2 for both stacks', () => {
    const exo2 = findFontPreset(DEFAULT_FONT_ID)!
    expect(exo2.name).toBe('Exo 2')
    expect(exo2.sans).toContain('Exo 2')
    expect(exo2.display).toBe(exo2.sans)
  })

  it('keeps Classic as Outfit and Fraunces', () => {
    const classic = findFontPreset('classic')!
    expect(classic.sans).toContain('Outfit')
    expect(classic.display).toContain('Fraunces')
  })

  it('uses the same stack for sans and display on techno presets', () => {
    const techno = fontPresets.filter((font) => font.id !== 'classic')
    expect(techno.length).toBeGreaterThanOrEqual(8)
    for (const font of techno) {
      expect(font.sans).toBe(font.display)
      expect(font.sans.length).toBeGreaterThan(0)
    }
  })
})
