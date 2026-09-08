import { DEFAULT_THEME_ID, findPresetTheme, presetThemes } from '@/domain/presets'
import { generateRandomTheme } from '@/domain/random-theme'
import type { Theme } from '@/domain/theme'
import type { ThemePersistence } from './ports'

export type ThemeSession = {
  activeTheme: Theme
  availableThemes: Theme[]
}

export class ThemeService {
  private readonly persistence: ThemePersistence

  constructor(persistence: ThemePersistence) {
    this.persistence = persistence
  }

  loadSession(): ThemeSession {
    const customJson = this.persistence.loadCustomTheme()
    const custom = customJson ? safeParseTheme(customJson) : null
    const availableThemes = custom
      ? [...presetThemes, custom]
      : [...presetThemes]

    const savedId = this.persistence.loadThemeId()
    const activeTheme =
      availableThemes.find((theme) => theme.id === savedId) ??
      findPresetTheme(DEFAULT_THEME_ID) ??
      presetThemes[0]!

    return { activeTheme, availableThemes }
  }

  selectTheme(theme: Theme): void {
    this.persistence.saveThemeId(theme.id)
    if (theme.generated) {
      this.persistence.saveCustomTheme(JSON.stringify(theme))
    }
  }

  createRandomTheme(seed?: number): Theme {
    const theme = generateRandomTheme(seed)
    this.persistence.saveCustomTheme(JSON.stringify(theme))
    this.persistence.saveThemeId(theme.id)
    return theme
  }

  listPresets(): Theme[] {
    return [...presetThemes]
  }
}

function safeParseTheme(json: string): Theme | null {
  try {
    const parsed = JSON.parse(json) as Theme
    if (
      typeof parsed?.id === 'string' &&
      typeof parsed?.name === 'string' &&
      parsed.tokens &&
      typeof parsed.tokens === 'object'
    ) {
      return { ...parsed, generated: true }
    }
    return null
  } catch {
    return null
  }
}
