import type { ThemePersistence } from '@/application/ports'

const THEME_ID_KEY = 'theme-playground:theme-id'
const CUSTOM_THEME_KEY = 'theme-playground:custom-theme'

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
