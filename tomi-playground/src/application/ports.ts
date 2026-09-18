export type ThemePersistence = {
  loadThemeId: () => string | null
  saveThemeId: (id: string) => void
  loadCustomTheme: () => string | null
  saveCustomTheme: (serialized: string) => void
  clearCustomTheme: () => void
}

export type FontPersistence = {
  loadFontId: () => string | null
  saveFontId: (id: string) => void
}

export type MazePersistence = {
  loadBackground: () => string | null
  saveBackground: (id: string) => void
  loadDensity: () => string | null
  saveDensity: (value: string) => void
  loadVisibility: () => string | null
  saveVisibility: (value: string) => void
}
