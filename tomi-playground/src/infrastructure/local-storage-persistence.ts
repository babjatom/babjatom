import type { FontPersistence, ThemePersistence } from '@/application/ports'

const THEME_ID_KEY = 'tomi-playground:theme-id'
const CUSTOM_THEME_KEY = 'tomi-playground:custom-theme'
const FONT_ID_KEY = 'tomi-playground:font-id'

export function createLocalStoragePersistence(
  storage: Storage = window.localStorage,
): ThemePersistence {
  return {
    loadThemeId: () => storage.getItem(THEME_ID_KEY),
    saveThemeId: (id) => storage.setItem(THEME_ID_KEY, id),
    loadCustomTheme: () => storage.getItem(CUSTOM_THEME_KEY),
    saveCustomTheme: (serialized) =>
      storage.setItem(CUSTOM_THEME_KEY, serialized),
    clearCustomTheme: () => storage.removeItem(CUSTOM_THEME_KEY),
  }
}

export function createLocalStorageFontPersistence(
  storage: Storage = window.localStorage,
): FontPersistence {
  return {
    loadFontId: () => storage.getItem(FONT_ID_KEY),
    saveFontId: (id) => storage.setItem(FONT_ID_KEY, id),
  }
}
