import type {
  FontPersistence,
  MazePersistence,
  ThemePersistence,
} from '@/application/ports'

const THEME_ID_KEY = 'tomi-playground:theme-id'
const CUSTOM_THEME_KEY = 'tomi-playground:custom-theme'
const FONT_ID_KEY = 'tomi-playground:font-id'
const MAZE_DENSITY_KEY = 'tomi-playground:maze-density'
const MAZE_VISIBILITY_KEY = 'tomi-playground:maze-visibility'
const AMBIENT_BACKGROUND_KEY = 'tomi-playground:ambient-background'

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

export function createLocalStorageMazePersistence(
  storage: Storage = window.localStorage,
): MazePersistence {
  return {
    loadBackground: () => storage.getItem(AMBIENT_BACKGROUND_KEY),
    saveBackground: (id) => storage.setItem(AMBIENT_BACKGROUND_KEY, id),
    loadDensity: () => storage.getItem(MAZE_DENSITY_KEY),
    saveDensity: (value) => storage.setItem(MAZE_DENSITY_KEY, value),
    loadVisibility: () => storage.getItem(MAZE_VISIBILITY_KEY),
    saveVisibility: (value) => storage.setItem(MAZE_VISIBILITY_KEY, value),
  }
}
