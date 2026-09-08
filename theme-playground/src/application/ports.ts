export type ThemePersistence = {
  loadThemeId: () => string | null
  saveThemeId: (id: string) => void
  loadCustomTheme: () => string | null
  saveCustomTheme: (serialized: string) => void
  clearCustomTheme: () => void
}
