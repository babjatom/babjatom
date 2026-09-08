import { describe, expect, it } from 'vitest'
import { applyThemeTokens } from '@/presentation/apply-theme'
import { findPresetTheme, DEFAULT_THEME_ID } from '@/domain/presets'

describe('applyThemeTokens', () => {
  it('writes semantic CSS variables onto a root element', () => {
    const root = document.createElement('div')
    const theme = findPresetTheme(DEFAULT_THEME_ID)!
    applyThemeTokens(theme.tokens, root)

    expect(root.style.getPropertyValue('--background')).toBe(
      theme.tokens.background,
    )
    expect(root.style.getPropertyValue('--primary')).toBe(theme.tokens.primary)
    expect(root.style.getPropertyValue('--radius')).toBe(theme.tokens.radius)
  })
})
