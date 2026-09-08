import { describe, expect, it } from 'vitest'
import { generateRandomTheme } from '@/domain/random-theme'
import { THEME_TOKEN_KEYS } from '@/domain/theme'
import { presetThemes, findPresetTheme, DEFAULT_THEME_ID } from '@/domain/presets'

describe('theme domain', () => {
  it('exposes preset themes with complete token maps', () => {
    expect(presetThemes.length).toBeGreaterThanOrEqual(3)
    for (const theme of presetThemes) {
      for (const key of THEME_TOKEN_KEYS) {
        expect(theme.tokens[key]).toBeTruthy()
      }
    }
  })

  it('finds the default preset theme', () => {
    expect(findPresetTheme(DEFAULT_THEME_ID)?.id).toBe(DEFAULT_THEME_ID)
  })

  it('generates deterministic random themes from a seed', () => {
    const a = generateRandomTheme(42)
    const b = generateRandomTheme(42)
    const c = generateRandomTheme(99)

    expect(a.generated).toBe(true)
    expect(a.tokens).toEqual(b.tokens)
    expect(a.id).toBe(b.id)
    expect(a.tokens.primary).not.toEqual(c.tokens.primary)
    for (const key of THEME_TOKEN_KEYS) {
      expect(a.tokens[key]).toBeTruthy()
    }
  })
})
