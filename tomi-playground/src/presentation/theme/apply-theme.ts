import type { Theme, ThemeTokens } from '@/domain/theme'
import { THEME_TOKEN_KEYS } from '@/domain/theme'

export function applyThemeTokens(tokens: ThemeTokens, root: HTMLElement = document.documentElement) {
  for (const key of THEME_TOKEN_KEYS) {
    root.style.setProperty(`--${key}`, tokens[key])
  }
}

export function applyTheme(theme: Theme, root: HTMLElement = document.documentElement) {
  applyThemeTokens(theme.tokens, root)
  root.dataset.theme = theme.id
}
